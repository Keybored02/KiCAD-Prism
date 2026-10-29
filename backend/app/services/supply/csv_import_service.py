"""Uploading and clearing a connector's offers file."""

from __future__ import annotations

from app.services.supply.audit import actor_text, write_audit
from app.services.supply.connectors import ConnectorError, ConnectorService
from app.services.supply.csv_format import ParsedCsv, parse_offers_csv
from app.services.supply.csv_offers import CsvImportInfo, CsvOfferStore
from app.services.supply.providers import registry
from app.services.supply.store import SupplyStore, supply_store


def _read_again(conn, connector_id: str) -> None:
    """Make every listing of the connector due now, so the offers already read from the old file are replaced on the next scan
    instead of standing until each listing's own next read (a day, a week or a month away)."""

    conn.execute(
        "UPDATE supply_poll_state SET next_poll_at = NOW() WHERE listing_id IN (SELECT id FROM supply_listings WHERE connector_id = %s)",
        (connector_id,),
    )


class CsvRejected(ValueError):
    """The file was not imported. ``parsed`` carries the errors to show."""

    def __init__(self, parsed: ParsedCsv) -> None:
        super().__init__(f"{parsed.error_count} problem(s) found in the file")
        self.parsed = parsed


class CsvImportService:
    def __init__(
        self,
        connectors: ConnectorService,
        store: SupplyStore = supply_store,
        offers: CsvOfferStore | None = None,
    ) -> None:
        self._connectors = connectors
        self._store = store
        self._offers = offers or CsvOfferStore()

    def import_file(
        self, connector_id: str, content: bytes, *, actor: str, filename: str = ""
    ) -> tuple[CsvImportInfo, ParsedCsv]:
        """Parse and replace the connector's offers. All or nothing."""

        actor = actor_text(actor)
        connector = self._require_csv_connector(connector_id)
        parsed = parse_offers_csv(content, default_currency=connector["currency"])
        if parsed.error_count:
            raise CsvRejected(parsed)
        filename = filename.strip()[:200]
        with self._store.connection() as conn:
            info = self._offers.replace_all(conn, connector_id, parsed.rows, filename=filename, actor=actor)
            conn.execute(
                "UPDATE supply_connectors SET last_ok_at = NOW(), last_error_code = '' WHERE id = %s", (connector_id,)
            )
            # New data may carry parts the old file lacked, and listings marked gone while the
            # file was missing can come back, so the connector is searched afresh on the next scan.
            conn.execute("DELETE FROM supply_discovery_runs WHERE connector_id = %s", (connector_id,))
            _read_again(conn, connector_id)
            write_audit(conn, actor, "connector.csv_import", connector_id,
                        {"filename": filename, "rows": info.row_count})
        return info, parsed

    def clear(self, connector_id: str, *, actor: str) -> None:
        actor = actor_text(actor)
        self._require_csv_connector(connector_id)
        with self._store.connection() as conn:
            self._offers.clear(conn, connector_id)
            _read_again(conn, connector_id)
            write_audit(conn, actor, "connector.csv_clear", connector_id, {})

    def _require_csv_connector(self, connector_id: str) -> dict:
        connector = self._connectors.get(connector_id)
        try:
            csv_fed = registry.get_spec(connector["provider"]).csv_fed
        except registry.UnknownProvider:
            csv_fed = False  # a plugin was removed; its connector cannot be fed a file
        if not csv_fed:
            raise ConnectorError("not_csv", "Only a CSV-fed connector takes an offers file.")
        return connector
