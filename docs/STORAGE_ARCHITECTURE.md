# Storage architecture: how the server and the client share a repository

Decided: **support both models, on one mechanism.** They are not opposites. They differ in
exactly one thing, *who hosts the git origin*, and everything else can be common.

Locking / check-in-check-out is **out of scope** and expected to stay out of scope for a
long time. That is what makes this tractable: without arbitration, the server does not
need to own the truth, so it does not need to own the remote.

---

## Where we are today, and why it cannot stand

The agent maps a local checkout to a Prism project by **comparing filesystem paths**:

```python
# prism_client.find_project_by_path
rows = GET /api/projects
for row in rows:
    if normalise(row["path"]) == normalise(local_path):
        return row
```

That works only because the server and the client are the same machine. Move the server
one hop and `row["path"]` is a *server-side* path that can never equal a local one.

The stored data confirms it. One live install currently holds three different models at
once:

| project | `path` | `repo_url` | what it actually is |
|---|---|---|---|
| satnogs | `data/projects/type1/satnogs...` | `https://gitlab.com/...` | server-owned clone of an upstream |
| test board | `data/projects/../../../test board` | `C:\...\test board` | server operating **directly on the user's working tree** |
| C100.03 | `D:\Documents\...` | same as path | referenced in place, off-workspace |

Two of those are a relative escape out of the server's workspace. They work by accident of
co-location, and a Prism server deployed anywhere else silently breaks for them.

**This is the thing to migrate away from.** Not because the models are wrong, but because
the *identity* is wrong: a path is not an identity.

---

## The one mechanism

Three pieces. All three are needed by both models, which is the point.

### 1. Identity lives in the repo

`.prism.json` gains a `project` block, committed:

```json
{
  "project": {
    "id": "prj_672e0edb9885",
    "server": "https://prism.example.com"
  },
  "paths": { ... }
}
```

Now **any checkout, on any machine, self-identifies**. The agent stops guessing from paths.
`prism://open/<id>` becomes a search for a marker, not a string comparison against a
server-side path.

`server` is a hint, not a constraint: the same repo may be registered on a staging server
and a production one, and the agent should not refuse to work because it found the "wrong"
one. Match on `id` first, use `server` only to disambiguate.

### 2. The agent knows where to look

A **projects root** setting (one or more directories). The agent indexes them, so
"do I have `prj_x`?" is a lookup, not a walk of the whole disk.

This is Option 2's "vault", made *soft*: a place to look, not a place you are forced to
put things. A user who keeps projects in three unrelated folders adds three roots.

Discovery is: check the index, then check the roots for a `.prism.json` with that id.
Nothing is enforced, nothing has to move.

### 3. The server records where the origin is, and stops pretending to own the tree

Each project stores, explicitly and without ambiguity:

```
origin_url      where git actually lives          (github.com/..., or Prism's own bare repo)
origin_owner    "external" | "prism"              which model this project is
workspace_path  the SERVER's clone, if it has one (server-local, never sent to clients)
```

`workspace_path` becomes **private to the server**. Clients never see it and never compare
against it. That single change kills the whole class of bug above.

---

## The two models, expressed on that mechanism

They now differ in `origin_owner` and nothing else.

### A. External origin (`origin_owner = "external"`)

Git lives where it already lives: GitHub, GitLab, a corporate server. Prism clones it and
polls. The client clones the **same upstream**, independently.

* No migration. This is the workflow people already have.
* Prism is a **viewer and a system of record for metadata**, not for git.
* Prism sees only what is pushed. Uncommitted local work is invisible to it, by design.
* If Prism is down, work continues.

`prism://open/<id>`: find the marker in a projects root; if absent, clone `origin_url`
into the primary root.

### B. Prism origin (`origin_owner = "prism"`)

Prism hosts a **bare** repo and is the origin. The client clones from Prism.

* Bare, so simultaneous users never pollute a shared working tree.
* Prism is now **infrastructure**: if it is down, nobody pushes.
* Suits orgs that do not already have enforced git hosting, or want one system.

`prism://open/<id>`: identical code path. `origin_url` simply points at Prism.

**The client does not need to know which model it is in.** It clones `origin_url`. That is
the whole point of unifying them.

### What we stop supporting

**"Reference a working tree in place"** (`local_path_mode = "reference"`, and the
relative-escape paths). It is not a third model, it is the absence of one: the server
mutating a directory that a user is also editing, with no coordination. It only ever
worked because they were the same machine.

Migration: re-register as A. The repo is already a git repo; give Prism its remote and let
it clone like anything else. If it has *no* remote, that is model B: Prism takes it as an
origin and the user re-clones from Prism.

---

## Every combination, covered

| origin | client has it? | what happens |
|---|---|---|
| external | yes, in a root | open it |
| external | yes, outside every root | found by marker anyway; offer to add its parent as a root |
| external | no | clone `origin_url` into the primary root |
| external | no, and no network | say so; do not half-clone |
| prism | yes | open it |
| prism | no | clone `origin_url` (which is Prism) |
| prism | no, Prism unreachable | say so |
| either | two checkouts with the same id | prefer the one under a root; if still ambiguous, ask |
| either | marker missing (older checkout) | match by `origin_url` as a fallback, then write the marker |
| either | marker present, project deleted server-side | say so; do not silently create |

The ambiguous cases are the interesting ones and none of them are hard. They only look hard
today because identity is inferred from a path.

---

## Plan

Ordered so nothing is broken mid-flight.

**Phase 1: identity.** Add `project.id` + `project.server` to `.prism.json`. Write it on
import and on clone. Backfill on next open for existing projects. Nothing depends on it yet.
*Reversible, no behaviour change.*

**Phase 2: the agent stops guessing.** Add the projects-root setting and the marker index.
`find_project_by_path` becomes `find_project_by_marker`, falling back to the old path match
so nothing regresses while the markers are still spreading.
*This is the fix for the same-machine assumption.*

**Phase 3: the server stops leaking its workspace.** Split `path` into private
`workspace_path` and public `origin_url` + `origin_owner`. Stop sending `path` to clients.
Migrate the existing rows: a relative-escape path becomes `origin_owner = "external"` with
`origin_url` = the tree's actual git remote.
*This is where the current model actually dies.*

**Phase 4: `prism://open/<id>`.** Now trivial: look up the marker, open KiCad; if absent,
confirm and clone `origin_url`. Both models, one path.

**Phase 5: Prism as origin (model B).** Bare repo hosting, `origin_owner = "prism"`, and a
create-project flow that produces one. Additive: model A keeps working untouched.

**Phase 6: retire "reference in place."** Once A and B are both real, this has no reason to
exist. Migrate, then delete the code.

Phases 1 to 4 are the ones that matter. 5 is a feature. 6 is cleanup.

---

## What we are deliberately NOT building

* **Locking / check-out.** Out of scope. If it ever comes in, it requires model B and a
  server that owns the truth, and it will be a real project. Nothing here forecloses it.
* **The server watching a user's working tree.** That is what "reference in place" was, and
  it is the thing being removed.
* **Guessing.** If we cannot identify a checkout, we say so and let the user point at it. A
  wrong guess about which repo you are looking at is worse than a question.
