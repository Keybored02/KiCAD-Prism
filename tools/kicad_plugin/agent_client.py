"""Client for the local Prism tray agent.

Runs inside KiCad's embedded Python, so this is strictly stdlib, no requests, no
pip. It finds the agent via the discovery file the agent publishes (port + token)
and calls its loopback API.

The plugin does no real work itself: everything (git, project lookup, backend
calls) lives in the agent, so those capabilities exist whether or not KiCad is
open. This is just the UI's transport.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

TIMEOUT = 15
# Diffing the working tree means parsing every changed board; a big one takes a
# couple of seconds cold (the agent caches on mtime, so it's ~instant after that).
DIFF_TIMEOUT = 120
# Signing in waits for the user to log in and approve in a browser. The agent
# itself gives up after five minutes, so allow a little longer than that here, or
# the plugin would time out on a flow the agent is still legitimately serving.
SIGNIN_TIMEOUT = 330
APP_NAME = "kicad-prism"
ENDPOINT_FILE = "agent.json"


class AgentUnavailable(Exception):
    """We couldn't get an answer out of the agent, it's down, or it refused."""


def _http_message(exc, route):
    """Turn an HTTP failure into something that points at the actual fix.

    A 404 from a *live* agent means the agent is older than the plugin: the route didn't
    exist when it started. During development that's the single most likely thing to go
    wrong, you edit the agent, reload the plugin, and the still-running old process
    doesn't have the new endpoint. "Restart the agent" is the real fix, so say it,
    instead of a bare status code or (worse) claiming the agent isn't running at all.
    """
    if exc.code == 404:
        return (
            "This Prism agent doesn't know about %s.\n\n"
            "It's running an older build than the plugin, restart the agent to pick "
            "up the new version." % route
        )
    if exc.code == 401:
        return (
            "The agent rejected our token.\n\n"
            "Its endpoint file is probably stale. Restart the agent."
        )

    detail = ""
    try:
        body = json.loads(exc.read() or b"{}")
        if isinstance(body, dict):
            detail = body.get("error") or ""
    except (ValueError, OSError):
        pass
    return detail or "The agent returned HTTP %d for %s." % (exc.code, route)


def profile():
    """The name of the profile whose agent we talk to ("dev" or "release").

    A symlinked working copy and a real PCM install can both be loaded by KiCad at
    once (that's the point: iterate on one, verify the other). They must not share an
    agent, or the single-instance guard means only one starts and it silently serves
    both, you edit agent code, restart, and see nothing change.

    Resolution (explicit env, then detection) lives in the shared profile
    registry so the agent and plugin never disagree on which environment they're
    in. PRISM_PROFILE still wins for running the agent by hand.
    """
    from .profiles import resolve
    return resolve().name


def _config_dir():
    # The config dir MUST match what prism_agent.discovery computes, or the
    # plugin looks for the agent's discovery file in the wrong place. The plugin
    # is installed standalone and cannot import the agent package, so the profile
    # registry is mirrored here (kicad_plugin/profiles.py); the suffix comes from
    # it so both sides derive the same path.
    from .profiles import resolve
    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or os.path.expanduser("~/AppData/Roaming")
    elif sys.platform == "darwin":
        base = os.path.expanduser("~/Library/Application Support")
    else:
        base = os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config")
    suffix = resolve().config_suffix
    return os.path.join(base, f"{APP_NAME}-{suffix}" if suffix else APP_NAME)


def _endpoint():
    path = os.path.join(_config_dir(), ENDPOINT_FILE)
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        raise AgentUnavailable(
            "The Prism agent isn't running.\n\n"
            "Start it from the system tray, or run:\n"
            "    python -m prism_agent"
        )
    if "port" not in data or "token" not in data:
        raise AgentUnavailable("The agent's endpoint file is malformed.")
    return data


class AgentClient:
    def __init__(self):
        ep = _endpoint()
        self.base = "http://127.0.0.1:%d" % ep["port"]
        self.token = ep["token"]

    def _call(self, method, path, body=None, timeout=TIMEOUT):
        url = self.base + path
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Accept", "application/json")
        req.add_header("Authorization", "Bearer " + self.token)
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
        except urllib.error.HTTPError as exc:
            # HTTPError subclasses URLError, so it MUST be caught first, otherwise an
            # agent answering "404" is reported as an agent that isn't running, and the
            # user goes off restarting a process that was working fine. An HTTP status
            # is proof it's alive.
            raise AgentUnavailable(_http_message(exc, path)) from exc
        except urllib.error.URLError as exc:
            # Nothing answered: the agent really is gone, or the endpoint file is stale
            # (it quit without cleaning up).
            raise AgentUnavailable(
                "Couldn't reach the Prism agent at %s.\n\n"
                "It may have stopped. Restart it from the tray." % self.base
            ) from exc
        return json.loads(raw) if raw else None

    # -- API ---------------------------------------------------------------

    def health(self):
        return self._call("GET", "/health")

    def project(self, path):
        """Everything the dialog shows: the project, its git state, its Prism row."""
        return self._call("GET", "/project?path=" + urllib.parse.quote(path))

    def changes(self, path):
        """Uncommitted changes, grouped the way the web UI groups a commit's.

        Slow the first time (it parses every changed board); the agent caches on
        file mtime, so subsequent calls are instant until you actually edit.
        """
        return self._call(
            "GET",
            "/changes?path=" + urllib.parse.quote(path),
            timeout=DIFF_TIMEOUT,
        )

    def open_in_prism(self, project_id, commit=None):
        """Open the project in the web app, optionally at a specific commit.

        The agent builds the URL, because it owns the one function that knows the web
        app's route. Rebuilding it here is how it drifted to the wrong path before.
        """
        body = {"project_id": project_id}
        if commit:
            body["commit"] = commit
        return self._call("POST", "/open-in-prism", body)

    def library(self):
        """Is Prism registered as KiCad's remote symbol provider?

        Returns {configured, kicad_version, linked, stale, linked_url, server_url}.
        `stale` means a Prism provider IS registered, but for a different server than
        the one we're configured for.
        """
        return self._call("GET", "/library")

    def link_library(self, remove=False):
        """Register (or remove) Prism as KiCad's remote symbol provider.

        Works with KiCad open, it only rewrites the parts of eeschema.json it touched,
        and the provider list isn't one of them. KiCad does need a restart to pick the
        change up, though.
        """
        return self._call("POST", "/library", {"remove": remove})

    # -- publishing --------------------------------------------------------

    def publish_status(self, path):
        """What publishing this folder would involve. Read-only.

        Returns {is_repo, has_commits, has_origin, origin, will_commit}. `will_commit`
        is the file list a first commit would take, so the user can see it BEFORE
        agreeing to anything.
        """
        return self._call("GET", "/publish?path=" + urllib.parse.quote(path))

    def publish(self, path, name, description=""):
        """Publish this folder into a repo Prism hosts.

        Slow: it commits, reserves a repo, and pushes a board over the network. Give it
        the same room a diff gets rather than timing out mid-push, which would leave the
        user unsure whether their work made it across.
        """
        return self._call(
            "POST",
            "/publish",
            {"path": path, "name": name, "description": description},
            timeout=DIFF_TIMEOUT,
        )

    # -- moving around the history -----------------------------------------

    def branches(self, path):
        """Local and remote branches, for a switch picker. Read-only."""
        return self._call("GET", "/branches?path=" + urllib.parse.quote(path))

    def checkout_status(self, path, ref=""):
        """Could we check `ref` out, and if not, why not? Read-only.

        Ask this BEFORE offering a button, so a refusal is explained in advance rather
        than after the user has committed to the action.
        """
        url = "/checkout?path=" + urllib.parse.quote(path)
        if ref:
            url += "&ref=" + urllib.parse.quote(ref)
        return self._call("GET", url)

    def checkout(self, path, ref, stash_message=None):
        """Move the working tree to a commit, branch or tag.

        Refuses anything that would destroy uncommitted work. The agent re-checks that
        immediately before acting, so a stale "it was clean" from a moment ago cannot
        lose a board the user just saved.

        `stash_message` (even empty) means "put my changes aside first". Omitting it
        entirely means uncommitted changes are still a refusal: moving someone's work
        needs an explicit yes, not a default.
        """
        body = {"path": path, "ref": ref}
        if stash_message is not None:
            body["stash_message"] = stash_message
        return self._call("POST", "/checkout", body)

    def pull(self, path, stash_message=None):
        """Fetch and fast-forward. Never a merge: a KiCad board cannot be merged
        textually, and git would happily produce one neither author drew."""
        body = {"path": path}
        if stash_message is not None:
            body["stash_message"] = stash_message
        return self._call("POST", "/pull", body, timeout=DIFF_TIMEOUT)

    def commit(self, path, message, paths=None, allow_detached=False):
        """Stage and commit. `paths` None commits everything; a list commits only those.

        Refuses an empty message and a detached HEAD (unless `allow_detached`), so a
        commit the user would lose on the next checkout is never made silently.
        """
        body = {"path": path, "message": message}
        if paths is not None:
            body["paths"] = paths
        if allow_detached:
            body["allow_detached"] = True
        return self._call("POST", "/commit", body)

    def create_branch(self, path, name, switch=True):
        """Create a branch at HEAD, switching to it by default.

        The remedy for commits stranded on a detached HEAD, and the everyday "start a
        new branch here".
        """
        return self._call("POST", "/branch", {"path": path, "name": name, "switch": switch})

    def fetch(self, path):
        """Update tracking refs and report ahead/behind. Read-only, always safe."""
        return self._call("POST", "/fetch", {"path": path}, timeout=DIFF_TIMEOUT)

    def push(self, path, set_upstream=False):
        """Push the current branch. Never forces; a rejection is reported, not overridden.

        `set_upstream` publishes a new branch that has no remote yet. Slow over a board
        repo, so it gets the same room a diff does.
        """
        body = {"path": path}
        if set_upstream:
            body["set_upstream"] = True
        return self._call("POST", "/push", body, timeout=DIFF_TIMEOUT)

    def merge_plan(self, path, ref):
        """What merging `ref` would involve. Read-only: nothing moves."""
        return self._call(
            "GET",
            "/merge/plan?path=%s&ref=%s"
            % (urllib.parse.quote(path), urllib.parse.quote(ref)),
            timeout=DIFF_TIMEOUT,
        )

    def start_merge(self, path, ref):
        """Open the merge UI in a browser for `ref`.

        The agent builds the URL and opens it, because only the agent knows its own port
        and the one-shot key that lets the page talk back to it.
        """
        return self._call(
            "POST", "/merge/start", {"path": path, "ref": ref}, timeout=DIFF_TIMEOUT
        )

    def stashes(self, path):
        """What is currently stashed, newest first."""
        return self._call("GET", "/stash?path=" + urllib.parse.quote(path))

    def apply_stash(self, path, ref="stash@{0}"):
        """Put a stash back into the working tree."""
        return self._call(
            "POST", "/stash", {"path": path, "action": "apply", "ref": ref}
        )

    def drop_stash(self, path, ref="stash@{0}"):
        """Throw a stash away. Destructive: confirm before calling."""
        return self._call(
            "POST", "/stash", {"path": path, "action": "drop", "ref": ref}
        )

    # -- the KiCad .gitignore ----------------------------------------------

    def gitignore_status(self, path):
        """Would a KiCad .gitignore help here, and what would it change? Read-only."""
        return self._call("GET", "/gitignore?path=" + urllib.parse.quote(path))

    def add_gitignore(self, path):
        """Write the KiCad .gitignore. Does not commit, and does not untrack anything:
        a file that is already committed keeps being reported, which is git's rule and
        the right one."""
        return self._call("POST", "/gitignore", {"path": path})

    # -- settings ----------------------------------------------------------

    def settings(self):
        """Current settings, backend identity, and prism:// registration state."""
        return self._call("GET", "/settings")

    def save_settings(self, changes):
        """Update settings. Returns the same shape as settings().

        The token is write-only: it's never sent back, so an empty api_token means
        "leave it as it is" rather than "clear it", pass clear_token to clear.
        """
        return self._call("PUT", "/settings", changes)

    def sign_in(self, label=""):
        """Sign in to Prism through the browser, and save the resulting token.

        Blocks while the agent opens the browser and waits for the user to log in
        and approve, so it needs a long timeout. The agent does the whole loopback
        flow; the plugin only kicks it off and shows the result. Returns the same
        shape as settings(), plus an "error" on failure.
        """
        body = {"label": label} if label else {}
        return self._call("POST", "/signin", body, timeout=SIGNIN_TIMEOUT)

    def cancel_sign_in(self):
        """Abandon a sign-in that is waiting on the browser.

        Called when the user closes the tab or cancels, so the agent's /signin
        stops waiting and returns, rather than holding the loopback listener open
        until it times out. Best-effort and quick.
        """
        return self._call("POST", "/signin/cancel", {}, timeout=TIMEOUT)

    def sign_out(self):
        """Sign out: clear the local token and best-effort revoke it at Prism.

        Returns the settings() shape, with a "warning" when the token was cleared
        locally but Prism could not be reached to revoke it.
        """
        return self._call("POST", "/signout", {})

    def restart(self):
        return self._call("POST", "/restart", {})

    def quit(self):
        return self._call("POST", "/quit", {})
