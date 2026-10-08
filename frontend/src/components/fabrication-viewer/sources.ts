import type { FabricationSource } from "./types";

/** The fabrication package of a Release Studio build. */
export function buildSource(projectId: string, buildId: string): FabricationSource {
    const base =
        `/api/projects/${encodeURIComponent(projectId)}/release-studio`
        + `/builds/${encodeURIComponent(buildId)}/fabrication-view`;
    return {
        key: `build:${projectId}:${buildId}`,
        viewUrl: base,
        layerUrl: (layerId) => `${base}/layers/${encodeURIComponent(layerId)}.svg`,
    };
}

/** Gerber and drill files a build keeps, which the viewer draws. */
export function isFabricationMember(path: string): boolean {
    return path.startsWith("fabrication/gerbers/") || path.startsWith("fabrication/drill/");
}

/** A layer file the viewer draws. The Gerber job file is metadata and stays text. */
export function isLayerFile(path: string): boolean {
    return isFabricationMember(path) && !path.endsWith(".gbrjob");
}

export function memberFileName(path: string): string {
    return path.slice(path.lastIndexOf("/") + 1);
}
