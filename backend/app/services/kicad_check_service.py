"""Asking KiCad itself whether a merged design is sound.

Two different questions live here, and the distinction matters:

**Can KiCad open this file at all?** (`can_open`) A merged board that will not load is
the one failure this feature must never produce: the user cannot fix it from inside
KiCad, because KiCad cannot open it. Our own integrity checks prove a file is well formed
by OUR understanding of the format; only KiCad can prove KiCad accepts it. So before any
merge is committed we make KiCad actually parse the file, and a failure here is not
overridable. There is no legitimate reason to commit a board nobody can open.

**Is the design electrically sound?** (`drc` / `erc`) This is a different class of
question, and the answer is almost never a clean yes. Real boards carry violations for
long stretches while work is in progress, so an absolute check would block every merge on
every board. What matters is whether the MERGE made things worse, so the gate is a
DELTA: run the same check on the pre-merge board, and only report what is new.

Missing KiCad is not a failure. Plenty of people will run the agent on a machine without
it installed, and refusing to merge because we could not find an optional tool would be
punishing the wrong person. Every function returns `ran=False` and the caller proceeds
with a banner.
"""

from __future__ import annotations

import json
import logging
import re
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

from . import kicad_cli

log = logging.getLogger(__name__)

# A board this size takes real time to check, and DRC on a dense 9MB board is minutes,
# not seconds. Generous, because a timeout here reads to the user as "the merge broke".
CHECK_TIMEOUT = 600
OPEN_TIMEOUT = 180

ERROR = "error"
WARNING = "warning"


def _no_window() -> int:
    """Keep a console window from flashing up on Windows."""
    return getattr(subprocess, "CREATE_NO_WINDOW", 0)


@dataclass(frozen=True)
class Violation:
    """One DRC or ERC finding, in a form that can be compared across runs."""

    kind: str  # KiCad's own type, e.g. "track_dangling"
    severity: str
    description: str
    uuids: tuple[str, ...]
    positions: tuple[tuple[float, float], ...]

    @property
    def fingerprint(self) -> tuple:
        """Identity for comparing two runs.

        Deliberately NOT the list index: KiCad reorders findings between runs, so index
        based comparison would report every violation as new the moment one was fixed.

        Rounding happens HERE rather than only where the report is parsed, so identity
        cannot depend on which path built the object. Severity is excluded: a rule
        promoted from warning to error is the same finding, and treating it as two would
        read as one violation vanishing and another appearing.
        """
        return (
            self.kind,
            self.uuids,
            tuple((round(x, 3), round(y, 3)) for x, y in self.positions),
        )

    def to_dict(self) -> dict:
        return {
            "kind": self.kind,
            "severity": self.severity,
            "description": self.description,
            "uuids": list(self.uuids),
            "positions": [list(p) for p in self.positions],
        }


@dataclass
class CheckResult:
    """What a check found, and whether it managed to run at all."""

    ran: bool
    ok: bool
    violations: list[Violation] = field(default_factory=list)
    detail: str = ""

    @property
    def errors(self) -> list[Violation]:
        return [v for v in self.violations if v.severity == ERROR]

    @property
    def warnings(self) -> list[Violation]:
        return [v for v in self.violations if v.severity == WARNING]

    def to_dict(self) -> dict:
        return {
            "ran": self.ran,
            "ok": self.ok,
            "detail": self.detail,
            "violations": [v.to_dict() for v in self.violations],
        }


@dataclass
class GateResult:
    """The merge gate's verdict: what this merge ADDED, not what exists."""

    ran: bool
    blocked: bool
    new_errors: list[Violation] = field(default_factory=list)
    new_warnings: list[Violation] = field(default_factory=list)
    pre_existing: int = 0
    detail: str = ""

    def to_dict(self) -> dict:
        return {
            "ran": self.ran,
            "blocked": self.blocked,
            "new_errors": [v.to_dict() for v in self.new_errors],
            "new_warnings": [v.to_dict() for v in self.new_warnings],
            "pre_existing": self.pre_existing,
            "detail": self.detail,
        }


def available() -> bool:
    """Is kicad-cli installed?"""
    return kicad_cli.resolve_optional() is not None


def _run(args: list[str], timeout: int) -> tuple[int, str]:
    """Run kicad-cli, returning (exit code, combined output).

    Never raises on a non-zero exit: for these commands the exit code IS the answer.
    """
    executable = kicad_cli.resolve_optional()
    if not executable:
        return -1, "kicad-cli not found"

    try:
        completed = subprocess.run(
            [executable, *args],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
            creationflags=_no_window(),
        )
    except subprocess.TimeoutExpired:
        return -1, f"timed out after {timeout}s"
    except OSError as exc:
        return -1, f"could not run kicad-cli: {exc}"

    # stdout first: kicad-cli reports the actual failure there ("Failed to load board"),
    # while stderr carries the deprecation notice. Concatenating the other way round put
    # a warning about future flag behaviour in front of the real reason.
    return completed.returncode, (completed.stdout or "") + (completed.stderr or "")


