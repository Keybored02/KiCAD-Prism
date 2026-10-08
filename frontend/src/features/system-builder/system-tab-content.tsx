import type { User } from "@/types/auth";
import type { SystemDocument } from "@/types/system";

import type { SystemTab } from "./system-tabs";
import type { PartDetail } from "./workspace/part-detail";
import type { WorkspaceSelection } from "./workspace/workspace-state";

export interface SystemTabProps {
  systemId: string;
  document: SystemDocument;
  /** The ETag every mutation sends as `If-Match`. */
  etag: string;
  canEdit: boolean;
  user: User | null;
  reload: () => Promise<void>;
  /** Switch tab, optionally selecting something in it (`{board: id}`, `{link: id}`). */
  onNavigate: (tab: SystemTab, params?: Record<string, string>) => void;
  /** The workspace selection the view shows (PLAN M8, SB2-61); views report their picks through `onSelect`. */
  selection?: WorkspaceSelection | null;
  onSelect?: (selection: WorkspaceSelection | null) => void;
  /** The 3D view reports the part picked on a board, for the inspector. */
  onPart?: (part: PartDetail | null) => void;
}
