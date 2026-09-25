from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.comments_url_service import resolve_comments_base_url  # noqa: E402
from app.services.public_url_service import (  # noqa: E402
    resolve_provider_base_url,
    resolve_public_base_url,
)


def _request(
    *,
    base_url: str = "http://backend:8000/",
    headers: dict[str, str] | None = None,
) -> MagicMock:
    request = MagicMock()
    request.base_url = base_url
    request.headers = headers or {}
    return request


class PublicUrlServiceTests(unittest.TestCase):
    def test_explicit_override_wins(self) -> None:
        request = _request(
            headers={
                "x-forwarded-proto": "https",
                "x-forwarded-host": "proxy.example.com",
            }
        )
        with patch("app.services.public_url_service.settings") as settings:
            settings.PUBLIC_BASE_URL = "https://env.example.com"
            self.assertEqual(
                resolve_public_base_url(request, explicit="https://explicit.example.com/"),
                "https://explicit.example.com",
            )

    def test_public_base_url_env_wins_over_headers(self) -> None:
        request = _request(
            headers={
                "x-forwarded-proto": "https",
                "x-forwarded-host": "proxy.example.com",
            }
        )
        with patch("app.services.public_url_service.settings") as settings:
            settings.PUBLIC_BASE_URL = "https://prism.example.com/"
            self.assertEqual(
                resolve_public_base_url(request),
                "https://prism.example.com",
            )

    def test_forwarded_proto_and_host(self) -> None:
        request = _request(
            headers={
                "x-forwarded-proto": "https",
                "x-forwarded-host": "prism.example.com",
            }
        )
        with patch("app.services.public_url_service.settings") as settings:
            settings.PUBLIC_BASE_URL = ""
            self.assertEqual(
                resolve_public_base_url(request),
                "https://prism.example.com",
            )

    def test_forwarded_proto_falls_back_to_host_header(self) -> None:
        request = _request(
            headers={
                "x-forwarded-proto": "https",
                "host": "prism.example.com",
            }
        )
        with patch("app.services.public_url_service.settings") as settings:
            settings.PUBLIC_BASE_URL = ""
            self.assertEqual(
                resolve_public_base_url(request),
                "https://prism.example.com",
            )

    def test_comma_separated_forwarded_proto_uses_leftmost(self) -> None:
        request = _request(
            headers={
                "x-forwarded-proto": "https, http",
                "x-forwarded-host": "prism.example.com, internal",
            }
        )
        with patch("app.services.public_url_service.settings") as settings:
            settings.PUBLIC_BASE_URL = ""
            self.assertEqual(
                resolve_public_base_url(request),
                "https://prism.example.com",
            )

    def test_forwarded_proto_rewrites_request_base_url_scheme(self) -> None:
        request = _request(
            base_url="http://prism.example.com/",
            headers={"x-forwarded-proto": "https"},
        )
        with patch("app.services.public_url_service.settings") as settings:
            settings.PUBLIC_BASE_URL = ""
            # No Host / X-Forwarded-Host → rewrite scheme on request.base_url.
            self.assertEqual(
                resolve_public_base_url(request),
                "https://prism.example.com",
            )

    def test_no_headers_uses_request_base_url(self) -> None:
        request = _request(base_url="http://127.0.0.1:8000/")
        with patch("app.services.public_url_service.settings") as settings:
            settings.PUBLIC_BASE_URL = ""
            self.assertEqual(
                resolve_public_base_url(request),
                "http://127.0.0.1:8000",
            )


class ProviderUrlOriginTests(unittest.TestCase):
    """KiCad rejects provider URLs that are plain HTTP on anything but loopback."""

    def _resolve(self, public_base_url: str, headers: dict[str, str]) -> str:
        request = _request(base_url="http://127.0.0.1:8000/", headers=headers)
        with patch("app.services.public_url_service.settings") as settings:
            settings.PUBLIC_BASE_URL = public_base_url
            return resolve_provider_base_url(request)

    def test_https_public_url_is_always_used(self) -> None:
        self.assertEqual(
            self._resolve(
                "https://prism.example.com",
                {"x-prism-loopback-origin": "http://127.0.0.1:5555", "host": "localhost:5173"},
            ),
            "https://prism.example.com",
        )

    def test_loopback_public_url_is_used(self) -> None:
        self.assertEqual(
            self._resolve("http://localhost:5173", {"host": "127.0.0.1:8000"}),
            "http://localhost:5173",
        )

    def test_http_lan_public_url_with_a_localhost_caller(self) -> None:
        # The dev proxy rewrites Host but keeps the caller's in X-Forwarded-Host.
        self.assertEqual(
            self._resolve(
                "http://192.168.1.17:5173",
                {"host": "127.0.0.1:8000", "x-forwarded-host": "localhost:5173"},
            ),
            "http://localhost:5173",
        )

    def test_http_lan_public_url_through_the_agent_bridge(self) -> None:
        # A proxy in front has overwritten X-Forwarded-Host with the LAN address.
        self.assertEqual(
            self._resolve(
                "http://192.168.1.17:5173",
                {
                    "host": "127.0.0.1:8000",
                    "x-forwarded-host": "192.168.1.17:5173",
                    "x-prism-loopback-origin": "http://127.0.0.1:61234",
                },
            ),
            "http://127.0.0.1:61234",
        )

    def test_http_lan_public_url_with_a_lan_caller_keeps_the_public_url(self) -> None:
        self.assertEqual(
            self._resolve(
                "http://192.168.1.17:5173",
                {"host": "127.0.0.1:8000", "x-forwarded-host": "192.168.1.17:5173"},
            ),
            "http://192.168.1.17:5173",
        )

    def test_a_non_loopback_bridge_header_is_ignored(self) -> None:
        self.assertEqual(
            self._resolve(
                "http://192.168.1.17:5173",
                {
                    "x-forwarded-host": "192.168.1.17:5173",
                    "x-prism-loopback-origin": "http://evil.example.com",
                },
            ),
            "http://192.168.1.17:5173",
        )


class CommentsUrlOriginTests(unittest.TestCase):
    def test_comments_api_base_url_wins_over_public_base_url(self) -> None:
        request = _request(
            headers={
                "x-forwarded-proto": "https",
                "x-forwarded-host": "proxy.example.com",
            }
        )
        with (
            patch("app.services.comments_url_service.settings") as comments_settings,
            patch("app.services.public_url_service.settings") as public_settings,
        ):
            comments_settings.COMMENTS_API_BASE_URL = "https://comments.example.com"
            public_settings.PUBLIC_BASE_URL = "https://prism.example.com"
            self.assertEqual(
                resolve_comments_base_url(request),
                "https://comments.example.com",
            )

    def test_comments_falls_back_to_shared_public_resolver(self) -> None:
        request = _request(
            headers={
                "x-forwarded-proto": "https",
                "x-forwarded-host": "prism.example.com",
            }
        )
        with (
            patch("app.services.comments_url_service.settings") as comments_settings,
            patch("app.services.public_url_service.settings") as public_settings,
        ):
            comments_settings.COMMENTS_API_BASE_URL = ""
            public_settings.PUBLIC_BASE_URL = ""
            self.assertEqual(
                resolve_comments_base_url(request),
                "https://prism.example.com",
            )


if __name__ == "__main__":
    unittest.main()
