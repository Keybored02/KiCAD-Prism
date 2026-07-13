# Storage architecture: how the server and the client share a repository

Decided: **support both models, on one mechanism.** They are not opposites. They differ in
exactly one thing, *who hosts the git origin*, and everything else can be common.

Locking / check-in-check-out is **out of scope** and expected to stay out of scope for a
long time. That is what makes this tractable: without arbitration, the server does not
need to own the truth, so it does not need to own the remote.

---

## Where we started, and why it could not stand

*(Phases 1 and 2 are now done, so the first half of this is history. It is kept because
the reasoning is what the rest of the plan rests on.)*

The agent mapped a local checkout to a Prism project by **comparing filesystem paths**:

```python
# prism_client.find_project_by_path, as it was
rows = GET /api/projects
for row in rows:
    if normalise(row["path"]) == normalise(local_path):
        return row
```

That works only because the server and the client are the same machine. Move the server
one hop and `row["path"]` is a *server-side* path that can never equal a local one.
The path match survives today only as a fallback for checkouts that predate the marker,
and phase 3 removes it by not sending `path` at all.

The stored data confirms it. One live install currently holds three different models at
once:

| project | `path` | `repo_url` | what it actually is |
|---|---|---|---|
| satnogs | `data/projects/type1/satnogs...` | `https://gitlab.com/...` | server-owned clone of an upstream |
| test board | `data/projects/../../../test board` | `C:\...\test board` | server operating **directly on the user's working tree** |
| C100.03 | `D:\Documents\...` | same as path | referenced in place, off-workspace |
| CIAA_ACC | `data/projects/../../../../../../Desktop/CIAA_ACC` | `C:\...\Desktop\CIAA_ACC` | referenced in place, and **not a git repo at all** |

Three of those are a relative escape out of the server's workspace. They work by accident
of co-location, and a Prism server deployed anywhere else silently breaks for them.

Note what `repo_url` holds for the bottom three: a **filesystem path, not a git remote**.
The column means two different things depending on how the project was imported, and a
client cannot tell which. That is the ambiguity phase 3 removes.

The migration resolved these by asking git. `test board` and `C100.03` turned out to have
real remotes after all (a NAS share), so both became `external`. CIAA_ACC has no `.git` at
all and became `none`.

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

**Only the server side is ever bare.** A client checkout is a normal working-tree
clone, always, in both models. KiCad opens files off the disk, so a bare clone would
be useless to it. Nothing is ever *converted* to bare either: when Prism adopts an
existing repo (see "Adopt a local project" below) it **creates a new bare repo and
pushes into it**. The user's working tree is left exactly as it was, and simply gains
a remote.

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

**Phase 2: the agent stops guessing.** Add the projects-root setting and the marker
search. `find_project_by_path` becomes `find_project`, which resolves by marker and falls
back to the old path match so nothing regresses while the markers are still spreading.
A new `/locate?id=` route answers "do I have this project, and where?" from the markers
alone, which is what `prism://open/<id>` will use.
*This is the fix for the same-machine assumption.*

One rule worth stating: when a checkout carries a marker naming a project the server does
not have, the answer is **no project**, not a path match. Falling back there could return
the *wrong* project, and a wrong answer about which board you are looking at is worse than
no answer.

**Phase 3: the server stops leaking its workspace.** `path` stays on the internal model
(thumbnails, diffs and path config all need a real directory) but is **excluded from
serialisation**, so it never leaves the process. Clients get `origin_url` + `origin_owner`
instead. The origin is derived by **asking git**, not by trusting the stored `url`: for a
cloned repo they agree, but for a local import `url` is the folder the user picked, which
is not a remote at all. That ambiguity was the bug.

The agent's path fallback dies with it, replaced by an **origin match**: ask git for the
checkout's `origin` and compare it to the project's `origin_url`. Also machine
independent, so it works for pre-marker projects without reintroducing co-location.

`origin_owner` has three values, not two:

