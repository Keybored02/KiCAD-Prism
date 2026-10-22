"""Stock forecasts: when a part runs out (P1), when a distributor is back (P2), the chance it can be bought on a day (P3) and how
long a distributor's quote really lasts (P4).

The models are small on purpose and say what they rest on:

* **Drain.** The observed net decrease of a distributor's counted stock since its last restock, as the spread of the pairwise
  slopes (Theil-Sen takes their median; here the 10% and 90% slopes give the range). It is not consumption.
* **Time out of stock.** A Kaplan-Meier survival curve of the stock-outs seen (still-out ones are censored), pooled for the
  distributor when it has five or more and for all distributors otherwise. With a quote and too few stock-outs, a log-normal
  around the quote times the distributor's real-to-quoted ratio.
* **Restock size.** The sizes of the restocks seen on that listing, or its peak.
* **A path** is simulated 2,000 times per distributor: it drains, may run out, comes back after a time out, and drains again.
  The part can be bought on a day when some distributor holds the quantity.

The simulation is pure (arrays in, arrays out) so a backtest can replay a past day from a slice of history.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Mapping, Sequence

import numpy as np

from app.services.supply import insights

DRAWS = 2000
HORIZON_DAYS = 84
RUNOUT_HORIZON = 56
MIN_RUN_POINTS = insights.MIN_RUN_POINTS
MIN_RUN_SPAN_DAYS = insights.MIN_RUN_SPAN_DAYS
# Readings since the last restock below which a part borrows the drain of similar parts, and how many similar parts that takes.
FEW_READINGS = 4
MIN_SIMILAR = 5
MIN_OUTAGES = 5
SHRINK_EVENTS = 5
QUOTE_SPREAD = 0.4
SEED = 20261017
NEVER = 10_000.0


@dataclass(slots=True)
class Holder:
    """One distributor's standing on a part."""

    connector_id: str
    name: str
    provider: str
    series: list[tuple[date, int]]
    quote_days: int | None = None
    weekly: bool = False
    # With fewer than ``FEW_READINGS`` readings since its last restock a part has no drain of its own; these are the drains, as a share
    # of stock a day, of similar parts (the same maker and category) that have one.
    similar: np.ndarray | None = None

    @property
    def stock(self) -> int:
        return self.series[-1][1] if self.series else 0


@dataclass(slots=True)
class OutageModel:
    """Survival of stock-outs: the event times and their survival, from Kaplan-Meier."""

    times: np.ndarray
    survival: np.ndarray
    events: int
    pooled: bool = False


@dataclass(slots=True)
class Simulation:
    stock: np.ndarray  # (holders, draws, days + 1)
    names: list[str]
    drain_known: list[bool]
    from_similar: list[bool] = field(default_factory=list)
    back_days: list[np.ndarray | None] = field(default_factory=list)  # per holder that is out now: draws of days until it is back


# --- pieces ---------------------------------------------------------------


def run_since_restock(series: Sequence[tuple[date, int]]) -> list[tuple[date, int]]:
    """The stretch of a distributor's series since its last restock."""

    run: list[tuple[date, int]] = []
    for day, stock in series:
        if run and insights.is_restock(run[-1][1], stock):
            run = []
        run.append((day, stock))
    return run


def restock_sizes(series: Sequence[tuple[date, int]]) -> list[int]:
    return [after - before for (_, before), (_, after) in zip(series, series[1:]) if insights.is_restock(before, after)]


def drain_samples(series: Sequence[tuple[date, int]], limit: int = insights.MAX_PAIRWISE_POINTS) -> np.ndarray | None:
    """Pairwise slopes, as a drain in pieces a day (rises count as zero), of the stretch since the last restock. None when it is too short."""

    run = run_since_restock(series)
    if len(run) < MIN_RUN_POINTS or (run[-1][0] - run[0][0]).days < MIN_RUN_SPAN_DAYS:
        return None
    sample = run[-limit:]
    slopes = [
        (b[1] - a[1]) / (b[0] - a[0]).days
        for index, a in enumerate(sample) for b in sample[index + 1:] if (b[0] - a[0]).days > 0
    ]
    return np.maximum(-np.asarray(slopes, dtype=float), 0.0) if slopes else None