def can_open(path: str | Path) -> CheckResult:
    """Does KiCad load this file?

    The last gate before a commit, and the only one with no override. We ask for an
    export and throw the result away: the point is that producing it requires a full
    parse and load, so a non-zero exit means KiCad could not read the file.

    Verified: a valid board exits 0, and the same board missing one closing paren
    exits 3.
    """
    source = Path(path)
    if not source.is_file():
        return CheckResult(ran=False, ok=False, detail=f"{source} does not exist")

    if not available():
        # Not a pass. The caller decides whether to proceed, and must say that KiCad
        # level validation was skipped rather than implying the file was checked.
        return CheckResult(ran=False, ok=False, detail="kicad-cli is not installed")

    suffix = source.suffix.lower()
    with tempfile.TemporaryDirectory() as tmp:
        if suffix == ".kicad_pcb":
            # One layer only: we are proving the file loads, not rendering it.
            args = [
                "pcb",
                "export",
                "svg",
                "--output",
                str(Path(tmp) / "probe.svg"),
                "--layers",
                "F.Cu",
                str(source),
            ]
        elif suffix == ".kicad_sch":
            args = [
                "sch",
                "export",
                "netlist",
                "--output",
                str(Path(tmp) / "probe.net"),
                str(source),
            ]
        else:
            return CheckResult(
                ran=False, ok=False, detail=f"nothing to check in {suffix}"
            )

        code, output = _run(args, OPEN_TIMEOUT)

    if code == 0:
        return CheckResult(ran=True, ok=True, detail="KiCad opened the file")

    return CheckResult(
        ran=True,
        ok=False,
        detail=_first_useful_line(output)
        or f"KiCad could not open the file (exit {code})",
    )


# kicad-cli colours its warnings, and prints a deprecation notice on stderr for some
# export commands. Neither is what went wrong, and showing either to a user whose merge
# just failed would bury the real reason.
_ANSI = re.compile(r"\x1b\[[0-9;]*m")
_NOISE = (
    "this command has deprecated behavior",
    "the new behavior will match",
    "usage:",
)


def _first_useful_line(output: str) -> str:
    """KiCad's own words about what went wrong, which beat any wording of ours."""
    for line in _ANSI.sub("", output or "").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if any(stripped.lower().startswith(n) for n in _NOISE):
            continue
        return stripped
    return ""


def _parse_violations(report: dict) -> list[Violation]:
    """Flatten a DRC/ERC report into comparable findings.

    `unconnected_items` and `schematic_parity` sit alongside `violations` in the same
    report and matter just as much: a partial merge that drops a track produces exactly
    an unconnected item, and one that takes a footprint without its symbol produces a
    parity failure.
    """
    found: list[Violation] = []
    for section in ("violations", "unconnected_items", "schematic_parity"):
        for entry in report.get(section) or []:
            items = entry.get("items") or []
            uuids = tuple(
                sorted(str(i.get("uuid", "")) for i in items if i.get("uuid"))
            )
            positions = tuple(
                sorted(
                    (
                        round(float(i.get("pos", {}).get("x", 0.0)), 3),
                        round(float(i.get("pos", {}).get("y", 0.0)), 3),
                    )
                    for i in items
                    if i.get("pos")
                )
            )
            found.append(
                Violation(
                    kind=str(entry.get("type") or section),
                    severity=str(entry.get("severity") or WARNING),
                    description=str(entry.get("description") or ""),
                    uuids=uuids,
                    positions=positions,
                )
            )
    return found


def refill_zones(path: str | Path) -> CheckResult:
    """Recompute the copper pours and save the board in place.

    A merge invalidates every pour: each was computed around the routing that existed
    when KiCad filled it, and a merged board has copper from both branches. The builder
    clears them for that reason, and this fills them back in so the merge commit lands a
    finished board rather than one the user must open, refill and commit again.

    KiCad does the fill itself, via `pcb drc --refill-zones --save-board`. There is no
    standalone refill subcommand; DRC is the one that carries the flag. Whatever the
    check reports is ignored here - the caller runs its own DRC afterwards and compares
    against a baseline.

    Note that KiCad rewrites the file in ITS OWN format version, which may be newer than
    the one the board was saved in. That is inherent to letting KiCad do the fill, and
    the reason the agent's kicad-cli should match the KiCad people actually run.

    Modifies the file at `path`. Only call it on a file you are about to commit.
    """
    source = Path(path)
    if not source.is_file():
        return CheckResult(ran=False, ok=False, detail=f"{source} does not exist")
    if source.suffix.lower() != ".kicad_pcb":
        return CheckResult(ran=False, ok=True, detail="not a board")
    if not available():
        # No KiCad, so no refill. The merge still stands; the user fills by hand, which
        # is what they would have done anyway.
        return CheckResult(ran=False, ok=True, detail="kicad-cli is not installed")

    with tempfile.TemporaryDirectory() as tmp:
        code, output = _run(
            [
                "pcb",
                "drc",
                "--refill-zones",
                "--save-board",
                "--format",
                "json",
                "--output",
                str(Path(tmp) / "ignored.json"),
                str(source),
            ],
            CHECK_TIMEOUT,
        )

    if code != 0:
        return CheckResult(
            ran=True,
            ok=False,
            detail=_first_useful_line(output) or f"refill failed (exit {code})",
        )
    return CheckResult(ran=True, ok=True, detail="zones refilled")


