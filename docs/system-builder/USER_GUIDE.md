# System Builder user guide

System Builder keeps an interface control document (ICD) tied to the KiCad
sources it describes. You describe which connectors on which boards are wired
together. Prism then watches each board's repository and tells you when a new
revision changes something a connection depends on.

The rules behind every behaviour below are in the [frozen contract](CONTRACTS.md).
This guide describes what you see and do.

## Concepts

| Term | Meaning |
| --- | --- |
| System | A named set of boards and the connections between them. It lives in a workspace folder and inherits that folder's visibility. |
| Board (instance) | One physical occurrence of a Prism project in the system. The same project can appear more than once, for example two identical OBCs. Each has its own label. |
| Baseline | The commit a board was last accepted at, plus the net every connected pin had there. |
| Tracked branch | A branch Prism watches for a board. When it moves, Prism compares the new tip with the baseline. |
| Port | A connector on a board that can be linked. |
| Link | A connection between two ports, such as a cable or a board-to-board mate. |
| Row | One pin-to-pin pair inside a link, with a signal label. |
| Review | A list of changes on a newer commit that a person has to decide on. |
| Snapshot | A frozen, named copy of the whole system, for example at a design review. |

Anyone who can see the folder can read a system. Changing it needs the
designer or admin role.

## Create a system

1. On the workspace page, choose **New system**, give it a name, and pick a
   folder. The folder decides who can see it.
2. Open the system. It has six tabs: **Overview**, **Diagram**, **Boards**,
   **Connections**, **Changes** and **History**.

## Add boards

On **Boards**, choose **Add board** and pick a project. Then choose where its
baseline comes from:

- **Track a branch** (usual): the baseline starts at the branch tip, and later
  pushes are checked automatically.
- **Fixed commit**: the baseline is the commit you enter. You can still set a
  tracked branch afterwards.

Give each board a label that makes sense at system level, such as `OBC-A` and
`OBC-B` for two copies of one project. Labels are unique within a system.

Prism extracts the board's connectors in the background. The board shows as
pending until that finishes. A large board can take a few minutes the first
time; later reads use the cache.

A **pinned** board keeps its baseline. Prism still notices when its branch
moves, but only reports "update available" and never opens a review for it.
**Unpin** checks the branch straight away, so a commit that arrived while the
board was pinned is reviewed or accepted then. **Check now** waits for its
check to finish, so any review it opens appears on the page.

### Which parts are ports

A part becomes a port when, in this order:

1. its `Prism_Port` field is `yes`, `true`, `1` or `port` (`no`, `false` or `0`
   excludes it), or its `System` field is `Connector`;
2. its reference prefix is exactly `J` (so `J7` is a port, but `JP1` is not a
   port); or
3. its symbol or footprint library name starts with `Connector`, except
   KiCad's `TestPoint` symbols, which are not ports unless you mark or promote
   them.

A board's label and tracked branch are changed with **Edit board** in its **⋯**
menu on **Boards**, next to **Check now** and **Pin**.

DNP parts are not ports by default. On the board's **Ports** table you can
**hide** a detected connector or **promote** any other annotated part, such as
a test pad. A port that a link uses cannot be hidden. Adding a `Prism_Port`
field in the schematic is the durable way to fix detection for everyone.

## Connect boards

### Diagram

**Diagram** places the most-connected board in the middle and its partners
on either side. Each board lists the connectors that are linked, with what
each one connects to; the other ports sit behind "N unlinked ports". Wires
run in separate lanes so they never overlap. Hover a wire to see its name and
pin count, and click it to open its pins.

Drag from a port on one board to a port on another to create a link (expand
a board to reach an unlinked port). Drag boards to arrange them. The layout is
saved for everyone, but it is not part of the engineering record: moving a box
changes no version and writes no history. **Auto-arrange** discards a saved
arrangement and goes back to the default layout.

### Connections

**Connections** lists links, with a warning or error count beside any that
have findings. Open one to edit its rows. The table mirrors the two ends: pin
and net on one side, the signal in the middle, net and pin on the other. Name,
harness and deletion are in the link's **⋯** menu. Edits stay in a local draft
until you save. The editor flags missing pads and duplicate pairs before you
save, and shows the system's validation findings next to the rows they concern.

To fill a link quickly, use **Generate rows**, which opens a side panel:

