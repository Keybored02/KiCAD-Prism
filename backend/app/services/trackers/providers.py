"""Per-provider construction of tracker adapters.

The tracker runtime (executors, recovery, the provider registry, connector
administration and inbound webhooks) asks this module for a provider's pieces
instead of constructing a forge's classes itself. Adding an issue-capable
provider means adding one ``ProviderKit`` here; nothing else branches on the
provider name.

Imports of adapter modules stay inside the builder functions so that loading
this module does not pull every forge's HTTP stack into processes that only
need a display name.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Mapping, Optional, Sequence

from app.services.trackers.contracts import Destination
from app.services.trackers.errors import ProviderError

# Display names are safe to use anywhere, including for hosts that only link
# accounts and therefore have no kit.
DISPLAY_NAMES: dict[str, str] = {
    "github": "GitHub",
    "gitlab": "GitLab",
    "gitea": "Gitea",
    "forgejo": "Forgejo",
}


def display_name(provider: str | None) -> str:
    """Human name for a provider id, e.g. ``gitlab`` -> ``GitLab``."""

    key = (provider or "").strip().casefold()
    if key == "github.com":
        key = "github"
    return DISPLAY_NAMES.get(key, key.title() or "the tracker")


@dataclass(frozen=True)
class WebhookCodec:
    """How one forge authenticates and describes a webhook delivery.

    ``verify`` gets the raw body so signatures are checked on the exact bytes
    the forge sent. ``parse`` returns durable hint dicts for ``InboxStore``.
    """

    delivery_id: Callable[[Mapping[str, str]], str]
    event_type: Callable[[Mapping[str, str]], str]
    verify: Callable[[Mapping[str, str], bytes, str], bool]
    parse: Callable[..., list[dict]]


@dataclass(frozen=True)
class ProviderKit:
    """Everything the runtime needs from one issue-capable provider.

    ``credential_fields`` are the keys of the encrypted installation envelope;
    all are required once any is given. Webhook secrets and OAuth clients are
    stored separately and are not part of the envelope.
    """

    provider: str
    credential_fields: tuple[str, ...]
    credential_aliases: Mapping[str, str]
    credential_error: str
    issue_adapter: Callable[[Mapping[str, Any], Mapping[str, Any], Any], Any]
    comment_adapter: Callable[[Any, Mapping[str, Any]], Any]
    issue_page_fetcher: Callable[..., Any]
    comment_page_fetcher: Callable[[Any, Destination, str], Any]
    test_connection: Callable[[Mapping[str, Any], Mapping[str, Any]], dict[str, Any]]
    list_repositories: Callable[[Mapping[str, Any], Mapping[str, Any]], list[dict[str, Any]]]

    @property
    def display_name(self) -> str:
        return display_name(self.provider)

    def credential_payload(self, credentials: Mapping[str, Any]) -> dict[str, str]:
        """Envelope fields from an admin request, accepting snake_case aliases."""

        payload: dict[str, str] = {}
        for field in self.credential_fields:
            alias = self.credential_aliases.get(field, "")
            payload[field] = str(credentials.get(field) or (credentials.get(alias) if alias else "") or "")
        return payload

    def has_credentials(self, credentials: Mapping[str, Any]) -> bool:
        return any(self.credential_payload(credentials).values())

    def require_complete(self, payload: Mapping[str, str]) -> None:
        if not all(str(payload.get(field) or "") for field in self.credential_fields):
            raise ProviderError("invalid_request", self.credential_error)


# --- GitHub -----------------------------------------------------------------


def _github_auth(connector: Mapping[str, Any], material: Mapping[str, Any], http: Any = None) -> Any:
    from app.services.trackers.github_auth import GitHubAppAuth, GitHubAppCredentials

    creds = GitHubAppCredentials(
        app_id=str(material.get("appId") or material.get("app_id") or ""),
        installation_id=str(material.get("installationId") or material.get("installation_id") or ""),
        private_key_pem=str(material.get("privateKey") or material.get("private_key") or ""),
        instance_kind=str(connector.get("instance_kind") or "github.com"),
        base_url=str(connector.get("base_url") or ""),
    )
    return GitHubAppAuth(creds, http=http) if http is not None else GitHubAppAuth(creds)


def _github_issue_adapter(connector: Mapping[str, Any], material: Mapping[str, Any], http: Any = None) -> Any:
    from app.services.trackers.github_issues import GitHubIssueAdapter

    auth = _github_auth(connector, material, http)
    return GitHubIssueAdapter(
        auth,
        http=auth.http,
        bot_user_id=str(connector.get("bot_forge_user_id") or ""),
        bot_login=str(connector.get("bot_login") or ""),
    )


def _github_comment_adapter(issue_adapter: Any, connector: Mapping[str, Any]) -> Any:
    from app.services.trackers.github_comments import GitHubCommentAdapter

    return GitHubCommentAdapter(
        issue_adapter.auth,
        http=issue_adapter.http,
        bot_user_id=str(connector.get("bot_forge_user_id") or ""),
        bot_login=str(connector.get("bot_login") or ""),
    )


def _github_issue_pages(adapter: Any, dest: Destination, *, since: str | None = None) -> Any:
    from app.services.trackers.github_recovery import make_issue_page_fetcher

    return make_issue_page_fetcher(adapter, dest, since=since)


def _github_comment_pages(adapter: Any, dest: Destination, issue: str) -> Any:
    from app.services.trackers.github_recovery import make_comment_page_fetcher

    return make_comment_page_fetcher(adapter, dest, issue)


def _github_test(connector: Mapping[str, Any], material: Mapping[str, Any]) -> dict[str, Any]:
    return _github_auth(connector, material).test_connection()


def _github_repositories(connector: Mapping[str, Any], material: Mapping[str, Any]) -> list[dict[str, Any]]:
    return _github_auth(connector, material).list_repositories()


def _github_webhook() -> WebhookCodec:
    from app.services.trackers import github_webhooks as hooks

    return WebhookCodec(
        delivery_id=lambda headers: headers.get(hooks.DELIVERY_HEADER, "").strip(),
        event_type=lambda headers: headers.get(hooks.EVENT_HEADER, "").strip(),
        verify=hooks.verify_signature,
        parse=hooks.parse_github_event,
    )


GITHUB = ProviderKit(
    provider="github",
    credential_fields=("appId", "installationId", "privateKey"),
    credential_aliases={"appId": "app_id", "installationId": "installation_id", "privateKey": "private_key"},
    credential_error="GitHub App id, installation id and private key are required.",
    issue_adapter=_github_issue_adapter,
    comment_adapter=_github_comment_adapter,
    issue_page_fetcher=_github_issue_pages,
    comment_page_fetcher=_github_comment_pages,
    test_connection=_github_test,
    list_repositories=_github_repositories,
)


# --- Registry ---------------------------------------------------------------

_KITS: dict[str, ProviderKit] = {GITHUB.provider: GITHUB}
_WEBHOOK_FACTORIES: dict[str, Callable[[], WebhookCodec]] = {"github": _github_webhook}


def issue_providers() -> frozenset[str]:
    """Providers that can publish issues. Others only link accounts."""

    return frozenset(_KITS)


def is_issue_provider(provider: str | None) -> bool:
    return (provider or "") in _KITS


def kit_for(provider: str | None) -> ProviderKit:
    kit = _KITS.get(provider or "")
    if kit is None:
        raise ProviderError(
            "capability_missing",
            f"Issue publishing is not available for {display_name(provider)} yet; this host is for account linking.",
        )
    return kit


def webhook_codec(provider: str | None) -> Optional[WebhookCodec]:
    factory = _WEBHOOK_FACTORIES.get(provider or "")
    return factory() if factory else None


def issue_adapter_for(connector: Mapping[str, Any], material: Mapping[str, Any], *, http: Any = None) -> Any:
    return kit_for(str(connector.get("provider") or "")).issue_adapter(connector, material, http)


def comment_adapter_for(connector: Mapping[str, Any], issue_adapter: Any) -> Any:
    return kit_for(str(connector.get("provider") or "")).comment_adapter(issue_adapter, connector)


def issue_page_fetcher_for(provider: str, adapter: Any, dest: Destination, *, since: str | None = None) -> Any:
    return kit_for(provider).issue_page_fetcher(adapter, dest, since=since)


def comment_page_fetcher_for(provider: str, adapter: Any, dest: Destination, issue: str) -> Any:
    return kit_for(provider).comment_page_fetcher(adapter, dest, issue)


def register_kit(kit: ProviderKit, *, webhook: Callable[[], WebhookCodec] | None = None) -> None:
    """Add a provider. Used by provider modules and by tests with fakes."""

    _KITS[kit.provider] = kit
    if webhook is not None:
        _WEBHOOK_FACTORIES[kit.provider] = webhook


def registered_kits() -> Sequence[ProviderKit]:
    return tuple(_KITS.values())


__all__ = [
    "DISPLAY_NAMES",
    "GITHUB",
    "ProviderKit",
    "WebhookCodec",
    "comment_adapter_for",
    "comment_page_fetcher_for",
    "display_name",
    "is_issue_provider",
    "issue_adapter_for",
    "issue_page_fetcher_for",
    "issue_providers",
    "kit_for",
    "register_kit",
    "registered_kits",
    "webhook_codec",
]
