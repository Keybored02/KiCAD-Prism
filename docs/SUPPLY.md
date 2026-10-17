# Supply chain data

Prism reads stock, prices and lifecycle of manufacturer parts from distributors, keeps the history, and uses it to
warn before a part runs out and to judge a project's BOM. It never buys anything: there are no carts, no order lists
and no purchase support.

## Where supply shows

| Place | What it answers |
| --- | --- |
| **Supply > Dashboard** | What needs a person: counts with their change over seven days and a 30-day line (at risk, out of stock, end of life, open alerts, waiting for room, what needs you), then what is behind them: a grid of lifecycle against how many distributors hold stock (unknown is its own row and column), the last-time-buy and last-ship dates of the next year in days, when stock runs out, and a table of the tracked projects (parts at risk, parts held by one distributor, boards the stock covers, cost per board and its 30-day move). Each opens the parts or the project behind it and has a table view behind an icon. Then the alerts with a chip for each kind and how long each has been open, then recent changes. Administrators also see a strip with what only they can fix: a paused connector, a DigiKey sign-in that ends within two weeks, a Candidate List older than six months, parts waiting for room. |
| **Supply > Parts** | Every part that is tracked or in a project as one list, with the scopes below. Track a part, check a BOM file, read catalog vendors. |
| **Supply > Projects** | The parts of each project, a project at a time (closed until opened, tracked projects first). A closed row has three lines: the designs and packaging followed, a bar of the parts by status with the counts that need a look (at risk, out, end of life, one distributor, running out within two weeks), and for a tracked project its cost per board and 30-day move, how many boards the stock covers, how old the BOM read is and its open alerts. An arrow button opens the project. |
| **Supply > Review** | What needs a person: parts whose maker the distributors do not settle, listings pinned under another number, and, to look at or undo, what Prism matched by itself. |
| **Supply > Insights** | One page, seven sections to jump between: Signals, Runway (stock left against lead time, and lists of draining parts, late restocks, single-distributor parts, growing lead times, parts often out of stock, unusual drops and moving prices), Sourcing (how many of your parts each distributor lists, holds and is cheapest for; how many distributors hold each part; and, folded away, how often each changes price, who moves first, who restocks first, arrivals on time), Lifecycle and compliance (lifecycle mix, when parts will end, RoHS and REACH), Lead times and prices (lead times in buckets, the biggest price rises and falls over 30 days), Market, Trade (country of origin, export controlled parts). Unknown is always its own grey bar. |
| **Supply > Connectors** | Distributor accounts and the call budget. |
| **Project > Supply** | How one product stands: tracking, its parts, releases, line notes. Reads the stored BOM of the default branch, never a checked-out commit. |
| **Project > Visualizers > BOM** | This BOM line, now. Supply shows only at the latest revision, not at a commit checked out from History. |
| **Release Studio** | Whether what ships is sourceable, recorded with the release. |

Old addresses still work: `overview` and `inbox` open the Dashboard, `market` and `planning` open Insights, `bom-file` opens
Parts with the tool. Lists, tables and bars use icons with tooltips; detail views keep their words. Comparing two
revisions shows no supply.

Who sees what: administrators, designers and QA read supply data. Administrators and designers watch parts and
read a part now. QA and administrators approve alternates, aliases and waivers. Only administrators
manage connectors and settings. Viewers see none of it.

## Set up a distributor

Supply > Connectors. One connector per provider and storefront.

| Provider | Needs | Notes |
| --- | --- | --- |
| TME | API token and secret | Prices follow the account's country. |
| Mouser | API key | Answers in the account's language. About 1,000 calls a day. |
| DigiKey | Client id and secret | One part per call, so it is slow for large watchlists. The API allows 1,000 calls a day. Change notices have a quota of their own, 50 a day, counted apart from the 1,000: five are kept for "Check notices", the scheduled reads take about a seventh of the tracked parts a day (oldest first; more than 45 a day would be needed past 315 parts, and then the interval stretches to fit), a part with news (lifecycle change, a distributor that stopped listing it) is read within a day, and notices of parts nobody tracks are read only in the last three hours of the provider's day. A refusal or DigiKey's own count reaching zero stops notices for the day while stock and prices go on. Obsolete parts are not asked about. The connector card shows the day's notice calls as a second bar. Change notices also need an administrator's sign-in at DigiKey (below). |
| Farnell, Newark, element14 | API key, store, currency | Choose the store carefully: `il.farnell.com` is Israel, `it.farnell.com` is Italy. Farnell's answer does not name its currency, so Prism uses the store's own for UK (GBP), the euro-zone stores (EUR) and Newark US and Canada. For any other store, set the currency on the connector or offers show no price. Product links are the store's search for the SKU. Checked against the live service on 2026-10-13. |
| Avnet | Client ID, client secret, scope, subscription key | From the Avnet API portal after Avnet approves a subscription to the price and quantity API: the subscription key and a client secret are on the portal's Profile page, with the client ID and scope. Avnet answers by manufacturer part number only (at least 4 characters), with one price at the quantity it offers, customer specific. Not yet run against the live service. |
| LCSC | Nothing | Searches by manufacturer part number through EasyEDA's part search, or reads an LCSC number (`C2040`) directly. Prices are in US dollars. Not a published API; it can change. |
| JLCPCB (assembly) | Nothing | What JLCPCB can place on a board and at what price, from the parts search its own site uses (unpublished; it can change, and it may answer 403, which Prism reads as a block and pauses for 12 hours). It is read only for a project that is built at JLCPCB (Track this project asks "Built at JLCPCB?"). Its stock is for its own assembly: it is shown on its own line and never counted in a total, status or check. Basic, Extended and Preferred show as a small icon (B, E, a star) in the parts list, the BOM line, the part sheet and the project's parts. One call every 6 to 12 seconds, 300 a day. |
| CSV | A file you upload | For air-gapped installs. The file replaces the previous one. |