| Generator | Pairs |
| --- | --- |
| Identity | Pad `n` on A with pad `n` on B |
| Reverse | A in order with B in reverse order, as for a flipped mating connector |
| Offset | Pad `n` on A with pad `n + offset` on B |
| Net name | Pads whose net names end the same way, such as `/SPI_SCK` and `/Payload/SPI_SCK` |

You can limit either side to a pad range. Generators never overwrite rows you
already have, and skip pins that are unconnected on both sides unless you ask
for them. The proposals go into your draft for you to check and then save.

A **harness** label on a link records which cable it belongs to. Two links may
use the same pin without a fan-out warning only when both carry the same
harness label.

### Import an existing ICD spreadsheet

On **Connections**, **Import CSV** takes a CSV (UTF-8, up to 5 MB and 5,000
rows):

1. Upload the file. The delimiter is detected, and columns in Prism's own ICD
   export layout are recognised automatically.
2. Map columns to *from board/connector/pin*, *to board/connector/pin*, and
   optionally signal, harness, link name and row ID. Map each board value in
   the file to a board in the system, or skip it.
3. Preview the rows in four groups:
   - **Matched**: resolved, and the signal agrees with a net name on either
     end (or is empty);
   - **Needs review**: resolved, but the signal names neither net;
   - **Unresolved**: an unknown board, connector or pin;
   - **Conflict**: a duplicate of another row, or a row ID from another link.
4. Commit. Matched rows are written straight away. Needs-review rows go into an
   import review on **Changes**, where you accept each one (optionally
   with a corrected signal) or skip it.
   Unresolved and conflicting rows are listed in the report and not saved.

Rows are grouped into links by connector pair and harness, reusing a link when
one already exists. A connector that was not exposed yet is promoted
automatically. Importing a file exported from the same system changes nothing,
so the ICD CSV works as a round trip through a spreadsheet.

Harness wires are rows too. They fill the **from_end**, **from_end_pin**,
**to_end** and **to_end_pin** columns (ends are named "End 1", "End 2", …) and
may set **gauge_awg**, **colour** and **wire_label**; the board columns name
the connector pad each end pin lands on. Rows for a harness name that does not
exist yet create that harness, with Generic ends and pin maps taken from the
rows. Rows that disagree with an existing harness (a different connector on an
end, or a pin landing on another pad) are listed as conflicts, never applied.

### Board-to-board links and harnesses

- **Board-to-board.** Press **B** on the diagram (or use the toolbar button),
  then draw a link: it is a mate between two connectors. Link details show each
  connector's mating frame (vertical, top or bottom side, or a right-angle
  direction), inferred from the footprint. **Confirm** it, or **Set by hand**.
  3D placement only uses confirmed frames. You can also enter the stack height
  from the connector datasheet.
- **Harnesses.** Press **H** and draw between two ports to create a cable with
  a Generic mating connector at each end and one wire per shared pin. Drag
  from a harness's **Add an end** row to another port to add an end; a harness
  can have up to 32 ends. The harness editor on **Connections** lists the ends
  (what each mates, its mating block, and a pin map when a pin lands on a
  different pad) and the wires. Several wires on one pin form a splice.
- **Mating parts.** An end's mating block starts Generic. **Choose part**
  picks the real housing from the catalog: the parts the board connector
  "mates with" come first, and you can search for any other. The end's pins
  become the part's pins. When the part and the board connector have
  different pin counts, map every wired pin to a connector pad; until then
  the end shows an error. **Make generic** removes the part again. Parts with
  wires on pins the new part lacks are refused; move those wires first.
- **Converting.** A link's menu offers **Convert to a harness**. A link with a
  P1 harness label offers **Make harness … from its links**, which turns every
  link with that label into one harness. A harness with two ends, no splices
  and no pin map converts back to a link.
- A connector mates once: one board-to-board link or one harness end.
- When a board changes, harness wires are reviewed like link rows. **Remap**
  on a wire edits that end's pin map.

## When a board changes

After Prism fetches a repository (every five minutes by default, or on a
manual sync), it checks every board that tracks a branch there. Only pins used
by a row matter; changes anywhere else on the board are ignored.

- **Nothing a connection uses changed.** The baseline moves to the new commit
  on its own and appears under **Applied automatically** on **Changes**.
  This includes re-annotating a connector (`J2` → `J12`), replacing a symbol
  with an identical one, and sheet or README edits that leave every connected
  net alone.
- **Something did change.** Prism opens a review. The baseline stays where it
  was until the review is finished, so the ICD keeps describing the accepted
  design.

