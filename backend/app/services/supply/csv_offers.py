"""Storage for uploaded offers. SQL on a supplied connection; never commits."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Sequence

from app.services.supply.csv_format import CsvOfferRow
from app.services.supply.identity import alias_key, match_key
from app.services.supply.models import Incoming, Offer, PartMatch, PriceBreak
from app.services.supply.vocabulary import Lifecycle, Packaging

PROVIDER_KEY = "csv"


@dataclass(frozen=True, slots=True)
class CsvImportInfo:
    filename: str
    imported_by: str
    imported_at: datetime
    row_count: int

    def to_dto(self) -> dict[str, object]:
        return {
            "filename": self.filename,
            "imported_by": self.imported_by,
            "imported_at": self.imported_at.isoformat(),
            "row_count": self.row_count,
        }


def _info(row) -> CsvImportInfo:
    return CsvImportInfo(row["filename"], row["imported_by"], row["imported_at"], int(row["row_count"]))


_INSERT = """
    INSERT INTO csv_offers (
        connector_id, sku, mpn, match_key, manufacturer, stock, currency, moq, order_multiple,
        packaging, lead_time_days, lifecycle, discontinued, rohs, product_url,
        incoming_qty, incoming_date, price_breaks
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
"""


class CsvOfferStore:
    def replace_all(
        self, conn, connector_id: str, rows: Sequence[CsvOfferRow], *, filename: str, actor: str
    ) -> CsvImportInfo:
        """Swap the connector's offers for ``rows``, in the caller's transaction."""

        conn.execute("DELETE FROM csv_offers WHERE connector_id = %s", (connector_id,))
        with conn.cursor() as cursor:
            cursor.executemany(
                _INSERT,
                [
                    (
                        connector_id, row.sku, row.mpn, match_key(row.mpn), row.manufacturer, row.stock,
                        row.currency, row.moq, row.order_multiple, row.packaging.value, row.lead_time_days,
                        row.lifecycle.value, row.discontinued, row.rohs, row.product_url,
                        row.incoming.quantity if row.incoming else None,
                        row.incoming.expected if row.incoming else None,
                        json.dumps([[brk.quantity, str(brk.unit_price)] for brk in row.price_breaks]),
                    )
                    for row in rows
                ],
            )
        saved = conn.execute(
            """
            INSERT INTO csv_imports (connector_id, filename, imported_by, imported_at, row_count)
            VALUES (%s, %s, %s, NOW(), %s)
            ON CONFLICT (connector_id) DO UPDATE SET
                filename = EXCLUDED.filename, imported_by = EXCLUDED.imported_by,
                imported_at = EXCLUDED.imported_at, row_count = EXCLUDED.row_count
            RETURNING filename, imported_by, imported_at, row_count
            """,
            (connector_id, filename, actor, len(rows)),
        ).fetchone()
        return _info(saved)

    def clear(self, conn, connector_id: str) -> None:
        conn.execute("DELETE FROM csv_offers WHERE connector_id = %s", (connector_id,))
        conn.execute("DELETE FROM csv_imports WHERE connector_id = %s", (connector_id,))

    def import_infos(self, conn) -> dict[str, CsvImportInfo]:
        rows = conn.execute(
            "SELECT connector_id, filename, imported_by, imported_at, row_count FROM csv_imports"
        ).fetchall()
        return {row["connector_id"]: _info(row) for row in rows}

    def import_info(self, conn, connector_id: str) -> CsvImportInfo | None:
        row = conn.execute(
            "SELECT filename, imported_by, imported_at, row_count FROM csv_imports WHERE connector_id = %s",
            (connector_id,),
        ).fetchone()
        return _info(row) if row else None

    def offers_for_skus(self, conn, connector_id: str, skus: Sequence[str]) -> list[Offer]:
        if not skus:
            return []
        rows = conn.execute(
            """
            SELECT o.*, i.imported_at FROM csv_offers o
            JOIN csv_imports i ON i.connector_id = o.connector_id
            WHERE o.connector_id = %s AND o.sku = ANY(%s)
            ORDER BY o.sku
            """,
            (connector_id, list(skus)),
        ).fetchall()
        return [self._offer(row) for row in rows]

    def matches_for_mpn(
        self, conn, connector_id: str, mpn: str, manufacturer: str | None, *, limit: int = 50
    ) -> list[PartMatch]:
        """Rows with this part number. ``manufacturer`` ranks, it never excludes.

        A file spells manufacturers its own way, so excluding by text would hide
        "Texas Instruments Inc." from a search for "Texas Instruments". Whether
        a row is the same manufacturer is decided later, with the alias table.
        """

        key = match_key(mpn)
        if not key:
            return []
        rows = conn.execute(
            """
            SELECT sku, mpn, manufacturer, product_url FROM csv_offers
            WHERE connector_id = %s AND match_key = %s ORDER BY sku LIMIT %s
            """,
            (connector_id, key, limit),
        ).fetchall()
        hint = alias_key(manufacturer or "")
        if hint:
            rows = sorted(rows, key=lambda row: alias_key(row["manufacturer"]) != hint)
        return [
            PartMatch(PROVIDER_KEY, row["sku"], row["mpn"], row["manufacturer"], product_url=row["product_url"])
            for row in rows
        ]

    @staticmethod
    def _offer(row) -> Offer:
        incoming = ()
        if row["incoming_qty"]:
            incoming = (Incoming(int(row["incoming_qty"]), row["incoming_date"]),)
        return Offer(
            provider=PROVIDER_KEY,
            sku=row["sku"],
            mpn=row["mpn"],
            manufacturer=row["manufacturer"],
            stock=int(row["stock"]),
            # The upload time, so the data is as old as the file says it is.
            fetched_at=row["imported_at"],
            incoming=incoming,
            moq=int(row["moq"]),
            order_multiple=int(row["order_multiple"]),
            packaging=Packaging(row["packaging"]),
            price_breaks=tuple(PriceBreak(int(qty), Decimal(price)) for qty, price in row["price_breaks"]),
            currency=row["currency"],
            lead_time_days=row["lead_time_days"],
            lifecycle=Lifecycle(row["lifecycle"]),
            discontinued=bool(row["discontinued"]),
            rohs=row["rohs"],
            product_url=row["product_url"],
        )