def days_out(series: Sequence[tuple[date, int]]) -> int:
    """How many trailing days the distributor has held none."""

    count = 0
    for _, stock in reversed(series):
        if stock > 0:
            break
        count += 1
    return count


def kaplan_meier(durations: Sequence[float], observed: Sequence[bool], pooled: bool = False) -> OutageModel | None:
    """Survival of the time out of stock. None without at least ``MIN_OUTAGES`` stock-outs that ended."""

    if sum(1 for flag in observed if flag) < MIN_OUTAGES:
        return None
    pairs = sorted(zip((max(float(d), 1.0) for d in durations), observed))
    at_risk = len(pairs)
    survival = 1.0
    times, curve = [], []
    index = 0
    while index < len(pairs):
        time = pairs[index][0]
        ended = tied = 0
        while index < len(pairs) and pairs[index][0] == time:
            ended += 1 if pairs[index][1] else 0
            tied += 1
            index += 1
        if ended:
            survival *= 1 - ended / at_risk
            times.append(time)
            curve.append(survival)
        at_risk -= tied
    return OutageModel(np.asarray(times), np.asarray(curve), sum(1 for flag in observed if flag), pooled)


def sample_back(model: OutageModel | None, quote_days: int | None, ratio: float, already: float, rng: np.random.Generator, draws: int) -> np.ndarray | None:
    """Draws of the days until a distributor that has been out ``already`` days is back, or None when nothing says."""

    if model is not None:
        floor = float(np.interp(already, model.times, model.survival, left=1.0)) if already > 0 else 1.0
        floor = max(min(floor, 1.0), 1e-9)
        u = rng.uniform(0.0, floor, draws)
        # The first event time whose survival is at or below u; beyond the curve means longer than any seen.
        index = np.searchsorted(-model.survival, -u, side="left")
        out = np.where(index < len(model.times), model.times[np.minimum(index, len(model.times) - 1)], NEVER)
        return np.maximum(out - already, 0.0)
    if quote_days:
        centre = max(quote_days * ratio - already, 1.0)
        return rng.lognormal(np.log(centre), QUOTE_SPREAD, draws)
    return None


def shrunk_ratio(own: Sequence[float], pooled: Sequence[float]) -> tuple[float, int]:
    """The real-to-quoted wait ratio of a distributor, pulled towards the pooled one when it has few cases (P4)."""

    base = statistics.median(pooled) if len(pooled) >= SHRINK_EVENTS else 1.0
    if not own:
        return base, 0
    mine = statistics.median(own)
    return (len(own) * mine + SHRINK_EVENTS * base) / (len(own) + SHRINK_EVENTS), len(own)


# --- the simulation -------------------------------------------------------


def simulate(
    holders: Sequence[Holder], outage: Mapping[str, OutageModel | None], ratios: Mapping[str, float], *,
    draws: int = DRAWS, horizon: int = HORIZON_DAYS, seed: int = SEED,
) -> Simulation:
    """Stock of every distributor on each of the next ``horizon`` days, in ``draws`` possible futures."""

    rng = np.random.default_rng(seed)
    days = np.arange(horizon + 1, dtype=float)
    stock = np.zeros((len(holders), draws, horizon + 1))
    known: list[bool] = []
    borrowed: list[bool] = []
    backs: list[np.ndarray | None] = []
    for index, holder in enumerate(holders):
        now = float(holder.stock)
        slopes = drain_samples(holder.series)
        known.append(slopes is not None)
        borrows = slopes is None and holder.similar is not None and len(holder.similar) > 0 and now > 0
        borrowed.append(bool(borrows))
        if slopes is not None:
            drain = rng.choice(slopes, draws)
        elif borrows:
            drain = rng.choice(holder.similar, draws) * now
        else:
            drain = np.zeros(draws)
        sizes = restock_sizes(holder.series)
        size = rng.choice(np.asarray(sizes, dtype=float), draws) if sizes else np.full(draws, float(max((s for _, s in holder.series), default=0) or 1))
        model = outage.get(holder.connector_id)
        ratio = ratios.get(holder.connector_id, 1.0)
        if now <= 0:
            back = sample_back(model, holder.quote_days, ratio, float(days_out(holder.series)), rng, draws)
            backs.append(back)
            back = back if back is not None else np.full(draws, NEVER)
            out_at = np.zeros(draws)
        else:
            backs.append(None)
            with np.errstate(divide="ignore"):
                out_at = np.where(drain > 0, now / np.where(drain > 0, drain, 1.0), NEVER)
            wait = sample_back(model, holder.quote_days, ratio, 0.0, rng, draws)
            back = out_at + (wait if wait is not None else NEVER)
        t = days[None, :]
        before = np.maximum(now - drain[:, None] * t, 0.0) if now > 0 else np.zeros((draws, horizon + 1))
        after = np.maximum(size[:, None] - drain[:, None] * (t - back[:, None]), 0.0)
        stock[index] = np.where(t < out_at[:, None], before, np.where(t < back[:, None], 0.0, after))
    return Simulation(stock, [h.name for h in holders], known, borrowed, backs)


