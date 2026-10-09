# System Builder user guide

System Builder keeps a system's interface control document (ICD) tied to the
KiCad sources it describes. You place boards, modules and subsystems, and say
which connectors are wired together and how. Prism then watches each board's
repository and tells you when a new revision changes something a connection
depends on. Around that record it gives you a 3D view of the whole system,
harness design down to manufacturing outputs, checks, snapshots and a Git
history.

The rules behind every behaviour below are in the [contracts](CONTRACTS.md)
and the [P2 contracts](CONTRACTS_P2.md). This guide describes what you see and
do.

## Concepts

| Term | Meaning |
| --- | --- |
| System | A named set of placed items and the connections between them. It lives in a workspace folder and inherits that folder's visibility. |
| Board | One physical occurrence of a Prism project in the system. The same project can appear more than once, for example two identical OBCs, each with its own label. |
| Module | A bought-out unit from the catalog, such as an IMU. Its connectors are ports, like a board's. |
| Part | A mechanical item from the catalog, such as an enclosure or bracket. It has a 3D model and no connectors. |
| Subsystem | Another system, published to the catalog and placed here as one item. You connect to it through its exports. |
| Baseline | The commit a board was last accepted at, plus the net every connected pin had there. |
| Tracked branch | A branch Prism watches for a board. When it moves, Prism compares the new tip with the baseline. |
| Port | A connector that can be connected. |
| Sub-port | A named set of a connector's pads, used as a port of its own, such as `J6.PWR`. |
| Export | A port a system publishes, so a parent system can connect to it. |
| Link | A connection between two ports. A **board-to-board** link is two connectors mated directly. |
| Row | One pin-to-pin pair inside a link, with a signal label. |
| Harness | A cable: up to 32 ends, each mating a port, with wires between end pins. |
| Review | The changes on a newer commit that a person has to decide on. |
| Finding | A problem a check found: an error, a warning or info. |
| Snapshot | A frozen, named copy of the whole system, for example at a design review. |

Anyone who can see the folder can read a system. Changing it needs the
designer or admin role.

## Systems

The workspace page lists the systems of the folder you are in, next to its
folders and boards. Each card shows the counts of boards, modules and
subsystems, and the number of open reviews. Hover a card to read its
description. **All** opens the systems list: one row per system with its
boards, subsystems, modules, findings, items to review, last snapshot and Git
state. **Filter** narrows it by name.

To create a system, choose **New System** on the workspace page. It is created
in the folder you are viewing. Give it a **Name**, optionally a
**Description**, and optionally its first boards.

## The workspace

Opening a system shows its workspace:

- **Top bar.** The breadcrumb, the **3D**, **Diagram** and **ICD** views, the
  finding counts (click them to open the findings), the Git branch, the last
  snapshot and **Take snapshot**. An archived system is marked
  **Archived · read-only**: it is kept because parent systems or the catalog
  still use it.
- **Outline** (left). Everything in the system, grouped into Boards, Modules,
  Subsystems, Parts, Harnesses and Links, with a dot on anything that has
  findings. **Add** places a Board, Module, Subsystem or Part.
- **Inspector** (right). Details of what you selected, or of the system when
  nothing is.
- **Tray** (bottom). Five tabs: **Nets**, **Connections**, **Findings**,
  **Changes** and **History**. Drag its edge to resize it; collapse it when
  you need the room.

The 3D view needs WebGPU. Without it the 3D tab is disabled and the workspace
opens on the Diagram. Below 1024 px wide, the outline and inspector open as
sheets from the **Outline** and **Details** buttons in the top bar.

The address bar keeps the view, the tray tab and the selection, so a link to
the page opens exactly what you were looking at.

With no selection, the inspector shows the system's counts and its
**Exports**: each export with the connector it publishes and its state. Use
an export's menu to **Rename** it (parents keep their links; an export's
identity never changes) or **Remove export**.

## Add boards

