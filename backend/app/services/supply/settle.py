"""Settling who makes a part, from what distributors say about its number. Functions on a connection; none commit.

A part made from a line nobody has checked is provisional: its maker is the name as written (or "Not known yet"). Each
search or read of it brings listings of its number, each with the maker the distributor names. Spellings are grouped into
makers (``makers.same_maker``) and counted by how many distributors list each:

* a maker that is the written name settles it;
* one maker settles it;
* several makers, one listed by at least two distributors and by more than any other, settles it (the original against
  clones, as for FDN308P);
* otherwise a person chooses (``needs_choice``).

A part whose maker is known never asks, except when no distributor lists its number under that maker while some list it
under another (a rename, an acquisition): then the question is whether they are the same maker.
"""

from __future__ import annotations

from collections import Counter
from typing import Any

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import alias_key, match_key
from app.services.supply.makers import same_maker

SYSTEM = "system"
LEARNED = "learned"
MIN_SUPPORT = 2


def _evidence(conn, part_id: str, key: str) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT l.id, l.connector_id, c.display_name AS connector, l.raw_mpn, l.raw_manufacturer, l.match_state
        FROM listings l JOIN connectors c ON c.id = l.connector_id
        WHERE l.part_id = %s AND l.match_state <> 'rejected' ORDER BY l.first_seen_at
        """,
        (part_id,),
    ).fetchall()
    return [row for row in rows if match_key(row["raw_mpn"] or "") == key]


def _clusters(rows: list[dict[str, Any]], canon) -> list[dict[str, Any]]:
    """The makers the listings name: spellings that are the same maker are one."""

    found: list[dict[str, Any]] = []
    for row in rows:
        spelling = (row["raw_manufacturer"] or "").strip()
        if not alias_key(spelling):
            continue
        cluster = next((item for item in found if any(same_maker(spelling, other, canon) for other in item["spellings"])), None)
        if cluster is None:
            cluster = {"spellings": Counter(), "connectors": {}, "listings": []}
            found.append(cluster)
        cluster["spellings"][spelling] += 1
        cluster["connectors"][row["connector_id"]] = row["connector"]
        cluster["listings"].append(row)
    return found


def _leader(clusters: list[dict[str, Any]], written: str, canon) -> dict[str, Any] | None:
    ours = next((item for item in clusters if any(same_maker(spelling, written, canon) for spelling in item["spellings"])), None) if alias_key(written) and written != parts.UNKNOWN_NAME else None
    if ours is not None:
        return ours
    if len(clusters) == 1:
        # A name a person wrote is not overruled by one distributor's word; it is by two, or when no name was written.
        unwritten = not alias_key(written) or written == parts.UNKNOWN_NAME
        return clusters[0] if unwritten or len(clusters[0]["connectors"]) >= MIN_SUPPORT else None
    ranked = sorted(clusters, key=lambda item: len(item["connectors"]), reverse=True)
    if len(ranked) > 1 and len(ranked[0]["connectors"]) >= MIN_SUPPORT and len(ranked[0]["connectors"]) > len(ranked[1]["connectors"]):
        return ranked[0]
    return None


def _apply(conn, part: parts.PartRecord, clusters: list[dict[str, Any]], leader: dict[str, Any], actor: str) -> str:
    """Make ``leader`` this part's maker: its listings count, the others are another maker's."""

    canon = parts._known_keys(conn).get  # noqa: SLF001
    own = any(same_maker(spelling, part.manufacturer_name, canon) for spelling in leader["spellings"]) and part.manufacturer_name != parts.UNKNOWN_NAME
    target = part.manufacturer_id
    if not own:
        best = leader["spellings"].most_common(1)[0][0]
        target = parts.similar_manufacturer(conn, best) or parts.ensure_manufacturer(conn, best, actor)
        if target != part.manufacturer_id:
            clash = conn.execute("SELECT 1 FROM parts WHERE manufacturer_id = %s AND match_key = %s AND id <> %s", (target, part.match_key, part.id)).fetchone()
            if clash:
                return "conflict"
            conn.execute("UPDATE parts SET manufacturer_id = %s WHERE id = %s", (target, part.id))
            if part.manufacturer_name != parts.UNKNOWN_NAME:
                parts.record_spelling(conn, part.id, part.manufacturer_name, LEARNED)
            conn.execute("DELETE FROM manufacturers WHERE id = %s AND provisional AND NOT EXISTS (SELECT 1 FROM parts WHERE manufacturer_id = %s)", (part.manufacturer_id, part.manufacturer_id))
    conn.execute("UPDATE manufacturers SET provisional = FALSE WHERE id = %s", (target,))
    counted = {row["id"] for row in leader["listings"]}
    for cluster in clusters:
        for row in cluster["listings"]:
            if row["match_state"] == "manual":
                continue
            if row["id"] in counted:
                conn.execute(
                    "UPDATE listings SET match_state = 'exact', match_reason = %s, matched_by = %s WHERE id = %s",
                    ("same maker as the part", actor, row["id"]),
                )
            else:
                conn.execute(
                    "UPDATE listings SET match_state = 'near', match_reason = %s, matched_by = %s WHERE id = %s",
                    ("same part number, different maker", actor, row["id"]),
                )
    for spelling in leader["spellings"]:
        parts.record_spelling(conn, part.id, spelling, LEARNED if actor == SYSTEM else "person")
    write_audit(conn, actor, "part.settle", part.id, {"manufacturer_id": target, "by": "distributors" if actor == SYSTEM else "person"}, subject_kind="part")
    return "settled"


def settle_part(conn, part_id: str, actor: str = SYSTEM) -> str:
    """Settle a provisional part from its listings. Returns settled, confirmed, choice, conflict or unchanged."""

    part = parts.get_part(conn, part_id)
    if not part.provisional:
        return "unchanged"
    canon = parts._known_keys(conn).get  # noqa: SLF001
    clusters = _clusters(_evidence(conn, part_id, part.match_key), canon)
    if not clusters:
        searched = conn.execute("SELECT 1 FROM discovery_runs WHERE part_id = %s LIMIT 1", (part_id,)).fetchone()
        if searched and part.manufacturer_name != parts.UNKNOWN_NAME:
            conn.execute("UPDATE manufacturers SET provisional = FALSE WHERE id = %s", (part.manufacturer_id,))
            return "confirmed"
        return "unchanged"
    leader = _leader(clusters, part.manufacturer_name, canon)
    if leader is None:
        return "choice"
    return _apply(conn, part, clusters, leader, actor_text(actor))


def _option(cluster: dict[str, Any]) -> dict[str, Any]:
    spelling = cluster["spellings"].most_common(1)[0][0]
    return {
        "key": alias_key(spelling),
        "spelling": spelling,
        "spellings": sorted(cluster["spellings"]),
        "connectors": sorted(cluster["connectors"].values()),
        "listings": len(cluster["listings"]),
    }


def needs_choice(conn) -> list[dict[str, Any]]:
    """Parts whose maker the distributors' answers do not settle, with what each distributor says."""

    canon = parts._known_keys(conn).get  # noqa: SLF001
    found: list[dict[str, Any]] = []
    rows = conn.execute(
        """
        SELECT p.id, p.mpn, p.match_key, m.name AS maker, m.provisional FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE m.provisional OR NOT EXISTS (SELECT 1 FROM listings l WHERE l.part_id = p.id AND l.match_state IN ('exact', 'manual'))
        ORDER BY lower(p.mpn)
        """
    ).fetchall()
    for part in rows:
        clusters = _clusters(_evidence(conn, part["id"], part["match_key"]), canon)
        if not clusters:
            continue
        if part["provisional"]:
            if _leader(clusters, part["maker"], canon) is None:
                found.append({"part_id": part["id"], "mpn": part["mpn"], "manufacturer": part["maker"], "kind": "maker", "options": [_option(c) for c in clusters]})
        else:
            found.append({"part_id": part["id"], "mpn": part["mpn"], "manufacturer": part["maker"], "kind": "unlisted", "options": [_option(c) for c in clusters]})
    return found


