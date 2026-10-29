"""What every registered provider, built in or plugin, must offer. No network, no database.

A plugin author runs this file with the plugin installed: every spec in the registry is checked.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply.providers import registry  # noqa: E402
from app.services.supply.providers.base import CAPABILITIES, CAP_OFFERS, CAP_SEARCH, ProviderConfig  # noqa: E402

SECRET = "s3cr3t-value-0123456789"


def build(spec):
    credentials = {field.name: SECRET for field in spec.credential_fields}
    storefront = spec.storefronts[0] if spec.storefronts else ""
    return spec.factory(ProviderConfig(connector_id="c1", storefront=storefront, currency="EUR", credentials=credentials))


class ProviderContractTests(unittest.TestCase):
    def specs(self):
        registry.load_plugins()
        return registry.list_specs(include_dev=True)

    def test_there_are_providers_to_check(self) -> None:
        self.assertGreaterEqual({spec.key for spec in self.specs()} & {"tme", "mouser", "digikey", "farnell", "lcsc", "csv", "fake"}, {"tme", "mouser", "digikey", "farnell", "lcsc", "csv", "fake"})

    def test_every_spec_describes_itself_completely(self) -> None:
        for spec in self.specs():
            with self.subTest(provider=spec.key):
                self.assertTrue(spec.label.strip())
                self.assertTrue(spec.capabilities <= CAPABILITIES)
                self.assertIn(CAP_OFFERS, spec.capabilities, "a provider that cannot read offers has no use")
                self.assertGreaterEqual(spec.max_batch, 1)
                self.assertIn(spec.stock_pooling, ("pooled", "separate"))
                self.assertEqual(len(spec.storefronts), len(set(spec.storefronts)), "storefronts repeat")
                self.assertTrue(all(field.label.strip() for field in spec.credential_fields))
                self.assertEqual(spec.required_credentials, tuple(field.name for field in spec.credential_fields))
                if not spec.metered:
                    self.assertEqual(spec.default_daily_budget, 0, "a free provider has no call budget")
                if spec.metered and not spec.dev_only:
                    self.assertTrue(spec.hosts, "a provider that calls out names the hosts it calls")
                if spec.csv_fed:
                    self.assertEqual(spec.hosts, (), "a file upload calls nothing")

    def test_every_factory_builds_without_touching_the_network(self) -> None:
        for spec in self.specs():
            with self.subTest(provider=spec.key):
                provider = build(spec)
                for method in ("lookup_mpn", "get_offers", "get_part_data"):
                    self.assertTrue(callable(getattr(provider, method, None)), method)
                if CAP_SEARCH in spec.capabilities:
                    self.assertTrue(callable(provider.lookup_mpn))

    def test_credentials_never_show_in_a_config_or_a_provider_repr(self) -> None:
        for spec in self.specs():
            with self.subTest(provider=spec.key):
                config = ProviderConfig(connector_id="c1", credentials={field.name: SECRET for field in spec.credential_fields})
                self.assertNotIn(SECRET, repr(config))
                self.assertNotIn(SECRET, repr(build(spec)))


if __name__ == "__main__":
    unittest.main()
