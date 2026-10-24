from __future__ import annotations

import unittest

from app.services.supply import parts_view


def part(mpn: str, stock: int | None, price: str | None) -> dict:
    return {"id": mpn, "mpn": mpn, "stock": stock, "unit_price": price}


ITEMS = [part("B", 50, "0.10"), part("A", None, None), part("C", 900, "12.5"), part("D", 0, "0.0125")]


class SortTests(unittest.TestCase):
    def order(self, sort: str) -> list[str]:
        return [item["mpn"] for item in parts_view._by_column(ITEMS, sort)]

    def test_price_sorts_by_value_not_text(self) -> None:
        self.assertEqual(self.order("price:desc"), ["C", "B", "D", "A"])
        self.assertEqual(self.order("price:asc"), ["D", "B", "C", "A"])

    def test_stock_sorts_both_ways_and_a_part_with_no_figure_is_last_either_way(self) -> None:
        self.assertEqual(self.order("stock:desc"), ["C", "B", "D", "A"])
        self.assertEqual(self.order("stock:asc"), ["D", "B", "C", "A"])

    def test_part_sorts_by_number(self) -> None:
        self.assertEqual(self.order("part:asc"), ["A", "B", "C", "D"])
        self.assertEqual(self.order("part:desc"), ["D", "C", "B", "A"])

    def test_an_unknown_column_leaves_the_order_alone(self) -> None:
        self.assertEqual(self.order("colour:asc"), ["B", "A", "C", "D"])


if __name__ == "__main__":
    unittest.main()