**Add → Board** asks for a project, a label and where the baseline comes
from; **Another board** adds more rows, and all are added in one go. A board
the server refuses stays in the dialog with the reason, and the others are
added:

- **Track a branch** (usual): the baseline starts at the branch tip, and later
  pushes are checked automatically. The branch is checked as soon as the board
  is added.
- **Fixed commit**: the baseline is the commit you enter. You can still set a
  tracked branch afterwards.

**Pinned** keeps the baseline even when the branch moves (see below). Give
each board a label that makes sense at system level, such as `OBC-A` and
`OBC-B` for two copies of one project. Labels are unique within a system.

Prism extracts the board's connectors in the background. The board shows as
pending until that finishes. A large board can take a few minutes the first
time; later reads use the cache.

Select a board to see it in the inspector: its baseline, branch and tip, and
its ports. **Check now** checks the branch straight away. **Pin** keeps the
baseline: Prism still notices when the branch moves, but only reports an
update and never opens a review. **Unpin** checks the branch at once, so a
commit that arrived while the board was pinned is reviewed or accepted then.
**Board actions** has **Edit board** (label and tracked branch) and **Remove
board**.

### Which parts are ports

A part becomes a port when, in this order:

1. its `Prism_Port` field is `yes`, `true`, `1` or `port` (`no`, `false` or `0`
   excludes it), or its `System` field is `Connector`;
2. its reference prefix is exactly `J` (so `J7` is a port, but `JP1` is not); or
3. its symbol or footprint library name starts with `Connector`, except
   KiCad's `TestPoint` symbols, which are not ports unless you mark or promote
   them.

DNP parts are not ports by default. In the board's **Ports** list, **All
parts** shows every part so you can **Promote to port** one, such as a test
pad. A port's menu can also **Hide** a detected connector; a port that is
linked, exported or split cannot be hidden. Adding a `Prism_Port` field in the
schematic is the durable way to fix detection for everyone.

### Sub-ports

When one connector carries several interfaces that go to different places,
split it. In the port's menu choose **Split**, name the sub-port (it reads
`J6.PWR`), and click the pads it takes. The pads you leave stay on the
connector itself (`J6`). The dialog previews the rows that will move: rows on
the chosen pads go to the sub-port, and a link whose rows end up on two sides
is split into two links. Nothing else about the connector changes: mating,
3D and nets stay per physical connector.

A sub-port is a port of its own: link it, export it, or **Edit** and
**Remove** it from its menu (its pads return to the connector). A connector
can have up to 16 sub-ports. Board-to-board links cannot use split
connectors, and a connector in a board-to-board link cannot be split. A
harness end always mates the whole connector; its wires are named by the
sub-port their pad is in. In the diagram, ICD and CSV, a split connector shows
each sub-port and the rest of the connector separately.

## Modules, parts and subsystems

- **Modules.** **Add → Module** places a catalog module. Its connectors are
  ports: link, harness and mate them like a board's. Where each connector sits
  on the module's model is set on the module's library page (**Place
  connector**), not in the system.
- **Parts.** **Add → Part** places a catalog part that has a converted 3D
  model, such as an enclosure. A part has no ports. It takes part in the 3D
  view, the collision check and the STEP export. Add a new enclosure to the
  catalog first.
- **Subsystems.** **Add → Subsystem** places a published system. You connect
  to it through its exports. **Open its system** opens it; its **Inside**
  section lists what it contains. Its node, its inspector (**Findings
  inside**) and the top bar ("+ N errors in subsystems") show the open
  errors and warnings its pinned snapshot was taken with.

Modules, parts and subsystems come from the catalog at a revision. **Updates**
chooses **Follow releases** (take each new released revision) or **Keep this
revision**. An item that is not released yet is pinned to its current
revision, with a warning, until one is released.
Its **Revision** shows where it stands, for example `v2 · released · v3
released · v4 in QA review`: the one you use, a newer release you could take,
and a newer revision still in review. The diagram node says "v3 released"
when a newer release exists.

### Exports