def choose(conn, part_id: str, key: str, actor: str) -> str:
    """A person says which maker the part is: the one behind ``key``. For a part with a known maker, that the maker is the same."""

    actor = actor_text(actor)
    part = parts.get_part(conn, part_id)
    canon = parts._known_keys(conn).get  # noqa: SLF001
    clusters = _clusters(_evidence(conn, part_id, part.match_key), canon)
    chosen = next((item for item in clusters if any(alias_key(spelling) == key for spelling in item["spellings"])), None)
    if chosen is None:
        raise ValueError("That maker is not listed for this part.")
    if part.provisional:
        return _apply(conn, part, clusters, chosen, actor)
    for row in chosen["listings"]:
        if row["match_state"] != "manual":
            conn.execute(
                "UPDATE listings SET match_state = 'exact', match_reason = %s, matched_by = %s WHERE id = %s",
                ("same maker, said by a person", actor, row["id"]),
            )
    for spelling in chosen["spellings"]:
        parts.record_spelling(conn, part_id, spelling, "person")
    write_audit(conn, actor, "part.same_maker", part_id, {"spellings": sorted(chosen["spellings"])}, subject_kind="part")
    return "settled"


def not_this_maker(conn, part_id: str, key: str, actor: str) -> int:
    """A person says the listings of the maker behind ``key`` are not this part: they stop counting and are not asked about again."""

    actor = actor_text(actor)
    part = parts.get_part(conn, part_id)
    canon = parts._known_keys(conn).get  # noqa: SLF001
    clusters = _clusters(_evidence(conn, part_id, part.match_key), canon)
    chosen = next((item for item in clusters if any(alias_key(spelling) == key for spelling in item["spellings"])), None)
    if chosen is None:
        return 0
    for row in chosen["listings"]:
        conn.execute("UPDATE listings SET match_state = 'rejected', match_reason = 'another maker, said by a person', matched_by = %s WHERE id = %s", (actor, row["id"]))
    write_audit(conn, actor, "part.other_maker", part_id, {"spellings": sorted(chosen["spellings"])}, subject_kind="part")
    return len(chosen["listings"])


