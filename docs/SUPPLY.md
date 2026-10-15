# Supply chain data

Prism reads stock, prices and lifecycle of manufacturer parts from distributors, keeps the history, and uses it to
warn before a part runs out and to judge a project's BOM. It never buys anything: there are no carts, no order lists
and no purchase support.

Who sees what: administrators, designers and QA read supply data. Administrators and designers watch parts, add
demand and read a part now. QA and administrators approve alternates, aliases and waivers. Only administrators
manage connectors and settings. Viewers see none of it.

## Set up a distributor

Supply > Connectors. One connector per provider and storefront.

| Provider | Needs | Notes |
| --- | --- | --- |
| TME | API token and secret | Prices follow the account's country. |
| Mouser | API key | Answers in the account's language. About 1,000 calls a day. |
| DigiKey | Client id and secret | One part per call, so it is slow for large watchlists. Change notices also need an administrator's sign-in at DigiKey (below). |
| Farnell, Newark, element14 | API key, store, currency | Choose the store carefully: `il.farnell.com` is Israel, `it.farnell.com` is Italy. Farnell's answer does not name its currency, so Prism uses the store's own for UK (GBP), the euro-zone stores (EUR) and Newark US and Canada. For any other store, set the currency on the connector or offers show no price. Product links are the store's search for the SKU. Checked against the live service on 2026-10-13. |
| Avnet | Client ID, client secret, scope, subscription key | From the Avnet API portal after Avnet approves a subscription to the price and quantity API: the subscription key and a client secret are on the portal's Profile page, with the client ID and scope. Avnet answers by manufacturer part number only (at least 4 characters), with one price at the quantity it offers, customer specific. Not yet run against the live service. |
| LCSC | Nothing | Searches by manufacturer part number through EasyEDA's part search, or reads an LCSC number (`C2040`) directly. Prices are in US dollars. Not a published API; it can change. |
| CSV | A file you upload | For air-gapped installs. The file replaces the previous one. |

Credentials are encrypted and never shown again. `TRACKER_CREDENTIAL_ROOT_KEY` must be set (see
[Configuration](CONFIGURATION.md)). Use **Test connection** after saving: it makes one real call. The card shows how
many calls the watchlist needs against the daily budget, and warns when reads will run later than they should.
Record that you reviewed the provider's terms; some limit how long their data may be kept.

**DigiKey change notices.** DigiKey gives change notices only to a signed-in person, not to the client id alone. On the
DigiKey connector card an administrator chooses **Sign in at DigiKey**, signs in there, and is sent back to the
Connectors tab. The DigiKey app must list the callback address the card shows (`PUBLIC_BASE_URL` followed by
`/api/supply/oauth/digikey/callback`, HTTPS only). The sign-in lasts about 90 days; the card says who signed in and until
when, and asks for a new sign-in when it runs out or DigiKey refuses it. Stock and prices do not depend on it.

## Track projects and parts

Prism follows a part at one of two tiers. **Tier 1** is read every day; **tier 2** every week or month. Everything else
(tier 3) is read only when someone asks. A part is in the highest tier any reason gives it, and the part sheet says why: a
tracked project, someone's choice, a watched component or its approved alternates, or a watch from before tiers (tier 2).

- **Track a project:** on the BOM (Visualizers) choose **Track this project**. Pick the designs to follow and the
  distributors you buy from. A distributor that only assembles (JLCPCB) appears as "Built at ..." and is read only when
  you tick it. Before anything is applied you see, per distributor, the calls a day it adds, how many parts will be read
  and how many will wait. **Track where there is room** reads what fits; the rest waits for room and is read from spare
  budget. If nothing fits anywhere it is refused.
- **Set a part's tier:** the **Tracking** control on the part sheet shows what a choice would cost, then applies it.
- **Call budget:** each connector's day is split into a committed share (what tracking may use, at most 90%) and a pool
  for people's reads, first searches and one-off checks. Connectors on the same credentials share one budget. The
  **Connectors** page shows today's spending by purpose, the last two weeks, what waits for room and what costs most.
- **Track from the catalog:** the catalog's **Track** button (all shown, or the rows you ctrl-clicked) asks for a tier and
  shows the same cost preview before it tracks.
- **Packaging picks:** a distributor lists one part as several listings (cut tape, reel, tray). Until you pick one, all are
  read and their stock adds up. **Review > Packaging** lists the tracked parts that need a pick, with the calls a day each
  would save; the part sheet offers the same. The pick pop-up sets the listings side by side and marks what differs. After a
  pick it offers the same packaging for the other waiting parts at that distributor with the same choice, listed so you can
  untick any. Only the picked listing is read and counted. If it stops being listed, the part is read at all its listings
  again.
