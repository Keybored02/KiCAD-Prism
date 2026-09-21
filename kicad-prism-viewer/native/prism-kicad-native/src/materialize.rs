use crate::contract::{
    Board, CoordinateSystem, Diagnostic, Document, Drill, Feature, KICAD_MONKEY_REVISION, Layer,
    Metrics, Net, SCHEMA, SourceIdentity, StackupLayer,
};
use crate::geometry::{
    Point, capsule, chamfered_rectangle, circle, mm_to_nm, oval, point_to_nm, rectangle,
    ring_to_nm, rounded_rectangle, sample_arc, transform_footprint, trapezoid,
};
use anyhow::{Context, Result, bail};
use kicad_monkey_core::{
    BoardFootprintOperation, BoardPlotLimits, BoardPlotRecord, BoardViaOperationKind, PcbFamily,
    PcbFootprint, PcbNetRef, PcbPad, PcbPadPrimitiveGeometry, PcbPoint, PcbPolygonPoint,
    PcbResolvedPadCopperLayer, PcbRoutingArc, PcbSegment, PcbSelection, PcbVia, PcbView, PcbZone,
    board_plot_document, resolve_pad_copper_layer,
};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::fs;
use std::path::Path;
use std::time::Instant;

pub const DEFAULT_TOLERANCE_MM: f64 = 0.005;

#[derive(Default)]
struct FlashOverrides {
    vias: HashMap<String, Vec<String>>,
    pads: HashMap<String, Vec<String>>,
    used_oracle: bool,
}

struct NetCatalog {
    nets: Vec<Net>,
    by_key: HashMap<String, usize>,
}

impl NetCatalog {
    fn from_sources<'a>(
        source_nets: impl IntoIterator<Item = (i64, String)>,
        refs: impl IntoIterator<Item = &'a PcbNetRef>,
    ) -> Self {
        let mut source_ordinals = BTreeMap::<String, i64>::new();
        for (ordinal, name) in source_nets {
            if !name.is_empty() {
                source_ordinals.entry(name).or_insert(ordinal);
            }
        }
        let mut keys = BTreeSet::new();
        keys.extend(source_ordinals.keys().cloned());
        for net in refs {
            if let Some(key) = net_key(net) {
                keys.insert(key);
            }
        }
        let nets = keys
            .into_iter()
            .enumerate()
            .map(|(index, key)| Net {
                index,
                name: key.clone(),
                source_ordinal: source_ordinals.get(&key).copied(),
                key,
            })
            .collect::<Vec<_>>();
        let by_key = nets
            .iter()
            .map(|net| (net.key.clone(), net.index))
            .collect();
        Self { nets, by_key }
    }

    fn index(&self, net: &PcbNetRef) -> Option<usize> {
        net_key(net).and_then(|key| self.by_key.get(&key).copied())
    }
}