def undo_alias(conn, key: str, actor: str) -> int:
    """Take back a spelling Prism learned for a maker. It is not learned again for that maker. Returns the listings that stop counting."""

    actor = actor_text(actor)
    row = conn.execute("SELECT manufacturer_id FROM manufacturer_aliases WHERE alias_key = %s AND source = 'learned'", (key,)).fetchone()
    if row is None:
        raise ValueError("Prism did not learn that spelling.")
    conn.execute("INSERT INTO alias_rejections (alias_key, manufacturer_id, rejected_by) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", (key, row["manufacturer_id"], actor))
    conn.execute("DELETE FROM manufacturer_aliases WHERE alias_key = %s", (key,))
    conn.execute("DELETE FROM part_spellings WHERE alias_key = %s AND source = 'learned'", (key,))
    moved = 0
    for listing in conn.execute(
        "SELECT l.id, l.sku, l.raw_mpn, l.raw_manufacturer, l.part_id FROM listings l WHERE l.match_state = 'exact' AND l.part_id IS NOT NULL"
    ).fetchall():
        if alias_key(listing["raw_manufacturer"] or "") != key:
            continue
        part = parts.get_part(conn, listing["part_id"])
        if same_maker(listing["raw_manufacturer"], part.manufacturer_name, parts._known_keys(conn).get) or key in parts.part_spelling_keys(conn, part.id):  # noqa: SLF001
            continue
        conn.execute("UPDATE listings SET match_state = 'near', match_reason = 'same part number, different manufacturer', matched_by = %s WHERE id = %s", (actor, listing["id"]))
        moved += 1
    write_audit(conn, actor, "alias.undo", key, {"listings": moved}, subject_kind="manufacturer_alias")
    return moved


def learn_aliases(conn) -> int:
    """A spelling that two or more parts of one maker carry becomes a spelling of that maker for every part.

    Never when it was undone for that maker, and never when parts of different makers carry it.
    """

    rows = conn.execute(
        """
        SELECT s.alias_key, MIN(s.alias_text) AS alias_text, MIN(p.manufacturer_id) AS manufacturer_id
        FROM part_spellings s JOIN parts p ON p.id = s.part_id
        GROUP BY s.alias_key HAVING COUNT(DISTINCT s.part_id) >= 2 AND COUNT(DISTINCT p.manufacturer_id) = 1
        """
    ).fetchall()
    known = parts._known_keys(conn)  # noqa: SLF001
    learned = 0
    for row in rows:
        if row["alias_key"] in known:
            continue
        if conn.execute("SELECT 1 FROM alias_rejections WHERE alias_key = %s AND manufacturer_id = %s", (row["alias_key"], row["manufacturer_id"])).fetchone():
            continue
        conn.execute(
            "INSERT INTO manufacturer_aliases (alias_key, alias_text, manufacturer_id, status, confirmed_by, source) "
            "VALUES (%s, %s, %s, 'confirmed', %s, 'learned') ON CONFLICT (alias_key) DO NOTHING",
            (row["alias_key"], row["alias_text"], row["manufacturer_id"], SYSTEM),
        )
        learned += 1
    return learned