- **Check once:** on a BOM, **Check once (N)** reads the lines nobody reads, at every distributor, without tracking them. The
  calls come from the pool, and from spare budget when the pool is empty, so a large BOM can take an evening; the bar shows
  how many parts are read. The release check offers the same for the parts on a release BOM.
- **Parts list:** the scopes are Tracked, Tier 1, Tier 2, Waiting for room, Pick a packaging, In use and All known.
- **Settings:** Supply settings has the working week and which spare work is on (administrators). Each connector's Edit dialog
  has its daily budget, the share held for people and one-off checks, and the hour and time zone its day begins.
- **Track from the catalog:** the catalog's **Track** button (all shown, or the rows you ctrl-clicked) asks for a tier and
  shows the same cost preview before it tracks.
- **Packaging picks:** a distributor lists one part as several listings (cut tape, reel, tray). Until you pick one, all are
  read and their stock adds up. **Review > Packaging** lists the tracked parts that need a pick, with the calls a day each
  would save; the part sheet offers the same. The pick pop-up sets the listings side by side and marks what differs. After a
  pick it offers the same packaging for the other waiting parts at that distributor, listed so you can untick any. Only the
  picked listing is read and counted. If it stops being listed, the part is read at all its listings again.
- **Check once:** on a BOM, **Check once (N)** reads the lines nobody reads, at every distributor, without tracking them. The
  calls come from the pool, and from spare budget when the pool is empty, so a large BOM can take an evening. The release
  check offers the same for the parts on a release BOM.
- **Parts list:** the scopes are Tracked, Tier 1, Tier 2, Waiting for room, Pick a packaging, In use and All known.
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
  price, listings, demand and watch settings.
- **Watch**: optionally set a stock threshold, or pin the part to the fastest reading.
- **Read now**: asks the distributors for fresh figures. Once every 15 minutes per person and part; it uses a small
  reserve of the daily budget, never the polling budget.
- **Read catalog vendors** (seeds listings from the catalog's vendor and vendor part number) and **Fill from distributor** (in a component's metadata) create listings and fill fields.
  Fill only fills the form; the save is the normal revision.
- Parts need a manufacturer part number. Components without one are not tracked.

Calls are saved where the distributors allow it. TME reads 50 parts, Mouser 10 and Farnell 10 per call (Farnell searches by part number still go one at a time). DigiKey has no batch, but
one answer holds every packaging of a part, so a part with three packagings costs one call, not three. Searching for
new parts also goes 50 (TME) or 10 (Mouser) at a time. A part a distributor carries is searched there again only
after a month (new packagings are rare); one it does not carry, after a week.

How often a part is read: hot every 1.5 hours (pinned, out of stock, at its threshold, or stock under 1.5 times what
is needed), warm every 6 hours, normal daily, cold weekly. When the budget is short, hot goes first and nothing waits
more than twice its interval. The data age is always shown.

A watch can count only one packaging (cut tape for prototypes, tape and reel for production). Stock, price and warnings for that part then follow it, and listings of unknown packaging are left out. It is set in the part sheet.

A catalog component can be watched as a whole (Approved parts > Watch component): its part, and with "Include approved alternates" every alternate approved for it, now and later.

## Review

Supply > Review. Distributors spell manufacturers their own way; Prism never merges them by guess. A person maps a
spelling to a manufacturer, confirms a listing that is probably the part, or rejects it. QA and administrators decide.

## Approved parts (alternates)

A component's Sourcing tab lists its approved parts. The component's own part is the primary; others are alternates
that someone proposes and QA approves and ranks. The list is not part of a component revision. If the part and every
approved alternate are out of stock, the component says so.

## Datasheets

