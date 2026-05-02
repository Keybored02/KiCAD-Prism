#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import shutil
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Callable


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
for candidate in (REPO_ROOT / "backend", REPO_ROOT):
    if (candidate / "app").is_dir():
        sys.path.insert(0, str(candidate))
        break

ComponentCatalogService: Any = None
_discover_footprint_name_in_text: Callable[[str], str]
_discover_symbol_names_in_text: Callable[[str], list[str]]
_sanitize_name: Callable[[str, str], str]


STEP_EXTENSIONS = {".step", ".stp"}
SPICE_EXTENSIONS = {".lib", ".mod", ".mdl", ".cir", ".sub", ".subckt", ".spice"}


def _load_catalog_runtime() -> None:
    global ComponentCatalogService
    global _discover_footprint_name_in_text
    global _discover_symbol_names_in_text
    global _sanitize_name

    try:
        from app.services.component_catalog_service_pg import (  # noqa: PLC0415
            ComponentCatalogService as LoadedComponentCatalogService,
            _discover_footprint_name_in_text as loaded_discover_footprint_name,
            _discover_symbol_names_in_text as loaded_discover_symbol_names,
            _sanitize_name as loaded_sanitize_name,
        )
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "Backend Python dependencies are not available. Run this with the backend virtualenv "
            "or inside the backend container, for example: "
            "KiCAD-Prism-remote-datasource/backend/.venv/bin/python "
            "KiCAD-Prism-remote-datasource/scripts/import_kicad_library_assets.py --help"
        ) from exc

    ComponentCatalogService = LoadedComponentCatalogService
    _discover_footprint_name_in_text = loaded_discover_footprint_name
    _discover_symbol_names_in_text = loaded_discover_symbol_names
    _sanitize_name = loaded_sanitize_name


@dataclass
class ImportStats:
    symbol_libraries_seen: int = 0
    symbols_written: int = 0
    footprints_written: int = 0
    models_written: int = 0
    spice_written: int = 0
    component_csv_rows: int = 0
    component_csv_required_placeholders: int = 0
    assets_indexed: int = 0
    previews_attempted: int = 0
    reused_existing_files: int = 0
    skipped_files: int = 0
    errors: list[str] = field(default_factory=list)


@dataclass
class ComponentCsvRow:
    value: str
    datasheet: str
    description: str
    manufacturer: str
    manufacturer_part_number: str
    category: str
    package_name: str = ""
    vendor: str = ""
    vendor_part_number: str = ""
    mass_g: str = ""
    rqjc_c_w: str = ""
    rqjc_top_c_w: str = ""
    temp_max_c: str = ""
    temp_min_c: str = ""
    power_dissipation_w: str = ""
    rate: str = ""
    sap_code: str = ""
    symbol_file_path: str = ""
    symbol_target_library: str = ""
    symbol_target_name: str = ""
    footprint_file_path: str = ""
    footprint_target_library: str = ""
    footprint_target_name: str = ""
    model_3d_file_path: str = ""
    spice_file_path: str = ""


CSV_FIELDNAMES = [
    "value",
    "datasheet",
    "description",
    "manufacturer",
    "manufacturer_part_number",
    "category",
    "package_name",
    "vendor",
    "vendor_part_number",
    "mass_g",
    "rqjc_c_w",
    "rqjc_top_c_w",
    "temp_max_c",
    "temp_min_c",
    "power_dissipation_w",
    "rate",
    "sap_code",
    "symbol_file_path",
    "symbol_target_library",
    "symbol_target_name",
    "footprint_file_path",
    "footprint_target_library",
    "footprint_target_name",
    "model_3d_file_path",
    "spice_file_path",
]


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def _same_bytes(path: Path, payload: bytes) -> bool:
    return path.is_file() and path.read_bytes() == payload


def _write_canonical_file(
    destination: Path,
    payload: bytes,
    *,
    dry_run: bool,
    overwrite: bool,
    stats: ImportStats,
) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if _same_bytes(destination, payload):
            stats.reused_existing_files += 1
            return destination
        if not overwrite:
            raise ValueError(f"Canonical asset conflict at {destination}")
    if not dry_run:
        destination.write_bytes(payload)
    return destination


def _copy_canonical_file(
    source: Path,
    destination: Path,
    *,
    dry_run: bool,
    overwrite: bool,
    stats: ImportStats,
) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if source.read_bytes() == destination.read_bytes():
            stats.reused_existing_files += 1
            return destination
        if not overwrite:
            raise ValueError(f"Canonical asset conflict at {destination}")
    if not dry_run:
        shutil.copy2(source, destination)
    return destination