pub fn materialize(path: &Path, curve_tolerance_mm: f64) -> Result<Document> {
    if curve_tolerance_mm <= 0.0 || !curve_tolerance_mm.is_finite() {
        bail!("curve tolerance must be finite and positive");
    }
    let total_started = Instant::now();
    let read_started = Instant::now();
    let bytes = fs::read(path).with_context(|| format!("read {}", path.display()))?;
    let source_read_ms = read_started.elapsed().as_secs_f64() * 1000.0;
    let source =
        std::str::from_utf8(&bytes).with_context(|| format!("{} is not UTF-8", path.display()))?;
    let digest_sha256 = Sha256::digest(&bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>();

    let parse_started = Instant::now();
    let selection = PcbSelection::none()
        .with(PcbFamily::Layers)
        .with(PcbFamily::Setup)
        .with(PcbFamily::Nets)
        .with(PcbFamily::Footprints)
        .with(PcbFamily::Pads)
        .with(PcbFamily::Segments)
        .with(PcbFamily::Arcs)
        .with(PcbFamily::Vias)
        .with(PcbFamily::Zones)
        .with(PcbFamily::Holes)
        .with(PcbFamily::FootprintTransforms);
    let view = PcbView::parse_selected(source, Default::default(), selection)
        .context("parse selected PCB source families with kicad-monkey-core")?;
    let parse_index_ms = parse_started.elapsed().as_secs_f64() * 1000.0;

    let extraction_started = Instant::now();
    let source_layers = view.layers().collect::<Result<Vec<_>, _>>()?;
    let layers = source_layers
        .iter()
        .enumerate()
        .map(|(index, layer)| Layer {
            index,
            key: layer.name.clone(),
            name: layer.name.clone(),
            source_ordinal: layer.ordinal,
            layer_type: layer.kind.clone(),
            user_name: layer.user_name.clone(),
        })
        .collect::<Vec<_>>();
    let copper_names = source_layers
        .iter()
        .filter(|layer| layer.name.ends_with(".Cu"))
        .map(|layer| layer.name.clone())
        .collect::<Vec<_>>();
    if copper_names.is_empty() {
        bail!("board exposes no copper layers");
    }
    let layer_index = layers
        .iter()
        .map(|layer| (layer.name.clone(), layer.index))
        .collect::<HashMap<_, _>>();

    let source_nets = view.nets().collect::<Result<Vec<_>, _>>()?;
    let footprints = view.footprints().collect::<Result<Vec<_>, _>>()?;
    let pads = view.pads().collect::<Result<Vec<_>, _>>()?;
    let segments = view.segments().collect::<Result<Vec<_>, _>>()?;
    let arcs = view.arcs().collect::<Result<Vec<_>, _>>()?;
    let vias = view.vias().collect::<Result<Vec<_>, _>>()?;
    let zones = view.zones().collect::<Result<Vec<_>, _>>()?;
    let metadata = view.metadata().context("decode board metadata")?;
    let setup = view.setup().context("decode board setup")?;
    let board = Board {
        thickness_mm: metadata.thickness,
        aux_axis_origin_nm: setup
            .as_ref()
            .map(|value| point_to_nm(point(value.aux_axis_origin)))
            .unwrap_or([0, 0]),
        stackup_layers: setup
            .as_ref()
            .and_then(|value| value.stackup.as_ref())
            .map(|stackup| {
                stackup
                    .layers
                    .iter()
                    .map(|layer| StackupLayer {
                        name: layer.name.clone(),
                        type_name: layer.type_name.clone(),
                        thickness_mm: layer.thickness,
                        material: layer.material.clone(),
                        epsilon_r: layer.epsilon_r,
                        loss_tangent: layer.loss_tangent,
                        color: layer.color.clone(),
                    })
                    .collect()
            })
            .unwrap_or_default(),
        copper_finish: setup
            .as_ref()
            .and_then(|value| value.stackup.as_ref())
            .map(|value| value.copper_finish.clone())
            .unwrap_or_default(),
        edge_connector: setup
            .as_ref()
            .and_then(|value| value.stackup.as_ref())
            .map(|value| value.edge_connector.clone())
            .unwrap_or_default(),
        edge_plating: setup
            .as_ref()
            .and_then(|value| value.stackup.as_ref())
            .is_some_and(|value| value.edge_plating),
    };

    let net_refs = segments
        .iter()
        .map(|item| &item.net)
        .chain(arcs.iter().map(|item| &item.net))
        .chain(vias.iter().map(|item| &item.net))
        .chain(pads.iter().map(|item| &item.net))
        .chain(zones.iter().map(|item| &item.net));
    let net_catalog = NetCatalog::from_sources(
        source_nets.into_iter().map(|net| (net.code, net.name)),
        net_refs,
    );

    let mut diagnostics = Vec::new();
    let overrides = flash_overrides(source, &vias, &pads, &mut diagnostics)?;
    let mut features = Vec::new();
    let mut drills = Vec::new();
    let mut source_order = 0usize;

    for segment in &segments {
        append_segment(
            segment,
            curve_tolerance_mm,
            &layer_index,
            &net_catalog,
            &mut source_order,
            &mut features,
        );
    }
    for arc in &arcs {
        append_arc(
            arc,
            curve_tolerance_mm,
            &layer_index,
            &net_catalog,
            &mut source_order,
            &mut features,
            &mut diagnostics,
        );
    }
    for via in &vias {
        append_via(
            via,
            curve_tolerance_mm,
            &copper_names,
            &layer_index,
            &net_catalog,
            &overrides,
            &mut source_order,
            &mut features,
            &mut drills,
        );
    }
    for zone in &zones {
        append_zone(
            zone,
            &layer_index,
            &net_catalog,
            &mut source_order,
            &mut features,
        );
    }
    for (pad_index, pad) in pads.iter().enumerate() {
        let Some(footprint) = footprints.get(pad.footprint_index) else {
            diagnostics.push(Diagnostic {
                severity: "error",
                code: "missing_footprint",
                message: format!(
                    "pad index {pad_index} references missing footprint {}",
                    pad.footprint_index
                ),
                source_uid: pad.uuid.clone(),
            });
            continue;
        };
        append_pad(
            pad,
            footprint,
            pad_index,
            curve_tolerance_mm,
            &copper_names,
            &layer_index,
            &net_catalog,
            &overrides,
            &mut source_order,
            &mut features,
            &mut drills,
            &mut diagnostics,
        );
    }

    let bounds_nm = feature_bounds(&features);
    let mut stats = BTreeMap::new();
    stats.insert("tracks".to_owned(), segments.len());
    stats.insert("track_arcs".to_owned(), arcs.len());
    stats.insert("vias".to_owned(), vias.len());
    stats.insert("pads".to_owned(), pads.len());
    stats.insert(
        "zone_fills".to_owned(),
        zones.iter().map(|zone| zone.filled_polygons.len()).sum(),
    );
    stats.insert("features".to_owned(), features.len());
    stats.insert("drills".to_owned(), drills.len());
    stats.insert("nets".to_owned(), net_catalog.nets.len());
    stats.insert("layers".to_owned(), layers.len());
    stats.insert("copper_layers".to_owned(), copper_names.len());
    stats.insert(
        "unsupported_features".to_owned(),
        diagnostics
            .iter()
            .filter(|item| item.code.starts_with("unsupported_") || item.severity == "error")
            .count(),
    );
    let extraction_ms = extraction_started.elapsed().as_secs_f64() * 1000.0;

    Ok(Document {
        schema: SCHEMA,
        kicad_monkey_revision: KICAD_MONKEY_REVISION,
        kicad_monkey_engine_version: kicad_monkey_core::ENGINE_VERSION,
        source: SourceIdentity {
            path: path.display().to_string(),
            digest_sha256,
            bytes: bytes.len(),
        },
        coordinate_system: CoordinateSystem::default(),
        curve_tolerance_mm,
        board,
        bounds_nm,
        layers,
        nets: net_catalog.nets,
        features,
        drills,
        diagnostics,
        stats,
        metrics: Metrics {
            source_read_ms,
            parse_index_ms,
            extraction_ms,
            serialization_ms: 0.0,
            total_ms: total_started.elapsed().as_secs_f64() * 1000.0,
            used_plot_facts_flash_oracle: overrides.used_oracle,
        },
    })
}

fn net_key(net: &PcbNetRef) -> Option<String> {
    net.name
        .as_ref()
        .filter(|name| !name.is_empty())
        .cloned()
        .or_else(|| {
            net.ordinal
                .filter(|ordinal| *ordinal != 0)
                .map(|ordinal| format!("#{ordinal}"))
        })
}

fn source_uid(kind: &str, uuid: Option<&str>, source_start: usize) -> String {
    uuid.filter(|value| !value.is_empty())
        .map(str::to_owned)
        .unwrap_or_else(|| format!("{kind}@{source_start}"))
}

fn semantic_id(kind: &str, source_uid: &str) -> String {
    format!("{kind}:{source_uid}")
}

fn expand_layers(requested: &[String], copper: &[String]) -> Vec<String> {
    if requested.iter().any(|name| name == "*.Cu") {
        return copper.to_vec();
    }
    if requested.iter().any(|name| name == "F&B.Cu") {
        return copper
            .iter()
            .filter(|name| matches!(name.as_str(), "F.Cu" | "B.Cu"))
            .cloned()
            .collect();
    }
    if requested.len() == 2
        && requested.iter().all(|name| copper.contains(name))
        && requested[0] != requested[1]
    {
        let first = copper
            .iter()
            .position(|name| name == &requested[0])
            .unwrap();
        let last = copper
            .iter()
            .position(|name| name == &requested[1])
            .unwrap();
        let low = first.min(last);
        let high = first.max(last);
        return copper[low..=high].to_vec();
    }
    requested
        .iter()
        .filter(|name| copper.contains(name))
        .cloned()
        .collect()
}

fn indexes(names: &[String], layer_index: &HashMap<String, usize>) -> Vec<usize> {
    names
        .iter()
        .filter_map(|name| layer_index.get(name).copied())
        .collect()
}

fn append_segment(
    segment: &PcbSegment,
    tolerance: f64,
    layer_index: &HashMap<String, usize>,
    nets: &NetCatalog,
    source_order: &mut usize,
    features: &mut Vec<Feature>,
) {
    let (Some(layer), Some(width)) = (segment.layer.as_ref(), segment.width) else {
        return;
    };
    let Some(index) = layer_index.get(layer).copied() else {
        return;
    };
    if width <= 0.0 {
        return;
    }
    let uid = source_uid("track", segment.uuid.as_deref(), segment.source_range.start);
    features.push(Feature {
        source_order: *source_order,
        semantic_id: semantic_id("track", &uid),
        kind: "track".to_owned(),
        source_uid: uid,
        net_index: nets.index(&segment.net),
        layer_indexes: vec![index],
        outer_nm: ring_to_nm(capsule(
            Point::new(segment.start_x, segment.start_y),
            Point::new(segment.end_x, segment.end_y),
            width / 2.0,
            tolerance,
        )),
        holes_nm: Vec::new(),
        footprint_uid: None,
        component_ref: None,
        pad_number: None,
        island: false,
    });
    *source_order += 1;
}

fn append_arc(
    arc: &PcbRoutingArc,
    tolerance: f64,
    layer_index: &HashMap<String, usize>,
    nets: &NetCatalog,
    source_order: &mut usize,
    features: &mut Vec<Feature>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let (Some(layer), Some(width)) = (arc.layer.as_ref(), arc.width) else {
        return;
    };
    let Some(index) = layer_index.get(layer).copied() else {
        return;
    };
    if width <= 0.0 {
        return;
    }
    let uid = source_uid("track_arc", arc.uuid.as_deref(), arc.source_range.start);
    let Some(points) = sample_arc(point(arc.start), point(arc.mid), point(arc.end), tolerance)
    else {
        diagnostics.push(Diagnostic {
            severity: "warning",
            code: "degenerate_arc",
            message: "routing arc is collinear and was lowered as a straight capsule".to_owned(),
            source_uid: Some(uid.clone()),
        });
        let outer = capsule(point(arc.start), point(arc.end), width / 2.0, tolerance);
        push_arc_feature(
            &uid,
            index,
            nets.index(&arc.net),
            outer,
            source_order,
            features,
        );
        return;
    };
    for pair in points.windows(2) {
        let outer = capsule(pair[0], pair[1], width / 2.0, tolerance);
        push_arc_feature(
            &uid,
            index,
            nets.index(&arc.net),
            outer,
            source_order,
            features,
        );
    }
}

fn push_arc_feature(
    uid: &str,
    layer_index: usize,
    net_index: Option<usize>,
    outer: Vec<Point>,
    source_order: &mut usize,
    features: &mut Vec<Feature>,
) {
    features.push(Feature {
        source_order: *source_order,
        semantic_id: semantic_id("track_arc", uid),
        kind: "track_arc".to_owned(),
        source_uid: uid.to_owned(),
        net_index,
        layer_indexes: vec![layer_index],
        outer_nm: ring_to_nm(outer),
        holes_nm: Vec::new(),
        footprint_uid: None,
        component_ref: None,
        pad_number: None,
        island: false,
    });
    *source_order += 1;
}

#[allow(clippy::too_many_arguments)]
fn append_via(
    via: &PcbVia,
    tolerance: f64,
    copper_names: &[String],
    layer_index: &HashMap<String, usize>,
    nets: &NetCatalog,
    overrides: &FlashOverrides,
    source_order: &mut usize,
    features: &mut Vec<Feature>,
    drills: &mut Vec<Drill>,
) {
    let uid = source_uid("via", via.uuid.as_deref(), via.source_range.start);
    let physical_layers = expand_layers(&via.layers, copper_names);
    let flash_layers = overrides
        .vias
        .get(&uid)
        .cloned()
        .unwrap_or_else(|| physical_layers.clone());
    let hole = (via.drill > 0.0).then(|| {
        ring_to_nm(circle(
            Point::new(via.at_x, via.at_y),
            via.drill / 2.0,
            tolerance,
        ))
    });
    for layer in flash_layers {
        let Some(index) = layer_index.get(&layer).copied() else {
            continue;
        };
        let diameter = via_diameter(via, &layer);
        if diameter <= 0.0 {
            continue;
        }
        features.push(Feature {
            source_order: *source_order,
            semantic_id: semantic_id("via", &uid),
            kind: "via".to_owned(),
            source_uid: uid.clone(),
            net_index: nets.index(&via.net),
            layer_indexes: vec![index],
            outer_nm: ring_to_nm(circle(
                Point::new(via.at_x, via.at_y),
                diameter / 2.0,
                tolerance,
            )),
            holes_nm: hole.clone().into_iter().collect(),
            footprint_uid: None,
            component_ref: None,
            pad_number: None,
            island: false,
        });
        *source_order += 1;
    }
    if via.drill > 0.0 {
        drills.push(Drill {
            semantic_id: semantic_id("via_hole", &uid),
            source_uid: uid,
            kind: "via".to_owned(),
            center_nm: [mm_to_nm(via.at_x), mm_to_nm(via.at_y)],
            width_nm: mm_to_nm(via.drill),
            height_nm: mm_to_nm(via.drill),
            oval: false,
            plated: true,
            layer_indexes: indexes(&physical_layers, layer_index),
            footprint_uid: None,
            component_ref: None,
            pad_number: None,
        });
    }
}

fn via_diameter(via: &PcbVia, layer: &str) -> f64 {
    let Some(stack) = via.padstack.as_ref() else {
        return via.size;
    };
    let selector =
        if stack.mode.as_deref() == Some("front_inner_back") && !matches!(layer, "F.Cu" | "B.Cu") {
            "Inner"
        } else {
            layer
        };
    stack
        .layers
        .iter()
        .find(|row| row.layer == selector)
        .and_then(|row| row.size)
        .unwrap_or(via.size)
}

fn append_zone(
    zone: &PcbZone,
    layer_index: &HashMap<String, usize>,
    nets: &NetCatalog,
    source_order: &mut usize,
    features: &mut Vec<Feature>,
) {
    let uid = source_uid("zone", zone.uuid.as_deref(), zone.source_range.start);
    for polygon in &zone.filled_polygons {
        let layer = if polygon.layer.is_empty() && zone.layers.len() == 1 {
            &zone.layers[0]
        } else {
            &polygon.layer
        };
        let Some(index) = layer_index.get(layer).copied() else {
            continue;
        };
        let outer_nm = ring_to_nm(polygon.points.iter().copied().map(point));
        if outer_nm.len() < 3 {
            continue;
        }
        features.push(Feature {
            source_order: *source_order,
            semantic_id: semantic_id("zone_fill", &uid),
            kind: "zone_fill".to_owned(),
            source_uid: uid.clone(),
            net_index: nets.index(&zone.net),
            layer_indexes: vec![index],
            outer_nm,
            holes_nm: Vec::new(),
            footprint_uid: None,
            component_ref: None,
            pad_number: None,
            island: polygon.island,
        });
        *source_order += 1;
    }
}

#[allow(clippy::too_many_arguments)]
fn append_pad(
    pad: &PcbPad,
    footprint: &PcbFootprint,
    pad_index: usize,
    tolerance: f64,
    copper_names: &[String],
    layer_index: &HashMap<String, usize>,
    nets: &NetCatalog,
    overrides: &FlashOverrides,
    source_order: &mut usize,
    features: &mut Vec<Feature>,
    drills: &mut Vec<Drill>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let uid = source_uid("pad", pad.uuid.as_deref(), pad.source_range.start);
    let footprint_uid = source_uid(
        "footprint",
        footprint.uuid.as_deref(),
        footprint.source_range.start,
    );
    let component_ref = footprint
        .reference
        .clone()
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| footprint.library_link.clone());
    let authored_layers = expand_layers(&pad.layers, copper_names);
    let flash_layers = overrides.pads.get(&uid).cloned().unwrap_or(authored_layers);
    let footprint_origin = Point::new(
        footprint.at_x.unwrap_or_default(),
        footprint.at_y.unwrap_or_default(),
    );
    let footprint_angle = footprint.angle.unwrap_or_default();
    let pad_anchor = transform_footprint(
        Point::new(pad.at_x, pad.at_y),
        footprint_origin,
        footprint_angle,
    );
    let hole = pad.drill.as_ref().and_then(|drill| {
        (drill.width > 0.0 && drill.height.unwrap_or(drill.width) > 0.0).then(|| {
            let height = drill.height.unwrap_or(drill.width);
            let world_ring = oval(pad_anchor, drill.width, height, -pad.angle, tolerance);
            (drill, height, pad_anchor, ring_to_nm(world_ring))
        })
    });

    // KiCad may serialize `*.Cu` selectors on NPTH mechanical holes, but they
    // do not flash copper. The drill remains part of the contract below.
    if pad.kind != "np_thru_hole" {
        for layer in flash_layers {
            let Some(index) = layer_index.get(&layer).copied() else {
                continue;
            };
            let resolved = match resolve_pad_copper_layer(pad, &layer) {
                Ok(value) => value,
                Err(error) => {
                    diagnostics.push(Diagnostic {
                        severity: "warning",
                        code: "unsupported_padstack",
                        message: format!("pad {uid} layer {layer}: {error}"),
                        source_uid: Some(uid.clone()),
                    });
                    continue;
                }
            };
            let rings = pad_rings(pad, &resolved, pad_anchor, tolerance, &uid, diagnostics);
            for ring in rings {
                let outer_nm = ring_to_nm(ring);
                if outer_nm.len() < 3 {
                    continue;
                }
                features.push(Feature {
                    source_order: *source_order,
                    semantic_id: semantic_id("pad", &uid),
                    kind: "pad".to_owned(),
                    source_uid: uid.clone(),
                    net_index: nets.index(&pad.net),
                    layer_indexes: vec![index],
                    outer_nm,
                    holes_nm: hole
                        .as_ref()
                        .map(|(_, _, _, ring)| ring.clone())
                        .into_iter()
                        .collect(),
                    footprint_uid: Some(footprint_uid.clone()),
                    component_ref: Some(component_ref.clone()),
                    pad_number: Some(pad.number.clone()),
                    island: false,
                });
                *source_order += 1;
            }
        }
    }

    if let Some((drill, height, center, _)) = hole {
        let plated = pad.plated.unwrap_or(pad.kind != "np_thru_hole");
        let mut physical_layers = if plated {
            copper_names.to_vec()
        } else {
            expand_layers(&pad.layers, copper_names)
        };
        if physical_layers.is_empty() {
            // Mask-only NPTH declarations still pass mechanically through the
            // complete board even though they flash no copper.
            physical_layers = copper_names.to_vec();
        }
        drills.push(Drill {
            semantic_id: semantic_id("pad_hole", &uid),
            source_uid: uid,
            kind: if plated { "plated_pad" } else { "npth_pad" }.to_owned(),
            center_nm: point_to_nm(center),
            width_nm: mm_to_nm(drill.width),
            height_nm: mm_to_nm(height),
            oval: (drill.width - height).abs() > 1e-12,
            plated,
            layer_indexes: indexes(&physical_layers, layer_index),
            footprint_uid: Some(footprint_uid),
            component_ref: Some(component_ref),
            pad_number: Some(pad.number.clone()),
        });
    }
    let _ = pad_index;
}