| value | meaning |
|---|---|
| `external` | a remote we do not host: GitHub, GitLab, an SSH host, a NAS share |
| `prism` | a bare repo Prism hosts (phase 5) |
| `none` | **not backed by git at all.** Prism knows the project; git does not |

`none` is not a failure state, it is an honest one. A project can be registered and simply
not be in git yet. It keeps working exactly as before, and *adopting* it (git init, first
commit, give it an origin) is an explicit thing the user does, never something a startup
migration does behind their back.

*This is where the current model actually dies.*

**Phase 4: `prism://open/<id>`.** As promised, it falls out: look up the marker, open
KiCad; if absent, confirm and clone `origin_url`. Both models, one code path, because the
client never learns which model it is in. It just clones what the server told it to.

`open` means **open it on this machine**, in KiCad. That is the point of a desktop agent;
if you wanted the web app you would have followed a web link. `prism://web/<id>` is the
escape hatch that still opens the browser.

Two rules a URL handler has to obey, since a web page can invoke it:

* **Never write to disk without asking.** A link in a browser is not consent to clone a
  repository into someone's filesystem. The confirmation names the exact destination, and
  a failure to ask (no dialog available) is a NO, never a silent yes.
* **A project name can never steer the clone.** Names come from the server and can contain
  anything; `..` or a separator in one must not put a clone outside the projects root.

`origin_owner = "none"` has nothing to clone. It says so, rather than inventing an origin.

**Phase 5: Prism as origin (model B).** Bare repo hosting, `origin_owner = "prism"`, and a
create-project flow that produces one. Additive: model A keeps working untouched.

**Transport: Smart HTTP, on the port Prism already listens on.**

```
git clone https://prism.example.com/git/prj_abc.git
```

Served by shelling out to `git http-backend`, git's own CGI program. We are not
reimplementing the pack protocol; we are speaking CGI to the thing that already
implements it correctly. Chosen over SSH because reaching a repo then goes through the
*same* auth as everything else in Prism. A parallel SSH key system is one nobody
remembers to revoke, and it would put access control somewhere Prism cannot see.

Two things git clients do that shape the endpoint:

* They authenticate with **HTTP Basic**, not Bearer. A Prism API token arrives as the
  Basic *password*, and we bridge it to the normal bearer path.
* They need a **401 with `WWW-Authenticate`** to know to prompt. A 403 makes git give up
  silently, which the user reads as "the repo doesn't exist".

Reading needs `viewer`; pushing needs `designer`.

**Two ways to get a hosted project:**

* `POST /api/projects/create` from nothing. Seeded with a `.kicad_pro` and a KiCad
  `.gitignore`, not left empty: an empty origin is a worse starting point than it looks
  (clone warns, no branch to track, and the user's first act would be creating the very
  files we know they need).
* `POST /api/projects/adopt` from a tree the user already has. **The tree is not moved
  and not converted.** A new bare repo is created, the history is pushed into it, and it
  is set as `origin`. Admin-only and allow-listed, like a local import, because it reads
  a server-side path the caller names.

Adoption refuses a folder that is not a git repo, or that has no commits, or that already
has an origin. Turning a pile of files into a repository is deliberately a separate,
explicit act: deciding what belongs in the first commit is the user's call, and a
`git add -A` on someone's project folder is how you commit 3 GB of build output and a
private key.

**One id, everywhere.** The bare repo is `prj_abc.git`, the workspace row is `prj_abc`,
and the committed marker says `prj_abc`. If those diverge every lookup by id misses, and
it fails in the worst way: silently, looking like it worked.

**Phase 6: retire "reference in place."** Done, but *not* the way this originally said.

"Migrate, then delete" turned out to be wrong once the live data was inspected: **three of
four projects were reference-mode**, and one of them (CIAA_ACC) has no git at all, so
there was nothing to migrate it *to*. Deleting the feature outright would have stranded
it.

So: **close the door, keep the room.**

* New reference imports are refused. Local imports are always copied into the server's
  workspace, and the mode argument is gone from the API and the import dialog.
