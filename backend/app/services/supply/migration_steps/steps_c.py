"""Supply schema migrations: the later migrations (makers, suffixes, budgets, settings and the project page).

Applied migrations are never edited. ``schema_migrations`` lists every step in order and runs them.
"""

from __future__ import annotations


def _seed_makers(conn) -> None:
    """Add the usual spellings in code that the table does not have yet (a group's head is its first spelling)."""

    from app.services.supply import makers
    from app.services.supply.identity import alias_key

    for group in makers.default_spellings():
        head = alias_key(group[0])
        for spelling in group:
            conn.execute(
                "INSERT INTO maker_seeds (alias_key, group_key, alias_text) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (alias_key(spelling), head, spelling.title() if spelling.islower() and len(spelling) > 3 else spelling.upper() if len(spelling) <= 3 else spelling),
            )


def _m061_number_suffixes(conn) -> None:
    """The endings makers put on a base number, as rows an administrator can read and change (a list that was in code)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS number_suffixes (
            suffix_key TEXT PRIMARY KEY,
            suffix_text TEXT NOT NULL,
            kind TEXT NOT NULL CHECK (kind IN ('packaging', 'grade')),
            source TEXT NOT NULL DEFAULT 'seeded'
        );
        """,
        prepare=False,
    )
    from app.services.supply import number_suffixes

    _seed_makers(conn)
    for key, kind in number_suffixes.DEFAULTS:
        conn.execute(
            "INSERT INTO number_suffixes (suffix_key, suffix_text, kind) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", (key, key, kind)
        )


def _m062_part_insights(conn) -> None:
    """What the history says about each tracked part, kept so the Dashboard and Insights can list and chart every part."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_insights (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            computed_at TIMESTAMPTZ NOT NULL,
            data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        """,
        prepare=False,
    )


def _m063_figure_history(conn) -> None:
    """The Dashboard's figures, one value a day, so each can show how it moved. Parts that found nothing countable are searched again."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS figure_history (
            day DATE NOT NULL,
            metric TEXT NOT NULL,
            value INTEGER NOT NULL,
            PRIMARY KEY (day, metric)
        );
        """,
        prepare=False,
    )
    # Searches now keep the longer numbers distributors list. A part that found nothing countable is searched again, from the
    # committed share, the next time the scheduler looks.
    conn.execute(
        """
        UPDATE discovery_runs SET last_run_at = '2000-01-01'::timestamptz
        WHERE part_id NOT IN (SELECT part_id FROM listings WHERE part_id IS NOT NULL AND match_state IN ('exact', 'manual'))
        """,
        prepare=False,
    )


def _m064_maker_seeds_added(conn) -> None:
    """Spellings added to the usual list after migration 60 (TAI-SAW's own brand, TST)."""

    _seed_makers(conn)


def _m065_family_done(conn) -> None:
    """Whether the looser search for a part's longer numbers has been made at a connector (once, and again when its numbers change)."""

    conn.execute("ALTER TABLE discovery_runs ADD COLUMN IF NOT EXISTS family_done BOOLEAN NOT NULL DEFAULT FALSE", prepare=False)


def _m066_drop_demands(conn) -> None:
    """Demand and planned builds are left to the manufacturing feature: the table that held them goes."""

    conn.execute("DROP TABLE IF EXISTS demands", prepare=False)


def _m067_cost_history_outliers(conn) -> None:
    """A Farnell pack priced as one piece (a coin cell at EUR 1,476) made some projects' cost per board absurd; those days go."""

    conn.execute(
        """
        DELETE FROM bom_cost_history h
        USING (
            SELECT project_id, variant, percentile_cont(0.5) WITHIN GROUP (ORDER BY cost_per_board) AS median
            FROM bom_cost_history GROUP BY project_id, variant
        ) m
        WHERE h.project_id = m.project_id AND h.variant = m.variant AND m.median > 0 AND h.cost_per_board > m.median * 100
        """,
        prepare=False,
    )


