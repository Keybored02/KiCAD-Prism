import type { User } from "@/types/auth";
import type { SystemDocument } from "@/types/system";

import type { SystemTab } from "./system-tabs";

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
}
