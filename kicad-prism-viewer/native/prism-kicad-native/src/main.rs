pub mod analytic_contract;
mod contract;
pub mod geometer_packets;
mod geometry;
mod materialize;
pub mod semantic_compiler;

use anyhow::{Context, Result, bail};
use std::env;
use std::path::PathBuf;
use std::time::Instant;

fn main() {
    if let Err(error) = run() {
        eprintln!("prism-kicad-native: {error:#}");
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let mut pretty = false;
    let mut analytic = false;
    let mut source = None;
    for argument in env::args().skip(1) {
        match argument.as_str() {
            "emit-analytic" if source.is_none() && !analytic => analytic = true,
            "--pretty" => pretty = true,
            "--version" => {
                println!(
                    "prism-kicad-native {} kicad-monkey {}",
                    env!("CARGO_PKG_VERSION"),
                    contract::KICAD_MONKEY_REVISION
                );
                return Ok(());
            }
            value if value.starts_with('-') => bail!("unknown option: {value}"),
            value if source.is_some() => bail!("expected exactly one .kicad_pcb path, got {value}"),
            value => source = Some(PathBuf::from(value)),
        }
    }
    let source =
        source.context("usage: prism-kicad-native [emit-analytic] [--pretty] board.kicad_pcb")?;
    let started = Instant::now();
    if analytic {
        let mut document =
            materialize::materialize_analytic(&source, materialize::DEFAULT_TOLERANCE_MM)?;
        let serialize_started = Instant::now();
        let _ = serde_json::to_vec(&document).context("serialize Prism analytic PCB geometry")?;
        document.metrics.serialization_ms = serialize_started.elapsed().as_secs_f64() * 1000.0;
        document.metrics.total_ms = started.elapsed().as_secs_f64() * 1000.0;
        if pretty {
            serde_json::to_writer_pretty(std::io::stdout().lock(), &document)?;
        } else {
            serde_json::to_writer(std::io::stdout().lock(), &document)?;
        }
        println!();
        return Ok(());
    }
    let mut document = materialize::materialize(&source, materialize::DEFAULT_TOLERANCE_MM)?;
    let serialize_started = Instant::now();
    let _ = serde_json::to_vec(&document).context("serialize Prism PCB geometry")?;
    document.metrics.serialization_ms = serialize_started.elapsed().as_secs_f64() * 1000.0;
    document.metrics.total_ms = started.elapsed().as_secs_f64() * 1000.0;
    if pretty {
        serde_json::to_writer_pretty(std::io::stdout().lock(), &document)?;
    } else {
        serde_json::to_writer(std::io::stdout().lock(), &document)?;
    }
    println!();
    Ok(())
}