def _unique_destination(destination: Path) -> Path:
    if not destination.exists():
        return destination
    stem = destination.stem
    suffix = destination.suffix
    for index in range(2, 10_000):
        candidate = destination.with_name(f"{stem}_{index}{suffix}")
        if not candidate.exists():
            return candidate
    raise ValueError(f"Could not find an unused destination near {destination}")


def _library_from_symbol_file(symbol_file: Path) -> str:
    return _sanitize_name(symbol_file.stem, "Prism_Symbols")


def _library_from_footprint_file(footprint_file: Path, footprints_root: Path) -> str:
    for parent in [footprint_file.parent, *footprint_file.parents]:
        if parent == footprints_root.parent:
            break
        if parent.suffix.lower() == ".pretty":
            return _sanitize_name(parent.name.removesuffix(".pretty"), "Prism_Footprints")
    return _sanitize_name(footprint_file.parent.name.removesuffix(".pretty"), "Prism_Footprints")


def _relative_library_name(file_path: Path, root: Path, default: str) -> str:
    try:
        relative_parent = file_path.parent.relative_to(root)
    except ValueError:
        return _sanitize_name(file_path.parent.name, default)
    if not relative_parent.parts:
        return default
    return _sanitize_name("_".join(relative_parent.parts), default)


def _decode_symbol_property_value(value: str) -> str:
    return value.replace(r"\"", '"').replace(r"\\", "\\")


def _symbol_properties(symbol_block: str) -> dict[str, str]:
    properties: dict[str, str] = {}
    for match in re_finditer_property(symbol_block):
        properties[match[0]] = _decode_symbol_property_value(match[1])
    return properties


def re_finditer_property(symbol_block: str) -> list[tuple[str, str]]:
    import re

    pattern = re.compile(r'\(property\s+"((?:\\.|[^"])*)"\s+"((?:\\.|[^"])*)"')
    return [(match.group(1), match.group(2)) for match in pattern.finditer(symbol_block)]


def _property_first(properties: dict[str, str], names: tuple[str, ...]) -> str:
    lowered = {key.lower().replace(" ", "_"): value for key, value in properties.items()}
    for name in names:
        if name in properties and properties[name].strip():
            return properties[name].strip()
        normalized = name.lower().replace(" ", "_")
        if lowered.get(normalized, "").strip():
            return lowered[normalized].strip()
    return ""


def _infer_category(library: str) -> str:
    category = library
    for prefix in ("Pixxel_", "Prism_"):
        if category.startswith(prefix):
            category = category[len(prefix) :]
    return category.replace("_", " ").strip() or library


def _csv_path(path: Path, *, csv_store_root: Path | None, service_store_root: Path) -> str:
    if not csv_store_root:
        return str(path.resolve())
    relative = path.resolve().relative_to(service_store_root.resolve())
    return str((csv_store_root / relative).as_posix())


def _fill_required(value: str, fallback: str, stats: ImportStats) -> str:
    if value.strip():
        return value.strip()
    stats.component_csv_required_placeholders += 1
    return fallback


def _component_row_from_symbol(
    *,
    symbol_name: str,
    library: str,
    symbol_block: str,
    symbol_path: Path,
    csv_store_root: Path | None,
    service_store_root: Path,
    stats: ImportStats,
) -> tuple[ComponentCsvRow, str]:
    properties = _symbol_properties(symbol_block)
    value = _property_first(properties, ("Value",)) or symbol_name
    footprint_ref = _property_first(properties, ("Footprint", "ki_fp_filters"))
    manufacturer = _property_first(properties, ("Manufacturer", "Manufacturer_Name", "Manufacturer Name"))
    mpn = _property_first(
        properties,
        (
            "Manufacturer Part Number",
            "Manufacturer_Part_Number",
            "ManufacturerPartNumber",
            "MPN",
            "Part Number",
        ),
    )
    vendor_part = _property_first(properties, ("Mouser Part Number", "Arrow Part Number", "Vendor Part Number"))
    vendor = "Mouser" if properties.get("Mouser Part Number") else ("Arrow" if properties.get("Arrow Part Number") else "")
    row = ComponentCsvRow(
        value=_fill_required(value, symbol_name, stats),
        datasheet=_fill_required(_property_first(properties, ("Datasheet",)), "TBD", stats),
        description=_fill_required(_property_first(properties, ("Description",)), value or symbol_name, stats),
        manufacturer=_fill_required(manufacturer, "TBD", stats),
        manufacturer_part_number=_fill_required(mpn, value or symbol_name, stats),
        category=_infer_category(library),
        package_name="",
        vendor=vendor,
        vendor_part_number=vendor_part,
        symbol_file_path=_csv_path(symbol_path, csv_store_root=csv_store_root, service_store_root=service_store_root),
        symbol_target_library=library,
        symbol_target_name=symbol_name,
    )
    return row, footprint_ref