To let a parent system connect to a connector, export it: **Export** in the
port's menu, then a name and a description. A sub-port can be exported, and
the rest of its connector stays usable here. A linked port cannot be
exported. A system can have up to 200 exports.

**Export…** on the Exports section exports several connectors at once: tick
them in a list of the free connectors (filter by board, connector or part
number), edit the proposed names, and export them in one change.

## Connect boards

### Diagram

**Diagram** places the most-connected board in the middle and its partners on
either side. Each board lists the connectors that are linked, with what each
one connects to; the other ports sit behind "N unlinked ports". Wires run in
separate lanes so they never overlap. Hover a wire to see its name and pin
count, and click it to open its pins.

Drag from a port on one board to a port on another to create a link (expand a
board to reach an unlinked port). The toolbar switches what a drag creates: a
**Link**, a **Board-to-board** mate (**B**), or a **Harness** (**H**); **Esc**
cancels. Drag boards to arrange them. The layout is saved for everyone, but it
is not part of the engineering record: moving a box changes no version and
writes no history. **Auto-arrange** discards a saved arrangement.

Without dragging: **Connect…** in a port's menu, or **New connection** on the
Connections tab, picks the kind and both connectors from searchable lists
that show each connector's part number and pin count.

### Connections

The **Connections** tray tab lists every link and harness with its type, ends,
row or wire count and findings. Open one to edit it; **All connections** goes
back to the list.

The link editor mirrors the two ends: pin and net on one side, the signal in
the middle, net and pin on the other. Edits stay in a draft until you **Save
pins**; **Undo** right after saving restores the rows you had. The editor
flags missing pads and duplicate pairs before you save, and shows the
system's findings next to the rows they concern. Name, harness label and
deletion are in **Link actions**. If you leave with unsaved edits, Prism asks
before discarding them.

A new, empty link offers **Fill pins**: **Same pin** (pin 1 to pin 1) or
**Reversed**, applied at once; **Undo** empties it again. **More…** opens
**Generate rows**.

To fill a link quickly, use **Generate rows**:

| Generator | Pairs |
| --- | --- |
| Same pin | Pad `n` on A with pad `n` on B |
| Reversed | A in order with B in reverse order, as for a flipped mating connector |
| Offset | Pad `n` on A with pad `n + offset` on B |
| Matching net names | Pads whose net names end the same way, such as `/SPI_SCK` and `/Payload/SPI_SCK` |

You can limit either side to a pad range. Generators never overwrite rows you
already have, and skip pins that are unconnected on both sides unless you ask
for them. Their proposals go into your draft for you to check and save.
The preview marks a pair that would raise a finding (unrelated net names,
power meeting a signal, a named net meeting no net); **Leave out suspect**
unticks them all.

A **harness** label on a link records which cable it belongs to. Two links may
use the same pin without a fan-out warning only when both carry the same
label.

### Import an existing ICD spreadsheet

**Import CSV** on the Connections tab takes a CSV (UTF-8, up to 5 MB and 5,000
rows):

1. Upload the file. The delimiter is detected, and columns in Prism's own ICD
   export layout are recognised automatically.
2. Map columns to *from board/connector/pin*, *to board/connector/pin*, and
   optionally signal, harness, link name and row ID. Map each board value in
   the file to a board in the system, or skip it.
3. Preview the rows in four groups:
   - **Matched**: resolved, and the signal agrees with a net name on either end
     (or is empty);
   - **Needs review**: resolved, but the signal names neither net;
   - **Unresolved**: an unknown board, connector or pin;
   - **Conflict**: a duplicate of another row, or a row ID from another link.
4. Commit. Matched rows are written straight away. Needs-review rows go into an
   import review on **Changes**, where you accept each one (optionally with a
   corrected signal) or skip it. Unresolved and conflicting rows are listed in
   the report and not saved.