Credentials are encrypted and never shown again. `TRACKER_CREDENTIAL_ROOT_KEY` must be set (see
[Configuration](CONFIGURATION.md)). Use **Test connection** after saving: it makes one real call. Of the providers checked (2026-10-15), only DigiKey reports its limit and what is left, in every answer; the card shows it. From those readings, or from a refusal that lasted hours, Prism works out when the provider's day resets; once two days agree the card says so and an administrator can use that time, after which Prism takes DigiKey's own count as the truth for the day. The card shows how
many calls the watchlist needs against the daily budget, and warns when reads will run later than they should.
Each connector has the time its day resets and a time zone (default 00:00 UTC); set them to the provider's. A day is 23 or 25 hours long where the clocks change, and pacing follows that.

**DigiKey change notices.** DigiKey gives change notices only to a signed-in person, not to the client id alone. On the
DigiKey connector card an administrator chooses **Sign in at DigiKey**, signs in there, and is sent back to the
Connectors tab. The DigiKey app must list the callback address the card shows (`PUBLIC_BASE_URL` followed by
`/api/supply/oauth/digikey/callback`, HTTPS only). The sign-in lasts about 90 days; the card says who signed in and until
when, and asks for a new sign-in when it runs out or DigiKey refuses it. Stock and prices do not depend on it.

## Track projects and parts

Prism follows a part at one of two tiers. **Tier 1** is read every day; **tier 2** every week or month. Everything else
(tier 3) is read only when someone asks. A part is in the highest tier any reason gives it, and the part sheet says why: a
tracked project, someone's choice, a watched component or its approved alternates, or a watch from before tiers (tier 2).

- **Track a project:** on the BOM (Visualizers) or in Project > Supply choose **Track this project**. One dialog asks everything:
  the designs (and **Also designs added later**), the distributors you buy from (an assembly-only one such as JLCPCB shows
  as "Built at ..." and is read only when ticked) and the **Packaging** you prefer: cut tape (the default), custom reel (Digi-Reel, MouseReel), full reel, tube or tray,
  or the smallest order. Where a distributor does not offer it, the nearest is followed. Each distributor's call budget shows as a bar:
  what is committed, what this adds, and how many parts would wait for room. If Prism has not read the project's BOM yet, the
  dialog reads it first. Lines whose part number several makers share are listed with the parts to choose from, one click each.
  **Track (N)** then starts the work and the dialog shows the first searches, a bar per distributor; closing it leaves them
  running. What does not fit waits for room and is read from spare budget; if nothing fits anywhere it is refused. A
  distributor added later is used for the project too, unless you unticked it.
- **New revisions:** a tracked project's BOM is read again every 15 minutes, nobody has to open it. When its newest
  revision has no index yet, Prism queues one (the normal index job). Parts a revision adds are tracked at tier 1 and
  searched first; parts it removes leave tracking unless something else keeps them. Recent changes on the Dashboard says
  what each revision added and removed. A line with a maker Prism does not know is tracked as written; the distributors'
  answers settle who makes it (see Makers).
- **Set a part's tier:** the **Tracking** control on the part sheet shows what a choice would cost, then applies it.
- **Call budget:** each connector's day is split into a committed share (what tracking may use, at most 90%) and a pool
  for people's reads, first searches and one-off checks. Connectors on the same credentials share one budget. The
  **Connectors** page shows today's spending by purpose, the last two weeks, what waits for room and what costs most.
- **Track from the catalog:** the catalog's **Track** button (all shown, or the rows you ctrl-clicked) asks for a tier and
  shows the same cost preview before it tracks.
