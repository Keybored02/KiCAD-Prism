"""Picking which packaging of a part is followed, by what the part is bought for (plan section 12).

A distributor lists one part as several listings (cut tape, reel, Digi-Reel). Reading all of them costs a call each, so one
is followed (``packaging_picks.py``). Nobody should have to choose per part: a project says what it buys for, and Prism picks.

* ``prototypes``: the listing with the smallest minimum order (cut tape in practice).
* ``production``: a reel when there is one (the smallest reel), otherwise the smallest minimum order.

A part used by tracked projects is bought for production only when every one of them says so. A part in no project, or in
none that is tracked, is bought for prototypes. A person's pick is never changed; only parts with no pick get one.
Functions on a connection; none commit.
"""

from __future__ import annotations

from typing import Any

from app.services.supply import packaging_picks, usage

PROTOTYPES, PRODUCTION = "prototypes", "production"
BUYING = (PROTOTYPES, PRODUCTION)
AUTO = "auto"


def policy_of(conn, part_id: str) -> str:
    """What a part is bought for: production only when every tracked project that uses it says production."""

    rows = conn.execute(
        "SELECT DISTINCT tp.project_id, tp.buying_for FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id "
        "JOIN " + usage.ALL_USES + " u ON " + usage.MATCHES_PART + " JOIN tracked_projects tp ON tp.project_id = u.project_id "
        "WHERE p.id = %s",
        (part_id,),
    ).fetchall()
    if rows and all(row["buying_for"] == PRODUCTION for row in rows):
        return PRODUCTION
    return PROTOTYPES


def _moq(listing: dict[str, Any]) -> int:
    return int(listing["moq"] or 1)


def choose(listings: list[dict[str, Any]], policy: str) -> dict[str, Any]:
    """The listing to follow among these (the same part at one distributor)."""

    def prototype_key(item: dict[str, Any]) -> tuple:
        return (_moq(item), 0 if packaging_picks._packaging(item) == "cut_tape" else 1, item["sku"])  # noqa: SLF001

    if policy == PRODUCTION:
        reels = [item for item in listings if packaging_picks._packaging(item) == "tape_reel"]  # noqa: SLF001
        if reels:
            return min(reels, key=prototype_key)
    return min(listings, key=prototype_key)


def auto_pick(conn, *, limit: int = 500) -> int:
    """Pick a packaging for every tracked part that has several listings at a distributor and no pick. Returns how many."""

    done = 0
    for item in packaging_picks.waiting(conn, limit):
        listings = packaging_picks._listings(conn, item["part_id"], item["connector_id"])  # noqa: SLF001
        if len(listings) < 2 or any(row["fetched_at"] is None for row in listings):
            continue  # read first: a minimum order is only known from an offer
        packaging_picks.pick(conn, item["part_id"], item["connector_id"], choose(listings, policy_of(conn, item["part_id"]))["id"], AUTO)
        done += 1
    return done