def _register_asset(
    service: ComponentCatalogService,
    conn: Any | None,
    *,
    asset_type: str,
    canonical_path: Path,
    target_library: str,
    target_name: str,
    source_group: str = "",
    generate_previews: bool,
    stats: ImportStats,
) -> None:
    if conn is None:
        return
    asset = service._register_asset(  # type: ignore[attr-defined]
        conn,
        asset_type=asset_type,
        canonical_path=canonical_path,
        target_library=target_library,
        target_name=target_name,
        source_group=source_group,
    )
    stats.assets_indexed += 1
    if generate_previews and asset_type in {"symbol", "footprint"}:
        stats.previews_attempted += 1
        service._ensure_asset_preview(conn, asset)  # type: ignore[attr-defined]


def _import_symbols(
    source_root: Path,
    service: ComponentCatalogService,
    conn: Any | None,
    *,
    dry_run: bool,
    overwrite: bool,
    skip_upgrade: bool,
    generate_previews: bool,
    csv_store_root: Path | None,
    component_rows: list[tuple[ComponentCsvRow, str]],
    stats: ImportStats,
) -> None:
    symbols_root = source_root / "symbols"
    if not symbols_root.is_dir():
        return

    for symbol_file in sorted(symbols_root.rglob("*.kicad_sym")):
        stats.symbol_libraries_seen += 1
        library = _library_from_symbol_file(symbol_file)
        print(f"Processing symbol library: {symbol_file.name} ({library}) ...")
        try:
            payload = symbol_file.read_bytes()
            if skip_upgrade:
                normalized = payload
            else:
                normalized = service._normalize_symbol_upload(symbol_file.name, payload)  # type: ignore[attr-defined]
            text = normalized.decode("utf-8", errors="ignore")
            symbols = _discover_symbol_names_in_text(text)
            blocks = dict(service._extract_top_level_symbol_blocks(text))  # type: ignore[attr-defined]
            if not symbols:
                stats.skipped_files += 1
                stats.errors.append(f"No symbols found in {symbol_file}")
                continue

            for symbol_name in symbols:
                try:
                    print(f"  -> Extracting symbol: {symbol_name}")
                    canonical_payload = service._single_symbol_payload(text, symbol_name)  # type: ignore[attr-defined]
                    destination = service._symbol_destination(library, symbol_name)  # type: ignore[attr-defined]
                    if destination.exists() and not _same_bytes(destination, canonical_payload) and not overwrite:
                        destination = _unique_destination(destination)
                    canonical = _write_canonical_file(
                        destination,
                        canonical_payload,
                        dry_run=dry_run,
                        overwrite=overwrite,
                        stats=stats,
                    )
                    stats.symbols_written += 1
                    if symbol_name in blocks:
                        component_rows.append(
                            _component_row_from_symbol(
                                symbol_name=symbol_name,
                                library=library,
                                symbol_block=blocks[symbol_name],
                                symbol_path=canonical,
                                csv_store_root=csv_store_root,
                                service_store_root=service.store_root,
                                stats=stats,
                            )
                        )
                    _register_asset(
                        service,
                        conn,
                        asset_type="symbol",
                        canonical_path=canonical,
                        target_library=library,
                        target_name=symbol_name,
                        source_group=symbol_file.name,
                        generate_previews=generate_previews,
                        stats=stats,
                    )
                except Exception as exc:  # noqa: BLE001
                    stats.errors.append(f"{symbol_file}::{symbol_name}: {exc}")
        except Exception as exc:  # noqa: BLE001
            stats.errors.append(f"{symbol_file}: {exc}")


