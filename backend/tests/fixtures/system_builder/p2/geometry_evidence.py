"""Record kicad-cli placement evidence for the extractor v6 geometry goldens (SB2-11).

For each board source listed below, writes ``evidence/geometry/<board>/<step>/``:

* ``positions.csv``: ``kicad-cli pcb export pos --format csv --units mm``
  (page origin, y up, KiCad angle: the board frame of CONTRACTS_P2 §14.2);
* ``pads.d356``: ``kicad-cli pcb export ipcd356`` (every pad centre, in
  0.0001 in from the board's aux origin, y up).

Run from ``backend/`` with KiCad 10.0.6::

    KICAD_CLI=/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli \\
        venv/bin/python tests/fixtures/system_builder/p2/geometry_evidence.py
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCES = HERE.parent / "sources"
OUT = HERE / "evidence" / "geometry"
BOARDS = [("mini_obc", "F0"), ("mini_power", "F0")]  # mini_payload has no board (P1 fixture)


def main() -> None:
    cli = os.environ.get("KICAD_CLI", "kicad-cli")
    version = subprocess.run([cli, "--version"], check=True, capture_output=True, text=True).stdout.strip()
    record = {"kicad": version, "boards": {}}
    for board, step in BOARDS:
        pcb = SOURCES / board / step / f"{board}.kicad_pcb"
        out = OUT / board / step
        out.mkdir(parents=True, exist_ok=True)
        for argv in (["pcb", "export", "pos", "--format", "csv", "--units", "mm", "-o", str(out / "positions.csv")],
                     ["pcb", "export", "ipcd356", "-o", str(out / "pads.d356")]):
            subprocess.run([cli, *argv, str(pcb)], check=True, capture_output=True)
        # The d356 header carries a timestamp; drop it so the evidence is reproducible.
        d356 = out / "pads.d356"
        d356.write_text("".join(line for line in d356.read_text().splitlines(keepends=True)
                                if not line.startswith("C  ")))
        record["boards"][f"{board}/{step}"] = sorted(p.name for p in out.iterdir())
    (OUT / "record.json").write_text(json.dumps(record, indent=1, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
