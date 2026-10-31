"""A Gitea or self-hosted GitLab address may be http only when the operator allows it."""

from __future__ import annotations

import unittest
from unittest.mock import patch

from app.core.config import settings
from app.services.trackers.errors import ProviderError
from app.services.trackers.gitea_identity import web_root_for as gitea_web_root
from app.services.trackers.gitlab_auth import api_root_for as gitlab_api_root
from app.services.trackers.http import forge_schemes


class InsecureForgeHttpTests(unittest.TestCase):
    def test_http_is_refused_by_default(self) -> None:
        with patch.object(settings, "IMPORT_ALLOW_INSECURE_HTTP", False):
            self.assertEqual(forge_schemes(), frozenset({"https"}))
            with self.assertRaises(ProviderError):
                gitea_web_root("http://git.internal:3000")
            with self.assertRaises(ProviderError):
                gitlab_api_root(instance_kind="self_hosted", base_url="http://git.internal")

    def test_http_is_accepted_when_the_operator_allows_it(self) -> None:
        with patch.object(settings, "IMPORT_ALLOW_INSECURE_HTTP", True):
            self.assertEqual(gitea_web_root("http://git.internal:3000"), "http://git.internal:3000")
            self.assertEqual(
                gitlab_api_root(instance_kind="self_hosted", base_url="http://git.internal"),
                "http://git.internal/api/v4",
            )


if __name__ == "__main__":
    unittest.main()