- **Packaging:** a distributor lists one part as several listings (cut tape, reel, tray) and only one is followed. Each listing says
  which it is (cut tape, custom reel, reel with its size, tray, tube) from what the distributor states; a guess from the
  number or the order terms is shown in italics and never counts as certain. Prism picks the listing that matches the project's
  packaging, the nearest where there is none (it notes "Full reel, not offered here"). A part in several tracked projects
  follows the smaller packaging; a part in no project uses its own watch setting, else cut tape. Changing a project's packaging
  redoes the picks Prism made; a pick you make on the part sheet is never changed. If the picked listing stops being listed,
  the part is picked again. On the part sheet the listings are grouped by distributor: the followed one is marked, the others
  read "Not counted" with **Follow this instead**, and **One per distributor** shows what Prism would pick and the calls it
  saves before it does. DigiKey answers every packaging of a part in one call, so a pick there changes which stock and price
  count, not the calls. Review lists every part with several listings at a distributor, picked or not, to check and change.
- **First searches and the pool:** when parts are tracked, their first search at each distributor comes from the pool, but only
  half of it; the rest stays for Read now, Check notices and Fill from distributor. The remainder of a large batch waits for
  spare budget.
- **Check once:** on a BOM, **Check once (N)** reads the lines nobody reads, at every distributor, without tracking them. The
  calls come from the pool, and from spare budget when the pool is empty, so a large BOM can take an evening; the bar shows
  how many parts are read. The release check offers the same for the parts on a release BOM.
- **Room to track:** the Parts page (Tracked) says how many more parts fit, daily and weekly, and which distributor fills
  first; the Connectors page lists it per distributor. It is counted in parts like the ones already searched: how often each
  distributor carries them and how many listings they have there, so a distributor that carries few of your parts is not the
  limit for the rest. Once tracking has spent for a week, the estimate is corrected by what it really spent. A distributor with
  fewer than 10 parts searched shows no figure, and one with parts already waiting shows none left.
- **Parts list:** the scopes are Tracked and in projects, Tracked, Tier 1, Tier 2, Waiting for room, Pick a packaging, In use and All known. The default scope, Tracked and in projects, lists every part that is tracked or in a project; more load as you scroll. Projects has the same parts by project.
- **Settings:** Supply settings has the working week and which spare work is on (administrators). Each connector's Edit dialog
  has its daily budget, the share held for people and one-off checks, and the hour and time zone its day begins.
- **Track from the catalog:** the catalog's **Track** button (all shown, or the rows you ctrl-clicked) asks for a tier and
  shows the same cost preview before it tracks.
- **Packaging:** a distributor lists one part as several listings (cut tape, reel, tray) and only one is followed. Each listing says
  which it is (cut tape, custom reel, reel with its size, tray, tube) from what the distributor states; a guess from the
  number or the order terms is shown in italics and never counts as certain. Prism picks the listing that matches the project's
  packaging, the nearest where there is none (it notes "Full reel, not offered here"). A part in several tracked projects
  follows the smaller packaging; a part in no project uses its own watch setting, else cut tape. Changing a project's packaging
  redoes the picks Prism made; a pick you make on the part sheet is never changed. If the picked listing stops being listed,
  the part is picked again. On the part sheet the listings are grouped by distributor: the followed one is marked, the others
  read "Not counted" with **Follow this instead**, and **One per distributor** shows what Prism would pick and the calls it
  saves before it does. DigiKey answers every packaging of a part in one call, so a pick there changes which stock and price
  count, not the calls. Review lists every part with several listings at a distributor, picked or not, to check and change.
- **Check once:** on a BOM, **Check once (N)** reads the lines nobody reads, at every distributor, without tracking them. The
  calls come from the pool, and from spare budget when the pool is empty, so a large BOM can take an evening. The release
  check offers the same for the parts on a release BOM.
- **Parts list:** the scopes are Tracked and in projects, Tracked, Tier 1, Tier 2, Waiting for room, Pick a packaging, In use and All known. The default scope, Tracked and in projects, lists every part that is tracked or in a project; more load as you scroll. Projects has the same parts by project.
- **Settings:** Supply settings has the working week and which spare work is on (administrators). Each connector's Edit dialog
  has its daily budget, the share held for people and one-off checks, and the hour and time zone its day begins.
- **Spare budget** is what would go unused: outside working hours, on non-working days and in the last three hours of a
  provider's day. It reads parts waiting for room, then tier-2 parts early, then change notices of parts nobody tracks.
- **Politeness:** calls are spaced at random around half a provider's published rate, a rate limit slows the whole account
  for a day, and a web page or challenge where data was expected is treated as a block: the connector rests for 12 hours
  and the Connectors page shows why.

## Watch parts

In the Component Catalog a coloured dot beside a component's name shows where its manufacturer part stands (hover for stock and whether it is watched). A component Prism does not track has no dot. Designers and admins also get Watched and At risk filters and a Watch button there: it watches the components shown, or only the ones picked with ctrl-click (cmd-click on a Mac).

A part is a manufacturer and a part number. Watched parts are read regularly; unwatched ones only when someone asks.

- **Supply > Parts**: *Watched*, *In use* (parts on project BOMs) or *All known*. Open a part for its stock history,
  price, listings and watch settings.
- **Watch**: optionally set a stock threshold, or pin the part to the fastest reading.
- **Read now**: asks the distributors for fresh figures. Once every 15 minutes per person and part; it uses a small
  reserve of the daily budget, never the polling budget.
