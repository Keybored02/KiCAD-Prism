"""Distributor connectors: setup, credentials, pause and state.

One connector per provider and storefront, owned by the workspace. Credentials
are sealed with the credential keyring and never leave the backend: every read
returns which credentials are set, not their values. Audit identity is the
``actor`` the caller passes from the session.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any, Callable, Mapping

from psycopg.errors import UniqueViolation

from app.services.supply import credentials as sealed
from app.services.supply.providers import registry
from app.services.supply.providers.base import ProviderConfig, ProviderSpec, SupplyProvider
from app.services.supply.store import SupplyStore, supply_store

_UPDATABLE = frozenset({
    "display_name", "currency", "enabled", "daily_budget", "interactive_reserve_pct",
})
_MAX_REASON = 200


class ConnectorError(ValueError):
    """A request the connector rules reject. ``code`` is stable; the message is safe to show."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


class ConnectorNotFound(KeyError):
    """No connector with this id."""


def _settings_allow_dev() -> bool:
    from app.core.config import settings

    return bool(settings.SUPPLY_ENABLE_SIMULATED_PROVIDER)


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _clean_currency(value: Any) -> str:
    text = str(value or "").strip().upper()
    if text and (len(text) != 3 or not text.isalpha()):
        raise ConnectorError("invalid_currency", "Currency must be a three letter code.")
    return text


