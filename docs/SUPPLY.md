# Supply chain data

Prism reads stock, prices and lifecycle of manufacturer parts from distributors, keeps the history, and uses it to
warn before a part runs out and to judge a project's BOM. It never buys anything: there are no carts, no order lists
and no purchase support.

Who sees what: administrators, designers and QA read supply data. Administrators and designers watch parts, add
demand and read a part now. QA and administrators approve alternates, aliases and waivers. Only administrators
manage connectors and settings. Viewers see none of it.

## Set up a distributor

Library Manager > Connectors. One connector per provider and storefront.

| Provider | Needs | Notes |
| --- | --- | --- |
| TME | API token and secret | Prices follow the account's country. |
| Mouser | API key | Answers in the account's language. About 1,000 calls a day. |
| DigiKey | Client id and secret | One part per call, so it is slow for large watchlists. |
| Farnell, Newark, element14 | API key, store, currency | Choose the store and the currency yourself. Not yet checked against the live service. |
| LCSC | Nothing | Looks up an LCSC number only (`C2040`). Prices are in US dollars. Not a published API; it can change. |
| CSV | A file you upload | For air-gapped installs. The file replaces the previous one. |

Credentials are encrypted and never shown again. `TRACKER_CREDENTIAL_ROOT_KEY` must be set (see
[Configuration](CONFIGURATION.md)). Use **Test connection** after saving: it makes one real call. The card shows how
many calls the watchlist needs against the daily budget, and warns when reads will run later than they should.
Record that you reviewed the provider's terms; some limit how long their data may be kept.

## Watch parts

In the Component Catalog a coloured dot beside a component's name shows where its manufacturer part stands (hover for stock and whether it is watched). A component Prism does not track has no dot.

A part is a manufacturer and a part number. Watched parts are read regularly; unwatched ones only when someone asks.

- **Supply > Parts**: *Watched*, *In use* (parts on project BOMs) or *All known*. Open a part for its stock history,
  price, listings, demand and watch settings.
- **Watch**: optionally set a stock threshold, or pin the part to the fastest reading.
- **Read now**: asks the distributors for fresh figures. Once every 15 minutes per person and part; it uses a small
  reserve of the daily budget, never the polling budget.
- **Read catalog vendors** (seeds listings from the catalog's vendor and vendor part number) and **Fill from distributor** (in a component's metadata) create listings and fill fields.
  Fill only fills the form; the save is the normal revision.
- Parts need a manufacturer part number. Components without one are not tracked.

How often a part is read: hot every 1.5 hours (pinned, out of stock, at its threshold, or stock under 1.5 times what
is needed), warm every 6 hours, normal daily, cold weekly. When the budget is short, hot goes first and nothing waits
more than twice its interval. The data age is always shown.

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
"discontinued", "preliminary"). A new version of a watched part raises a *datasheet changed* alert for two weeks.
Designers and administrators can set the address by hand. Files come from the public internet and are never opened by
Prism itself: text is read in a separate process with a time limit, and downloads are served as sandboxed attachments.

## Compliance

A part sheet's Compliance section shows RoHS and REACH with where each answer comes from. RoHS follows what distributors
say. For REACH, a distributor may flag a part as affected (DigiKey does). A designer can also enter the substances a
supplier declared, as CAS numbers; an administrator loads the ECHA Candidate List (a CSV export with a substance name
and a CAS column) in Supply settings, and a declared substance on the list makes the part *affected by REACH*. A part
nobody says anything about is *unknown*, never clear.

## Parameters

A part sheet's Parameters section lists the attributes distributors give for the part (Mouser, DigiKey and LCSC give them
when the part is found). For resistors, capacitors and inductors the common ones (resistance, capacitance, inductance,
tolerance, voltage and power rating, package, dielectric) are put in one vocabulary first, with the value in SI units next
to the distributor's own text; everything else is shown as written, with who gave it. A text Prism cannot read is shown
raw and never guessed.

## Product change notices

A manufacturer's notice (end of life, last time buy, not recommended for new designs, or another change) is entered by
a designer or administrator on a part sheet: a title, what it announces, its dates, an address, and the parts it covers.
Prism does not read the PDF, so every date shown is one a person typed. An open notice that announces an ending feeds the
outlook and raises an alert on watched parts, an error when the last time buy is within 90 days. Closing a notice keeps
it.

## Market

Supply > Market shows how the parts you follow do as a group, by manufacturer: the share out of stock, the share with a
lifecycle risk, the share every distributor dropped, and the median lead time, each with its change since a month ago once
a month of snapshots exists. It covers watched parts and parts on project BOMs only, a manufacturer needs at least three
of them, and the number of parts is always shown. It is not the market as a whole.

## Outlook

A part sheet's Outlook says whether the part looks headed for its end: *ended*, *under 2 years*, *2 to 5 years*, *no signs
of an end of life*, or *not enough to say*. It is rule-based and lists every signal with its source: the lifecycle
distributors report, distributors that stopped selling it, lifecycle phrases in the datasheet, a month or more with no
stock anywhere, and a price rise of 20% or more. One soft signal is a note; two together, or any watch signal such as
*not recommended for new designs*, move the band. Nothing found is not a promise of a long life, and the KiCad panel
shows the same phrase.

## Demand

A part sheet's Demand section holds what is needed and by when. A negative quantity is stock already on its way in.
Our own stock (from the catalog inventory) is subtracted; the part is judged against what is left.

## Project BOMs

The Visualizer's BOM tab gets Supply, Stock, Unit price, Extended and Lead time columns. Set the build size and the
spares percentage. Lines resolve by the `Prism ID` field on a placed symbol first, then by manufacturer and part
number. The header shows the cost of the build, parts at risk and short, and how many boards the stock allows.
Prices are list prices, without VAT or shipping. Offers in different currencies are converted to the base currency (a Supply setting, EUR by default) with the European Central Bank's daily rates, and the total says which day's rates it used. Without a route to the ECB, an administrator can enter rates (`POST /api/supply/fx/rates`); without rates there is no total across currencies. Lines without a part number are
counted as *not tracked*. "Read project BOMs" queues the BOM reading of projects nobody has opened yet, so Where Used and Parts in use are complete.

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

## Alerts

Supply > Inbox. A watched part raises an alert when it runs out, falls to its threshold, may run out within eight
weeks at the recent rate, rises 20% or more in price over 30 days, changes lifecycle, gets a new datasheet, has a product change notice that announces an ending, is dropped by every distributor,
or is lost. A condition must hold on two looks at least 30 minutes apart. Acknowledge or snooze an alert; it clears by
itself. Nothing is sent by email or chat.

## Releases

The publish step in Release Studio shows a supply note for the BOM. It informs and never blocks a release. At
publish, the BOM assessment and approved parts are recorded once and cannot be changed.

## KiCad panel

The panel shows a one-line standing in search and, in detail, offers, alternates and risks. Its refresh button reads
the part now (same 15 minute wait). Links open the part in Prism for roles that can see it.

## Looking after it

- Administrators: `GET /api/supply/health` lists calls against budget, errors, late reads and the oldest read per
  connector.
- Old readings are rolled into one row per listing per day after 60 days.
- Providers that Prism does not know yet can be added as plugins (`prism.supply_providers` entry point). Run
  `backend/tests/test_supply_provider_contract.py` with the plugin installed.
- Real answers for tests: `backend/scripts/record_supply_answer.py`, run where the connector's credentials can be
  unsealed.