def drc(path: str | Path, schematic_parity: bool = False) -> CheckResult:
    """Run DRC on a board.

    `schematic_parity` compares the board against its schematic. It is the highest value
    check for a merge, because taking a footprint on one side without the matching symbol
    on the other is exactly what partial staging can produce. It requires the schematic
    to sit beside the board, so it is opt-in.
    """
    return _check(
        path,
        ".kicad_pcb",
        lambda src, out: [
            "pcb",
            "drc",
            "--format",
            "json",
            "--severity-all",
            *(["--schematic-parity"] if schematic_parity else []),
            "--output",
            out,
            src,
        ],
    )


def erc(path: str | Path) -> CheckResult:
    """Run ERC on a schematic."""
    return _check(
        path,
        ".kicad_sch",
        lambda src, out: [
            "sch",
            "erc",
            "--format",
            "json",
            "--severity-all",
            "--output",
            out,
            src,
        ],
    )


def _check(path: str | Path, expected_suffix: str, build_args) -> CheckResult:
    source = Path(path)
    if not source.is_file():
        return CheckResult(ran=False, ok=False, detail=f"{source} does not exist")
    if source.suffix.lower() != expected_suffix:
        return CheckResult(ran=False, ok=False, detail=f"not a {expected_suffix} file")
    if not available():
        return CheckResult(ran=False, ok=True, detail="kicad-cli is not installed")

    with tempfile.TemporaryDirectory() as tmp:
        report_path = Path(tmp) / "report.json"
        # Note we do NOT pass --exit-code-violations: a board with violations is a
        # normal state, and we want the report, not a failure.
        code, output = _run(build_args(str(source), str(report_path)), CHECK_TIMEOUT)

        if not report_path.is_file():
            return CheckResult(
                ran=False,
                ok=True,
                detail=_first_useful_line(output) or f"check did not run (exit {code})",
            )

        try:
            report = json.loads(report_path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            return CheckResult(ran=False, ok=True, detail=f"unreadable report: {exc}")

    violations = _parse_violations(report)
    return CheckResult(
        ran=True,
        ok=not any(v.severity == ERROR for v in violations),
        violations=violations,
        detail=f"{len(violations)} finding(s)",
    )


def gate(before: CheckResult, after: CheckResult) -> GateResult:
    """Compare a check before and after the merge, and report only what is NEW.

    This is the whole reason the gate is a delta. Real boards carry violations for long
    stretches of a design, and the test board in this repo has 17 warnings sitting in it
    right now. Blaming those on whoever happens to merge next would make the gate noise
    that people learn to click through, which is worse than no gate at all.
    """
    if not after.ran:
        return GateResult(ran=False, blocked=False, detail=after.detail)

    # If the baseline could not run we cannot tell new from pre-existing. Report
    # everything as new rather than silently passing: over-reporting is recoverable by
    # the user, under-reporting is not.
    baseline = {v.fingerprint for v in before.violations} if before.ran else set()

    fresh = [v for v in after.violations if v.fingerprint not in baseline]
    new_errors = [v for v in fresh if v.severity == ERROR]
    new_warnings = [v for v in fresh if v.severity == WARNING]
    pre_existing = len(after.violations) - len(fresh)

    if new_errors:
        detail = f"This merge introduces {len(new_errors)} new error(s)."
    elif new_warnings:
        detail = f"This merge introduces {len(new_warnings)} new warning(s)."
    else:
        detail = "No new violations."

    if not before.ran:
        # Say so even when there ARE findings, especially then: without a baseline we
        # cannot tell what this merge caused from what was already wrong, and letting
        # someone believe the merge broke their board is its own kind of wrong.
        detail += " Could not compare against the pre-merge board, so everything the "
        detail += "check found is listed."

    return GateResult(
        ran=True,
        blocked=bool(new_errors),
        new_errors=new_errors,
        new_warnings=new_warnings,
        pre_existing=pre_existing,
        detail=detail,
    )
