"""The process cache of parsed interface artifacts (SB2-93)."""

from __future__ import annotations

import threading
import unittest

from app.services.systems.interface_cache import PARSED_PER_STORED_BYTE, InterfaceCache


def artifact(*ports: str) -> dict:
    return {"boardThicknessMm": 1.6, "components": [{"portKey": p, "reference": p.upper()} for p in ports]}


class InterfaceCacheTest(unittest.TestCase):
    def test_a_kept_artifact_is_returned_and_indexed_by_port(self) -> None:
        cache = InterfaceCache(10_000 * PARSED_PER_STORED_BYTE)
        cache.put(("p", "c", "6"), artifact("/a", "/b"), 100)
        self.assertEqual(cache.get(("p", "c", "6"))["boardThicknessMm"], 1.6)
        self.assertEqual(cache.component(("p", "c", "6"), "/b"), (True, {"portKey": "/b", "reference": "/B"}))
        self.assertEqual(cache.component(("p", "c", "6"), "/z"), (True, None))
        self.assertEqual(cache.component(("p", "other", "6"), "/a"), (False, None))

    def test_the_budget_evicts_the_least_recently_used(self) -> None:
        cache = InterfaceCache(250 * PARSED_PER_STORED_BYTE)
        for name in ("one", "two"):
            cache.put((name, "c", "6"), artifact("/a"), 100)
        cache.get(("one", "c", "6"))  # "two" is now the least recently used
        cache.put(("three", "c", "6"), artifact("/a"), 100)
        self.assertIsNotNone(cache.get(("one", "c", "6")))
        self.assertIsNone(cache.get(("two", "c", "6")))
        self.assertIsNotNone(cache.get(("three", "c", "6")))
        self.assertLessEqual(cache.stats()["bytes"], cache.budget_bytes)

    def test_an_artifact_larger_than_the_budget_is_not_kept(self) -> None:
        cache = InterfaceCache(50 * PARSED_PER_STORED_BYTE)
        payload = artifact("/a")
        self.assertIs(cache.put(("p", "c", "6"), payload, 100), payload)
        self.assertIsNone(cache.get(("p", "c", "6")))

    def test_the_first_copy_of_a_concurrent_read_wins(self) -> None:
        cache = InterfaceCache(10_000 * PARSED_PER_STORED_BYTE)
        first = cache.put(("p", "c", "6"), artifact("/a"), 100)
        second = cache.put(("p", "c", "6"), artifact("/a"), 100)
        self.assertIs(second, first)
        self.assertEqual(cache.stats()["entries"], 1)

    def test_verify_mode_catches_a_caller_that_mutates(self) -> None:
        cache = InterfaceCache(10_000 * PARSED_PER_STORED_BYTE, verify=True)
        cache.put(("p", "c", "6"), artifact("/a"), 100)
        cache.get(("p", "c", "6"))["components"][0]["reference"] = "J99"
        with self.assertRaises(AssertionError):
            cache.get(("p", "c", "6"))

    def test_concurrent_puts_and_gets_stay_within_budget(self) -> None:
        cache = InterfaceCache(1_000 * PARSED_PER_STORED_BYTE)

        def work(n: int) -> None:
            for i in range(200):
                cache.put((f"p{n}", str(i % 30), "6"), artifact("/a"), 100)
                cache.component((f"p{n}", str(i % 7), "6"), "/a")

        threads = [threading.Thread(target=work, args=(n,)) for n in range(8)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertLessEqual(cache.stats()["bytes"], cache.budget_bytes)
        self.assertLessEqual(cache.stats()["entries"], 10)