fn pad_rings(
    pad: &PcbPad,
    resolved: &PcbResolvedPadCopperLayer<'_>,
    pad_anchor: Point,
    tolerance: f64,
    uid: &str,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<Vec<Point>> {
    let rotated_offset =
        crate::geometry::rotate(Point::new(resolved.offset.x, resolved.offset.y), -pad.angle);
    let center = Point::new(
        pad_anchor.x + rotated_offset.x,
        pad_anchor.y + rotated_offset.y,
    );
    let width = resolved.size.x;
    let height = resolved.size.y;
    if width <= 0.0 || height <= 0.0 {
        return Vec::new();
    }
    if resolved.shape == "roundrect"
        && resolved.roundrect_rratio.abs() <= f64::EPSILON
        && resolved.chamfer_ratio > 0.0
        && !resolved.chamfer_corners.is_empty()
    {
        return vec![chamfered_rectangle(
            center,
            width,
            height,
            resolved.chamfer_ratio,
            resolved.chamfer_corners,
            -pad.angle,
        )];
    }
    match resolved.shape {
        "circle" => vec![circle(center, width / 2.0, tolerance)],
        "oval" => vec![oval(center, width, height, -pad.angle, tolerance)],
        "rect" => vec![rectangle(center, width, height, -pad.angle)],
        "roundrect" => vec![rounded_rectangle(
            center,
            width,
            height,
            width.min(height) * resolved.roundrect_rratio,
            -pad.angle,
            tolerance,
        )],
        "trapezoid" => vec![trapezoid(
            center,
            width,
            height,
            resolved.rect_delta.x,
            resolved.rect_delta.y,
            -pad.angle,
        )],
        "custom" => custom_pad_rings(pad, resolved, center, tolerance, uid, diagnostics),
        shape => {
            diagnostics.push(Diagnostic {
                severity: "warning",
                code: "unsupported_pad_shape",
                message: format!("pad {uid} uses unsupported shape {shape}"),
                source_uid: Some(uid.to_owned()),
            });
            Vec::new()
        }
    }
}

fn custom_pad_rings(
    pad: &PcbPad,
    resolved: &PcbResolvedPadCopperLayer<'_>,
    pad_anchor: Point,
    tolerance: f64,
    uid: &str,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<Vec<Point>> {
    let mut rings = Vec::new();
    for primitive in resolved.custom_primitives {
        let width = primitive.width.unwrap_or(0.0);
        let Some(geometry) = primitive.geometry.as_ref() else {
            diagnostics.push(Diagnostic {
                severity: "warning",
                code: "unsupported_custom_pad_primitive",
                message: format!(
                    "pad {uid} custom primitive {} has no supported geometry",
                    primitive.kind
                ),
                source_uid: Some(uid.to_owned()),
            });
            continue;
        };
        let local_rings = match geometry {
            PcbPadPrimitiveGeometry::Line { start, end } if width > 0.0 => {
                vec![capsule(point(*start), point(*end), width / 2.0, tolerance)]
            }
            PcbPadPrimitiveGeometry::Arc { start, mid, end } if width > 0.0 => {
                sample_arc(point(*start), point(*mid), point(*end), tolerance)
                    .map(|points| {
                        points
                            .windows(2)
                            .map(|pair| capsule(pair[0], pair[1], width / 2.0, tolerance))
                            .collect()
                    })
                    .unwrap_or_default()
            }
            PcbPadPrimitiveGeometry::Circle { center, end } => {
                let center = point(*center);
                let radius = (end.x - center.x).hypot(end.y - center.y);
                vec![circle(center, radius + width.max(0.0) / 2.0, tolerance)]
            }
            PcbPadPrimitiveGeometry::Rect { start, end, radius } => {
                let start = point(*start);
                let end = point(*end);
                let center = Point::new((start.x + end.x) / 2.0, (start.y + end.y) / 2.0);
                let width = (end.x - start.x).abs();
                let height = (end.y - start.y).abs();
                vec![rounded_rectangle(
                    center,
                    width,
                    height,
                    radius.unwrap_or_default(),
                    0.0,
                    tolerance,
                )]
            }
            PcbPadPrimitiveGeometry::Polygon { points } => {
                vec![polygon_points(points, tolerance)]
            }
            PcbPadPrimitiveGeometry::Curve { points } if width > 0.0 => {
                bezier_rings(*points, width, tolerance)
            }
            PcbPadPrimitiveGeometry::BoundingBoxProxy { .. }
            | PcbPadPrimitiveGeometry::VectorProxy { .. }
            | PcbPadPrimitiveGeometry::Line { .. }
            | PcbPadPrimitiveGeometry::Arc { .. }
            | PcbPadPrimitiveGeometry::Curve { .. } => {
                diagnostics.push(Diagnostic {
                    severity: "warning",
                    code: "unsupported_custom_pad_primitive",
                    message: format!(
                        "pad {uid} custom primitive {} cannot be materialized",
                        primitive.kind
                    ),
                    source_uid: Some(uid.to_owned()),
                });
                Vec::new()
            }
        };
        for ring in local_rings {
            rings.push(
                ring.into_iter()
                    .map(|point| {
                        let rotated = crate::geometry::rotate(point, -pad.angle);
                        Point::new(rotated.x + pad_anchor.x, rotated.y + pad_anchor.y)
                    })
                    .collect(),
            );
        }
    }
    rings
}

fn polygon_points(points: &[PcbPolygonPoint], tolerance: f64) -> Vec<Point> {
    let mut output = Vec::new();
    for item in points {
        match item {
            PcbPolygonPoint::Xy(value) => output.push(point(*value)),
            PcbPolygonPoint::Arc { start, mid, end } => {
                if let Some(sampled) =
                    sample_arc(point(*start), point(*mid), point(*end), tolerance)
                {
                    if output.last().is_some() {
                        output.extend(sampled.into_iter().skip(1));
                    } else {
                        output.extend(sampled);
                    }
                }
            }
        }
    }
    output
}

fn bezier_rings(points: [PcbPoint; 4], width: f64, tolerance: f64) -> Vec<Vec<Point>> {
    let samples = 24usize;
    let path = (0..=samples)
        .map(|index| {
            let t = index as f64 / samples as f64;
            let mt = 1.0 - t;
            Point::new(
                mt.powi(3) * points[0].x
                    + 3.0 * mt.powi(2) * t * points[1].x
                    + 3.0 * mt * t.powi(2) * points[2].x
                    + t.powi(3) * points[3].x,
                mt.powi(3) * points[0].y
                    + 3.0 * mt.powi(2) * t * points[1].y
                    + 3.0 * mt * t.powi(2) * points[2].y
                    + t.powi(3) * points[3].y,
            )
        })
        .collect::<Vec<_>>();
    path.windows(2)
        .map(|pair| capsule(pair[0], pair[1], width / 2.0, tolerance))
        .collect()
}

fn point(value: PcbPoint) -> Point {
    Point::new(value.x, value.y)
}

fn flash_overrides(
    source: &str,
    vias: &[PcbVia],
    pads: &[PcbPad],
    diagnostics: &mut Vec<Diagnostic>,
) -> Result<FlashOverrides> {
    let required = vias.iter().any(|via| {
        via.remove_unused_layers == Some(true)
            || via.keep_end_layers.is_some()
            || via.start_end_only == Some(true)
            || via.zone_layer_connections.is_some()
    }) || pads.iter().any(|pad| {
        pad.remove_unused_layers == Some(true)
            || pad.keep_end_layers.is_some()
            || pad.zone_layer_connections.is_some()
    });
    if !required {
        return Ok(FlashOverrides::default());
    }
    let mut limits = BoardPlotLimits::default();
    limits.max_source_bytes = limits.max_source_bytes.max(source.len().saturating_add(1));
    let document = board_plot_document(source, limits)
        .context("resolve effective pad/via flash layers with kicad-monkey board facts")?;
    let mut result = FlashOverrides {
        used_oracle: true,
        ..FlashOverrides::default()
    };
    for record in document.records {
        match record {
            BoardPlotRecord::Via(via) => {
                let layers = via
                    .operations
                    .iter()
                    .find(|operation| operation.kind == BoardViaOperationKind::Aperture)
                    .map(|operation| operation.layers.clone())
                    .unwrap_or_default();
                result.vias.insert(via.uuid, layers);
            }
            BoardPlotRecord::Footprint(footprint) => {
                for operation in footprint.operations {
                    if let BoardFootprintOperation::StartBlock(block) = operation
                        && block.data_ref == "pad"
                    {
                        result.pads.insert(block.data_uuid, block.layers);
                    }
                }
            }
            _ => {}
        }
    }
    diagnostics.push(Diagnostic {
        severity: "warning",
        code: "plot_facts_flash_oracle",
        message:
            "used kicad-monkey board plot facts only to resolve conditional pad/via copper flashing"
                .to_owned(),
        source_uid: None,
    });
    Ok(result)
}

fn feature_bounds(features: &[Feature]) -> Option<[i64; 4]> {
    let mut bounds: Option<[i64; 4]> = None;
    for point in features.iter().flat_map(|feature| feature.outer_nm.iter()) {
        bounds = Some(match bounds {
            None => [point[0], point[1], point[0], point[1]],
            Some(current) => [
                current[0].min(point[0]),
                current[1].min(point[1]),
                current[2].max(point[0]),
                current[3].max(point[1]),
            ],
        });
    }
    bounds
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn layer_selectors_expand_without_inventing_non_copper_layers() {
        let copper = vec!["F.Cu".to_owned(), "In1.Cu".to_owned(), "B.Cu".to_owned()];
        assert_eq!(expand_layers(&["*.Cu".to_owned()], &copper), copper);
        assert_eq!(
            expand_layers(&["F&B.Cu".to_owned()], &copper),
            vec!["F.Cu".to_owned(), "B.Cu".to_owned()]
        );
        assert_eq!(
            expand_layers(&["F.Cu".to_owned(), "B.Cu".to_owned()], &copper),
            copper
        );
    }

    #[test]
    fn authoritative_net_name_wins_over_ordinal() {
        assert_eq!(
            net_key(&PcbNetRef {
                ordinal: Some(7),
                name: Some("GND".to_owned()),
            }),
            Some("GND".to_owned())
        );
    }

    #[test]
    fn default_tolerance_is_the_contract_value() {
        assert_eq!(DEFAULT_TOLERANCE_MM, 0.005);
    }
}