def _m068_drop_worker_seen(conn) -> None:
    """The worker no longer reports itself; the table that held its report goes."""

    conn.execute("DROP TABLE IF EXISTS worker_seen", prepare=False)


def _m069_offer_reel(conn) -> None:
    """A listing keeps the pieces on its full reel and whether its packaging was guessed."""

    conn.execute(
        """
        ALTER TABLE offers ADD COLUMN IF NOT EXISTS reel_size INTEGER;
        ALTER TABLE offers ADD COLUMN IF NOT EXISTS packaging_inferred BOOLEAN NOT NULL DEFAULT FALSE;
        """,
        prepare=False,
    )


def _m070_project_packaging(conn) -> None:
    """A project says which packaging it prefers instead of what it buys for; Prism's own picks note when they fell back."""

    conn.execute(
        """
        ALTER TABLE tracked_projects ADD COLUMN IF NOT EXISTS packaging TEXT NOT NULL DEFAULT 'cut_tape';
        UPDATE tracked_projects SET packaging = 'tape_reel' WHERE buying_for = 'production';
        ALTER TABLE tracked_projects DROP COLUMN IF EXISTS buying_for;
        ALTER TABLE packaging_picks ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
        """,
        prepare=False,
    )


def _m071_part_preferences(conn) -> None:
    """A person's preferred distributor for a part: shown first, and marked in lists."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_preferences (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            set_by TEXT NOT NULL DEFAULT '',
            set_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )


def _m072_cost_history_rollup(conn) -> None:
    """The day's BOM rollup is kept with the cost (boards the stock covers, money out, parts at risk) for the Projects rows."""

    conn.execute("ALTER TABLE bom_cost_history ADD COLUMN IF NOT EXISTS rollup JSONB NOT NULL DEFAULT '{}'::jsonb", prepare=False)


