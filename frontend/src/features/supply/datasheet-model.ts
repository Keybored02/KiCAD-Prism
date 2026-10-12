const STATUS_TEXT: Record<string, string> = {
  new: "A new version was kept.",
  unchanged: "Checked, nothing changed.",
  not_a_pdf: "The address did not give a PDF.",
  unreadable: "The file could not be read.",
  egress_denied: "This server is not allowed to reach that address.",
  response_too_large: "The file is larger than Prism keeps (25 MB).",
  unavailable: "The address did not answer.",
  auth_failed: "The address asked for a sign-in.",
  rate_limited: "The address is limiting requests.",
};

/** What the last check of a datasheet address found, in a sentence. */
export function datasheetStatusText(status: string | null): string {
  if (status === null) return "Not checked yet. Parts that are watched or on a project BOM are checked weekly.";
  return STATUS_TEXT[status] ?? "The address could not be read.";
}

export function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} kB`;
}