# --- what is said ----------------------------------------------------------


def _quantiles(values: np.ndarray) -> tuple[float, float, float]:
    low, mid, high = np.percentile(values, [10, 50, 90])
    return float(low), float(mid), float(high)


def _widen(low: float, high: float, weekly: bool) -> tuple[float, float]:
    """A part read weekly gives week-wide dates: the range is at least that wide."""

    if weekly and high - low < 7:
        return max(low - 3.0, 0.0), high + 4.0
    return low, high


def forecast(holders: Sequence[Holder], outage: Mapping[str, OutageModel | None], ratios: Mapping[str, float], quantity: int, *, weekly: bool = False) -> dict[str, Any]:
    """Everything stock-related that is said about a part: runout, back-in, the chance of buying by week, and what it rests on."""

    live = [holder for holder in holders if holder.series]
    if not live:
        return {"available": False, "reason": "no_readings"}
    span = max((h.series[-1][0] - h.series[0][0]).days for h in live)
    if span < 7:
        return {"available": False, "reason": "too_few_readings"}
    sim = simulate(live, outage, ratios)
    total = sim.stock.sum(axis=0)  # (draws, days)
    out_now = bool(total[:, 0].max() == 0)
    zero = total <= 0
    first_zero = np.where(zero.any(axis=1), zero.argmax(axis=1), -1)
    horizon_hit = (first_zero >= 0) & (first_zero <= RUNOUT_HORIZON)
    p_out = float(horizon_hit.mean())
    runout = None
    if p_out >= 0.10 and not out_now and (any(sim.drain_known) or any(sim.from_similar)):
        low, mid, high = _quantiles(first_zero[horizon_hit].astype(float))
        low, high = _widen(low, high, weekly)
        runout = {"low": low, "median": mid, "high": high, "probability": p_out}
    weeks = []
    for week in range(1, 13):
        day = min(week * 7, HORIZON_DAYS)
        weeks.append(float((sim.stock[:, :, day] >= max(quantity, 1)).any(axis=0).mean()))
    out_everywhere = {w: float((total[:, min(w * 7, HORIZON_DAYS)] <= 0).mean()) for w in (4, 8)}
    back = []
    for holder, draw in zip(live, sim.back_days):
        if draw is not None:
            low, mid, high = _quantiles(np.minimum(draw, 365.0))
            low, high = _widen(low, high, weekly)
            back.append({
                "connector_id": holder.connector_id, "name": holder.name, "provider": holder.provider,
                "low": low, "median": mid, "high": high, "quote_days": holder.quote_days,
                "ratio": ratios.get(holder.connector_id), "beyond": float((draw >= NEVER / 2).mean()),
            })
    steps = list(range(0, RUNOUT_HORIZON + 1, 2))
    path = [[day, *(float(v) for v in np.percentile(total[:, day], [10, 50, 90]))] for day in steps]
    # Each distributor's most likely stock on the same days, for a line of its own on the chart.
    holder_paths = [
        {"connector_id": holder.connector_id, "path": [[day, float(np.percentile(sim.stock[index][:, day], 50))] for day in steps]}
        for index, holder in enumerate(live)
    ]
    return {
        "available": True, "quantity": quantity, "path": path, "holder_paths": holder_paths, "out_now": out_now, "runout": runout, "p_out_total": p_out,
        "out_everywhere": out_everywhere, "weeks": weeks, "back": back,
        "inputs": {
            "span_days": span, "holders": len(live), "drain_known": sum(sim.drain_known), "from_similar": sum(sim.from_similar), "outages_modelled": sum(1 for m in outage.values() if m),
            "weekly": weekly,
        },
    }