- **Read catalog vendors** (seeds listings from the catalog's vendor and vendor part number) and **Fill from distributor** (in a component's metadata) create listings and fill fields.
  Fill only fills the form; the save is the normal revision.
- Parts need a manufacturer part number. Components without one are not tracked.

Calls are saved where the distributors allow it. TME reads 50 parts, Mouser 10 and Farnell 10 per call (Farnell searches by part number still go one at a time). DigiKey has no batch, but
one answer holds every packaging of a part, so a part with three packagings costs one call, not three. Searching for
new parts also goes 50 (TME) or 10 (Mouser) at a time. A part a distributor carries is searched there again after a
month at tier 1 and three months at tier 2 (new packagings are rare); one it does not carry, after two weeks at tier 1 and a
month at tier 2, so a distributor that starts stocking it is noticed. A distributor added later searches every tracked part.

How often a part is read: hot every 1.5 hours (pinned, out of stock, at its threshold, or stock under 1.5 times what
is needed), warm every 6 hours, normal daily, cold weekly. When the budget is short, hot goes first and nothing waits
more than twice its interval. The data age is always shown.

A watch can count only one packaging (cut tape, custom reel, full reel, tray, tube or bulk). Stock, price and warnings for that part then follow it, and listings of unknown packaging are left out. It is set in the part sheet.

On the part sheet, a star on a distributor makes it the part's **preferred** one: it comes first and is marked in lists. It changes no figure; the stock total and the cheapest price stay across every distributor. With **Preferred distributors** switched on in Supply settings, the BOM is priced at the part's preferred distributor, then at the workspace's order, when one holds enough stock for the build, else at the cheapest (off by default). Stock and price are drawn as a line per distributor in its colour, stepping from reading to reading and dashed when a distributor has not been read for longer than the part's rate allows, with restocks and product change notices marked on the axis; a chart opens larger with 1 month, 3 months, 6 months, 1 year or all. A distributor's ECCN other than EAR99 shows as **Export controlled 3A991** beside the lifecycle (**ECCN disputed** when they differ); a person can set it by hand, which wins over the distributors.

A catalog component can be watched as a whole (Approved parts > Watch component): its part, and with "Include approved alternates" every alternate approved for it, now and later.

## What else Prism works out

- **Change events.** Each reading is compared with the one before. A lifecycle change, a distributor that stops stocking a part
  normally, a smallest order that doubles, and a listing that goes (with its packaging) appear under Recent changes on the Dashboard.
- **Free fields.** Factory stock, normally-stocking, non-cancellable, back orders, the manufacturer's lead weeks and the country of
  origin come with answers already read and are kept as facts on the part sheet.
- **Behaviour over the history.** The part sheet's trend lists days at zero and the wait before stock returned, how widely stock swings,
  how many distributors hold it and how concentrated it is, the gap between the day stock runs out and the lead time, the lead
  time's own move over 90 days, one-step collapses in stock, and the pattern by month once there is more than a year of history.
  The Market view adds signals for a manufacturer or category going out of stock or stretching its lead times.
- **Distributors compared.** Once there is history, the part sheet says how often each distributor reprices, who changes price first and
  whether the others follow, how much of a price in another currency is the exchange rate, who restocks first, and how often
  announced arrivals came within a week of their date. A figure is withheld until enough events back it. Dashboard changes also
  list a new sibling number turning up beside a part, and a distributor changing an attribute with no notice.
- **More checks.** Distributors that disagree on lifecycle are a warning. A distributor whose price is far from the median is a note.
  A part whose whole assessment gets worse raises an alert (accepting it makes the new state the baseline). Per part, **Alert rules**
  mute alerts, set the price rise that matters, and set a target price.
- **Suggestions for the BOM.** The project tab lists what Prism knows about a line that its symbol lacks: a manufacturer for a
  line with only a part number, the part an LCSC number is, a datasheet address, the library component to link. A list only;
  Prism changes nothing in the project, and a person applies it in KiCad. A symbol with only an LCSC number now shows as a
  line of its own ("not tracked") instead of being dropped.
- **Costing.** The line drawer shows the pieces bought beyond the need and the next price break. The project tab follows the cost of a
  board over time, shows the rounding waste, and downloads a costing CSV that names no distributor, SKU or link. Spares can be set
  **by package** (small passives get 2%, other parts none).
- **Alternatives.** On the part sheet, **Find alternatives** lists what distributors suggest first (LCSC's alternate parts and Mouser's
  suggested replacement come with the answers Prism already reads; **Ask DigiKey for substitutes** asks DigiKey, one call, once an hour
  per part, and Prism asks by itself once, from the committed budget, when a tracked part turns not recommended for new designs, last
  time buy or obsolete, or a distributor drops it, and again after 30 days). Prism has not compared those with the part, and says so; a
  suggested part can be tracked. Then it grades other parts in the same category as direct, same form-fit-function or functional,
  from the parameters distributors list. It does not compare footprint or
  pins. A candidate is proposed to the part's catalog component and QA approves it. A component's parts, with who gives how much
  stock, show in the Sourcing tab and on the part sheet.