* **The dangerous default is gone.** `start_import_job` did `local_path_mode or
  "reference"`, so any caller who simply *omitted* the argument silently got the mode
  where the server writes into the user's own working tree. A dangerous default is worse
  than a missing feature.
* Existing reference-mode projects keep working, untouched. They die out naturally as
  they are re-imported or adopted.

**And a loaded gun was removed.** `project_service.delete_project` `rmtree`'d the project
directory, and the *only* thing between that and a user's KiCad folder was a
`local_path_mode == "reference"` check. For a reference project, that directory **is** the
user's folder. It had **zero callers** (the API deletes through `workspace.delete_project`,
which drops the row and touches no files), so it was dead code, but dead code with an
`rmtree` in it is one careless import away from being live code with an `rmtree` in it.
Deleted.

The rule it violated, now pinned by a test: **registering a folder with Prism is not a
claim of ownership over it.** Unregistering must never delete it.

Phases 1 to 4 are the ones that matter. 5 is a feature. 6 is cleanup.

---

## Backlog: what this unlocks

Three features that all become straightforward once the mechanism above exists, and
all of which are awkward or impossible before it. Ordered by dependency, not priority.

### Create a project from the web UI

Today a project only exists because something on disk already existed. The web UI can
only *register* what is already there.

Once model B is real (phase 5), "New project" is: mint an id, create the bare repo,
seed it (an empty commit, or a KiCad project skeleton), done. The user then clones it,
by hand or via `prism://open/<id>`, which is exactly the flow that already works for
every other model-B project.

Needs: phase 5.

### Adopt a local project (git or not)

The common real case: someone has a KiCad project in a folder, and either it is not a
git repo at all, or it is one with no remote. Right now Prism has nothing useful to
say to them.

The flow, from the plugin, on a project Prism does not know:

1. `git init` if needed, and write a KiCad-appropriate `.gitignore`.
2. Commit what is there, so the history starts from something rather than nothing.
3. Ask where the origin should live:
   * **Prism** (model B): server mints a bare repo, client pushes into it, sets it as
     `origin`. The working tree never moves and is never converted.
   * **Somewhere else** (model A): the user supplies a URL they already control.
4. Write the `.prism.json` marker and register with the server.

This is the on-ramp. Without it, Prism only serves people who have already solved
hosting themselves, which is the smaller half of the audience.

Needs: phases 1 to 3, and phase 5 for the Prism-hosted branch of step 3.

### Commits, PRs, merges

The collaboration layer. The constraint that shapes all of it: **ECAD is all-or-nothing.**
A `.kicad_pcb` cannot be textually three-way merged, so a "merge" here is a choice of
one side's file, not a blend of both. Anything that pretends otherwise will silently
corrupt boards.

So the model is:

* **Commit** from the plugin: stage, message, push. Prism already computes the diff, so
  it can show what is about to be committed, visually, before it is.
* **Propose** (the PR): a branch plus a *rendered* diff. The review surface is the board
  and schematic viewers Prism already has, not a text hunk list. This is the part Prism
  is uniquely placed to do well and the reason the feature is worth building.
* **Merge**: fast-forward when possible. When not, it is a **conflict**, and the only
  honest resolution for a binary-ish ECAD file is to **take one side whole**. Present it
  that way: side-by-side render, pick a side, per file. Never offer a "merge" that
  produces a file neither author drew.

Text files in the repo (netlists, BOM scripts, docs) can merge normally. Only the ECAD
artefacts are all-or-nothing, and the merge UI should draw that line explicitly rather
than treating every file the same.

Needs: phases 1 to 3. Model-agnostic, this works whoever owns the origin.

---

## What we are deliberately NOT building

* **Locking / check-out.** Out of scope. If it ever comes in, it requires model B and a
  server that owns the truth, and it will be a real project. Nothing here forecloses it.
* **The server watching a user's working tree.** That is what "reference in place" was, and
  it is the thing being removed.
* **Guessing.** If we cannot identify a checkout, we say so and let the user point at it. A
  wrong guess about which repo you are looking at is worse than a question.
