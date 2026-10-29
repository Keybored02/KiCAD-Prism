"""Unit price at a reference quantity.

Offers list price breaks from the first orderable quantity upward. Comparing the
first break of each offer would pit a reel price (3,000 pieces) against a cut
tape price (1 piece), so prices are compared at one reference quantity instead.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Sequence

REFERENCE_QUANTITY = 100


def order_quantity(wanted: int, moq: int, order_multiple: int) -> int:
    """What must be ordered to get ``wanted``: at least the minimum, in whole multiples."""

    quantity = max(wanted, moq, 1)
    multiple = max(order_multiple, 1)
    return -(-quantity // multiple) * multiple


def unit_price_at(
    breaks: Sequence[tuple[int, Decimal]],
    *,
    moq: int = 1,
    order_multiple: int = 1,
    wanted: int = REFERENCE_QUANTITY,
    up_to: int | None = None,
) -> Decimal | None:
    """The unit price when buying ``wanted`` pieces, or None if no break covers it.

    ``breaks`` is ascending by quantity. A price break above the order quantity
    does not apply, and an offer whose cheapest break starts higher than that
    quantity has no price here (the buyer would need more pieces). ``up_to`` is
    the largest quantity the breaks hold for, when the distributor quoted only
    up to it: a larger order has no price here rather than the quote's.
    """

    quantity = order_quantity(wanted, moq, order_multiple)
    if up_to is not None and quantity > up_to:
        return None
    chosen: Decimal | None = None
    for break_quantity, price in breaks:
        if break_quantity <= quantity:
            chosen = price
    return chosen