- **Prices.** A part's price in lists is the cheapest listing that can be bought now, at the part's **price quantity**, in the base
  currency: other currencies are converted at the day's rates (a price whose currency has no rate is left out, and the row says so).
  When nothing is in stock it shows the cheapest price with a lead time quoted, in amber with that lead time; then the price when the part
  was last in stock, with its age; then the list price, said so. The part sheet adds the range over distributors and the median (never a
  mean), and a box to try any quantity without saving it. The price quantity is a Supply setting (100 by default, 1 to 1,000,000), and
  each part can have its own on the part sheet; the list, the price history, price alerts and the coverage figures follow it. Prism keeps
  each listing's price breaks when they change, so the history is worked out at the part's quantity; days before they were kept are drawn
  at 100 and the sheet says so. The BOM still prices at its build quantity.
- **Restock promises.** Prism keeps stock-outs and restocks as they happen, with the lead time a distributor quoted at the stock-out as a
  promise to be back by that day. The part sheet shows each distributor's open promise and its record on that part. Insights > Sourcing has a
  scorecard: stock-outs and days out, restocked first, promises kept, the wait said against the real one, and days in stock, judged only on
  parts two or more distributors list. A figure shows from five events; it needs months of readings to say much.
- **LCSC in your currency.** A LCSC connector set to a currency other than USD asks LCSC for it (a cookie, as its site does) and takes LCSC's own
  price in it, the one an order is charged; if LCSC answers in dollars anyway, the dollar price is converted. The market price index follows each
  part's own quantity once price breaks have been kept.
- **Mouser's suggestion.** Mouser names its suggested replacement by Mouser number; **Ask DigiKey for substitutes** also reads each such number
  at Mouser (one call each, from the interactive reserve) and shows the part number, which stays when Mouser is read again.
- **Trade classification.** The project tab lists the export control class (ECCN) and tariff codes distributors state for each part,
  flags disputes and gaps, and downloads them as CSV. It is what they say, not a classification.
- **RoHS exemptions.** A person names the exemptions a part relies on (such as 7(a)); they go into the draft declaration.
- **Parameters** now cover the common ones of voltage regulators, connectors and microcontrollers as well as passives.
- **MCP.** `POST /api/supply/mcp` is a read-only Model Context Protocol endpoint (parts at risk in a project, part status, best
  alternate). It answers as the caller's role.

Not built: JLCPCB and TME suggestions (JLCPCB's alternatives field was empty in every recorded answer and TME's answers carry no similar-parts
field, so there is no format to read), IPC-1752A import (needs a real supplier file to read), datasheet table extraction, a lifecycle survival model (needs more
observed transitions), TME and Farnell attributes (need a recorded answer), a footprint and pin check of alternatives.

## Forecasts

Prism says what it expects, as ranges and chances, and checks itself. A forecast is a range (10% to 90%, with a most likely value) or a
chance, always with the number beside the word: Almost certain (90% and up), Likely, Uncertain, Unlikely, Very unlikely. It never says
"will".

- **What is forecast.** When a part runs out (per distributor and everywhere), when a distributor that is out is back (from how long
  earlier stock-outs lasted, or from its quote times how its real waits compare), the chance the part can be bought at a quantity in each of
  the next twelve weeks, its price in 30 and 90 days, a board's cost in 90 days, the chance a project can be built in each of twelve weeks for
  a number of boards, lead times three months ahead by maker and category, early warnings that a family is going short, and the chance of an
  end-of-life change in 12 and 24 months. Demand is not forecast: a fall in stock is not consumption, and Prism plans no builds. A quantity or
  a board count is a question typed on the screen and saved nowhere.
- **How sure Prism is.** Every forecast is kept and compared with what happened once its day comes. A model is **Learning** until it has
  enough checks (60 for the chance of buying, 40 for runouts and prices, 30 for end of life), **Shown** while its 80% ranges hold the truth
  72% to 88% of the time (a chance: off by no more than 10 points), and **Paused** if its last 30 checks fall outside that. A learning
  forecast is greyed with a dashed "Learning" chip, a paused one says why. Insights > Forecasts has the track record of every model, with
  "said 70%, happened 68%" for the chances. `python -m app.services.supply.forecast_backtest --since YYYY-MM-DD` replays past days so a model
  has a record before it shows anything.
- **Where it shows.** Part sheet: a Forecast section (the chance it can be bought, a twelve-week strip, runout and return ranges, the price
  range, the end-of-life chance, a Why on each line) and a dashed band continuing the stock and price charts. Parts list: "out ~14 Dec" under
  the stock once the runout model is shown, and the filters Likely out within 4 or 8 weeks. Project tab: one **Boards** count for the forecast,
  the costing and the CSV; the chance the project is buildable week by week, what holds it back, and a cost range. Dashboard: a "Likely out in
  4 weeks" tile (greyed, with how far along the model is, while learning) and, once shown, a Coming up card. An alert "Likely out" replaces
  the straight-line running-out alert once the four-week model is shown (a tier 1 part, 70% or more on two runs in a row). The KiCad panel and
  the BOM line drawer carry one line each, from a shown model only.
