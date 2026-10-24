"""Versioned, additive migrations for the ``supply`` schema.

Supply keeps its own ledger so its numbers cannot collide with the workspace
or catalog ledgers when branches merge. ``SupplyStore.initialize()`` applies
these in order under the schema advisory lock and records each one. Every step
must be safe to apply twice.

Table names are unqualified; the caller has set the search path to the supply
schema (or a disposable test schema).
"""

from __future__ import annotations

import logging
from typing import Callable, List, Tuple

logger = logging.getLogger(__name__)

LEDGER_TABLE = "supply_schema_migrations"
from app.services.supply.migration_steps.steps_a import (  # noqa: F401
    _m001_connectors_quota_audit,
    _m002_csv_offers,
    _m003_parts_and_listings,
    _m004_watches_offers_samples,
    _m005_discovery_runs,
    _m006_events_rollups,
    _m007_alerts,
    _m008_bom_usage,
    _m009_usage_visibility,
    _m010_component_sources,
    _m011_waivers,
    _m012_release_snapshots,
    _m013_settings,
    _m014_demands,
    _m015_fx_rates,
    _m016_datasheets,
    _m017_reach,
    _m018_market_indices,
    _m019_pcns,
    _m020_part_params,
)
from app.services.supply.migration_steps.steps_b import (  # noqa: F401
    _m040_read_requests,
    _m039_summary_dirty_log,
    _m038_part_summaries,
    _m037_release_snapshot_jobs,
    _m036_poll_schedules,
    _m035_tracking,
    _m034_variant_usage_keys,
    _m033_connector_keep_days,
    _m032_bom_usage_variants,
    _m031_bom_comments,
    _m030_release_compliance,
    _m029_notice_files,
    _m028_datasheet_denied_hosts,
    _m027_component_watches,
    _m026_watch_packaging,
    _m025_worker_seen,
    _m024_market_categories,
    _m023_connector_retention,
    _m022_usage_lcsc,
    _m021_distributor_details,
    _m041_catch_up,
    _m042_sample_order_terms,
    _m043_bom_cost_history,
    _m044_alert_rules,
    _m045_notice_parse,
    _m046_rohs_exemptions,
    _m047_arrival_promises,
    _m048_rate_limits,
    _m049_limit_marks,
    _m050_drop_headers_seen,
    _m051_project_opt_outs,
    _m052_usage_symbol_facts,
    _m053_no_stored_files,
    _m054_limit_scopes,
    _m055_follow_all_variants,
    _m056_makers_without_friction,
    _m057_part_numbers,
    _m058_buying_for,
    _m059_ask_maker,
    _m060_maker_seeds,
)
from app.services.supply.migration_steps.steps_c import (  # noqa: F401
    _m061_number_suffixes,
    _m062_part_insights,
    _m063_figure_history,
    _m064_maker_seeds_added,
    _m065_family_done,
    _m066_drop_demands,
    _m067_cost_history_outliers,
    _m068_drop_worker_seen,
    _m069_offer_reel,
    _m070_project_packaging,
    _m071_part_preferences,
    _m072_cost_history_rollup,
    _m073_part_trade_marks,
    _m074_price_quantity,
    _m075_part_alternates,
    _m076_stock_events,
    _m077_component_restrictions,
    _m081_reschedule_raised_parts,
    _m082_reschedule_raised_weekly_parts,
    _m083_detail_tried_at,
    _m084_block_streak,
    _m085_pace_state,
    _m086_free_budget,
    _m087_restart_price_forecasts,
    _m088_recompute_health,
    _m089_likely_out_percent,
    _m090_jlcpcb_budget,
    _m091_remove_approved_parts,
    _m092_usual_build,
    _m093_usual_spares,
    _m078_forget_cached_prices,
    _m079_forecasts,
)