def _import_footprints(
    source_root: Path,
    service: ComponentCatalogService,
    conn: Any | None,
    *,
    dry_run: bool,
    overwrite: bool,
    generate_previews: bool,
    stats: ImportStats,
) -> dict[str, tuple[Path, str, str]]:
    footprint_index: dict[str, tuple[Path, str, str]] = {}
    footprints_root = source_root / "footprints"
    if not footprints_root.is_dir():
        return footprint_index

    for footprint_file in sorted(footprints_root.rglob("*.kicad_mod")):
        try:
            print(f"Processing footprint: {footprint_file.name} ...")
            library = _library_from_footprint_file(footprint_file, footprints_root)
            text = _read_text(footprint_file)
            footprint_name = _discover_footprint_name_in_text(text) or footprint_file.stem
            destination = service._footprint_destination(library, footprint_name)  # type: ignore[attr-defined]
            if destination.exists() and footprint_file.read_bytes() != destination.read_bytes() and not overwrite:
                destination = _unique_destination(destination)
            canonical = _copy_canonical_file(
                footprint_file,
                destination,
                dry_run=dry_run,
                overwrite=overwrite,
                stats=stats,
            )
            stats.footprints_written += 1
            footprint_index.setdefault(footprint_name, (canonical, library, footprint_name))
            _register_asset(
                service,
                conn,
                asset_type="footprint",
                canonical_path=canonical,
                target_library=library,
                target_name=footprint_name,
                generate_previews=generate_previews,
                stats=stats,
            )
        except Exception as exc:  # noqa: BLE001
            stats.errors.append(f"{footprint_file}: {exc}")
    return footprint_index


def _resolve_footprint_reference(
    footprint_ref: str,
    footprint_index: dict[str, tuple[Path, str, str]],
) -> tuple[Path, str, str] | None:
    ref = (footprint_ref or "").strip()
    if not ref:
        return None
    if ":" in ref:
        library, name = ref.rsplit(":", 1)
        found = footprint_index.get(name)
        if found and found[1] == library:
            return found
        if found:
            return found
        return None
    return footprint_index.get(ref)


def _write_component_csv(
    output_path: Path,
    rows_with_footprints: list[tuple[ComponentCsvRow, str]],
    footprint_index: dict[str, tuple[Path, str, str]],
    *,
    csv_store_root: Path | None,
    service_store_root: Path,
    stats: ImportStats,
) -> None:
    print(f"Generating component metadata CSV at {output_path} ...")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDNAMES)
        writer.writeheader()
        for row, footprint_ref in rows_with_footprints:
            resolved = _resolve_footprint_reference(footprint_ref, footprint_index)
            if resolved:
                footprint_path, footprint_library, footprint_name = resolved
                row.footprint_file_path = _csv_path(
                    footprint_path,
                    csv_store_root=csv_store_root,
                    service_store_root=service_store_root,
                )
                row.footprint_target_library = footprint_library
                row.footprint_target_name = footprint_name
            writer.writerow(asdict(row))
            stats.component_csv_rows += 1


def _import_auxiliary_files(
    source_root: Path,
    service: ComponentCatalogService,
    conn: Any | None,
    *,
    dry_run: bool,
    overwrite: bool,
    stats: ImportStats,
) -> None:
    models_root = source_root / "3D"
    if models_root.is_dir():
        for model_file in sorted(models_root.rglob("*")):
            if not model_file.is_file() or model_file.suffix.lower() not in STEP_EXTENSIONS:
                continue
            try:
                print(f"Processing 3D model: {model_file.name} ...")
                library = _relative_library_name(model_file, models_root, "Prism_Models")
                destination = service._asset_root("3dmodel") / library / _sanitize_name(model_file.name, "model.step")  # type: ignore[attr-defined]
                canonical = _copy_canonical_file(
                    model_file,
                    destination,
                    dry_run=dry_run,
                    overwrite=overwrite,
                    stats=stats,
                )
                stats.models_written += 1
                _register_asset(
                    service,
                    conn,
                    asset_type="3dmodel",
                    canonical_path=canonical,
                    target_library=library,
                    target_name=canonical.name,
                    generate_previews=False,
                    stats=stats,
                )
            except Exception as exc:  # noqa: BLE001
                stats.errors.append(f"{model_file}: {exc}")

    spice_root = source_root / "spice"
    if spice_root.is_dir():
        for spice_file in sorted(spice_root.rglob("*")):
            if not spice_file.is_file() or spice_file.suffix.lower() not in SPICE_EXTENSIONS:
                continue
            try:
                print(f"Processing SPICE file: {spice_file.name} ...")
                library = _relative_library_name(spice_file, spice_root, "Prism_SPICE")
                destination = service._asset_root("spice") / library / _sanitize_name(spice_file.name, "model.lib")  # type: ignore[attr-defined]
                canonical = _copy_canonical_file(
                    spice_file,
                    destination,
                    dry_run=dry_run,
                    overwrite=overwrite,
                    stats=stats,
                )
                stats.spice_written += 1
                _register_asset(
                    service,
                    conn,
                    asset_type="spice",
                    canonical_path=canonical,
                    target_library=library,
                    target_name=canonical.name,
                    generate_previews=False,
                    stats=stats,
                )
            except Exception as exc:  # noqa: BLE001
                stats.errors.append(f"{spice_file}: {exc}")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Import existing KiCad libraries into Prism canonical storage. "
            "Packed symbol libraries are split into one .kicad_sym file per symbol."
        )
    )
    parser.add_argument("source_root", type=Path, help="Existing library root containing symbols/, footprints/, and 3D/")
    parser.add_argument(
        "--store-root",
        type=Path,
        default=None,
        help="Prism canonical store root. Defaults to backend settings KICAD_PROJECTS_ROOT/.kicad-prism-components.",
    )
    parser.add_argument(
        "--database-url",
        default=os.environ.get("CATALOG_DATABASE_URL", ""),
        help="Postgres URL used to index reusable asset rows. Defaults to CATALOG_DATABASE_URL.",
    )
    parser.add_argument("--no-index-db", action="store_true", help="Only write files; do not create/update Postgres asset rows.")
    parser.add_argument("--no-previews", action="store_true", help="Skip symbol/footprint preview generation.")
    parser.add_argument("--skip-symbol-upgrade", action="store_true", help="Do not run kicad-cli sym upgrade before splitting symbols.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite conflicting canonical files instead of writing suffixed names.")
    parser.add_argument("--dry-run", action="store_true", help="Report what would be imported without writing files or DB rows.")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero when any asset fails to import.")
    parser.add_argument("--report-json", type=Path, default=None, help="Optional path for a JSON import report.")
    parser.add_argument(
        "--component-csv",
        type=Path,
        default=None,
        help="Optional output CSV for Prism component metadata import, with canonical asset link columns.",
    )
    parser.add_argument(
        "--csv-store-root",
        type=Path,
        default=None,
        help=(
            "Store root to use when writing asset paths into --component-csv. "
            "Use /app/projects/.kicad-prism-components when the CSV will be uploaded to the Docker backend."
        ),
    )
    return parser