- **Limits.** A part read weekly gives week-wide dates, so its ranges are at least a week wide. The currency's own movement is not in the price
  range. The stock-out model is Kaplan-Meier on the stock-outs seen, not a fitted curve. It needs months of readings to say much.

## Ending parts

Library Manager > Ending Parts (for roles that open Supply) lists the catalog components whose part is ending: not recommended for new
designs, last time buy, obsolete, dropped by every distributor, or an outlook under two years. Each row gives the reasons and where each
comes from, the last buy date, stock, the tracked projects that use the part and the component's approved alternates. Prism proposes;
QA and administrators decide. **Not for new designs** marks the component: it stays released and keeps resolving where it is placed, and
the catalog shows a tag. **Retire** archives it through the catalog's own workflow (which takes it out of the KiCad library) after
listing the projects that use it, and is allowed while projects still do. The decision is kept outside the component's revision, like
the approved parts. A marked component reads "Not for new designs" in the KiCad database's Status column (instead of its workflow stage)
and the KiCad panel warns on its detail screen; the Dashboard has an "Ending in library" tile with the number nobody has decided about.
Not built: making an approved alternate the primary from the dialog.

## Search

The command palette (Ctrl or Command K) finds a part once, whether it is a library component, a supply part or both: a row reads the
part number and maker with the component's stage and the stock, Enter opens the library component for people who use the library
manager and the supply sheet for the others, and Ctrl or Command Enter opens the other place. Two components with one number stay two
rows; an approved alternate is its own row named for what it stands in for. It also opens Parts on a group named in words (out of
stock, obsolete, runs out, one distributor, waiting for room) and the BOM file tool.

## Makers

A part has a manufacturer, but nobody has to confirm spellings first. Prism treats two spellings as one maker when they
are the same name apart from case, punctuation and a legal form ("Inc."), when one starts the other ("KOA", "KOA Speer"),
when one holds the other as whole words ("Maxim Integrated" in "Analog Devices Inc./Maxim Integrated"), when one is the
initials of the other ("TI", "ADI") or when they are a known spelling of a large maker. A listing of a part's number from
the same maker counts at once; another maker's listing of the number (a clone) is kept on the part sheet, marked with its
maker, and does not count. A QA or administrator can take it as the same part.

A part made from a line nobody has checked has a maker "as written" (or "Not known yet" when the line names none), shown
"not confirmed". The distributors' answers settle it: the written name confirmed by one that agrees; one maker answering; or
the maker most distributors list when several do. A spelling two parts of one maker carry becomes a spelling of that maker for
every part (Review > Matched by Prism, with Undo).

A part can also be sold under other numbers (`LM358D` as `LM358DR`). Packaging suffixes of the same maker are added by Prism;
a family number asks once which numbers it is sold as; the part sheet's Numbers row adds or removes one. BOM lines naming any
of them find the part.

Distributors list orderable numbers longer than the base number a catalog keeps, so a search keeps the part's own number
and up to ten longer forms of it (`74AHC1G09GV` and `74AHC1G09GV,125`). A longer number of the same maker whose ending is
a packaging ending (`R`, `TR`, `#PBF`, `/NOPB`, a comma and three digits) is added to the part by Prism. A grade ending
(`-Q100`, `-EP`) is another orderable part: it shows on the Numbers row as "Count it". Administrators edit the endings in
Supply settings. A number a person added is searched on its own. A second source that lists the same number under an
unrelated maker is shown on the part and asks nothing.

## Review

Supply > Review lists what needs a person, each section closed or open (long ones start closed; your choice is
remembered):

- **Needs a choice:** a part whose maker the answers do not settle (several makers, none leading), or whose known maker no
  distributor lists while some list the number under another ("same maker?"), or whose number no distributor lists while the
  same maker lists numbers that begin with it. One click each. Designers, QA and administrators answer.