A distributor's answer can carry the manufacturer's datasheet address (Mouser, DigiKey, Farnell and LCSC do). Prism
keeps the first one it sees, fetches the PDF weekly for watched parts and parts on project BOMs, and keeps up to five
versions. A part sheet's Datasheets section shows each version, how much of the first pages' text changed, and
lifecycle phrases the text mentions ("not recommended for new designs", "last time buy", "obsolete", "end of life",
"discontinued", "preliminary"). A new version of a watched part raises a *datasheet changed* alert for two weeks. An administrator can list hosts to avoid in Supply settings; nothing is fetched from them or their subdomains.
Designers and administrators can set the address by hand. Files come from the public internet and are never opened by
Prism itself: text is read in a separate process with a time limit, and downloads are served as sandboxed attachments.

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
BOMs once a week: its type, description, release date and a link to the notice. The same notice is kept once however many
parts it covers, and one that is closed stays closed. Prism keeps a copy of a notice's PDF (a "Kept copy" link) but does not read it, so a last time buy date is one a person
typed (DigiKey's last date to buy shows under Compliance and in the Outlook). Any other notice on a watched part (a change of packaging, assembly site or design) goes to the Inbox for two weeks after Prism first sees it, if it was released in the last year; older ones stay on the part sheet only. An open notice that announces an ending feeds the
outlook and raises an alert on watched parts, an error when the last time buy is within 90 days. "Check notices" in that section reads one part's notices now, one DigiKey call per listing from the allowance kept for lookups, once an hour per person and part. The part sheet lists notices in a section that folds away (open when one announces an ending). Notices are a record and cannot be dismissed there.


## Market

Supply > Market shows how the parts you follow do as a group, by manufacturer and by category (the one DigiKey or Mouser files the part under) and, once two days are stored, a chart of any figure over time: the share out of stock, the share with a
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

## Planning

Supply > Planning lists every part with open demand against our own stock and what the distributors hold now, shortages
first. A part is short on the first date the demand so far is more than the supply so far; stock already on its way in
counts from its own date, and demand with no date is counted last. Demand comes from a part sheet's Demand section or from
the BOM: **Add to plan** on a project BOM asks for the build's parts (spares included) under a name and a needed-by date,
and adding the same name again replaces what it asked for before. It plans; it never buys.

## Demand

A part sheet's Demand section holds what is needed and by when. A negative quantity is stock already on its way in.
Our own stock (from the catalog inventory) is subtracted; the part is judged against what is left.

## Project BOMs

The Visualizer's BOM tab gets Supply, Stock, Unit price, Extended and Lead time columns. Set the build size and the
spares percentage. Lines resolve by the `Prism ID` field on a placed symbol first, then by manufacturer and part
number. The header shows the cost of the build, parts at risk and short, and how many boards the stock allows.
Prices are list prices, without VAT or shipping. Offers in different currencies are converted to the base currency (a Supply setting, EUR by default) with the European Central Bank's daily rates, and the total says which day's rates it used. Without a route to the ECB, an administrator can enter rates (`POST /api/supply/fx/rates`); without rates there is no total across currencies. Lines without a part number are
counted as *not tracked*. "Read project BOMs" queues the BOM reading of projects nobody has opened yet, so Where Used and Parts in use are complete.

A symbol can carry its LCSC number in a field named `LCSC`, `LCSC Part #`, `LCSC Part Number` or similar, or in
`Supplier Part` when `Supplier` is `LCSC` (as EasyEDA exports it). Watching the BOM's parts links that number to the
part at the LCSC connector, so LCSC is read without a search. After that, a line whose part number Prism does not know
is still found by its LCSC number. The project overview's Supply card has a design variant picker, and the draft declaration download follows it. A part that only a design variant fits counts as in use, the part sheet says which variants, and the release check assesses each named variant beside the base design.

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

Supply > BOM file checks a BOM that is not a project. Choose a CSV (comma, semicolon or tab separated; up to 2 MB and 5,000
rows), confirm which column is the part number, manufacturer, LCSC number, quantity and references (they are guessed from
the header), set the number of boards, and Prism shows what the parts would cost and whether they can be built, with the
same rollup as a project BOM. A row needs a part number or an LCSC number. Rows of the same part are added together.
Nothing is saved, and parts Prism does not watch show as unknown.

## Compliance draft

The project overview's Supply card links a draft RoHS and REACH declaration (CSV): every distinct part on the BOM with its
RoHS and REACH standing, what each distributor states about RoHS, REACH and substances (with its name), and a list of gaps
(no statement, not tracked, affected, compliant only by exemption, Candidate List not loaded). It is a working
document for a person to complete; Prism cannot know what a manufacturer has not said, and unknown is never shown as compliant.

## BOM line comments

Each part in the BOM row drawer has a comments list: notes shared by everyone who can open the project, kept by the line's key so they follow the part. An author, or an administrator, can remove a comment.

## Alerts

Supply > Inbox. A watched part raises an alert when it runs out, falls to its threshold, may run out within eight
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
