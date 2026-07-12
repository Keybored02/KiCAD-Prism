"""Assemble the KiCad Plugin & Content Manager (PCM) package.

Produces the zip a user installs from KiCad's Plugin Manager. Layout is fixed by
KiCad (https://dev-docs.kicad.org/en/addons/):

    archive root
      metadata.json
      plugins/            <- the plugin itself, NOT in a further subdirectory
        __init__.py
        ...
        prism-agent[.exe] <- the agent binary for THIS platform
      resources/
        icon.png          <- the package icon PCM shows

    python tools/package_plugin.py --version 0.4.0 --binaries <dir> --out dist

`--binaries` is a directory of the artifacts CI downloaded, one subdirectory per
platform (that's how actions/download-artifact lays them out).

One zip is produced per platform, because each carries its own agent binary. A
single zip with all three would triple the download for no reason, and KiCad has no
notion of per-platform files inside a package.
"""

from __future__ import annotations

import argparse
import json
import shutil
import zipfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
PLUGIN_SRC = TOOLS / "kicad_plugin"

IDENTIFIER = "com.github.keybored02.kicad-prism"

# The binary each platform's package carries, keyed by the artifact name CI uses.
PLATFORMS = {
    "prism-agent-windows": ("windows", "prism-agent.exe"),
    "prism-agent-macos": ("macos", "prism-agent"),
    "prism-agent-linux": ("linux", "prism-agent"),
}

# Files in kicad_plugin/ that are ours to ship. Everything else (caches, the dev
# build output) stays out.
EXCLUDE = {"__pycache__", ".pytest_cache"}


def metadata(version: str, platform: str) -> dict:
    return {
        "$schema": "https://go.kicad.org/pcm/schemas/v1",
        "name": "Prism",
        "description": "Project status, uncommitted changes, and cross-probe from Prism.",
        "description_full": (
            "Shows what you have changed but not yet committed — grouped the way "
            "Prism's web UI groups a commit, with components, nets, zones and "
            "symbols — and lets you jump straight to a changed item on the board.\n"
            "\n"
            "Includes the Prism agent, which does the machine-side work (git, "
            "project detection, diffing) and keeps running whether or not KiCad is "
            "open. No Python installation is required.\n"
        ),
        "identifier": IDENTIFIER,
        "type": "plugin",
        "author": {
            "name": "Matteo Parenti",
            "contact": {"web": "https://github.com/Keybored02/KiCAD-Prism"},
        },
        "license": "MIT",
        "resources": {"homepage": "https://github.com/Keybored02/KiCAD-Prism"},
        "versions": [
            {
                "version": version,
                "status": "testing",
                # The plugin uses pcbnew.ActionPlugin and FocusOnItem, both present
                # since 6.0; tested on 8 and 10.
                "kicad_version": "8.0",
                "platforms": [platform],
            }
        ],
    }


def _copy_plugin(dest: Path) -> None:
    """The plugin's own files, straight into plugins/ — PCM requires no extra nesting."""
    dest.mkdir(parents=True, exist_ok=True)
    for item in sorted(PLUGIN_SRC.iterdir()):
        if item.name in EXCLUDE:
            continue
        if item.is_dir():
            shutil.copytree(
                item, dest / item.name, ignore=shutil.ignore_patterns(*EXCLUDE)
            )
        else:
            shutil.copy2(item, dest / item.name)


def _find_binary(binaries: Path, artifact: str, name: str) -> Path:
    """Locate a CI artifact. download-artifact puts each under its own directory,
    but a locally-built one may just be the file — accept both."""
    candidates = [
        binaries / artifact / name,
        binaries / name,
    ]
    for c in candidates:
        if c.is_file():
            return c
    raise SystemExit(
        f"can't find {name} for {artifact}. Looked in:\n  "
        + "\n  ".join(str(c) for c in candidates)
    )


def build_package(version: str, binaries: Path, out: Path, artifact: str) -> Path:
    platform, binary_name = PLATFORMS[artifact]
    binary = _find_binary(binaries, artifact, binary_name)

    staging = out / f"_stage-{platform}"
    shutil.rmtree(staging, ignore_errors=True)

    plugins = staging / "plugins"
    _copy_plugin(plugins)

    # The agent sits beside the plugin — which is exactly where agent_launcher's
    # find_binary() looks first.
    shutil.copy2(binary, plugins / binary_name)
    if platform != "windows":
        (plugins / binary_name).chmod(0o755)  # zip preserves this; PCM extracts it

    resources = staging / "resources"
    resources.mkdir(parents=True, exist_ok=True)
    icon = PLUGIN_SRC / "assets" / "prism-64.png"
    if icon.is_file():
        shutil.copy2(icon, resources / "icon.png")

    (staging / "metadata.json").write_text(
        json.dumps(metadata(version, platform), indent=2), encoding="utf-8"
    )

    out.mkdir(parents=True, exist_ok=True)
    zip_path = out / f"kicad-prism-{version}-{platform}.zip"
    zip_path.unlink(missing_ok=True)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(staging.rglob("*")):
            if path.is_file():
                arc = path.relative_to(staging)
                # Preserve the executable bit — a zip that loses it gives the user a
                # non-runnable agent and a baffling permission error.
                info = zipfile.ZipInfo(str(arc).replace("\\", "/"))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = (path.stat().st_mode & 0xFFFF) << 16
                zf.writestr(info, path.read_bytes())

    shutil.rmtree(staging, ignore_errors=True)
    size = zip_path.stat().st_size / (1024 * 1024)
    print(f"  {zip_path.name}  ({size:.1f} MB)")
    return zip_path


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--version", required=True)
    ap.add_argument("--binaries", required=True, type=Path)
    ap.add_argument("--out", default=Path("dist"), type=Path)
    args = ap.parse_args()

    if not PLUGIN_SRC.is_dir():
        raise SystemExit(f"plugin source not found: {PLUGIN_SRC}")

    built = []
    for artifact in PLATFORMS:
        # Only package platforms whose binary we actually got. A macOS runner
        # failing shouldn't stop us shipping Windows and Linux.
        try:
            built.append(build_package(args.version, args.binaries, args.out, artifact))
        except SystemExit as exc:
            print(f"  skipping {artifact}: {exc}")

    if not built:
        raise SystemExit("no packages were built — no agent binaries were found")
    print(f"\n{len(built)} package(s) in {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