- **Pinned under another number:** listings pinned as a part although numbered otherwise (their stock counts as the part's).
  Tick the ones to take off; QA and administrators decide.
- **To approve:** waivers and alternates people proposed, each with Approve and Reject and a link to where it lives. QA and
  administrators decide.
- **Matched by Prism:** spellings Prism learned (Undo) and parts whose maker the distributors settled (Undo asks about the
  part again). Administrators can read and edit the built-in spellings of large makers in Supply settings.

A project with open questions shows a **N to settle** badge on Project > Supply and on the BOM bar; it opens the same
answers for that project. Pinning a listing that is numbered otherwise than the part asks whether to add the number to the
part or only pin the listing.

## Approved parts (alternates)

A component's Sourcing tab lists its approved parts. The component's own part is the primary; others are alternates
that someone proposes and QA approves and ranks. The list is not part of a component revision. If the part and every
approved alternate are out of stock, the component says so.

## Datasheets

A distributor's answer can carry the manufacturer's datasheet address (Mouser, DigiKey, Farnell and LCSC do). The part
sheet links to it and it opens in the browser. Designers and administrators can set the address by hand. Prism downloads
and keeps no files: no datasheets, no versions, no copies of notices.

## Compliance

A part sheet's Compliance section shows RoHS and REACH with where each answer comes from. RoHS follows what distributors
say. For REACH, a distributor may flag a part as affected (DigiKey does). A designer can also enter the substances a
supplier declared, as CAS numbers; an administrator loads the ECHA Candidate List (a CSV or Excel export with a substance name
and a CAS column) in Supply settings, and a declared substance on the list makes the part *affected by REACH*. A part
nobody says anything about is *unknown*, never clear.

Below that, the section lists what each distributor states, in its own words and with its name: RoHS (for example
"ROHS3 Compliant" or "Compliant by exemption") and REACH wording, moisture sensitivity level, export control class
(ECCN), tariff codes (United States HTS, EU TARIC, China and others), DigiKey's last date to buy, and Mouser's suggested
replacement. These come with every stock and price read, at no extra cost. When two distributors disagree, both are
shown and marked. Once a week Mouser is also asked which substances of very high concern a part contains; substances it
names that are on the Candidate List count like a declaration, marked *listed by Mouser*, and go away when Mouser stops
listing them. People's own declarations are never changed.

## Parameters

A part sheet's Parameters section lists the attributes distributors give for the part (Mouser, DigiKey and LCSC give them
when the part is found). For resistors, capacitors and inductors the common ones (resistance, capacitance, inductance,
tolerance, voltage and power rating, package, dielectric) are put in one vocabulary first, with the value in SI units next
to the distributor's own text; everything else is shown as written, with who gave it. A text Prism cannot read is shown
raw and never guessed.

## Product change notices

