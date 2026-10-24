"""A forecast as the screens get it: dates instead of day counts, the words for chances, and each figure's model state.

Computed on request from the readings (no distributor call); the quantity is a question and nothing is saved.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any, Mapping

from app.services.supply import forecast_lifecycle, forecast_run, forecasting


def _day(today: date, offset: float) -> str:
    return (today + timedelta(days=round(offset))).isoformat()


def _range(today: date, item: Mapping[str, Any], extra: Mapping[str, Any] | None = None) -> dict[str, Any]:
    return {"low": _day(today, item["low"]), "median": _day(today, item["median"]), "high": _day(today, item["high"]), **(extra or {})}


def _chance(probability: float) -> dict[str, Any]:
    return {"probability": probability, "percent": forecasting.chance_percent(probability), "word": forecasting.chance_word(probability)}


def _borrowed(state: dict[str, Any], stock: dict[str, Any]) -> dict[str, Any]:
    """A runout worked out from similar parts, because the part has too few readings of its own, is kept as learning: it says so."""

    if stock["inputs"].get("from_similar"):
        return {**state, "state": "learning", "reason": "The drain is taken from similar parts of the same maker and category: this part has too few readings of its own."}
    return state


def part(conn, part_id: str, now: datetime | None = None, quantity: int | None = None) -> dict[str, Any]:
    """Everything the part sheet's Forecast section and chart bands need."""

    now = now or datetime.now(timezone.utc)
    today = now.astimezone(timezone.utc).date()
    states = forecasting.model_states(conn)

    def state(target: str) -> dict[str, Any]:
        item = states[target]
        return {"state": item["state"], "checks": item["checks"], "needs": item["needs"], "reason": item["reason"]}

    stock = forecast_run.stock_forecast(conn, part_id, now, quantity)
    out: dict[str, Any] = {"available": bool(stock.get("available")), "reason": stock.get("reason"), "today": today.isoformat(), "models": {name: state(name) for name in states}}
    if stock.get("available"):
        weeks = [{"week": index + 1, "date": _day(today, (index + 1) * 7), **_chance(value)} for index, value in enumerate(stock["weeks"])]
        out |= {
            "quantity": stock["quantity"], "out_now": stock["out_now"], "weeks": weeks,
            "buy_state": {"4w": state("can_buy_4w"), "8w": state("can_buy_8w")},
            "out_everywhere": {"4w": _chance(stock["out_everywhere"][4]), "8w": _chance(stock["out_everywhere"][8])},
            "runout": ({**_range(today, stock["runout"]), **_chance(stock["runout"]["probability"]), "state": _borrowed(state("runout"), stock)} if stock["runout"] else None),
            "back": [
                _range(today, item, {"connector_id": item["connector_id"], "name": item["name"], "provider": item["provider"], "quote_days": item["quote_days"],
                                      "ratio": item["ratio"], "beyond_share": item["beyond"], "state": state("back_in")})
                for item in stock["back"]
            ],
            "path": [{"day": _day(today, offset), "low": low, "median": mid, "high": high} for offset, low, mid, high in stock["path"]],
            "inputs": stock["inputs"],
            "by_distributor": {
                "stock": [
                    {"connector_id": item["connector_id"], "path": [{"day": _day(today, offset), "median": median} for offset, median in item["path"]]}
                    for item in stock["holder_paths"]
                ],
                "price": [],
            },
        }
    price = forecast_run.price_forecast(conn, part_id, now)
    if price.get("available"):
        out["price"] = {
            "now": price["now"], "inputs": price["inputs"],
            "h30": {**price["h30"], "date": _day(today, 30), "state": state("price_30")},
            "h90": {**price["h90"], "date": _day(today, 90), "state": state("price_90")},
        }
        out.setdefault("by_distributor", {"stock": [], "price": []})["price"] = [
            {"connector_id": item["connector_id"], "now": item["now"],
             "h30": {"date": _day(today, 30), "median": item["h30"]["median"], "low": item["h30"]["low"], "high": item["h30"]["high"]},
             "h90": {"date": _day(today, 90), "median": item["h90"]["median"], "low": item["h90"]["low"], "high": item["h90"]["high"]}}
            for item in forecast_run.price_by_distributor(conn, part_id, now)
        ]
    items = _lifecycle_of(conn, part_id)
    if items is not None:
        found = forecast_lifecycle.part_chance(conn, part_id, items, today)
        if found["available"]:
            out["end_of_life"] = {"p12": _chance(found["p12"]), "p24": _chance(found["p24"]), "changes": found["changes"], "needs": found["needs"], "state": state("eol_12")}
    return out


def _lifecycle_of(conn, part_id: str) -> str | None:
    from app.services.supply import parts_view

    found = parts_view.summaries_for(conn, [part_id])
    return found[0]["lifecycle"] if found else None
