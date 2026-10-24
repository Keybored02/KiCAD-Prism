/** "2026-03-01" as "1 Mar". The date is read as a calendar day, with no time zone shift. */
export function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Days when the number of listings behind the figure differs from the day before. */
export function coverageChanges(history: ReadonlyArray<{ day: string; listings: number }>): string[] {
  const days: string[] = [];
  for (let index = 1; index < history.length; index += 1) {
    if (history[index].listings !== history[index - 1].listings) days.push(history[index].day);
  }
  return days;
}