def main() -> int:
    args = _build_parser().parse_args()
    source_root = args.source_root.expanduser().resolve()
    if not source_root.is_dir():
        print(f"Source root does not exist: {source_root}", file=sys.stderr)
        return 2

    try:
        _load_catalog_runtime()
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    service = ComponentCatalogService(store_root=args.store_root, database_url=args.database_url or None)
    stats = ImportStats()
    component_rows: list[tuple[ComponentCsvRow, str]] = []

    conn = None
    conn_context = None
    fatal_error = False
    try:
        if args.dry_run:
            service._ensure_storage_dirs()  # type: ignore[attr-defined]
        elif args.no_index_db:
            service._ensure_storage_dirs()  # type: ignore[attr-defined]
        else:
            service.initialize()
            conn_context = service._connect()  # type: ignore[attr-defined]
            conn = conn_context.__enter__()

        _import_symbols(
            source_root,
            service,
            conn,
            dry_run=args.dry_run,
            overwrite=args.overwrite,
            skip_upgrade=args.skip_symbol_upgrade,
            generate_previews=not args.no_previews and not args.dry_run,
            csv_store_root=args.csv_store_root,
            component_rows=component_rows,
            stats=stats,
        )
        footprint_index = _import_footprints(
            source_root,
            service,
            conn,
            dry_run=args.dry_run,
            overwrite=args.overwrite,
            generate_previews=not args.no_previews and not args.dry_run,
            stats=stats,
        )
        if args.component_csv:
            _write_component_csv(
                args.component_csv,
                component_rows,
                footprint_index,
                csv_store_root=args.csv_store_root,
                service_store_root=service.store_root,
                stats=stats,
            )
        _import_auxiliary_files(
            source_root,
            service,
            conn,
            dry_run=args.dry_run,
            overwrite=args.overwrite,
            stats=stats,
        )

        if conn is not None:
            if args.dry_run:
                conn.rollback()
            else:
                conn.commit()
    except Exception as exc:  # noqa: BLE001
        fatal_error = True
        if conn is not None:
            conn.rollback()
        stats.errors.append(str(exc))
    finally:
        if conn_context is not None:
            conn_context.__exit__(None, None, None)

    report = asdict(stats)
    report["source_root"] = str(source_root)
    report["store_root"] = str(service.store_root)
    report["indexed_db"] = bool(not args.no_index_db and not args.dry_run)
    report["previews_enabled"] = bool(not args.no_previews and not args.dry_run)

    if args.report_json:
        args.report_json.parent.mkdir(parents=True, exist_ok=True)
        args.report_json.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps(report, indent=2))
    return 1 if fatal_error or (args.strict and stats.errors) else 0


if __name__ == "__main__":
    raise SystemExit(main())
