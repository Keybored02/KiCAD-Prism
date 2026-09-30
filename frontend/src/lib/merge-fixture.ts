/**
 * A hand-built merge plan for working on the merge UI without a live agent.
 *
 * MergePage normally claims a one-time session from the desktop agent and fetches
 * a real plan; that needs KiCad running a merge. This fixture stands in for that
 * so the page can be opened at /merge-preview and iterated on with hot reload.
 * It deliberately exercises every decision shape the UI must handle: a plain
 * conflict, a field-level merge, an inferred-identity pairing, a one-sided add, a
 * trace group that follows a moved part, and a text file git couldn't merge.
 *
 * Preview only. Nothing here is wired to the agent or ever written to a repo.
 */

import type {
    MergeDecision,
    MergeFile,
    MergePlan,
    MergeSession,
    TraceGroup,
} from "./merge-agent";

function decision(partial: Partial<MergeDecision> & Pick<MergeDecision, "key" | "classification">): MergeDecision {
    return {
        kind: "footprint",
        ours_action: "modified",
        theirs_action: "modified",
        resolutions: ["ours", "theirs"],
        default: "ours",
        needs_input: partial.classification === "conflict"
            || partial.classification === "both_fields"
            || partial.classification === "undescribable"
            || partial.classification === "key_collision",
        base_item: null,
        ours_item: null,
        theirs_item: null,
        conflicting_fields: {},
        merged_fields: {},
        detail: "",
        inferred_identity: false,
        inferred_from: "",
        inferred_score: 0,
        ...partial,
    };
}

const pcbDecisions: MergeDecision[] = [
    decision({
        key: "fp:R42",
        classification: "conflict",
        detail: "R42 moved to different positions on each side.",
        conflicting_fields: {
            "position.x": { base: 100.0, ours: 112.5, theirs: 118.0 },
            "position.y": { base: 50.0, ours: 50.0, theirs: 62.0 },
        },
        base_item: { reference: "R42", value: "10k" },
        ours_item: { reference: "R42", value: "10k" },
        theirs_item: { reference: "R42", value: "10k" },
    }),
    decision({
        key: "fp:C7",
        classification: "both_fields",
        detail: "C7 changed different, non-overlapping fields on each side.",
        conflicting_fields: {},
        merged_fields: { value: "theirs", "position.x": "ours" },
        base_item: { reference: "C7", value: "100nF" },
        ours_item: { reference: "C7", value: "100nF" },
        theirs_item: { reference: "C7", value: "220nF" },
    }),
    decision({
        key: "fp:U3",
        classification: "conflict",
        detail: "A part whose uuid changed on one side; paired by similarity.",
        inferred_identity: true,
        inferred_from: "theirs",
        inferred_score: 0.92,
        conflicting_fields: {
            "lib_id": { base: "MCU:STM32", ours: "MCU:STM32", theirs: "MCU:STM32F4" },
        },
        base_item: { reference: "U3", value: "STM32" },
        ours_item: { reference: "U3", value: "STM32" },
        theirs_item: { reference: "U3", value: "STM32F4" },
    }),
    decision({
        key: "fp:J9",
        classification: "only_theirs",
        ours_action: "unchanged",
        theirs_action: "added",
        detail: "J9 was added on theirs.",
        resolutions: ["theirs", "drop"],
        default: "theirs",
        theirs_item: { reference: "J9", value: "USB-C" },
    }),
];

const traceGroups: TraceGroup[] = [
    {
        id: "grp:GND-1",
        net_name: "GND",
        keys: ["seg:1", "seg:2", "seg:3", "seg:4"],
        layers: ["F.Cu", "B.Cu"],
        endpoints_on: ["fp:R42", "fp:C7"],
        resolutions: ["ours", "theirs"],
        default: "ours",
        settled: [],
        follows: "fp:R42",
        follows_reference: "R42",
        conflicts: [],
        reason: "A reroute of GND that lands on R42; follows the part's move.",
    },
    {
        id: "grp:VBUS-1",
        net_name: "VBUS",
        keys: ["seg:9", "seg:10"],
        layers: ["F.Cu"],
        endpoints_on: ["fp:J9"],
        resolutions: ["ours", "theirs"],
        default: "theirs",
        settled: [],
        follows: "",
        follows_reference: "",
        conflicts: [],
        reason: "Both sides rerouted VBUS differently.",
    },
];

const schDecisions: MergeDecision[] = [
    decision({
        key: "sym:R42",
        kind: "symbol",
        classification: "conflict",
        detail: "R42's value differs between the two sides.",
        conflicting_fields: {
            value: { base: "10k", ours: "10k", theirs: "4k7" },
        },
        base_item: { reference: "R42", value: "10k" },
        ours_item: { reference: "R42", value: "10k" },
        theirs_item: { reference: "R42", value: "4k7" },
    }),
    decision({
        key: "sym:N1",
        kind: "symbol",
        classification: "undescribable",
        detail: "Both sides changed N1 but no single field explains the difference.",
        base_item: { reference: "N1" },
        ours_item: { reference: "N1" },
        theirs_item: { reference: "N1" },
    }),
];

const files: MergeFile[] = [
    {
        path: "boards/main.kicad_pcb",
        kind: "pcb",
        semantic: true,
        decisions: pcbDecisions,
        groups: traceGroups,
        detail: "",
        needs_input: pcbDecisions.filter(d => d.needs_input).length,
    },
    {
        path: "boards/main.kicad_sch",
        kind: "sch",
        semantic: true,
        decisions: schDecisions,
        groups: [],
        detail: "",
        needs_input: schDecisions.filter(d => d.needs_input).length,
    },
];

export const FIXTURE_PLAN: MergePlan = {
    repo: "satnogs-comms-hardware",
    ours: "feature/rf-frontend",
    theirs: "main",
    base: "a1b2c3d",
    files,
    text_files: ["README.md", "docs/changelog.md"],
    detail: "",
    needs_input: files.reduce((n, f) => n + f.needs_input, 0),
};

/** Text files git couldn't merge by line, surfaced as a per-file choice. */
export const FIXTURE_TEXT_CONFLICTS: string[] = ["docs/changelog.md"];

/** A stand-in session so nothing tries to reach a real agent. */
export const FIXTURE_SESSION: MergeSession = {
    port: 0,
    id: "preview",
    token: "preview",
    ref: "preview",
};