MIGRATIONS: List[Tuple[int, str, Callable[[object], None]]] = [
    (1, "connectors_quota_audit", _m001_connectors_quota_audit),
    (2, "csv_offers", _m002_csv_offers),
    (3, "parts_and_listings", _m003_parts_and_listings),
    (4, "watches_offers_samples", _m004_watches_offers_samples),
    (5, "discovery_runs", _m005_discovery_runs),
    (6, "events_rollups", _m006_events_rollups),
    (7, "alerts", _m007_alerts),
    (8, "bom_usage", _m008_bom_usage),
    (9, "usage_visibility", _m009_usage_visibility),
    (10, "component_sources", _m010_component_sources),
    (11, "waivers", _m011_waivers),
    (12, "release_snapshots", _m012_release_snapshots),
    (13, "settings", _m013_settings),
    (14, "demands", _m014_demands),
    (15, "fx_rates", _m015_fx_rates),
    (16, "datasheets", _m016_datasheets),
    (17, "reach", _m017_reach),
    (18, "market_indices", _m018_market_indices),
    (19, "pcns", _m019_pcns),
    (20, "part_params", _m020_part_params),
    (21, "distributor_details", _m021_distributor_details),
    (22, "usage_lcsc", _m022_usage_lcsc),
    (23, "connector_retention", _m023_connector_retention),
    (24, "market_categories", _m024_market_categories),
    (25, "worker_seen", _m025_worker_seen),
    (26, "watch_packaging", _m026_watch_packaging),
    (27, "component_watches", _m027_component_watches),
    (28, "datasheet_denied_hosts", _m028_datasheet_denied_hosts),
    (29, "notice_files", _m029_notice_files),
    (30, "release_compliance", _m030_release_compliance),
    (31, "bom_comments", _m031_bom_comments),
    (32, "bom_usage_variants", _m032_bom_usage_variants),
    (33, "connector_keep_days", _m033_connector_keep_days),
    (34, "variant_usage_keys", _m034_variant_usage_keys),
    (35, "tracking", _m035_tracking),
    (36, "poll_schedules", _m036_poll_schedules),
    (37, "release_snapshot_jobs", _m037_release_snapshot_jobs),
    (38, "part_summaries", _m038_part_summaries),
    (39, "summary_dirty_log", _m039_summary_dirty_log),
    (40, "read_requests", _m040_read_requests),
    (41, "catch_up", _m041_catch_up),
    (42, "sample_order_terms", _m042_sample_order_terms),
    (43, "bom_cost_history", _m043_bom_cost_history),
    (44, "alert_rules", _m044_alert_rules),
    (45, "notice_parse", _m045_notice_parse),
    (46, "rohs_exemptions", _m046_rohs_exemptions),
    (47, "arrival_promises", _m047_arrival_promises),
    (48, "rate_limits", _m048_rate_limits),
    (49, "limit_marks", _m049_limit_marks),
    (50, "drop_headers_seen", _m050_drop_headers_seen),
    (51, "project_opt_outs", _m051_project_opt_outs),
    (52, "usage_symbol_facts", _m052_usage_symbol_facts),
    (53, "no_stored_files", _m053_no_stored_files),
    (54, "limit_scopes", _m054_limit_scopes),
    (55, "follow_all_variants", _m055_follow_all_variants),
    (56, "makers_without_friction", _m056_makers_without_friction),
    (57, "part_numbers", _m057_part_numbers),
    (58, "buying_for", _m058_buying_for),
    (59, "ask_maker", _m059_ask_maker),
    (60, "maker_seeds", _m060_maker_seeds),
    (61, "number_suffixes", _m061_number_suffixes),
    (62, "part_insights", _m062_part_insights),
    (63, "figure_history", _m063_figure_history),
    (64, "maker_seeds_added", _m064_maker_seeds_added),
    (65, "family_done", _m065_family_done),
    (66, "drop_demands", _m066_drop_demands),
    (67, "cost_history_outliers", _m067_cost_history_outliers),
    (68, "drop_worker_seen", _m068_drop_worker_seen),
    (69, "offer_reel", _m069_offer_reel),
    (70, "project_packaging", _m070_project_packaging),
    (71, "part_preferences", _m071_part_preferences),
    (72, "cost_history_rollup", _m072_cost_history_rollup),
    (73, "part_trade_marks", _m073_part_trade_marks),
    (74, "price_quantity", _m074_price_quantity),
    (75, "part_alternates", _m075_part_alternates),
    (76, "stock_events", _m076_stock_events),
    (77, "component_restrictions", _m077_component_restrictions),
    (78, "forget_cached_prices", _m078_forget_cached_prices),
    (79, "forecasts", _m079_forecasts),
    (81, "reschedule_raised_parts", _m081_reschedule_raised_parts),
    (82, "reschedule_raised_weekly_parts", _m082_reschedule_raised_weekly_parts),
    (83, "detail_tried_at", _m083_detail_tried_at),
    (84, "block_streak", _m084_block_streak),
    (85, "pace_state", _m085_pace_state),
    (86, "free_budget", _m086_free_budget),
    (87, "restart_price_forecasts", _m087_restart_price_forecasts),
    (88, "recompute_health", _m088_recompute_health),
    (89, "likely_out_percent", _m089_likely_out_percent),
    (90, "jlcpcb_budget", _m090_jlcpcb_budget),
    (91, "remove_approved_parts", _m091_remove_approved_parts),
    (92, "usual_build", _m092_usual_build),
    (93, "usual_spares", _m093_usual_spares),
]


def applied_versions(conn) -> set[int]:
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {LEDGER_TABLE} (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    return {int(row["version"]) for row in conn.execute(f"SELECT version FROM {LEDGER_TABLE}").fetchall()}


def apply_supply_migrations(conn) -> List[int]:
    """Apply every pending migration in order; return the versions applied.

    Runs inside the caller's transaction and advisory lock, so a crash in the
    middle of a step rolls the step and its ledger row back together.
    """

    applied = applied_versions(conn)
    newly: List[int] = []
    for version, name, migration in MIGRATIONS:
        if version in applied:
            continue
        logger.info("Applying supply schema migration %s (%s)", version, name)
        migration(conn)
        conn.execute(
            f"INSERT INTO {LEDGER_TABLE}(version, name) VALUES (%s, %s)",
            (version, name),
        )
        newly.append(version)
    return newly
