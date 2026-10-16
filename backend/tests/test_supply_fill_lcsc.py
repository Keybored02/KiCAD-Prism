"""Fill from distributor with LCSC: its own number finds the part, whatever the manufacturer number is."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply.fill import FillService  # noqa: E402
from app.services.supply.models import PartMatch  # noqa: E402


class _Connectors:
    store = None

    def list(self):
        return [{
            "id": "c1", "display_name": "LCSC", "provider": "lcsc", "enabled": True, "paused_reason": None,
            "provider_available": True, "metered": False,
        }]


class _Provider:
    def lookup_mpn(self, mpn, manufacturer=None):
        if mpn.upper() == "C7950":
            return [PartMatch(provider="lcsc", sku="C7950", mpn="LM358DR2G", manufacturer="onsemi")]
        return []


class FillLcscTests(unittest.TestCase):
    def service(self) -> FillService:
        return FillService(_Connectors(), provider_for=lambda _id: _Provider(), clock=lambda: datetime(2026, 1, 1, tzinfo=timezone.utc))

    def test_an_lcsc_number_gives_the_part(self) -> None:
        from unittest import mock

        with mock.patch("app.services.supply.fill.trouble.cooling_down", return_value=False):
            result = self.service().search("c7950")
        (candidate,) = result["candidates"]
        self.assertEqual((candidate["sku"], candidate["mpn"], candidate["manufacturer"]), ("C7950", "LM358DR2G", "onsemi"))

    def test_a_number_nothing_carries_is_no_match(self) -> None:
        from unittest import mock

        with mock.patch("app.services.supply.fill.trouble.cooling_down", return_value=False):
            result = self.service().search("LM358DR")
        self.assertEqual(result["candidates"], [])
        self.assertEqual(result["skipped"], [{"connector": "LCSC", "reason": "no match"}])

    def test_a_connector_awaiting_its_terms_is_not_asked(self) -> None:
        from unittest import mock

        connectors = _Connectors()
        connectors.list = lambda: [{**_Connectors().list()[0], "awaiting_terms": True}]
        asked = []
        service = FillService(connectors, provider_for=lambda _id: asked.append(1) or _Provider(), clock=lambda: datetime(2026, 1, 1, tzinfo=timezone.utc))
        with mock.patch("app.services.supply.fill.trouble.cooling_down", return_value=False):
            result = service.search("C7950")
        self.assertEqual((asked, result["skipped"]), ([], [{"connector": "LCSC", "reason": "terms not reviewed"}]))


if __name__ == "__main__":
    unittest.main()
