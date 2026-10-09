"""Harness manufacturing outputs (SB2-110, CONTRACTS_P2 §26.2): the model ``harness_outputs`` renders,
built from the live document so every output agrees with what the workspace shows."""

from __future__ import annotations

import math
import re
from typing import Any, Mapping, Optional

from app.services.systems import harness_outputs
from app.services.systems.service_base import Caller
from app.services.systems.store import Invalid, NotFound

OUTPUTS = {
    "drawing.svg": "image/svg+xml",
    "drawing.pdf": "application/pdf",
    "wiring.csv": "text/csv; charset=utf-8",
    "bom.csv": "text/csv; charset=utf-8",
    "wireviz.yaml": "application/yaml",
}


def _end_name(end: Mapping[str, Any], ordinal: int, instances: Mapping[str, Mapping[str, Any]]) -> str:
    """§26.2: what the end mates, ``HPDRM J4``, or ``End N`` when unmated."""
    mates = end.get("mates") or {}
    port = mates.get("port") or {}
    if not port:
        return f"End {ordinal}"
    instance = instances.get(mates.get("instanceId")) or {}
    reference = str(port.get("reference") or port.get("portKey") or "")
    if instance.get("kind") == "assembly":  # an export already names its board: "HPDRM J4"
        return reference
    return f"{instance.get('label') or ''} {reference}".strip()


def harness_model(document: Mapping[str, Any], harness: Mapping[str, Any]) -> dict:
    instances = {i["id"]: i for i in document["instances"]}
    lengths = harness.get("lengths") or {}
    wire_lengths = lengths.get("wires") or {}

    def cut(wire_id: str) -> Optional[int]:
        found = wire_lengths.get(wire_id)
        if found is not None:
            return math.ceil(found["estimatedMm"])
        return math.ceil(harness["cutLengthMm"]) if harness.get("cutLengthMm") else None

    return {
        "system": {"name": document["system"]["name"], "version": document["system"]["version"]},
        "harness": {"id": harness["id"], "name": harness["name"], "label": harness.get("label"),
                    "cutLengthMm": harness.get("cutLengthMm"), "bundleMm": lengths.get("bundleMm"),
                    "estimatedMm": lengths.get("estimatedMm")},
        "ends": [{"id": end["id"], "name": _end_name(end, n, instances), "pins": list(end.get("pins") or []),
                  "part": end.get("part"), "contact": end.get("contact")}
                 for n, end in enumerate(harness["ends"], 1)],
        "wires": [{**wire, "cutMm": cut(wire["id"])} for wire in harness["wires"]],
        "segments": lengths.get("segments") if lengths else None,
        "coverings": list(harness.get("coverings") or []),
    }


class HarnessOutputsMixin:
    def harness_output(self, caller: Caller, system_id: str, harness_id: str, name: str) -> tuple[bytes, str, str]:
        """``GET …/harnesses/{hid}/outputs/{name}``: ``(content, media type, file name)`` (§26.2)."""
        if name not in OUTPUTS:
            raise Invalid(f"unknown output {name}; one of {', '.join(OUTPUTS)}")
        with self._tx() as store:
            self._system(store, system_id, caller)
            self._visible_harness(store, system_id, harness_id, caller)  # 404 with an end the reader cannot see
        document = self.document(caller, system_id).body
        harness = next((h for h in document.get("harnesses") or [] if h["id"] == harness_id), None)
        if harness is None:
            raise NotFound("Harness not found")
        model = harness_model(document, harness)
        if name == "wiring.csv":
            content = harness_outputs.wiring_csv(model)
        elif name == "bom.csv":
            content = harness_outputs.bom_csv(model)
        elif name == "wireviz.yaml":
            content = harness_outputs.wireviz_yaml(model)
        else:
            content = harness_outputs.drawing_svg(model)
            if name == "drawing.pdf":
                content = harness_outputs.drawing_pdf(content)
        stem = re.sub(r"[^\w.-]+", "_", harness["name"]).strip("_") or "harness"
        return content, OUTPUTS[name], f"{stem}-v{document['system']['version']}-{name}"