def _m073_part_trade_marks(conn) -> None:
    """A person's word on whether a part is export controlled, which wins over what distributors state."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_trade_marks (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            control TEXT NOT NULL CHECK (control IN ('controlled', 'none')),
            eccn TEXT NOT NULL DEFAULT '',
            set_by TEXT NOT NULL DEFAULT '',
            set_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )


def _m074_price_quantity(conn) -> None:
    """A part's own price quantity, and each listing's price breaks as they changed, so the price history can follow any quantity."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_price_quantity (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 1000000),
            set_by TEXT NOT NULL DEFAULT '',
            set_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS price_breaks_history (
            listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            since TIMESTAMPTZ NOT NULL,
            breaks JSONB NOT NULL,
            currency TEXT NOT NULL DEFAULT '',
            moq INTEGER NOT NULL DEFAULT 1,
            order_multiple INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (listing_id, since)
        );

        -- The breaks held now, from the day they were last read. Earlier days only have the price at 100.
        INSERT INTO price_breaks_history (listing_id, since, breaks, currency, moq, order_multiple)
        SELECT listing_id, fetched_at, price_breaks, currency, moq, order_multiple FROM offers
        WHERE currency <> '' AND jsonb_array_length(price_breaks) > 0
        ON CONFLICT DO NOTHING;
        """,
        prepare=False,
    )


def _m075_part_alternates(conn) -> None:
    """Parts distributors suggest in place of a part, kept from the answers Prism reads and from asking for substitutes."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_alternates (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            -- listed: came with an offer read; asked: from a call made for it (DigiKey substitutes).
            origin TEXT NOT NULL DEFAULT 'listed' CHECK (origin IN ('listed', 'asked')),
            alt_key TEXT NOT NULL,
            manufacturer TEXT NOT NULL DEFAULT '',
            mpn TEXT NOT NULL DEFAULT '',
            sku TEXT NOT NULL DEFAULT '',
            note TEXT NOT NULL DEFAULT '',
            seen_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (part_id, provider, origin, alt_key)
        );
        """,
        prepare=False,
    )


def _m076_stock_events(conn) -> None:
    """Stock-outs and restocks of each listing as they happened, with the lead time the distributor quoted at the stock-out."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS stock_events (
            listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            day DATE NOT NULL,
            kind TEXT NOT NULL CHECK (kind IN ('stock_out', 'restock')),
            stock_before INTEGER NOT NULL,
            stock_after INTEGER NOT NULL,
            quoted_lead_days INTEGER,
            -- stock_out with a quote: the day the distributor said it would be back.
            expected DATE,
            -- stock_out: the day stock came back.
            resolved_on DATE,
            PRIMARY KEY (listing_id, day, kind)
        );
        CREATE INDEX IF NOT EXISTS idx_stock_events_day ON stock_events (day);

        -- What the recorded readings already show.
        INSERT INTO stock_events (listing_id, day, kind, stock_before, stock_after, quoted_lead_days, expected)
        SELECT listing_id, day, kind, before, after, lead, CASE WHEN kind = 'stock_out' AND lead IS NOT NULL THEN day + lead END
        FROM (
            SELECT s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date AS day, s.stock AS after, LAG(s.stock) OVER w AS before,
                   s.lead_time_days AS lead,
                   CASE WHEN LAG(s.stock) OVER w > 0 AND s.stock = 0 THEN 'stock_out'
                        WHEN LAG(s.stock) OVER w = 0 AND s.stock > 0 THEN 'restock' END AS kind
            FROM samples s WHERE NOT s.marketplace
            WINDOW w AS (PARTITION BY s.listing_id ORDER BY s.sampled_at)
        ) t WHERE kind IS NOT NULL
        ON CONFLICT DO NOTHING;

        UPDATE stock_events o SET resolved_on = (
            SELECT MIN(r.day) FROM stock_events r WHERE r.listing_id = o.listing_id AND r.kind = 'restock' AND r.day >= o.day
        ) WHERE o.kind = 'stock_out';
        """,
        prepare=False,
    )


def _m077_component_restrictions(conn) -> None:
    """What the library decided about a component whose part is ending: marked for no new designs, or retired. Outside the revision hash."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS component_restrictions (
            component_id TEXT PRIMARY KEY,
            level TEXT NOT NULL CHECK (level IN ('not_for_new_designs', 'retired')),
            reason TEXT NOT NULL DEFAULT '',
            replacement_component_id TEXT NOT NULL DEFAULT '',
            set_by TEXT NOT NULL DEFAULT '',
            set_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )


def _m081_reschedule_raised_parts(conn) -> None:
    """A part raised to daily kept the next read planned for its old rate (a week or a month away). Each listing of a daily part is due
    a day after its last read at the latest."""

    conn.execute(
        """
        UPDATE poll_state ps SET tier = 'daily', next_poll_at = LEAST(ps.next_poll_at, ps.last_polled_at + INTERVAL '1 day')
        FROM listings l JOIN part_tiers pt ON pt.part_id = l.part_id
        WHERE l.id = ps.listing_id AND pt.rate = 'daily' AND ps.last_polled_at IS NOT NULL
          AND ps.next_poll_at > ps.last_polled_at + INTERVAL '1 day'
        """,
        prepare=False,
    )


def _m082_reschedule_raised_weekly_parts(conn) -> None:
    """The same repair for the parts raised to weekly (from monthly) before a read was brought forward with the rate, and to monthly from
    nothing slower: a listing is due one rate's interval after its last read at the latest."""

    for rate, days in (("weekly", 7), ("monthly", 30)):
        conn.execute(
            """
            UPDATE poll_state ps SET tier = %s, next_poll_at = LEAST(ps.next_poll_at, ps.last_polled_at + make_interval(days => %s))
            FROM listings l JOIN part_tiers pt ON pt.part_id = l.part_id
            WHERE l.id = ps.listing_id AND pt.rate = %s AND ps.last_polled_at IS NOT NULL
              AND ps.next_poll_at > ps.last_polled_at + make_interval(days => %s)
            """,
            (rate, days, rate, days),
        )