Rows are grouped into links by connector pair and harness, reusing a link when
one exists. A connector that was not exposed yet is promoted automatically. A
connector column of `J6.PWR` lands on that sub-port; a plain `J6` on a split
connector puts each row on whichever part holds its pad. Importing a file
exported from the same system changes nothing, so the ICD CSV works as a round
trip through a spreadsheet.

Harness wires are rows too. They fill the **from_end**, **from_end_pin**,
**to_end** and **to_end_pin** columns (ends are named "End 1", "End 2", …) and
may set **gauge_awg**, **colour** and **wire_label**; the board columns name
the connector pad each end pin lands on. Rows for a harness that does not
exist yet create it, with Generic ends and pin maps taken from the rows. Rows
that disagree with an existing harness (a different connector on an end, or a
pin landing on another pad) are listed as conflicts, never applied.

### Board-to-board links

A board-to-board link is a mate between two connectors. Its **Mating** panel
shows each connector's mating frame (vertical, top or bottom side, or a
right-angle direction), inferred from the footprint. **Confirm** it, or **Set
by hand**; **Confirm both** confirms the two inferred frames at once. 3D placement only uses confirmed frames; a confirmed frame goes
stale when the footprint moves, and is flagged. Enter the **Stack height
(mm)** from the connector datasheet (the gap between the two boards' facing
surfaces); left empty, it is taken from the connector bodies plus 5 mm. The
panel says whether the mate lines up with the stack, and which board this
link places.

A connector mates once: one board-to-board link or one harness end.

### Harnesses

Press **H** on the diagram and draw between two ports to create a cable with a
Generic mating connector at each end and one wire per shared pin. Drag from a
harness's **Add an end** row to another port to add an end. The harness
editor (open it from Connections, or **Open its wires** in the inspector) has
two tables:

- **Ends**: what each end mates, its mating block, its pin map and its wire
  count. **Generic end** adds an unmated end.
  - **Choose part** picks the real housing from the catalog: the parts the
    board connector "mates with" come first. The end's pins become the part's
    pins. When the part and the board connector have different pin counts, map
    every wired pin to a connector pad (the pin map reads **One to one** until
    you remap); until then the end shows an error. **Make generic** removes
    the part.
  - **Contact** sets the crimp contact part for the end's cavities.
- **Wires**: from, to, signal, AWG and colour for each wire. **Generate**
  fills them from two ends (**Same pin**, **Reversed** or **By net name**).
  Several wires on one pin form a splice. Paste a block copied from a
  spreadsheet into a signal, AWG or colour cell to fill down and across from
  there. Tick wires to give them one AWG or colour with **Set**. **Save wires**
  saves the draft.

**Harness actions** has **Edit details** (name, label such as `WH-003`, and a
cut length), **Convert to a link** (two ends, no splices, no pin map) and
**Delete harness**. A link's **Convert to a harness** goes the other way, and
**Make harness … from its links** turns every link with one harness label
into one harness.

When a board changes, harness wires are reviewed like link rows. **Remap** on
a wire edits that end's pin map.

## 3D view

The 3D view places every board, module, part and subsystem of the system, with
harnesses drawn along their routes.