def _clean_budget(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ConnectorError("invalid_budget", "Daily budget must be a whole number, 0 or more.")
    return value


def _clean_reserve(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 50:
        raise ConnectorError("invalid_reserve", "Interactive reserve must be between 0 and 50 percent.")
    return value


def _clean_credentials(spec: ProviderSpec, given: Mapping[str, Any] | None) -> dict[str, str]:
    cleaned = {str(name): str(value or "").strip() for name, value in (given or {}).items()}
    required = spec.required_credentials
    unknown = sorted(set(cleaned) - set(required))
    missing = [name for name in required if not cleaned.get(name)]
    if unknown or missing:
        parts = []
        if missing:
            parts.append("missing: " + ", ".join(missing))
        if unknown:
            parts.append("not used by this provider: " + ", ".join(unknown))
        raise ConnectorError("invalid_credentials", "Credentials " + "; ".join(parts) + ".")
    return {name: cleaned[name] for name in required}


def _actor(value: str | None) -> str:
    text = (value or "").strip()
    if not text:
        raise ValueError("actor is required")
    return text


def _audit(conn, actor: str, action: str, connector_id: str, detail: Mapping[str, Any]) -> None:
    conn.execute(
        "INSERT INTO audit_events (actor, action, subject_kind, subject_id, detail) "
        "VALUES (%s, %s, 'connector', %s, %s::jsonb)",
        (actor, action, connector_id, json.dumps(dict(detail))),
    )


def _fetch(conn, connector_id: str):
    row = conn.execute("SELECT * FROM connectors WHERE id = %s", (connector_id,)).fetchone()
    if row is None:
        raise ConnectorNotFound(connector_id)
    return row


class ConnectorService:
    def __init__(
        self,
        store: SupplyStore = supply_store,
        *,
        keyring_factory: sealed.KeyringFactory | None = None,
        allow_dev: Callable[[], bool] | None = None,
    ) -> None:
        self._store = store
        self._keyring = keyring_factory or sealed.default_keyring_factory
        self._allow_dev = allow_dev or _settings_allow_dev

    def list(self) -> list[dict[str, Any]]:
        with self._store.connection() as conn:
            rows = conn.execute("SELECT * FROM connectors ORDER BY created_at, id").fetchall()
        return [self._dto(row) for row in rows]

    def get(self, connector_id: str) -> dict[str, Any]:
        with self._store.connection() as conn:
            return self._dto(_fetch(conn, connector_id))

    def create(
        self,
        *,
        actor: str,
        provider: str,
        storefront: str = "",
        display_name: str = "",
        currency: str = "",
        credentials: Mapping[str, Any] | None = None,
        daily_budget: int | None = None,
        interactive_reserve_pct: int = 10,
    ) -> dict[str, Any]:
        actor = _actor(actor)
        spec = self._spec(provider)
        if spec.dev_only and not self._allow_dev():
            raise ConnectorError("provider_disabled", f"{spec.label} is not enabled on this server.")
        storefront = (storefront or "").strip()
        if spec.storefronts and storefront not in spec.storefronts:
            raise ConnectorError("invalid_storefront", f"{spec.label} needs a storefront.")
        if not spec.storefronts and storefront:
            raise ConnectorError("invalid_storefront", f"{spec.label} has no storefronts.")
        cleaned = _clean_credentials(spec, credentials)
        budget = _clean_budget(spec.default_daily_budget if daily_budget is None else daily_budget)
        reserve = _clean_reserve(interactive_reserve_pct)
        currency = _clean_currency(currency)
        name = (display_name or "").strip() or (f"{spec.label} {storefront}".strip())

        connector_id = uuid.uuid4().hex
        envelope = sealed.seal(self._keyring(), connector_id, cleaned) if cleaned else None
        try:
            with self._store.connection() as conn:
                conn.execute(
                    """
                    INSERT INTO connectors (
                        id, provider, storefront, display_name, currency,
                        credential_envelope, credential_names,
                        daily_budget, interactive_reserve_pct, created_by
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s)
                    """,
                    (
                        connector_id, spec.key, storefront, name, currency,
                        envelope, json.dumps(list(cleaned)), budget, reserve, actor,
                    ),
                )
                _audit(conn, actor, "connector.create", connector_id,
                       {"provider": spec.key, "storefront": storefront})
                row = _fetch(conn, connector_id)
        except UniqueViolation:
            raise ConnectorError(
                "duplicate", "A connector for this provider and storefront already exists."
            ) from None
        return self._dto(row)

    def update(self, connector_id: str, *, actor: str, **changes: Any) -> dict[str, Any]:
        actor = _actor(actor)
        unknown = sorted(set(changes) - _UPDATABLE)
        if unknown:
            raise ConnectorError("invalid_field", "Cannot change: " + ", ".join(unknown) + ".")
        fields: dict[str, Any] = {}
        if "display_name" in changes:
            fields["display_name"] = str(changes["display_name"] or "").strip()
        if "currency" in changes:
            fields["currency"] = _clean_currency(changes["currency"])
        if "enabled" in changes:
            if not isinstance(changes["enabled"], bool):
                raise ConnectorError("invalid_field", "enabled must be true or false.")
            fields["enabled"] = changes["enabled"]
        if "daily_budget" in changes:
            fields["daily_budget"] = _clean_budget(changes["daily_budget"])
        if "interactive_reserve_pct" in changes:
            fields["interactive_reserve_pct"] = _clean_reserve(changes["interactive_reserve_pct"])
        if not fields:
            return self.get(connector_id)
        # Column names come from the whitelist above, never from the caller.
        assignments = ", ".join(f"{column} = %s" for column in fields)
        with self._store.connection() as conn:
            result = conn.execute(
                f"UPDATE connectors SET {assignments}, updated_at = NOW() WHERE id = %s",
                (*fields.values(), connector_id),
            )
            if result.rowcount == 0:
                raise ConnectorNotFound(connector_id)
            _audit(conn, actor, "connector.update", connector_id, {"fields": sorted(fields)})
            return self._dto(_fetch(conn, connector_id))

    def set_credentials(
        self, connector_id: str, *, actor: str, credentials: Mapping[str, Any]
    ) -> dict[str, Any]:
        """Replace the whole credential set."""

        actor = _actor(actor)
        with self._store.connection() as conn:
            spec = self._spec(_fetch(conn, connector_id)["provider"])
            cleaned = _clean_credentials(spec, credentials)
            if not cleaned:
                raise ConnectorError("invalid_credentials", f"{spec.label} takes no credentials.")
            envelope = sealed.seal(self._keyring(), connector_id, cleaned)
            conn.execute(
                "UPDATE connectors SET credential_envelope = %s, credential_names = %s::jsonb, "
                "updated_at = NOW() WHERE id = %s",
                (envelope, json.dumps(list(cleaned)), connector_id),
            )
            _audit(conn, actor, "connector.credentials", connector_id, {"names": list(cleaned)})
            return self._dto(_fetch(conn, connector_id))

    def pause(self, connector_id: str, *, actor: str, reason: str) -> dict[str, Any]:
        actor = _actor(actor)
        reason = (reason or "").strip()
        if not reason or len(reason) > _MAX_REASON:
            raise ConnectorError("invalid_reason", f"Give a reason of up to {_MAX_REASON} characters.")
        return self._set_paused(connector_id, actor, reason, "connector.pause")

    def resume(self, connector_id: str, *, actor: str) -> dict[str, Any]:
        return self._set_paused(connector_id, _actor(actor), "", "connector.resume")

    def confirm_terms_review(self, connector_id: str, *, actor: str) -> dict[str, Any]:
        """Record that someone read this provider's terms of use."""

        actor = _actor(actor)
        with self._store.connection() as conn:
            result = conn.execute(
                "UPDATE connectors SET terms_reviewed_by = %s, terms_reviewed_at = NOW(), "
                "updated_at = NOW() WHERE id = %s",
                (actor, connector_id),
            )
            if result.rowcount == 0:
                raise ConnectorNotFound(connector_id)
            _audit(conn, actor, "connector.terms_review", connector_id, {})
            return self._dto(_fetch(conn, connector_id))

    def delete(self, connector_id: str, *, actor: str) -> None:
        actor = _actor(actor)
        with self._store.connection() as conn:
            row = _fetch(conn, connector_id)
            conn.execute("DELETE FROM connectors WHERE id = %s", (connector_id,))
            _audit(conn, actor, "connector.delete", connector_id,
                   {"provider": row["provider"], "storefront": row["storefront"]})

    def record_result(self, connector_id: str, error_code: str | None = None) -> None:
        """Note the outcome of a call. Success clears the error; failure keeps its code."""

        with self._store.connection() as conn:
            if error_code is None:
                conn.execute(
                    "UPDATE connectors SET last_ok_at = NOW(), last_error_code = '' WHERE id = %s",
                    (connector_id,),
                )
            else:
                conn.execute(
                    "UPDATE connectors SET last_error_code = %s, last_error_at = NOW() WHERE id = %s",
                    (error_code[:64], connector_id),
                )

    def load_provider(self, connector_id: str) -> SupplyProvider:
        """Build the adapter for an active connector, with its credentials."""

        with self._store.connection() as conn:
            row = _fetch(conn, connector_id)
        if not row["enabled"] or row["paused_reason"]:
            raise ConnectorError("connector_inactive", "The connector is disabled or paused.")
        spec = self._spec(row["provider"])
        creds: dict[str, str] = {}
        if row["credential_envelope"]:
            creds = sealed.unseal(self._keyring(), connector_id, row["credential_envelope"])
        return spec.factory(ProviderConfig(
            connector_id=connector_id,
            storefront=row["storefront"],
            currency=row["currency"],
            credentials=creds,
        ))

    def _set_paused(self, connector_id: str, actor: str, reason: str, action: str) -> dict[str, Any]:
        with self._store.connection() as conn:
            result = conn.execute(
                "UPDATE connectors SET paused_reason = %s, updated_at = NOW() WHERE id = %s",
                (reason, connector_id),
            )
            if result.rowcount == 0:
                raise ConnectorNotFound(connector_id)
            _audit(conn, actor, action, connector_id, {"reason": reason} if reason else {})
            return self._dto(_fetch(conn, connector_id))

    @staticmethod
    def _spec(provider: str) -> ProviderSpec:
        try:
            return registry.get_spec(provider)
        except registry.UnknownProvider:
            raise ConnectorError("unknown_provider", f"Unknown provider: {provider}.") from None

    def _dto(self, row: Mapping[str, Any]) -> dict[str, Any]:
        try:
            spec: ProviderSpec | None = registry.get_spec(row["provider"])
        except registry.UnknownProvider:
            spec = None  # a plugin was removed; the row stays visible
        names = set(row["credential_names"] or [])
        return {
            "id": row["id"],
            "provider": row["provider"],
            "provider_label": spec.label if spec else row["provider"],
            "provider_available": spec is not None,
            "storefront": row["storefront"],
            "display_name": row["display_name"],
            "currency": row["currency"],
            "enabled": bool(row["enabled"]),
            "paused_reason": row["paused_reason"],
            "daily_budget": row["daily_budget"],
            "interactive_reserve_pct": row["interactive_reserve_pct"],
            "credentials": {name: name in names for name in (spec.required_credentials if spec else ())},
            "credentials_status": sealed.status(self._keyring, row["credential_envelope"]),
            "terms_reviewed_by": row["terms_reviewed_by"],
            "terms_reviewed_at": _iso(row["terms_reviewed_at"]),
            "last_ok_at": _iso(row["last_ok_at"]),
            "last_error_code": row["last_error_code"],
            "last_error_at": _iso(row["last_error_at"]),
            "created_by": row["created_by"],
            "created_at": _iso(row["created_at"]),
            "updated_at": _iso(row["updated_at"]),
        }