### Deciding a review

Each item in a review is one kind of change:

| Change | What happened | Your choices |
| --- | --- | --- |
| Net changed | A connected pin now has a different net | **Accept** the new net, **remap** the row to another pad, or **remove** the row |
| Pin missing | The connected pad no longer exists | Remap or remove |
| Connector changed | The connector's symbol or footprint changed | Accept, which refreshes the port and every row on it (remap or remove any row whose pad disappeared first) |
| Connector missing | The connector could not be found | **Bind** one of the ranked candidates, or remove the rows |

You can change a decision until the last item is decided. At that point the
whole review applies at once: the baseline moves to the reviewed commit and
every decision is written to history. Prism applies exactly the commit it
reviewed, even if the branch has moved again since.

If a connection on that board is edited while its review is open (a row added,
moved to another pin or removed), the review no longer matches the system.
Your next decision is refused with a note, and Prism evaluates the same commit
again. The new review includes the edited rows, so nothing is carried onto the
new baseline unchecked.

**Keep pinned** closes the whole review without changes and pins the board at
its current baseline. Later, **Rebase to tip** under *Updates available on
pinned boards* on **Changes** moves it to the branch tip.
Anything that commit changes on a connection opens a review as usual.

If another push arrives while a review is open, the review is marked
superseded and a new one is opened from the same baseline to the newest
commit. Decisions on the superseded review are dropped, because they were made
about an older commit.

If a baseline commit disappears (for example after a force-push and prune),
the board is marked unresolved. Rebase it onto a commit that exists to carry
on.

## Validation

The **Overview** counts findings, and **Connections** shows them on the rows
they concern:

| Rule | Severity | Meaning |
| --- | --- | --- |
| SYS-V01 | error | Two identical rows in one link |
| SYS-V02 | warning | A pin is used by several links without a shared harness label |
| SYS-V03 | error | A link uses a port that is not exposed |
| SYS-V04 | error | A row uses a pad that does not exist |
| SYS-V05 | error | The board's source cannot be read |
| SYS-V06 | warning | The PCB carries a different net from the schematic on a connected pin |
| SYS-V07 | warning | A connected pin carries more than one net |
| SYS-V08 | info | The board has an open review |
| SYS-V09 | warning | The two nets a row joins have no related name. **Off by default**: turn it on under **Checks** on the Overview |
| SYS-V10 | error | A power net meets a named signal net across a link |

A rule that cannot run (for example SYS-V06 on a board with no PCB) is listed
as *not evaluated*; it never counts as a pass. The schematic is the source of
truth for drift; the PCB only produces the SYS-V06 warning.

## Snapshots and the ICD

On **History**, **Take snapshot** at a milestone (PDR, CDR, a build). A
snapshot freezes every board's baseline, every link and row, and the findings
at that moment. Snapshots cannot be edited or deleted.

From a snapshot, or from the live system, you can:

- open the **ICD** as a printable page (use the browser's *Print to PDF*). It
  has a title block, a board table with commits, a block diagram, one table per
  link, the board-to-board pairs with their mating frames and stack heights,
  each harness (ends, wires and splices), and the findings. If reviews were
  open, every page says so.
- download the **ICD CSV**, which is also the import format;
- **compare** with the live system or another snapshot, which lists boards
  rebased, added or removed, and rows added, removed or changed with their
  before and after nets.

The **Activity** log below lists every change with who made it. Automatic
changes are attributed to `system:detection`.

## Boards you cannot see

A system can include a board from a folder your role cannot see. That board
appears only as its label, marked restricted. Its project, commits,
references, pins and nets are hidden everywhere, including exports, snapshots
and comparisons, and you cannot change anything that touches it.

A board whose project has been deleted is treated the same way for everyone
except admins. A designer can still remove it from the system with **Remove
board**.

## Limits

| Limit | Value |
| --- | --- |
| Boards, modules and subsystems placed directly in one system | 50 |
| Links per system | 500 |
| Rows per system | 5,000 |
| Boards in a system of systems, counted through every subsystem | 200 |
| Nesting depth, counting the top system | 4 |
| CSV import | 5 MB and 5,000 rows |

## Not in this release

Git-tracked system files, nested systems, harness wiring details (wires,
splices, gauge, colour), non-KiCad parts, multi-board 3D, system-level
electrical checks, per-board variant selection, and server-side PDF output.