A manufacturer's notice (end of life, last time buy, not recommended for new designs, or another change) is entered by
a designer or administrator on a part sheet: a title, what it announces, its dates, an address, and the parts it covers.
With a DigiKey sign-in, Prism also reads DigiKey's notices for each DigiKey listing of watched parts and parts on project
BOMs once a week: its type, description, release date and a link to the notice. The same notice is listed once however many
parts it covers, and one that is closed stays closed. Prism links a notice's PDF but does not download it, so a last time buy date is one a person
typed (DigiKey's last date to buy shows under Compliance and in the Outlook). Any other notice on a watched part (a change of packaging, assembly site or design) goes to the Inbox for two weeks after Prism first sees it, if it was released in the last year; older ones stay on the part sheet only. An open notice that announces an ending feeds the
outlook and raises an alert on watched parts, an error when the last time buy is within 90 days. "Check notices" in that section reads one part's notices now, one DigiKey call per listing from the allowance kept for lookups, once an hour per person and part. The part sheet lists notices in a section that folds away (open when one announces an ending). Notices are a record and cannot be dismissed there.


## Market

Supply > Insights > Market (a section of the page) shows how the parts you follow do as a group, by manufacturer and by category (the one DigiKey or Mouser files the part under) and, once two days are stored, a chart of any figure over time: the share out of stock, the share with a
lifecycle risk, the share every distributor dropped, the median lead time and a price index (100 at the first snapshot, then the median price change of the listings), each with its change since a month ago once
a month of snapshots exists. It covers watched parts and parts on project BOMs only, a manufacturer needs at least three
of them, and the number of parts is always shown. It is not the market as a whole.

## Outlook

A part sheet's Outlook says whether the part looks headed for its end: *ended*, *under 2 years*, *2 to 5 years*, *no signs
of an end of life*, or *not enough to say*. It is rule-based and lists every signal with its source: the lifecycle
distributors report, distributors that stopped selling it, lifecycle phrases in the datasheet, a month or more with no
stock anywhere, a price rise of 20% or more, open notices, and a distributor's last date to buy. One soft signal is a note; two together, or any watch signal such as
*not recommended for new designs*, move the band. Nothing found is not a promise of a long life, and the KiCad panel
shows the same phrase.

## Project BOMs

The Visualizer's BOM tab gets Supply, Stock, Unit price, Extended and Lead time columns. Set the build size and the
spares percentage. Lines resolve by the `Prism ID` field on a placed symbol first, then by manufacturer and part
number. The header shows the cost of the build, parts at risk and short, and how many boards the stock allows.
Prices are list prices, without VAT or shipping. Offers in different currencies are converted to the base currency (a Supply setting, EUR by default) with the European Central Bank's daily rates, and the total says which day's rates it used. Without a route to the ECB, an administrator can enter rates (`POST /api/supply/fx/rates`); without rates there is no total across currencies. Lines without a part number are
counted as *not tracked*. "Read project BOMs" queues the BOM reading of projects nobody has opened yet, so Where Used and Parts in use are complete.

A symbol can carry its LCSC number in a field named `LCSC`, `LCSC Part #`, `LCSC Part Number` or similar, or in
`Supplier Part` when `Supplier` is `LCSC` (as EasyEDA exports it). Watching the BOM's parts links that number to the
part at the LCSC connector, so LCSC is read without a search. After that, a line whose part number Prism does not know
is still found by its LCSC number. The project's Supply tab has a design variant picker, and the draft declaration download follows it. A part that only a design variant fits counts as in use, the part sheet says which variants, and the release check assesses each named variant beside the base design.

## Assessment

Each part gets findings, five risk scores (lifecycle, sourcing, inventory, market, compliance), a health figure from
0 to 10, and a status: OK, warning, error, fatal or unknown.

| Finding | When |
| --- | --- |
| Part not found | No distributor carries the number |
| Obsolete, last time buy, not recommended for new designs | The manufacturer says so |
| Dropped by every distributor | Each distributor that lists it stopped selling it |
| No stock, stock does not cover the need | Counted stock of non-marketplace offers |
| Single source | Only one distributor has stock, while two or more are connected |
| Lead time over the limit | Over the limit in Supply settings |
| Not RoHS compliant | Distributors list it so |
| Affected by REACH | A distributor flags it, or a declared substance is on the Candidate List |
| Data out of date | Older than the limit in Supply settings |
| No approved source | The part and all approved alternates are out of stock |
| Manufacturer missing | The BOM line has a part number but no manufacturer |
| Not in library | No catalog component has this manufacturer and part number |

A finding can be waived with a reason; QA approves. A waiver holds only while the condition it was raised for does.
Administrators set the limits, the severity of each check and the weight of each risk area in the gear on the Supply
section.

## BOM file

Supply > Parts > Check a BOM file checks a BOM that is not a project. Choose a CSV (comma, semicolon or tab separated; up to 2 MB and 5,000
rows), confirm which column is the part number, manufacturer, LCSC number, quantity and references (they are guessed from
the header), set the number of boards, and Prism shows what the parts would cost and whether they can be built, with the
same rollup as a project BOM. A row needs a part number or an LCSC number. Rows of the same part are added together.
Nothing is saved, and parts Prism does not watch show as unknown.

## Compliance draft

The project's Supply tab links a draft RoHS and REACH declaration (CSV): every distinct part on the BOM with its
RoHS and REACH standing, what each distributor states about RoHS, REACH and substances (with its name), and a list of gaps
(no statement, not tracked, affected, compliant only by exemption, Candidate List not loaded). It is a working
document for a person to complete; Prism cannot know what a manufacturer has not said, and unknown is never shown as compliant.

## BOM line comments

Each part in the BOM row drawer has a comments list: notes shared by everyone who can open the project, kept by the line's key so they follow the part. An author, or an administrator, can remove a comment.

## Alerts

Supply > Dashboard. A watched part raises an alert when it runs out, falls to its threshold, may run out within eight
weeks at the recent rate, rises 20% or more in price over 30 days, changes lifecycle, gets a new datasheet, has a product change notice that announces an ending, is dropped by every distributor,
or is lost. A condition must hold on two looks at least 30 minutes apart. Acknowledge or snooze an alert; it clears by
itself. Nothing is sent by email or chat.

## Releases

The supply check reads the BOM the release build exported, so it is exactly what ships. It shows from the Outputs stage on
(a dot on the stage rail, a summary above the outputs) and again as a one-line summary on Publish. It informs the release
and never blocks it. At publish you can attach the compliance draft to the forge release (a working document, off by
default). The snapshot of what supply said then is taken by a worker job, retried, and shown on the published run; if it
could not be taken, the run says why. The BOM assessment, the approved parts and the compliance draft are recorded once
and cannot be changed. The kept draft is at `/api/supply/projects/<project>/releases/<build>/compliance` (add `?format=csv`
for the file); releases published before this have none. For a project Prism has never read, the published run offers to
keep the release's BOM; that asks no distributor and tracks nothing.

## KiCad panel

The panel shows a one-line standing in search and, in detail, offers, alternates and risks. Its refresh button reads
the part now (same 15 minute wait). Links open the part in Prism for roles that can see it.

## Looking after it

- Administrators: `GET /api/supply/health` lists calls against budget, errors, late reads and the oldest read per
  connector.
- Old readings are rolled into one row per listing per day after 60 days. An administrator can set a shorter or longer time on a connector (1 to 365 days). Daily rows stay for good unless the connector says "Delete all history after" some days (1 to 3650), for a provider whose terms limit how long its data may be stored; then raw and daily history past that is deleted.
- Providers that Prism does not know yet can be added as plugins (`prism.supply_providers` entry point). Run
  `backend/tests/test_supply_provider_contract.py` with the plugin installed.
- Real answers for tests: `backend/scripts/record_supply_answer.py`, run where the connector's credentials can be
  unsealed.