- **Search parts and nets** (**/**) finds parts on any board, or system nets
  that cross boards. Pick a net to light it on every board.
- **System nets** opens the net panel: search by name or alias, show up to 8
  nets at once, frame a net on each board, and **Isolate** (**I**) to show only
  the lit copper.
- **Fit all** (**Home**), **Board names**, **Harnesses** (show or hide),
  **Statistics** and **Keyboard shortcuts** (**?**) sit in the toolbar at the
  bottom right.
- **Move** (**M**, editors). Select a board to move it: drag an arrow to slide
  it or a ring to turn it, or type X/Y/Z and rotations. Releasing saves.
  **Shift** gives 0.1 mm and 1° steps. A board in a mated stack asks whether
  to **Move with its stack** or **Break the mate**; a mated position you
  override can **Snap back**. **Reset all positions** returns every board to
  the default row.
- **Route** (editors, when the system has harnesses). Drag a harness to bend
  it; **Alt**-drag adds a breakout; double-click a point to remove it. A
  waypoint can be **Pinned** so it stays put even through a tight bend. A
  subsystem's harness is edited in that subsystem. **Edit route** on a
  harness's inspector opens it here.

### Collision check

**Check collisions** in the toolbar checks every pair of bodies in the 3D
view: board outlines and the components on them, modules and parts, at every
level. Mated board-to-board connectors are allowed to touch. Each colliding
pair is a warning, **Bodies intersect in 3D**; **Show** frames the two bodies
and marks where they meet. Items that could not be checked (no 3D model, a
board you cannot see) are listed as not checked, never assumed clear. The
check does not run by itself: once you move something, the button shows the
result is out of date until you check again.

### STEP export

**Export STEP** in the toolbar builds one STEP assembly of the system for
mechanical CAD: each board's own STEP from KiCad at its baseline, each module's
and part's model, and each harness as a solid tube along its route with its end
housings. Everything sits where the 3D view puts it, with names and colours
kept. It runs in the background; when it is ready the button downloads it
(**Download STEP · v… · … MB**). Anything left out (a board you cannot see, an
item without a model) is reported. The STEP is made on request and is not
stored with snapshots.

## Harness manufacturing

The harness editor's **Manufacturing** section holds what a harness shop
needs.

- **Coverings.** Add a covering (sleeve, braid, heat-shrink) to the whole
  bundle or to one route segment, with a catalog part, a description such as
  `PET braid 6 mm`, or both.
- **Drawing.** Opens the harness drawing in Prism. It shows each end as a
  connector table, every wire in its colour from its cavity into the bundle,
  the bundle as its route with segment lengths, breakouts and coverings, then
  the wire list and the bill of materials. Hover a wire, a cavity, a segment or
  a wire-list row to trace it through the bundle; click to keep the trace, and
  **Esc** to clear it. Zoom with **Fit**, **1:1**, the **−**/**+** buttons, or
  **Ctrl/⌘** + wheel.
- **Downloads.** **Drawing SVG** and **PDF** (the same drawing), **Wiring
  list** and **BOM** (CSV), and **WireViz** (a YAML file for the WireViz tool).

Wires are numbered `W1…` in the same order in every output. A wire's cut
length is its estimated routed length, allowance included. The BOM lists
housings, contacts (one per wired cavity), wire by gauge and colour, splices,
coverings by length, and labels. WireViz cannot show breakouts or a covering's
position; the drawing does.

## When a board changes

After Prism fetches a repository (every five minutes by default, or on a
manual sync), it checks every board that tracks a branch there. Only pins used
by a row or wire matter; changes anywhere else on the board are ignored.

- **Nothing a connection uses changed.** The baseline moves to the new commit
  on its own and appears under **Applied automatically** on **Changes**. This
  includes re-annotating a connector (`J2` → `J12`), replacing a symbol with an
  identical one, and edits that leave every connected net alone.
- **Something did change.** Prism opens a review. The baseline stays where it
  was until the review is finished, so the ICD keeps describing the accepted
  design.

### Deciding a review

Each item in a review is one kind of change:

| Change | What happened | Your choices |
| --- | --- | --- |
| Net changed | A connected pin now has a different net | **Accept** the new net, **Remap** the row to another pad, or remove the row |
| Pin missing | The connected pad no longer exists | Remap or remove |
| Connector changed | The connector's symbol or footprint changed | Accept, which refreshes the port and every row on it (remap or remove any row whose pad disappeared first) |
| Connector missing | The connector could not be found | **Bind** one of the ranked candidates, or remove the rows |

You can change a decision until the last item is decided. Then the whole
review applies at once: the baseline moves to the reviewed commit and every
decision is written to history. Prism applies exactly the commit it reviewed,
even if the branch has moved again since.

If a connection on that board is edited while its review is open, the review
no longer matches the system. Your next decision is refused with a note, and
Prism evaluates the same commit again, including the edited rows.

**Keep pinned** closes the whole review without changes and pins the board at
its current baseline. Later, **Rebase to tip** under the updates on pinned
boards moves it to the branch tip; anything that commit changes on a
connection opens a review as usual. For a subsystem, **Take latest released**
moves it to the newest released revision.

If another push arrives while a review is open, the review is superseded and a
new one opens from the same baseline to the newest commit. If a baseline commit
disappears (for example after a force-push and prune), the board is marked
unresolved; rebase it onto a commit that exists.

## Findings

The top bar counts the open findings; the **Findings** tab lists them grouped
by rule. A finding on a pin pair shows both pins and both nets (`J3 4 ↔ J7 4 ·
VCC_3V3 ↔ no net`). **Show** selects what a finding is about; for a pin pair
it opens the link on that row. The filter narrows the list by any text
(rule, board, connector, net). A rule with more than 8 findings is split by
place, and **Waive all** waives a whole group or place with one note. An editor can **Waive** a
warning or info finding with a note saying why it is acceptable; waived
findings move to **Waived**, where **Unwaive** brings one back. Errors cannot
be waived. Snapshots keep the waivers they were taken with.

| Rule | Severity | Shown as |
| --- | --- | --- |
| SYS-V01 | error | Duplicate row |
| SYS-V02 | warning | Pin used by several links (without a shared harness label) |
| SYS-V03 | error | Connector is not a port |
| SYS-V04 | error | Pad does not exist |
| SYS-V05 | error | Board source unavailable |
| SYS-V06 | warning | PCB net differs from the schematic |
| SYS-V07 | warning | Pin carries several nets |
| SYS-V08 | info | Open review |
| SYS-V09 | warning | Joined nets share no name |
| SYS-V10 | error | Power net meets a signal net |
| SYS-V11 | warning | Mated connectors do not line up (more than 0.2 mm or 0.5°) |
| SYS-V12 | warning | Harness runs through a board |
| SYS-V13 | warning | Cut length differs from the estimate (by more than 15 %) |
| SYS-V14 | warning | Subsystem revision is not released |
| SYS-V15 | warning | Subsystem update blocked by hierarchy limits |
| SYS-V16 | error | Export does not resolve |
| SYS-V17 | info | Connector moved since its mating frame was confirmed |
| SYS-V18 | warning | Catalog does not list these parts as mating |
| SYS-V19 | error | Harness part pins do not land on connector pads |
| SYS-V20 | info | Harness bends tighter than its minimum radius (6 × bundle diameter) |
| SYS-V21 | warning | Sub-port names a pad the connector no longer has |
| SYS-V22 | warning | Bodies intersect in 3D (from the last collision check) |
| SYS-V23 | warning | Named net meets a pin on no net (the other board leaves that pin unconnected) |

A rule that cannot run (for example SYS-V06 on a board with no PCB) is listed
as *not evaluated*; it never counts as a pass. The schematic is the source of
truth for drift; the PCB only produces SYS-V06.

### Net names across boards

SYS-V09 warns when the two nets a link row joins share no name, such as
`CAN_H` on one board and `/BUS_A` on the other. Clear it either by waiving it,
or by proposing a rename: **Rename** on the finding picks the board whose net
should change and the new name, with an optional note for the board's owner.
Prism never edits a board. The proposal waits until a commit on that board
carries the new name; that commit is then accepted without a review, and the
proposal closes. Open proposals are listed under **Rename proposals**, where
**Withdraw** drops one. They are also in the system's report.

### What the checks do not cover

The checks catch, deterministically: a pin missing, a net changed, a connector
re-footprinted or missing, a stale subsystem revision, drift from the tracked
branch, duplicate rows, unexposed ports, PCB nets that differ from the
schematic, board-to-board mates that do not line up, stale mating frames,
mating parts the catalog does not pair, pin-count mismatches without a pin
map, harnesses through boards, cut lengths far from the estimate, tight bends
and colliding bodies.

They do **not** check, and your team still has to: signal direction (two
drivers on one net), voltage domains and logic levels (SYS-V10 only knows
"KiCad power symbol against a named net", so 3V3 meeting 12V passes), current
ratings and wire gauge against current, connector keying, shielding, impedance
or length matching, and the ICD's own signal labels, which are never
re-checked against the schematic after they are written.

## Snapshots, the ICD and reports

**Take snapshot** at a milestone (PDR, CDR, a build): give it a name and an
optional note. The dialog shows the open errors and warnings, unreviewed
changes and exports it will freeze. A snapshot freezes every board's baseline, every link, row and
harness, the 3D positions, and the findings and waivers at that moment.
Snapshots cannot be edited or deleted. **History** lists them, with the
activity log of every change and who made it (automatic changes are
attributed to `system:detection`).

- **ICD** (the view, or a snapshot's **ICD** button) is a printable page; use
  the browser's *Print to PDF*. It has a title block, a board table with
  commits, a block diagram, one table per link, the board-to-board pairs with
  their mating frames and stack heights, each harness (ends, wires and
  splices), and the findings. If reviews were open, every page says so.
  **Sections** jumps within it. **ICD, all levels** includes every
  subsystem's own links.
- **CSV** is the ICD as a spreadsheet, and also the import format.
- **System manifest (JSON)** is the snapshot's `prism.system.json`.
- **Compare** a snapshot with the live system or another snapshot: boards
  rebased, added or removed, and rows added, removed or changed with their
  before and after nets.
- **Report** (on the Findings, Changes and Connections tabs) downloads an
  Excel workbook of the live system: a summary, every open review item, every
  finding (waived ones with their notes) and the rename proposals.

### Publishing to the catalog

To place this system in other systems, publish one of its snapshots: **Publish
to the catalog** on the snapshot. The first time, give it an **Internal part
number**, an assembly name, a manufacturer and a description. A snapshot taken
with unreviewed changes can be published, but the catalog will not release it.
Releases then go through the catalog's own review. The publish dialog shows
what the snapshot froze, and warns when it has no exports (a parent could not
connect to it).

## Git tracking

At the top of **History**, **Link repository** connects the system to a Git
branch. Each snapshot is then committed to that branch as
`prism.system.json`, authored by you, and its badge shows the commit (or why
it failed, with **Retry**). **Fetch now** checks the branch.

If someone changes `prism.system.json` on the branch outside Prism, the
workspace shows **Manifest changed outside Prism**, and snapshots wait. The
change appears on **Changes** as a review listing what it changes:
**Accept** replaces the system with that manifest (including edits not yet in
a snapshot), **Reject** keeps the system as it is and the next snapshot
replaces the file on the branch.

## On a board's page

A board's project page shows **Used in** above its README when any system you
can see places it: each system, with the labels the board has there.

## Boards you cannot see

A system can include a board from a folder your role cannot see. That board
appears only as its label, marked restricted. Its project, commits,
references, pins and nets are hidden everywhere, including the 3D view,
exports, snapshots, comparisons, reports and the STEP export, and you cannot
change anything that touches it. A subsystem you cannot open shows only its
exports.

A board whose project has been deleted is treated the same way for everyone
except admins. A designer can still remove it with **Remove board**.

## Limits

| Limit | Value |
| --- | --- |
| Boards, modules, parts and subsystems placed directly in one system | 50 |
| Links per system | 500 |
| Rows per system | 5,000 |
| Boards in a system of systems, counted through every subsystem | 200 |
| Nesting depth, counting the top system | 4 |
| Exports per system | 200 |
| Sub-ports | 16 per connector, 200 per system |
| Harness ends | 32 per harness |
| Coverings | 64 per harness |
| Nets lit at once in 3D | 8 |
| CSV import | 5 MB and 5,000 rows |

A subsystem that follows releases does not advance to a revision that would
break a limit; it stays and raises SYS-V15 instead.