def _m083_detail_tried_at(conn) -> None:
    """A failed read of a listing's notices or substances no longer counts as read: ``checked_at`` is the last read that worked
    (empty when none did) and ``tried_at`` the last try."""

    conn.execute(
        """
        ALTER TABLE detail_checks ADD COLUMN IF NOT EXISTS tried_at TIMESTAMPTZ;
        ALTER TABLE detail_checks ALTER COLUMN checked_at DROP NOT NULL;
        UPDATE detail_checks SET tried_at = checked_at WHERE tried_at IS NULL;
        UPDATE detail_checks SET checked_at = NULL WHERE failures > 0;
        """,
        prepare=False,
    )


def _m084_block_streak(conn) -> None:
    """How many blocks in a row a connector without credentials has had, which sets how long it rests."""

    conn.execute("ALTER TABLE connectors ADD COLUMN IF NOT EXISTS block_streak INTEGER NOT NULL DEFAULT 0", prepare=False)


def _m085_pace_state(conn) -> None:
    """When an account may next call its provider, and until when it is slowed, kept where every process sees it."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS pace_state (
            pace_key TEXT PRIMARY KEY,
            next_at TIMESTAMPTZ NOT NULL,
            slow_until TIMESTAMPTZ
        )
        """,
        prepare=False,
    )


def _m086_free_budget(conn) -> None:
    """What scheduled work still needs today (written by the poll job, trusted for 15 minutes) and the spare calls of the current
    hour, which together say how many calls are free to spend."""

    conn.execute(
        """
        ALTER TABLE quota_ledger ADD COLUMN IF NOT EXISTS scheduled_rest INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE quota_ledger ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
        ALTER TABLE quota_ledger ADD COLUMN IF NOT EXISTS spare_hour INTEGER;
        ALTER TABLE quota_ledger ADD COLUMN IF NOT EXISTS spare_hour_spent INTEGER NOT NULL DEFAULT 0;
        """,
        prepare=False,
    )


def _m087_restart_price_forecasts(conn) -> None:
    """The price forecasts made before currency switches and noise stopped counting as repricings, and before drift needed evidence, no
    longer count towards the price models' track record; they start again from forecasts the new model makes."""

    conn.execute(
        """
        DELETE FROM forecasts WHERE target IN ('price_30', 'price_90');
        UPDATE forecast_models SET state = 'learning', checks = 0, coverage = NULL, since = NULL, reason = '', updated_at = NOW()
            WHERE target IN ('price_30', 'price_90');
        DELETE FROM part_summaries;
        UPDATE part_insights SET computed_at = '-infinity'::timestamptz;
        """,
        prepare=False,
    )


def _m088_recompute_health(conn) -> None:
    """Health numbers now sit in the band of their status; the kept list summaries are worked out again."""

    conn.execute("DELETE FROM part_summaries", prepare=False)


def _m089_likely_out_percent(conn) -> None:
    """A part's own chance of running out within four weeks that raises its "likely to run out" alert (empty: the default)."""

    conn.execute("ALTER TABLE alert_rules ADD COLUMN IF NOT EXISTS likely_out_percent INTEGER", prepare=False)


def _m090_jlcpcb_budget(conn) -> None:
    """JLCPCB's refusals were its request-forgery check on cookies Prism kept, not a limit, so its budget is no longer 300: connectors of
    that provider still on the old default get 1000 (one a person changed is left)."""

    conn.execute("UPDATE connectors SET daily_budget = 1000 WHERE provider = 'jlcpcb' AND daily_budget = 300", prepare=False)


def _m091_remove_approved_parts(conn) -> None:
    """The approved parts list (alternates approved for a catalog component) is gone: its table, a component watch's alternates option and a
    release snapshot's frozen list are dropped, and the kept list summaries are worked out again without the findings it made."""

    conn.execute(
        """
        DROP TABLE IF EXISTS component_sources;
        ALTER TABLE component_watches DROP COLUMN IF EXISTS include_alternates;
        ALTER TABLE release_snapshots DROP COLUMN IF EXISTS avl;
        DELETE FROM part_summaries;
        """,
        prepare=False,
    )


