/**
 * What the Supply pages last showed, kept for the life of the browser tab.
 *
 * Leaving Supply for Projects or the Library Manager unmounts every page, so a
 * return would start from a skeleton. A page that opts in starts from what it
 * showed last time and reloads behind it.
 */
const cache = new Map<string, unknown>();

export function readLoaded<T>(key: string | null): T | undefined {
  return key === null ? undefined : (cache.get(key) as T | undefined);
}

export function storeLoaded(key: string | null, data: unknown): void {
  if (key !== null) cache.set(key, data);
}

/** Forget everything: on sign-out, and between tests. */
export function clearLoadedCache(): void {
  cache.clear();
}
