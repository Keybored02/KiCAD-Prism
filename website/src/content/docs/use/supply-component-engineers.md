---
title: Supply for component engineers
description: Bring a board's parts into the Component Database, track the projects that use them, and keep the library clear of parts that are ending or hard to buy.
sidebar:
  order: 9.1
---

This guide is for the person who owns the parts: who decides what goes into the
Component Database, which alternates are allowed, and what happens when a part
starts to disappear. It walks through the work in the order you meet it.
[Track supply](/KiCAD-Prism/use/supply/) is the reference for each screen, and
[How supply figures are worked out](/KiCAD-Prism/use/supply-figures/) explains
the numbers.

You need the **Designer** or **QA** role. Designers track parts and propose
alternates; QA approves alternates and decides what happens to ending parts.
An administrator must first connect at least one distributor (see
[Connect distributors and inventory](/KiCAD-Prism/admin/supply/)).

## 1. Get the parts into the Component Database

Supply follows only parts that a library component names. A BOM line whose part
is not in the Component Database shows **Not in library** and is never read
on a schedule. So the first job on a new board is importing its components.

1. Open **Library Manager → Import Center**.
2. Choose the board in **Project** and choose **Scan**. **All projects** scans
   every project at once.
3. When the scan finishes, open the session. Each row is one part, however
   many times the board places it. Rows that can be imported as they are carry
   a check mark; the others list what is missing.

A project import keeps the fields that describe the part and leaves out those
that describe one placement on the board (reference, sheet, DNP and BOM
flags). A part number kept as **MPN** or **Part Number** on the symbol is moved
into **Manufacturer Part Number**.

### Fill what is missing, in bulk

A component needs a value, manufacturer, manufacturer part number, description
and a datasheet link starting with `http://` or `https://`. Boards drawn without
that discipline miss some of it on many rows. Fix them together:

1. Turn on **Only rows that need attention**.
2. Either edit in the grid (select rows, type a value and use **Fill this value
   down into selected rows**), or choose **Export CSV**, fill the columns in a
   spreadsheet and bring the file back with **Import CSV**.
3. Choose **Save edits** (`⌘S`). The fixes are kept with the session, so a long
   import survives a reload.
4. Accept with **Selected** (the rows you picked) or **All ready**. Each
   accepted row becomes a draft component.

An assistant connected over [MCP](/KiCAD-Prism/automate/mcp/) can do step 2 for
you: it reads the session and saves its fixes as drafts. Accepting stays with a
person, so you review what it filled before anything enters the library.

## 2. Track the projects that matter

Tracking a project reads every part of its BOM every day and keeps the history.

1. Open the project and choose **Supply**.
2. Choose **Track this project**.
3. Choose the designs to follow, the distributors you buy from (**Bought
   from**), the **Packaging** you prefer, the **Usual build, in boards** and the
   **Spares**.
4. Check **Daily call limit**. Each distributor's bar shows what tracking adds
   to its day. Parts that don't fit are **Queued for calls**: they are read with
   calls nothing else needs and join the schedule when room frees up.
5. Choose **Track (N)**. If some lines name a part number that several makers
   use, **Next** first asks you to pick the maker for each.

Prism then searches each distributor for the parts. A new BOM revision is
picked up within 15 minutes; parts it adds are tracked, and parts it removes
stop being tracked unless something else keeps them.

A project whose BOM Prism has not read shows **Not read**. Choose **Read now**;
the first read of a large board can take a few minutes while its design index
is built.

## 3. Watch parts that aren't on a tracked project

Some parts matter before any board uses them: a new standard part, a single
source you're worried about.

- On a library component's **Supply** tab, choose **Watch component**. Choose
  whether to count every packaging or only one in **Count stock of**.
- In **Supply → Tracking**, choose **Track a part**, enter the part number
  (and the maker if you know it), and optionally **Warn when stock is at or
  below** a threshold.
- In **Library Manager → Catalog**, filter the **Supply** column and choose
  **Track these** (or ctrl-click rows and **Track N picked**) to track many at
  once, weekly, monthly or daily.

A part is read at **Tier 1** (daily) or **Tier 2** (weekly or monthly). The
clock on a part's sheet shows its tier and why, and lets you change it.

## 4. Start the day on the Dashboard

**Supply → Dashboard** shows what needs a person, top to bottom:

- A red line when an inventory source or a distributor can't be read. Until it
  reads again, the figures behind it may be old.
- **Library components' parts are ending**: the components whose part is not
  recommended for new designs, at last time buy, obsolete, dropped by every
  distributor, or expected to end within two years. See step 6.
- The tiles: **Tracked**, **At risk**, **Out of stock**, **End of life**,
  **Open alerts**, **Queued for calls**. Each opens the list of exactly those
  parts.
- **Risk Distribution**: lifecycle against how many distributors hold stock.
  The cells that matter most are ending parts held by one distributor or none.
- **Deadlines**: last-time-buy and last-ship dates in the next year.
- **Projected stock**: parts by how soon they run out at the recent rate.
- **Tracked projects**: each project's parts at risk, how many boards the
  stock covers and its cost per board.
- **Alerts**, then **Recent changes** (new BOM revisions, parts added and
  removed).

## 5. Look into a part

Any part row opens the part's sheet. Read it top to bottom:

- **In stock**: total distributor stock, its history per distributor and the
  trend. **Read now** asks every distributor again (once every 15 minutes).
- **Price**: the price at the part's price quantity, its history, and the
  pencil to change the quantity it is priced at.
- **Outlook**: when the part may end (**Ended**, **Under 2 years**, **2 to 5
  years**, **No signs of an end**) and the health score with each finding.
- **Product change notices**, **Listings** (each distributor's products for
  the part), **Alternatives**, **Compliance** (RoHS, REACH, export control).

The bell sets the part's **Alert rules**: which alerts it raises, its stock
threshold, the price rise that matters and a target price.

## 6. Act on ending parts

When a library component's part is ending, the Dashboard lists it with the
reasons, the last buy date, its stock and the projects that use it. QA decides:

- **Not for new designs**: the component stays released and keeps working
  where it is placed, but the catalog marks it so nobody picks it for a new
  design.
- **Retire**: the component is archived and leaves the KiCad library.
  Symbols already placed stop resolving.
- **Dismiss**: hide it until its part gains a new reason.

Before retiring, give designers a way forward: propose an alternate (below) or
a replacement component.

## 7. Approve alternates

An alternate is another manufacturer part a component may be built with. Its
stock and offers count wherever the main part's do, but only once QA approves
it.

1. On the component's **Supply** tab, under **Parts**, enter the
   **Manufacturer** and **Part number** and choose **Propose alternate**.
2. A QA reviewer approves or rejects it on the same row. **Library Manager →
   Review** lists everything waiting.

**Alternatives** on a part's sheet suggests candidates (from distributors, and
graded against the part's parameters). It does not compare footprints or pins:
check those before you propose one.

## 8. Clear the review queue

**Library Manager → Review** collects what Prism could not settle alone:
manufacturer spellings, distributor listings filed under another number,
parts several makers sell under one number, and stock in your inventory that
matches no component. Work through it weekly; an unsettled spelling or listing
means a part's stock isn't counted.
