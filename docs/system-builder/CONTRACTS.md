# System Builder — frozen contracts

**Version 1.12 · 2026-09-30 · tickets SYS-00, SYS-04 to SYS-11, SYS-19, polish, review pass.** This is the source of truth for
System Builder P1
([issue #166](https://github.com/krishna-swaroop/KiCAD-Prism/issues/166)).
Implementation tickets build against this version. Changing a rule here is a
contract revision: bump the version, record the change in §12, and re-run the
affected fixture steps (§11).

Inspected baseline: `KiCAD-Prism` `57a7581e` (`dev` after #405).

P2 (systems of systems, catalog assemblies, harnesses, 3D) extends this
document in [CONTRACTS_P2.md](CONTRACTS_P2.md).

Terms:

- **System**: a named set of board instances and the connections between them.
- **Instance**: one physical occurrence of a Prism project inside a system.
  The same project may appear several times.
- **Interface**: the connector and pin facts extracted from one project at one
  commit.
- **Port**: a connector on an instance that can take part in links.
- **Link**: a connection between exactly two ports.
- **Row**: one pin-to-pin pair inside a link.
- **Baseline**: the accepted commit, plus the accepted observations that each
  row was validated against.
- **Candidate**: a newer commit being compared against the baseline.
- **Review**: the set of changes between a baseline and a candidate that a
  person must decide on.

---

## 1. Invariants

1. **The schematic is observed.** Every drift fact comes from schematic
   connectivity at an exact commit. The PCB only contributes the
   `pcb_out_of_sync` warning (§7.3).
2. **Auto-accept exactly when the connected interface is provably unchanged.**
   This one rule decides auto-advance (§6.3) and auto-rebind (§6.4). Everything
   else becomes a review.
3. **Only connected pins matter.** A change to a pin that no row uses never
   opens a review and never blocks auto-advance.
4. **The row signal label is never compared with a net after creation.** The
   only net-to-signal comparison is at CSV import (§9.3).
5. **Nothing is re-resolved at decision time.** Accepting a review applies
   exactly the candidate commit and observations stored in that review, even if
   the branch has moved since.
6. **Canvas layout is not engineering state.** It has its own storage, no
   ETag, and is excluded from the connectivity digest and the audit log.
   *Revised by P2 (CONTRACTS_P2 §9.5):* snapshots and manifests freeze the
   layout, and it counts toward the full digest only.
7. **Children are read-only.** System Builder never writes to a child
   repository or a KiCad file.
8. **PostgreSQL is authoritative.** Every engineering object has an opaque,
   stable, portable ID (§2.1), so the model serializes losslessly to a future
   Git manifest.

## 2. Identity

### 2.1 Portable IDs

The ID format is a prefix plus 32 lowercase hex characters from a UUID4. IDs
are allocated once, never reused, and never derived from labels.

| Object | Prefix |
|---|---|
| System | `sys_` |
| Instance | `sin_` |
| Link | `slk_` |
| Row | `srw_` |
| Review | `srv_` |
| Review item | `sri_` |
| Snapshot | `ssn_` |
| Audit event | `sae_` |
| Import session | `sim_` |

### 2.2 Occurrence key

A placed symbol unit is identified by its occurrence key:

```text
occurrence_key = <sheetInstancePath>/<symbolUuid>
```

`sheetInstancePath` is the **UUID form** (`/<root-uuid>/<sheet-uuid>…`, the
KiCad `(path …)` of the containing sheet). That makes the key equal to KiCad's
`KIID_PATH` for the symbol instance, which is the same identity design
variants use. Repeated sheets give distinct keys for a shared `symbolUuid`.
Renaming a sheet does **not** change a key.

### 2.3 Port key

A connector can be a multi-unit symbol, where each unit has its own UUID but
all share one reference designator. Every unit occurrence with that reference
on that board is part of the same port.

- `member_keys`: the sorted occurrence keys of every unit.
- `port_key`: the occurrence key of the **lowest unit number present**. For
  single-unit symbols this is the only key.

A link end stores both `portKey` and `memberKeys` in its port baseline. A
candidate component resolves that end when its `memberKeys` **intersect** the
baseline `memberKeys`. That covers unit A being deleted while unit B survives:
the end then resolves through unit B, and its stored `portKey` moves to the
candidate's `portKey` as a silent change (§6.1). If two candidate components
intersect, the end does not resolve by key. Anything that does not resolve by
key goes through the rebind rule in §6.4.

The **reference designator is display metadata**. Re-annotating `J4` to `J7`
with unchanged UUIDs is a silent label update.

Unannotated references (containing `?`) are extracted but cannot be exposed
as ports. They produce the `unannotated_connector` diagnostic.

A footprint with no schematic symbol cannot be a port in P1.

### 2.4 Pin key

A pin is identified by the **pad number as a string**. `"01"`, `"1"`, `"A1"`
and `"SH"` are distinct, and a pad number is never coerced to an integer.

- Several pads or pins that share one number form one logical pin.
- A logical pin's observed net is the **sorted set** of the schematic nets on
  its members. If the set has more than one element, the pin carries the
  `pin_net_ambiguous` diagnostic.

**Row key.** A row is `(link_id, pin_a, pin_b)`. No two rows in one link may
share that tuple.

## 3. Interface artifact: `prism.system_interface.v1`

The interface artifact is extracted once per `(project_id, commit,
extractor_version)`, cached in `system_interface_artifacts`, and shared by
every instance and system. It is derived from the pinned kicad-monkey pipeline
that the semantic index uses. It is not a new KiCad parser.

```json
{
  "schema": "prism.system_interface.v1",
  "projectId": "prj_…",
  "commit": "<40-hex>",
  "extractor": {"version": "3", "kicadMonkeyVersion": "…"},
  "hasPcb": true,
  "components": [
    {
      "portKey": "/r/s/uuid",
      "memberKeys": ["/r/s/uuid"],
      "reference": "J7",
      "libId": "Connector_Generic:Conn_02x10_Odd_Even",
      "footprint": "Connector_PinHeader_2.54mm:PinHeader_2x10_P2.54mm_Vertical",
      "value": "Conn_02x10",
      "dnp": false,
      "candidate": true,
      "candidateReason": "field|refdes|library|none",
      "pins": [
        {
          "pad": "17",
          "nets": ["/PAYLOAD_RESET#"],
          "pcbNets": ["/PAYLOAD_RESET#"],
          "pinNames": ["~{RESET}"],
          "pinTypes": ["passive"]
        }
      ]
    }
  ],
  "diagnostics": [{"code": "…", "portKey": "…", "pad": "…", "detail": "…"}],
  "digest": "sha256:…"
}
```

Field rules:

- `components` lists every placed, annotated or unannotated symbol reference
  that has pins, not just connector candidates, so a user can promote any
  symbol (§4.2). Virtual references starting with `#` (power flags) are
  excluded.
- `nets` holds the **full hierarchical schematic net names**, exactly as the
  netlist reports them (for example `/Power/VBUS`). Global and power nets keep
  their plain names. They are captured **before** any PCB overlay; the
  existing semantic index overwrites terminal nets with pad nets, and the
  extractor must not inherit that. A pin with no connection has `nets = []`.
  KiCad's autogenerated `unconnected-(…)` names are normalized to `[]`, so
  "pin became unconnected" appears as `["/X"] → []`.
- `pcbNets` is `null` when the commit has no board, or when the pad is absent
  on the board.
- `pinNames` and `pinTypes` are best effort. They are `null` when unavailable,
  and they never drive drift.
- `libId` is read from the placed symbol's native `lib_id`. The semantic index
  does not carry it today.
- `dnp` is the **default assembly** state, using the design-variant resolver's
  sheet fold. Per-instance variant selection is out of P1.
- `digest` is `sha256` over the canonical JSON (sorted keys, no whitespace)
  with `digest`, `extractor`, `projectId` and `commit` omitted, so it covers
  interface facts only.
  Two commits with identical schematic interface facts produce the same
  digest.

`connectedInterfaceDigest` is not stored in the artifact. The drift engine
computes it per port, for a given set of connected pads:

```text
sha256(canonical_json({libId, footprint, pins: [[pad, sorted(nets)] for pad in sorted(connected_pads)]}))
```

## 4. Ports

### 4.1 Detection

A component is a connector **candidate** when the first matching rule in this
order says so:

1. **Explicit field.** `Prism_Port` holding `true`, `yes`, `1` or `port` makes
   it a candidate. `false`, `no` or `0` **excludes** it, even when a later
   rule would match. Field `System` equal to `Connector` (case-insensitive) is
   also treated as a candidate.
2. **Reference prefix.** The alphabetic prefix of the reference is exactly
   `J`, so `J7` matches but `JP1` does not (v1.10: `P`, `CN` and `X` were
   dropped; `X` is an oscillator in many libraries, and `P`/`CN` connectors
   from a `Connector` library still match rule 3).
3. **Library.** The `lib_id` library nickname, or the footprint library
   nickname, starts with `Connector` (case-insensitive). Symbols whose name
   (the part of `lib_id` after `:`) starts with `TestPoint` are excluded from
   this rule (v1.9): KiCad ships its test points in the `Connector` library,
   and on real boards they outnumber connectors ten to one. A test point can
   still be a port through rule 1 or by promotion.

Field names are matched ignoring case and punctuation (`Prism_Port`,
`prism port` and `PRISMPORT` are the same field); values are matched ignoring
case. A value outside both lists is ignored and the next rule applies.
`candidateReason` records which rule matched.

### 4.2 Exposure

Exposure is resolved per instance at the instance's baseline:

| Per-instance override | Result |
|---|---|
| none | Exposed when `candidate` is true and `dnp` is false |
| `hidden` | Not exposed |
| `promoted` | Exposed, including non-candidates and DNP parts |

Overrides are stored per `(instance_id, port_key)`. The rules also apply:

- A port that is already an endpoint of a link cannot be hidden (409).
- Unannotated components cannot be promoted (422).

## 5. Stored model

All tables live in the `workspace` schema with a `system_` prefix. They are
created by workspace migration **26**. The shapes below are normative; the
column names are guidance for SYS-03.

| Table | Key and essential columns |
|---|---|
| `system_projects` | `id`; `name`; `description`; `folder_id` → `ws_folders` (`ON DELETE SET NULL`); `version` (bigint, the ETag counter); `created_by`; `created_at`; `updated_at` |
| `system_instances` | `id`; `system_id`; `project_id` (**no FK cascade**, §5.1); `label` (unique per system, case-insensitive); `baseline_commit`; `tracked_ref` (branch name or null); `pinned` (bool); `resolution` (`resolved`/`unresolved`); `tip_commit`; `tip_checked_at` |
| `system_port_overrides` | `(instance_id, port_key)`; `state` (`hidden`/`promoted`) |
| `system_links` | `id`; `system_id`; `name`; `harness` (nullable label); `end_a` and `end_b`, each an `instance_id` plus a **port baseline** `{portKey, memberKeys, reference, libId, footprint, pinCount}` |
| `system_link_rows` | `id`; `link_id`; `pin_a`; `pin_b`; `signal`; `net_a` and `net_b` (accepted sorted net sets); `source` (`manual`/`generator`/`import`); unique `(link_id, pin_a, pin_b)` |
| `system_reviews` | `id`; `system_id`; `instance_id`; `kind` (`source_update`/`baseline_unreachable`/`import`); `from_commit`; `to_commit`; `status`; `created_at`; `decided_by`; `decided_at` |
| `system_review_items` | `id`; `review_id`; `kind` (§6.1, plus `signal_mismatch` from §9.3); `link_id`; `row_ids`; `end` (`a`/`b`); `expected` (JSONB); `observed` (JSONB); `candidates` (JSONB); `decision`; `decision_payload` |
| `system_audit_events` | `id`; `system_id`; `at`; `actor` (session identity, or `system:detection`); `kind` (§10); `payload` (JSONB). Append-only |
| `system_snapshots` | `id`; `system_id`; `name` (unique per system); `note`; `created_by`; `created_at`; `document` (JSONB, frozen §8.1 body); `digest`; `open_review_count`; `renderer_version` |
| `system_layouts` | `system_id`; `positions` (JSONB); `updated_at`. Not versioned |
| `system_interface_artifacts` | `(project_id, commit, extractor_version)`; `digest`; `payload` (JSONB); `created_at` |
| `system_source_checks` | `instance_id`; `last_checked_commit`; `last_outcome`; `checked_at` |

### 5.1 Deletion

- Deleting a child project leaves its instances in place, with `resolution =
  unresolved`. Their baselines, links, rows and snapshots survive.
- Deleting a system deletes its own rows only.
- An instance cannot be deleted while it is an endpoint of a link (409),
  unless the request passes `?cascade=links`.

## 6. Drift

### 6.1 Evaluation

The drift engine is a pure function:

```text
evaluate(links, rows, instance_id, candidate_interface) -> Outcome
```

The engine reads only the **stored** port and row baselines and the candidate
interface. It never needs the old commit's interface, which is what lets a
rebase from an unreachable baseline (§10.1) evaluate normally.

For each link end on the instance, it resolves the port in the candidate
(§2.3), then checks each row's pin on that end. The item kinds below are
listed in precedence order. A link end yields at most one connector-level
item (`connector_missing` or `connector_changed`), and an end that has one
yields no row-level items; its rows are listed on the connector-level item:

| Item kind | Condition | Rows affected |
|---|---|---|
| `connector_missing` | The port does not resolve and the rebind rule (§6.4) does not apply | All rows on that end |
| `connector_changed` | The port resolves but `libId` or `footprint` differs from the port baseline | All rows on that end |
| `pin_missing` | The pad no longer exists on the resolved port | That row |
| `net_changed` | The sorted net set differs from the row's accepted `net_a`/`net_b` | That row |

Three changes are **silent**. They produce no review item and are recorded as
audit events when applied:

- The reference changed while the port resolved by key.
- The port resolved by key but its `portKey` changed (a unit was removed).
- A rebind succeeded under §6.4.

They are audited as `connector_relabelled` (reference changed, same
`portKey`) or `connector_rebound` (`portKey` changed, through `memberKeys` or
a rebind).

Items are ordered by link ID, then end, then pad number in natural order
(`"2"` before `"10"`). Unannotated components (§2.3) never resolve a port,
by key or by rebind.

### 6.2 Outcome

- **No items**: the instance **auto-advances**. `baseline_commit` becomes the
  candidate, silent changes are applied (the port baseline `reference`,
  `portKey` and `memberKeys` are updated), and a `baseline_auto_advanced`
  audit event is written.
- **Any items**: one `source_update` review is opened for `(instance,
  from = baseline_commit, to = candidate)`, holding every item. The baseline
  does not move.

### 6.3 Auto-advance equivalence

For every link end on the instance, auto-advance requires the port to resolve
by key or by rebind, with `connectedInterfaceDigest` over that end's connected
pads in the candidate equal to the same digest computed from the stored port
and row baselines. Refdes-only changes are tolerated.

That equivalence is exactly "no items" in §6.1. The digest is the check the
implementation asserts, and SYS-05 tests the two against each other.

### 6.4 Rebind

When a baseline port does not resolve by key, look for candidates among the
candidate interface's components that are not already bound to a different
link end of the same instance. "Bound" means resolved by key for any link end
of the instance.

**Auto-rebind** applies only when **exactly one** candidate meets all of
these, and it is then a silent change:

- its `reference` equals the port baseline `reference`;
- its `libId` equals the port baseline `libId`;
- its pin count (distinct pads) equals the port baseline `pinCount`;
- for every connected pad on that end, the pad exists and its net set equals
  the row's accepted set.

**Otherwise** a `connector_missing` item is raised, carrying up to five
ranked `candidates`. A component is listed only when at least one of its
reference, `libId` or pin count equals the port baseline's. They are sorted by these keys in order, all descending:

1. reference equal (1/0)
2. libId equal (1/0)
3. pin count equal (1/0)
4. the fraction of connected pads whose net set is equal (1.0 when the end
   has no rows)
5. then `portKey` ascending, as a stable tiebreak

### 6.5 Superseding

A review stays open until all its items are decided. If detection finds a
newer candidate for an instance with an open `source_update` review:

- the open review becomes `superseded` (decisions already taken on it are
  discarded, since they were against the older candidate);
- a new review is evaluated from the **same baseline** to the newer
  candidate.

A superseded review stays readable in history.

## 7. Reviews, validation and warnings

### 7.1 Decisions

| Decision | Allowed on | Effect when the review is applied |
|---|---|---|
| `accept` | `net_changed`, `connector_changed` | `net_changed`: the row's accepted net set takes the observed value. `connector_changed`: the port baseline and every affected row's net baseline take the observed values; refused with 409 if any affected row's pad no longer exists (remap or remove those rows first) |
| `remap` | `net_changed`, `pin_missing` | The row's pin on that end becomes `payload.pad` (it must exist on the resolved port and not create a duplicate row); its net baseline takes the observation |
| `bind_candidate` | `connector_missing` | The link end rebinds to `payload.portKey` from the item's candidates; each row's pin is kept by pad number, which must exist; net baselines take observations |
| `remove_rows` | any row-level item | The affected rows are deleted |
| `keep_pinned` | the **whole review** | The review closes as `kept_pinned`; the instance gets `pinned = true`; the baseline is unchanged |

The review is **applied atomically** when its last item is decided: the
baseline becomes `to_commit`, every decision is written, and each is recorded
as an audit event. Until then, decisions are stored on the items and can be
changed.

Every decision request carries the review ID, the item ID and the system
ETag. The server never re-evaluates the candidate commit while applying (§1
invariant 5).

**Implementation rules (v1.4).**

- A decision is checked when it is recorded and again when the review
  applies, against the review's candidate interface (the cached artifact at
  `to_commit`) and the item's stored `candidates`.
- `bind_candidate` needs `payload.portKey` from the item's candidates, and
  every affected row's pad must exist on it (409 otherwise). `remap` needs
  `payload.pad` on the resolved port (422 otherwise); a remap that would
  duplicate a row is 409.
- Applying a review, in order: its `pending_changes` port updates and silent
  audits, then each decision in item order, then the baseline moves to
  `to_commit` (audited as `review_applied`). Items whose link was deleted
  meanwhile are skipped.
- A `source_update` review records `pending_changes.basis`, a digest of every
  link end on its instance: the port baseline and each row's id, both pads and
  that end's accepted net. If a decision arrives after links or rows on the
  instance changed, the review no longer describes the system: nothing is
  recorded, the review is superseded by a fresh evaluation of the same
  `to_commit` (which may auto-advance), and the call returns 409
  `review_stale`. A row added or repointed mid-review is therefore reviewed,
  never carried onto the new baseline with the old commit's net.
- Only an `open` `source_update` review takes decisions or `keep-pinned`;
  anything else is 409.
- `POST …/rebase` accepts a SHA or an unambiguous prefix. It returns 409 at
  the current baseline and 202 while the commit's interface is extracted.
  Otherwise it applies §6.2 immediately, audited as `baseline_rebased`: an
  open `source_update` review is superseded, and an open
  `baseline_unreachable` review is closed.

### 7.2 Structural validation

Findings are computed on demand over the live state at the current
baselines. They are deterministic and sorted by `(severity, rule, link_id,
row_id)`. A rule that cannot run reports `not_evaluated` with a reason; it
never reports as passing.

| Rule | Severity | Condition |
|---|---|---|
| `SYS-V01 row_duplicate` | error | Two rows with the same `(link, pin_a, pin_b)`. This is prevented on write; the rule catches imported legacy data |
| `SYS-V02 pin_fanout` | warning | The same `(instance, port, pin)` appears in rows of two or more links, unless every such link carries the same non-null `harness` label |
| `SYS-V03 port_not_exposed` | error | A link end references a port that is not exposed at the current baseline |
| `SYS-V04 pin_absent` | error | A row pin does not exist on its port at the current baseline |
| `SYS-V05 source_unavailable` | error | The baseline commit cannot be read, or the project is unresolved |
| `SYS-V06 pcb_out_of_sync` | warning | On a connected pin, `pcbNets` differs from `nets`. It is `not_evaluated` when `hasPcb` is false |
| `SYS-V07 pin_net_ambiguous` | warning | A connected logical pin carries more than one schematic net |
| `SYS-V08 open_review` | info | The instance has an open review |

**Report (v1.5).** `GET …/validation` returns `{findings, notEvaluated,
exempt, counts}` with the system `ETag`.

- A finding is `{rule, name, severity, instanceId, linkId, rowId, end,
  reference, pin, detail, redacted}`.
- `notEvaluated` lists `{rule, instanceId, reason}`. An instance whose
  baseline interface is not extracted yet gets SYS-V03, V04, V06 and V07
  there, never a pass.
- `exempt` lists harness-shared fan-out (`{rule, instanceId, portKey,
  reference, pin, links, harness}`).
- `counts` is `{error, warning, info, notEvaluated}`. It is also the
  document's `findingCounts`.
- SYS-V05 fires for an unresolved instance, and for a baseline whose last
  extraction job failed; its `detail.reason` is the job's error code.
- A finding on a restricted instance keeps its rule, IDs and severity, with
  `reference`, `pin` and `detail` set to `null` and `redacted: true`.

### 7.3 PCB out of sync

`pcb_out_of_sync` is a warning, never drift. It does not block
auto-advance, does not open reviews, and is re-evaluated at each baseline.

## 8. HTTP API

All routes are under `/api/systems`. Router: `backend/app/api/systems.py`.

**Roles.** `viewer` and `qa` can read. `designer` and `admin` can mutate.

**Concurrency.** Every engineering mutation requires
`If-Match: "sys:<system_id>:<version>"`. A missing header returns **428**. A
stale version returns **412** with the current ETag. Successful mutations
return the new `ETag`.

| Status | Meaning |
|---|---|
| 404 | Not found, or hidden from the caller. Non-disclosing |
| 409 | Semantic conflict or invalid transition |
| 422 | Schema or limit violation |
| 202 | Queued work, returning `{job_id, status}` for the existing jobs polling |

Error bodies never carry exception detail.

### 8.1 Resources

| Method and path | Purpose |
|---|---|
| `GET /api/systems` | List systems visible to the role (§8.2), with `openReviewCount`, `instanceCount` and `folderId` |
| `POST /api/systems` | Create `{name, description?, folderId?}` |
| `GET /api/systems/{id}` | The **system document**: system, instances (with resolved ports at baseline), links and rows (with observed values at baseline), finding counts and open review count. Sends an `ETag` |
| `PATCH /api/systems/{id}` | Rename, describe, or move folder |
| `DELETE /api/systems/{id}` | Delete the system |
| `POST …/{id}/instances` | Create `{projectId, label, baselineCommit?, trackedRef?, pinned}`. If `baselineCommit` is omitted, it is resolved from `trackedRef`'s current tip **once** |
| `PATCH …/instances/{iid}` | Update `label`, `pinned` or `trackedRef`. The baseline changes only through reviews or `POST …/rebase` |
| `DELETE …/instances/{iid}` | Remove, subject to §5.1 |
| `GET …/instances/{iid}/interface?commit=` | Interface facts plus exposure. Defaults to the baseline. Returns 202 while extraction is queued |
| `PUT …/instances/{iid}/ports/{portKey}/override` | `{state: "hidden"\|"promoted"\|null}`. `portKey` is URL-encoded |
| `POST …/instances/{iid}/check` | Run detection now. Returns 202 with a job |
| `POST …/instances/{iid}/rebase` | `{commit}`. Evaluates like detection, but targets an explicitly chosen commit (used to move a pinned instance); follows §6.2 |
| `POST …/links` | Create `{a: {instanceId, portKey}, b: {…}, name?, harness?}`. Port baselines are captured from current baselines. Both ends on the same port is 422. The same port pair may have several links with different `harness` labels |
| `PATCH …/links/{lid}` | Update `name` or `harness` |
| `DELETE …/links/{lid}` | Delete the link |
| `PUT …/links/{lid}/rows` | **Replace all rows atomically**. Takes `[{id?, pinA, pinB, signal, source}]`; net baselines are captured from current observations |
| `POST …/links/{lid}/generate` | `{generator, options?}` → proposed rows (§8.5). Writes nothing |
| `GET …/validation` | Findings (§7.2) |
| `GET …/reviews?status=` | Reviews with their items |
| `POST …/reviews/{rvid}/items/{itemid}/decision` | `{decision, payload?}`, subject to §7.1 |
| `POST …/reviews/{rvid}/keep-pinned` | Keep pinned (§7.1) |
| `GET …/history?cursor=` | Audit events, newest first |
| `POST …/snapshots` | Freeze `{name, note?}` |
| `GET …/snapshots` | List snapshots |
| `GET …/snapshots/{sid}` | Read a snapshot |
| `GET …/icd.csv` and `…/icd.html` | The live ICD (§9.4, §9.5) |
| `GET …/snapshots/{sid}/icd.csv` and `…/icd.html` | A snapshot's ICD |
| `GET …/snapshots/{sid}/diff?against=live\|<sid>` | Row-level diff, grouped by link |
| `POST …/imports` | Multipart CSV upload. Returns `{importId, columns, sampleRows, boardValues}` |
| `POST …/imports/{imid}/preview` | `{columnMap, boardMap, delimiter?}` → buckets (§9.3) |
| `POST …/imports/{imid}/commit` | Commits Matched rows and opens an `import` review for Needs review rows. Requires `If-Match` |
| `GET …/layout` and `PUT …/layout` | `{positions}`. No `If-Match`; last write wins |

Snapshot creation, imports, decisions, overrides and instance changes all
write audit events in the same transaction.

### 8.2 Visibility and redaction

A system inherits its folder's visibility, using the same predicate as
`workspace.get_project_for_role`. A hidden system is a 404.

**Default O1.** Inside a visible system, an instance whose project is hidden
from the caller's role is **restricted**:

- The instance renders with `restricted: true` and its system-owned `label`.
- `projectId`, commits, references, pin names and nets on its side of every
  row are replaced with `null` plus `redacted: true`, in documents, exports,
  snapshots and diffs alike. Snapshots are stored unredacted and redacted on
  read.
- Mutations that touch a restricted instance, or a link or row with a
  restricted end, return 404.

Adding an instance requires the caller to see the project, via the role-aware
lookup (`get_project_for_role_or_404`, or the same folder predicate in SQL).

Further rules (v1.1):

- An instance whose project has been **deleted** is `unresolved` and, below
  admin, restricted (v1.12): with its folder gone, nothing says who may read
  what the system kept of it. It carries `projectDeleted: true`, which
  survives redaction, and a designer may still remove it (the removal reveals
  nothing).
- Deleting a system that contains a board the caller cannot see is 409: it
  would destroy rows the caller cannot see. Cascading an instance removal
  (`?cascade=links`) onto a link whose other end is restricted is 404.
- `GET …/history` returns an event with `payload: null, redacted: true` when
  its payload names a restricted instance or a project hidden from the caller.
- A system's placement folder must be visible to the caller (422 otherwise).

### 8.3 Limits (default O4)

| Limit | Value |
|---|---|
| Instances per system | 50 |
| Rows per system | 5,000 |
| Links per system | 500 |
| CSV upload | 5 MB and 5,000 data rows |

Exceeding a limit returns 422 with the limit name.

### 8.4 Response shapes (SYS-04)

These are the shapes the frontend (SYS-12 onward) builds against. Fields are
camelCase. Timestamps are ISO-8601 strings.

**System summary** (list items, workspace listing, `system` in the document):
`{id, kind: "system", name, description, folderId, version, etag,
instanceCount, openReviewCount, createdBy, createdAt, updatedAt}`. P2 adds `subsystemCount` and
`moduleCount`; `instanceCount` then counts boards only (SB2-66: a module is no longer counted as a subsystem).

**Workspace.** `GET /api/workspace/bootstrap` and
`GET /api/folders/contents` gain `systems`: the summaries visible to the
caller (for folder contents, only that folder's). Every system mutation also
moves the workspace bootstrap version (migration 27).

**System document** (`GET /api/systems/{id}`):

```json
{
  "system": {"…summary…"},
  "instances": [{
    "id": "sin_…", "label": "OBC-A", "restricted": false,
    "projectId": "prj_…", "projectName": "mini_obc",
    "baselineCommit": "<40-hex>", "trackedRef": "main", "pinned": false,
    "resolution": "resolved", "tipCommit": null, "tipCheckedAt": null,
    "updateAvailable": false,
    "interface": {"status": "ready|pending|failed", "digest": "sha256:…",
                  "hasPcb": true, "jobId": null, "errorCode": null},
    "ports": [{"portKey": "…", "memberKeys": ["…"], "reference": "J7",
               "libId": "…", "footprint": "…", "value": "…", "dnp": false,
               "candidate": true, "candidateReason": "refdes",
               "override": null, "exposed": true, "pinCount": 20}]
  }],
  "links": [{
    "id": "slk_…", "name": "", "harness": null, "updatedAt": "…",
    "a": {"instanceId": "sin_…", "redacted": false,
          "port": {"portKey": "…", "memberKeys": ["…"], "reference": "J7",
                   "libId": "…", "footprint": "…", "pinCount": 20},
          "resolved": true, "exposed": true},
    "b": {"…": "…"},
    "rows": [{"id": "srw_…", "pinA": "3", "pinB": "3", "signal": "SPI_SCK",
              "source": "manual", "netA": ["/Payload IF/SPI_SCK"], "netB": ["/SCK_IN"],
              "observedA": {"present": true, "nets": ["…"], "pcbNets": ["…"],
                            "pinNames": ["…"], "pinTypes": ["…"]},
              "observedB": {"…": "…"},
              "redacted": false, "redactedEnds": []}]
  }],
  "openReviewCount": 0,
  "findingCounts": null
}
```

- `ports` lists the exposed ports plus any port with an override; it is
  `null` until the interface is `ready`. `GET …/interface` returns every
  component, each with `override` and `exposed`, plus `instanceId` and
  `atBaseline`.
- `interface.status` is `pending` while extraction is queued or running,
  and `failed` with an `errorCode` (never the job's message) when the last
  job failed. Reading the document requests extraction only when no job
  exists; `GET …/interface` requests it again.
- `resolved`, `exposed` and `observed*` are `null` while that end's interface
  is not ready. `observed*.present` is false when the pad no longer exists
  at the baseline.
- A restricted instance keeps `id`, `label`, `pinned` and `resolution`; every
  other field is `null` and `redacted` is true. A link end on it has
  `port: null, redacted: true`, and each row nulls `pin`, `net` and
  `observed` on that side and lists the side in `redactedEnds`.
- `findingCounts` stays `null` (not evaluated) until SYS-08.

**Mutation responses.** Each returns the new `ETag` header.

| Call | Status | Body |
|---|---|---|
| `POST /api/systems` | 201 | summary |
| `PATCH /api/systems/{id}` | 200 | summary |
| `DELETE /api/systems/{id}` | 204 | none |
| `POST …/instances` | 201 | `{id, label, projectId, baselineCommit, trackedRef, pinned, resolution, tipCommit, tipCheckedAt}` |
| `PATCH …/instances/{iid}` | 200 | as above. Changing `trackedRef` clears `tipCommit` |
| `DELETE …/instances/{iid}` | 204 | none |
| `PUT …/ports/{portKey}/override` | 200 | the port, as in `ports` |
| `POST …/links` | 201 | the link, as in the document |
| `PATCH …/links/{lid}` | 200 | the link |
| `DELETE …/links/{lid}` | 204 | none |
| `PUT …/links/{lid}/rows` | 200 | the link |
| `PUT …/layout` | 200 | `{positions}`; no ETag |

**Reviews.** `GET …/reviews?status=` returns, newest first,
`{id, kind, status, instanceId, createdAt, decidedBy, decidedAt, redacted,
fromCommit, toCommit, pendingChanges, items}`. Each item is
`{id, ordinal, kind, linkId, end, rowIds, pins, expected, observed,
candidates, decision, decisionPayload}`, where `pins` are the affected rows'
pads on that end. A review of a restricted instance has `redacted: true`,
and its commits, `pendingChanges` and `items` are `null`. A decision
(`POST …/decision`, `{decision, payload?}`) and `keep-pinned` return the
review with the new `ETag`. `POST …/rebase` returns
`{outcome: "auto_advanced"|"review_opened", reviewId, instance}` or 202.

`GET …/history?cursor=&limit=` returns `{events: [{seq, id, at, actor, kind,
payload, redacted}], nextCursor}`; pass `nextCursor` back as `cursor`.

**Write rules.**

- `POST …/instances` needs `baselineCommit` or `trackedRef`. A baseline may
  be an unambiguous SHA prefix; it is expanded. An unknown ref or commit is
  422. A `trackedRef` is resolved against `origin/<ref>`, then the local
  branch.
- Creating a link, setting an override or replacing rows needs the
  instance's interface at its baseline. If it is not ready, the request is
  409 with detail starting `interface_not_ready`.
- A link end must name a component at the baseline (422 otherwise) that is
  exposed (409 otherwise).
- Every row pad must exist on its port at the baseline (422). Net baselines
  are taken from that observation. A row `id` that is not in the link is 409.
- An override's `portKey` must be a component of the board at its baseline
  (422).
- A malformed `If-Match`, or one naming another system, is 412.

### 8.5 Mapping generators (v1.8)

`POST …/links/{lid}/generate` proposes rows between the link's two ports at
their baselines. It is read-only, and any role that can see the link may call
it. The client applies proposals through `PUT …/links/{lid}/rows` with
`source = generator`, where they are validated like any other row.

| Generator | Pairs |
|---|---|
| `identity` | Each A pad with the B pad of the same name |
| `reverse` | A pads in natural order with B pads in reverse natural order, up to the shorter side |
| `offset` | `{offset}` (an integer within ±10000): each numeric A pad `n` with B pad `n + offset` |
| `net_name` | Each A pad with the first unused B pad whose net leaf (text after the last `/`) equals one of its net leaves, case-insensitively |

- `options.rangeA` and `options.rangeB` (`{from?, to?}`, inclusive, in
  natural pad order) limit either side. A bound that is not a pad is 422.
- Generators **never overwrite**. A pair touching a pad that a row of the
  link already uses is skipped with `reason: "existing"`. A pair whose pads
  both have no net is skipped with `reason: "unconnected"`, unless
  `options.includeUnconnected` is true.
- The response is `{linkId, generator, rows, skipped}`. Each row is
  `{pinA, pinB, signal, source, netA, netB, pinNamesA, pinNamesB}`, where
  `signal` defaults to the A net's leaf, or else the B net's.
- A link end that no longer resolves at its baseline is 409; a restricted
  link is 404.

## 9. Snapshots, CSV and ICD

### 9.1 Snapshot

A snapshot freezes the full, unredacted system document (§8.1 body) plus
every instance's baseline and project identity. Its digest is `sha256` over
the canonical document.

- `open_review_count` is recorded at creation.
- Snapshots are immutable; there is no update or delete in P1.
- The ICD is rendered from the frozen document on read, and
  `renderer_version` is stamped on it.

**Implementation rules (v1.6).**

- `POST …/snapshots` requires `If-Match` and freezes exactly that version. It
  writes `snapshot_created` but does **not** bump the version: a snapshot
  changes no engineering state, so it must not invalidate other editors'
  ETags. It returns 201 with the snapshot metadata and the unchanged ETag. A
  duplicate name (after trimming) is 409.
- The document is built from one consistent read of that version without
  holding the system lock (v1.13); the snapshot is then stored under the lock
  only if the version has not moved, otherwise 412 with the current ETag.
- The frozen document is the §8.1 body plus `validation` (the full §7.2
  report) and `reviewRowIds` (the sorted row IDs named by open review items),
  serialized to JSON. `digest` is `sha256` over its canonical form, like §3.
- `GET …/snapshots` lists metadata only (`id`, `name`, `note`, `createdBy`,
  `createdAt`, `digest`, `openReviewCount`, `rendererVersion`), newest first.
  `GET …/snapshots/{sid}` adds `document`.
- Redaction on read uses the reader's access **today** to each project the
  frozen document names, so an instance removed since the snapshot is still
  redacted if its project is hidden.
- Diffs (`…/diff?against=live|<sid>`) redact both sides with the **union** of
  their restricted instances, so a comparison cannot reveal a hidden side by
  difference. The body is `{snapshotId, against, boards, links}`:
  - `boards` lists instances `added`, `removed` or `rebased` (baseline commit
    changed), with `before` and `after` commits;
  - `links` lists links `added`, `removed` or `changed`. Each has
    `rows: {added, removed, changed}`, and a changed row carries `before` and
    `after` of `pinA`, `pinB`, `signal`, `netA` and `netB`. A rename or harness
    change alone marks a link `changed`.
- ICD CSV is served as an attachment, `text/csv`. ICD HTML is served inline
  with `Content-Security-Policy: default-src 'none'; style-src
  'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none';
  frame-ancestors 'self'`. Both carry `nosniff` and `Cache-Control:
  no-store`. The live ICD carries the system ETag; a snapshot ICD does not.
- CSV `status` is `error` when an error finding names the row (SYS-V01,
  SYS-V04) or the link's end (SYS-V03); otherwise `review` when an open review
  item names the row; otherwise `ok`. `*_net` falls back to the accepted net
  baseline when there is no current observation. Restricted ends are empty.

### 9.2 CSV columns (export and import)

Export columns, in this order:

```text
row_id,link_id,link_name,harness,signal,
a_board,a_connector,a_pin,a_pin_name,a_net,
b_board,b_connector,b_pin,b_pin_name,b_net,
status,a_commit,b_commit
```

Encoding and values:

- UTF-8, RFC 4180 quoting, header row, `,` delimiter.
- `*_board` is the instance label, and `*_connector` is the current reference.
- `*_net` is the observed net set joined with `|`.
- `status` is `ok`, `review` or `error`, from findings and open items.
- Rows are ordered by `link_name`, then `link_id`, then `pin_a` in natural
  order.

### 9.3 Import

The column map assigns uploaded columns to the targets `from_board`,
`from_connector`, `from_pin`, `signal`, `to_board`, `to_connector`, `to_pin`,
`harness`, `link_name` and `row_id`. The six endpoint targets are required.
The board map assigns every distinct board value to an instance ID, or to
`skip`.

Rows are resolved against each instance's **baseline** interface. A
connector is resolved by `reference` among exposed or promotable components;
unannotated references do not resolve. A pin is resolved by exact pad string.

| Bucket | Condition |
|---|---|
| **Unresolved** | The board is `skip` or unmapped, or the connector or pin is not found |
| **Conflict** | The row duplicates another uploaded row or an existing row, or `row_id` names a row in another link |
| **Matched** | Resolved, and `signal` is empty or equals, case-insensitively, the **leaf** (the text after the last `/`) of any net on either endpoint |
| **Needs review** | Resolved but not Matched |

Buckets are evaluated in the order above, and the first match wins.

On commit:

- Rows are grouped into links by the **unordered** port pair plus `harness`.
  An existing link with the same pair and harness is reused; otherwise a new
  one is created, named `link_name` or `<a_board>/<a_ref> ↔ <b_board>/<b_ref>`.
- Matched rows are created with `source = import`. An empty signal defaults
  to the leaf of the A-side net.
- Needs review rows are placed in one `import` review, with item kind
  `signal_mismatch`, whose decisions are `accept` (create the row) or
  `remove_rows` (drop it).
- Unresolved and Conflict rows are returned in the commit report and are not
  persisted.
- A `row_id` that matches an existing row in the same link **updates** that
  row. Re-importing an export into its own system is therefore idempotent.

**Implementation rules (v1.7).**

- **Upload** (`POST …/imports`, multipart `file`, optional `delimiter`):
  - The file must be UTF-8 (a BOM is allowed), at most 5 MB and 5000 data
    rows. Blank lines are skipped.
  - The delimiter is sniffed from the header (`,` `;` tab `|`) unless given.
  - The response is `{importId, filename, delimiter, rowCount, columns,
    sampleRows, suggestedColumnMap, boardValues}`. `boardValues` maps every
    column with at most 100 distinct values to those values, so the wizard can
    offer board values for whichever columns get mapped. `suggestedColumnMap`
    recognises the §9.2 export columns.
- **Sessions** (`sim_`, migration 29) keep the decoded upload. A session can
  be committed once (a second commit is 409). Uncommitted sessions older than
  seven days are pruned on the next upload to that system.
- **Maps.** Preview and commit take the same body, `{columnMap, boardMap,
  delimiter?}`. An unknown target, a missing endpoint target, a column not in
  the upload, or a board map naming an instance outside the system is 422. A
  board map naming a **restricted** instance is 404.
- **Resolution details.**
  - A connector reference naming more than one component is Unresolved
    (`connector_ambiguous`).
  - An endpoint with an empty board, connector or pin is Unresolved
    (`missing_value`).
  - An instance whose baseline interface is still extracting is Unresolved
    (`interface_not_ready`).
  - "Promotable" means any annotated component. Committing a row onto a port
    that is not exposed sets its override to `promoted` (audited as
    `port_override_set`).
- **Conflict reasons,** in evaluation order:
  - `same_port`: both ends are the same port;
  - `row_in_other_link`;
  - `pin_pair_taken`: an update would move onto another row's pins;
  - `duplicate_existing`: a new row repeats an existing row;
  - `duplicate_upload`: a later uploaded row repeats an earlier one, in
    either orientation.

  A `row_id` that names no row in the system is ignored, and the row is
  created.
- **Preview** returns `{importId, committed, counts, matched, needsReview,
  unresolved, conflict}`. Each entry is `{line, values, reason, from, to,
  signal, harness, linkName, linkId, rowId, action}`, where `action` is
  `create` or `update` and `from`/`to` carry the resolved instance, reference,
  portKey, port baseline, `exposed`, pin, `pinNames` and nets.
- **Commit** requires `If-Match`, re-classifies under the lock, writes Matched
  rows, opens the `import` review, and audits `import_committed`. It returns
  `{importId, created, updated, unchanged, linksCreated, reviewId, counts,
  unresolved, conflict}`.
  - An update that changes neither pins nor signal is `unchanged`: the row
    keeps its `source` and no `rows_replaced` is written. This is what makes a
    re-import idempotent.
  - A created link is oriented from the first row that creates it (A =
    `from`).
- **Import review items.** Each item stores the proposal in `observed` and
  `{leaves}` in `expected`. `rowIds` names the updated row, if any.
  - `accept` may carry `{signal}` to rename the signal.
  - When the last item is decided, the accepted proposals are written, as at
    commit, against the **current** baselines: a pad that has since
    disappeared is 409. The review becomes `applied`.
  - Items touching a restricted board are redacted, and deciding them is 404.

### 9.4 ICD CSV

The ICD CSV is the export format in §9.2.

### 9.5 ICD HTML

The printable HTML ICD contains, in order:

1. A title block: system name, snapshot name or "live", generation time,
   renderer version.
2. An instance table: label, project, baseline commit (short and full),
   tracked branch, pinned.
3. A connector-level block diagram as inline SVG, drawn with the default
   layout the canvas also uses (v1.11): the most-connected board in the
   middle, each board listing only its linked connectors with what they
   connect to, rows ordered by their partner, and one orthogonal lane per
   wire. A saved canvas arrangement is not used; it is not engineering state.
4. One table per link: pins, signal, pin names, nets, harness.
5. Findings.

When `open_review_count > 0`, every page carries a banner saying the document
contains that many unreviewed changes. Printing to PDF from the browser is the
P1 PDF path.

## 10. Detection and audit

### 10.1 Detection

`project_import_service.sync_project` already fetches for every due
repository. After a successful fetch, it enqueues **one** `system_source_check`
job for that repository, and **only if** some instance with a `tracked_ref`
references a project in it.

The job, for each such instance:

1. Resolve `origin/<tracked_ref>` in the server clone to `tip`. If the ref is
   missing, record `tip_commit = null` and `last_outcome = ref_missing`, and
   raise no review.
2. Store `tip_commit`. If `tip == last_checked_commit` or `tip ==
   baseline_commit`, stop.
3. If `pinned`, record `update_available` and stop: no extraction, no review.
4. Otherwise obtain the candidate interface (extract or use the cache), then
   evaluate (§6) and apply the outcome (§6.2, §6.5).
5. Record `last_checked_commit = tip`. After `extraction_failed` or
   `engine_error` it is cleared instead, so the next check retries the tip
   (v1.12). Unpinning an instance clears it too, and queues a check, so the
   tip a pinned check only reported is evaluated.

**Idempotency.** Re-running a check for the same tip changes nothing.

**Implementation rules (v1.3).**

- `last_outcome` is one of `ref_missing`, `at_baseline`, `update_available`,
  `baseline_unreachable`, `auto_advanced`, `review_opened`, `review_current`,
  `extraction_failed`, `project_missing`, `source_unavailable` or
  `engine_error`. Recording an outcome never bumps the system version.
- Evaluation and its application run under the system lock, against the rows
  and baselines current at that moment.
- A `source_update` review stores its silent changes and port updates in
  `system_reviews.pending_changes` (migration 28). They take effect only
  when the review is applied. A decision re-evaluates only when the review's
  `basis` no longer matches (§7.1, v1.12).
- An open review whose `to_commit` is already the tip is left alone
  (`review_current`). An open `baseline_unreachable` review stops evaluation
  until a rebase or removal. Opening one supersedes an open `source_update`
  review.
- `POST …/check` re-checks one tracked instance even when its tip was already
  seen (409 for an untracked instance). A repository check that is queued or
  running absorbs further fetches; the next fetch after it finishes picks up
  anything it missed.

**Baseline unreachable (default O3).** If the baseline commit cannot be read,
the instance becomes `unresolved` and a `baseline_unreachable` review is
opened. It has no items and no auto-advance. It closes only when the instance
is rebased onto a readable commit (`POST …/rebase`, which then evaluates
normally from the last accepted row baselines) or removed.

**Extraction cost (default O2).** The extractor reads the schematic in full
and the board only for pad nets of components with pins. The cache makes
repeat reads free, and instances of the same project share one extraction.
Measured in SYS-19 on an Apple-silicon laptop, cold, one process:

| Board | Components | Ports | Extraction |
|---|---|---|---|
| JTYU OBC | 975 | 16 | 20.6 s |
| JTYU CMBD | 2,440 | 40 | 39.1 s |

Peak resident memory for both in one process was about 2.7 GB. A push that
changes a tracked board is reported, fetch to review or auto-advance, in about
30 s, almost all of it extraction. The O2 default stands.

### 10.2 Audit event kinds

`system_created`, `system_updated`, `instance_added`, `instance_updated`,
`instance_removed`, `port_override_set`, `link_created`, `link_updated`,
`link_deleted`, `rows_replaced`, `baseline_auto_advanced`,
`connector_relabelled`, `connector_rebound`, `review_opened`,
`review_superseded`, `review_item_decided`, `review_applied`,
`review_kept_pinned`, `baseline_rebased`, `import_committed`,
`snapshot_created`.

The payload carries the before and after of the fields that changed. `actor`
comes from the session, or is `system:detection` for detection jobs.

## 11. Fixture acceptance matrix

These are the synthetic KiCad 10.0.6 boards `mini_obc`, `mini_payload` and
`mini_power` from SYS-01 (`backend/tests/fixtures/system_builder/`). The
fixture system has four instances: `OBC-A` (tracking), `OBC-B` (the same
project, pinned), `PAY` and `PWR`. It has five links, among them `L-J7J4`
(OBC-A/J7 ↔ PAY/J4, 18 rows) and `L-J2J1` (OBC-A/J2 ↔ PWR/J1). Each step is
F0 plus one change. The machine-readable expectations are in
`expected/steps.json`.

| Step | Commit change | Expected outcome |
|---|---|---|
| F0 | Baseline | No errors or warnings. `SYS-V06` is not evaluated for `PAY` (no PCB). Fan-out on PWR/J3.3 is exempt (shared harness `WH-001`) |
| F1 | `J7.17` no-connected | Review: `net_changed` `["PAYLOAD_RESET#"] → []` |
| F2 | J2 re-annotated to J12, UUID kept | Auto-advance; `connector_relabelled` |
| F3 | J7 replaced by a new symbol (same reference, lib and nets) | Auto-rebind; `connector_rebound`; auto-advance |
| F4 | J7 `lib_id` and footprint 2×10 → 2×12 | Review: `connector_changed` |
| F5 | Sheet "Payload IF" renamed | Review: 12 `net_changed` items, one per row on a sheet-local net |
| F6 | README only | Auto-advance; interface `digest` unchanged |
| F7 | Net change on J7.19, which no row uses | Auto-advance |
| F8 | J7.18 schematic net changed, PCB not updated | Review `net_changed`; after accept, `SYS-V06 pcb_out_of_sync` |
| F9 | J2 deleted; J5 and J6 remain | Review: `connector_missing` with candidates J6 (net overlap 0.75), then J5 (0.5) |
| F10 | `mini_power` J3 unit A deleted, unit B kept | Resolves through `memberKeys`; `portKey` moves to unit B; auto-advance |
| F11 | F1, then J7.3 renamed | The first review is `superseded`; the second is evaluated from F0 with two items |
| F12 | Tip F1 seen by both OBC instances | `OBC-A` gets a review; pinned `OBC-B` records `update_available` only |

## 12. Revision log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-27 | Initial freeze (SYS-00). Adopts plan decisions D1–D18 and defaults O1–O4. |
| 1.0 (pre-merge) | 2026-09-27 | Before the first merge: link ends store `memberKeys` and resolve by intersection, so a deleted unit no longer breaks a multi-unit port (§2.3, §5, §6). §11 aligned with the SYS-01 fixture boards. |
| 1.0 (pre-merge) | 2026-09-27 | §3: `digest` also omits `projectId` and `commit`; otherwise two commits could never share a digest as §3 requires (found in SYS-02). |
| 1.0 (pre-merge) | 2026-09-27 | Review of #407: `connectedInterfaceDigest` removed from the §3 example (never stored); `#` references excluded; §4.1 field matching defined; a connector-level item suppresses row items on its end (§6.1); rebind listing criteria defined (§6.4); `accept` on `connector_changed` refreshes row net baselines and refuses vanished pads (§7.1). |
| 1.1 | 2026-09-27 | SYS-04: response shapes and write rules (§8.4); deleted projects are unresolved, not restricted; restricted-board rules for system deletion, cascades and history (§8.2). No drift rule changed, so no fixture step needs re-running. |
| 1.2 | 2026-09-29 | SYS-05: §6 fixes what the rules left open — the audit kind of each silent change, item order, unannotated parts never resolving a port, "bound" meaning resolved by key, and `netOverlap` 1.0 for an end with no rows. No rule changed; every §11 step re-ran and still matches. |
| 1.3 | 2026-09-29 | SYS-06: detection implementation rules in §10.1 (outcome vocabulary, locking, `pending_changes` on reviews via migration 28, current and unreachable reviews, check now). No drift rule changed. |
| 1.4 | 2026-09-29 | SYS-07: decision validation and application order (§7.1), rebase behaviour, and the review response shape (§8.4). No drift rule changed. |
| 1.5 | 2026-09-29 | SYS-08: the validation report shape, not-evaluated and SYS-V05 sources, and finding redaction (§7.2). The F0 and F8 findings goldens pass. |
| 1.6 | 2026-09-29 | SYS-09: snapshot, ICD and diff implementation rules (§9.1). Creating a snapshot does not bump the version. No drift rule changed. |
| 1.7 | 2026-09-29 | SYS-10: CSV import implementation rules (§9.3): upload limits, sessions (migration 29), map validation, conflict reasons, promotion on commit, unchanged updates, and import review items. No drift rule changed. |
| 1.8 | 2026-09-29 | SYS-11: mapping generators and the read-only generate endpoint (§8.5). No drift rule changed. |
| 1.9 | 2026-09-30 | SYS-19 JTYU acceptance: `TestPoint*` symbols no longer match the library rule (§4.1); extractor version 2, so cached artifacts are re-extracted on first read. O2 measurements recorded (§10.1). §8.3 CSV row limit corrected to the enforced 5,000. Every §11 step re-ran and still matches. |
| 1.10 | 2026-09-30 | Polish: the reference-prefix rule (§4.1) is `J` only; extractor version 3. Every §11 step re-ran and still matches. |
| 1.11 | 2026-09-30 | Polish: the ICD block diagram uses the shared default layout (§9.5); renderer version 2. No drift rule changed. |
| 1.12 | 2026-09-30 | Review pass. Reviews record a `basis` and a decision on a stale review re-evaluates it (§7.1, 409 `review_stale`). A deleted project is restricted below admin (§8.2). Unpinning, or a failed extraction or engine error, leaves the tip to be evaluated again (§10.1). Extraction reads the schematic and board that `.prism.json` configures at the commit; extractor version 4. `PUT …/rows` rejects a repeated row id (422), and `rows_replaced` records each added, removed and changed row. |
| 1.13 | 2026-10-09 | SB2-94: a snapshot is built outside the system lock from one consistent read and stored only if the version has not moved (412 otherwise) (§9.1). Export create/update build their response after the change commits. |
