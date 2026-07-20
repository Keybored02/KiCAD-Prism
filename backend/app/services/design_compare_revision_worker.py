"""Subprocess entrypoint for a single design-compare revision build.

Invoked as:
  python -m app.services.design_compare_revision_worker <request.json> <result.json>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if len(args) != 2:
        print(
            "usage: python -m app.services.design_compare_revision_worker "
            "<request.json> <result.json>",
            file=sys.stderr,
        )
        return 2
    request_path = Path(args[0])
    result_path = Path(args[1])
    request = json.loads(request_path.read_text(encoding="utf-8"))

    # Import after argv parse so --help-style failures stay light.
    from app.services.design_compare_service import _build_revision_worker

    result = _build_revision_worker(request)
    result_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = result_path.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(result), encoding="utf-8")
    temporary.replace(result_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