def _m092_usual_build(conn) -> None:
    """The usual build of a tracked project (boards), which its cost is worked out for each day; a cost history row says which size it is
    for (the rows kept until now are for one board), and a changed usual build starts a new series."""

    conn.execute(
        """
        ALTER TABLE tracked_projects ADD COLUMN IF NOT EXISTS build_quantity INTEGER NOT NULL DEFAULT 100 CHECK (build_quantity BETWEEN 1 AND 1000000);
        ALTER TABLE bom_cost_history ADD COLUMN IF NOT EXISTS build_quantity INTEGER NOT NULL DEFAULT 1;
        """,
        prepare=False,
    )


def _m093_usual_spares(conn) -> None:
    """The spares a tracked project is costed with: empty is the workspace's setting, "auto" is by package, else a percent."""

    conn.execute("ALTER TABLE tracked_projects ADD COLUMN IF NOT EXISTS spares TEXT", prepare=False)


def _m094_csv_jlc_class(conn) -> None:
    """The JLCPCB columns of an uploaded offers file: the part's class in its assembly library and whether it is preferred."""

    conn.execute(
        """
        ALTER TABLE csv_offers ADD COLUMN IF NOT EXISTS jlc_library TEXT NOT NULL DEFAULT '';
        ALTER TABLE csv_offers ADD COLUMN IF NOT EXISTS jlc_preferred BOOLEAN NOT NULL DEFAULT FALSE;
        """,
        prepare=False,
    )


def _m078_forget_cached_prices(conn) -> None:
    """The kept list summaries and insights were worked out before prices were converted and given a kind; they are worked out again."""

    conn.execute(
        """
        DELETE FROM part_summaries;
        UPDATE part_insights SET computed_at = '-infinity'::timestamptz;
        """,
        prepare=False,
    )


def _m079_forecasts(conn) -> None:
    """Forecasts as they were made, the check of each once its day came, and the track record that decides whether a model is shown."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS forecasts (
            id BIGSERIAL PRIMARY KEY,
            subject_kind TEXT NOT NULL CHECK (subject_kind IN ('part', 'project', 'family')),
            subject_id TEXT NOT NULL,
            scope TEXT NOT NULL DEFAULT '',
            target TEXT NOT NULL,
            made_on DATE NOT NULL,
            horizon_days INTEGER NOT NULL,
            quantity INTEGER,
            median DOUBLE PRECISION,
            low DOUBLE PRECISION,
            high DOUBLE PRECISION,
            probability DOUBLE PRECISION,
            model TEXT NOT NULL,
            model_version INTEGER NOT NULL DEFAULT 1,
            inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
            UNIQUE (subject_kind, subject_id, scope, target, made_on)
        );
        CREATE INDEX IF NOT EXISTS idx_forecasts_due ON forecasts (made_on);
        CREATE INDEX IF NOT EXISTS idx_forecasts_subject ON forecasts (subject_kind, subject_id, made_on);

        CREATE TABLE IF NOT EXISTS forecast_checks (
            forecast_id BIGINT PRIMARY KEY REFERENCES forecasts(id) ON DELETE CASCADE,
            checked_on DATE NOT NULL,
            observed DOUBLE PRECISION,
            inside BOOLEAN,
            void BOOLEAN NOT NULL DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS forecast_models (
            target TEXT PRIMARY KEY,
            version INTEGER NOT NULL DEFAULT 1,
            state TEXT NOT NULL DEFAULT 'learning' CHECK (state IN ('learning', 'shown', 'paused')),
            checks INTEGER NOT NULL DEFAULT 0,
            coverage DOUBLE PRECISION,
            since TIMESTAMPTZ,
            reason TEXT NOT NULL DEFAULT '',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )
