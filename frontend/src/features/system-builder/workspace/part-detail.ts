import type { PrismSelection } from "@/types/prism-selection";

import type { BoardIndexState } from "../use-board-indexes";

/** A part, pad or board net picked in the 3D view, for the workspace inspector (PLAN M8). */
export interface PartDetail {
  selection: PrismSelection & { occurrence: string };
  /** The board it is on (OBC-1, or Stack ▸ OBC-1 inside a subsystem). */
  boardName: string;
  /** That board's design index; null for a board without one. */
  index: BoardIndexState | null;
  /** Drop the part, keeping its board selected. */
  clear: () => void;
}
