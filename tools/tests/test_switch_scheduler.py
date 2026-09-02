"""The deferred branch switch: wait for KiCad to close, then check out and reopen.

The scheduler never touches the working tree while KiCad is alive, that is the whole
point, so these drive it with a fake pid-alive signal and a fake launch, and assert the
checkout only happens after "KiCad" is gone and the guard still passes.
"""

import subprocess
import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import checkout, discovery, open_project, switch_scheduler  # noqa: E402


def git(*args, cwd):
    return subprocess.run(["git", *args], cwd=str(cwd), capture_output=True, text=True, check=True)


@pytest.fixture
def project(tmp_path):
    """A repo with a .kicad_pro and two branches, so a switch has somewhere to go."""
    repo = tmp_path / "proj"
    repo.mkdir()
    git("init", "-b", "main", cwd=repo)
    git("config", "user.email", "t@t.t", cwd=repo)
    git("config", "user.name", "T", cwd=repo)
    (repo / "board.kicad_pro").write_text("{}")
    (repo / "board.kicad_pcb").write_text("(kicad_pcb v1)")
    git("add", "-A", cwd=repo)
    git("commit", "-m", "first", cwd=repo)
    git("branch", "feature", cwd=repo)
    # Diverge feature so switching to it actually changes the board.
    git("switch", "feature", cwd=repo)
    (repo / "board.kicad_pcb").write_text("(kicad_pcb feature)")
    git("commit", "-am", "on feature", cwd=repo)
    git("switch", "main", cwd=repo)
    return repo


@pytest.fixture
def fast(monkeypatch):
    """Make the scheduler's waits instant so tests do not sleep for real."""
    monkeypatch.setattr(switch_scheduler, "SETTLE_SECONDS", 0)
    monkeypatch.setattr(switch_scheduler, "POLL_SECONDS", 0.01)


def _capture_notify():
    notes = []
    return notes, lambda title, msg: notes.append((title, msg))


def test_schedule_refuses_a_dead_pid(project, fast, monkeypatch):
    monkeypatch.setattr(discovery, "_pid_alive", lambda pid: False)
    sched = switch_scheduler.SwitchScheduler()
    with pytest.raises(checkout.CheckoutError, match="does not appear to be running"):
        sched.schedule(repo=str(project), ref="feature", project_dir=str(project), kicad_pid=99999)


def test_switch_happens_only_after_the_pid_exits(project, fast, monkeypatch):
    launched = []
    monkeypatch.setattr(open_project, "launch_kicad", lambda d: launched.append(str(d)))

    # KiCad is "alive" for the first few polls, then gone.
    alive = {"n": 3}

    def pid_alive(pid):
        alive["n"] -= 1
        return alive["n"] > 0

    monkeypatch.setattr(discovery, "_pid_alive", pid_alive)

    notes, notify = _capture_notify()
    sched = switch_scheduler.SwitchScheduler(notify=notify)
    sched.schedule(repo=str(project), ref="feature", project_dir=str(project), kicad_pid=4242)

    # Wait for the watcher to see the pid gone, switch, AND reopen (launch is the last
    # step, so waiting on it avoids racing the checkout).
    for _ in range(200):
        if launched:
            break
        time.sleep(0.02)

    assert (project / "board.kicad_pcb").read_text() == "(kicad_pcb feature)"
    assert launched == [str(project)]


def test_a_reopened_target_without_a_project_file_is_reported(project, fast, monkeypatch):
    # feature branch removes the .kicad_pro
    git("switch", "feature", cwd=project)
    (project / "board.kicad_pro").unlink()
    git("commit", "-am", "drop pro", cwd=project)
    git("switch", "main", cwd=project)

    monkeypatch.setattr(discovery, "_pid_alive", lambda pid: False)
    launched = []
    monkeypatch.setattr(open_project, "launch_kicad", lambda d: launched.append(d))

    notes, notify = _capture_notify()
    sched = switch_scheduler.SwitchScheduler(notify=notify)
    # Drive _perform directly (pid already gone), so we assert the no-project-file path.
    pending = switch_scheduler.PendingSwitch(
        repo=str(project), ref="feature", project_dir=str(project), kicad_pid=1
    )
    sched._perform(pending)

    assert launched == []  # nothing to reopen
    assert any("no KiCad project file" in m for _, m in notes)
    # But the switch itself still happened.
    assert (project / "board.kicad_pcb").read_text() == "(kicad_pcb feature)"


def test_a_dirty_tree_at_switch_time_is_reported_not_clobbered(project, fast, monkeypatch):
    """The user reopened KiCad and edited, or KiCad autosaved on close. The scheduler
    re-checks the guard and refuses rather than swapping under the changes."""
    monkeypatch.setattr(discovery, "_pid_alive", lambda pid: False)
    launched = []
    monkeypatch.setattr(open_project, "launch_kicad", lambda d: launched.append(d))

    # Make the tree dirty, as if KiCad wrote to it.
    (project / "board.kicad_pcb").write_text("(kicad_pcb UNSAVED EDIT)")

    notes, notify = _capture_notify()
    sched = switch_scheduler.SwitchScheduler(notify=notify)
    pending = switch_scheduler.PendingSwitch(
        repo=str(project), ref="feature", project_dir=str(project), kicad_pid=1
    )
    sched._perform(pending)

    assert launched == []
    assert any("unchanged" in m.lower() for _, m in notes)
    # The user's edit is intact, not overwritten by the switch.
    assert (project / "board.kicad_pcb").read_text() == "(kicad_pcb UNSAVED EDIT)"


def test_cancel_drops_a_pending_switch(project, fast, monkeypatch):
    monkeypatch.setattr(discovery, "_pid_alive", lambda pid: True)  # never exits
    monkeypatch.setattr(open_project, "launch_kicad", lambda d: pytest.fail("must not switch"))

    sched = switch_scheduler.SwitchScheduler()
    sched.schedule(repo=str(project), ref="feature", project_dir=str(project), kicad_pid=7)
    assert sched.pending() is not None

    result = sched.cancel()
    assert result["cancelled"] is True
    assert sched.pending() is None
    time.sleep(0.1)  # give the watcher a chance to (not) act
    assert (project / "board.kicad_pcb").read_text() == "(kicad_pcb v1)"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
