import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * SB2-98: a read shared by every component that asks for the same key. One request is
 * in flight per key; a component mounting later gets the value already read; the last
 * value stays shown while the key is re-read after `invalidateReads`. An entry goes when
 * nothing subscribes to it any more, so memory follows what is on screen.
 */
interface Entry {
  value: unknown;
  hasValue: boolean;
  error: unknown;
  inflight: Promise<void> | null;
  stale: boolean;
  listeners: Set<() => void>;
  snapshot: ReadState<unknown>;
}

export interface ReadState<T> {
  data: T | undefined;
  error: unknown;
}

const entries = new Map<string, Entry>();
const EMPTY: ReadState<never> = { data: undefined, error: null };

function entry(key: string): Entry {
  let found = entries.get(key);
  if (!found) {
    found = { value: undefined, hasValue: false, error: null, inflight: null, stale: true, listeners: new Set(), snapshot: EMPTY };
    entries.set(key, found);
  }
  return found;
}

function publish(item: Entry) {
  item.snapshot = { data: item.hasValue ? item.value : undefined, error: item.error };
  for (const listener of item.listeners) listener();
}

function load(key: string, item: Entry, fetcher: () => Promise<unknown>) {
  if (item.inflight || !item.stale) return;
  item.stale = false;
  item.inflight = fetcher().then(
    (value) => {
      item.value = value;
      item.hasValue = true;
      item.error = null;
    },
    (error) => {
      item.error = error;
    },
  ).finally(() => {
    item.inflight = null;
    if (item.listeners.size === 0) entries.delete(key);
    else publish(item);
  });
}

/** Mark every read whose key starts with `prefix` stale; subscribed ones re-read now. */
export function invalidateReads(prefix: string) {
  for (const [key, item] of entries) {
    if (!key.startsWith(prefix)) continue;
    item.stale = true;
    publish(item);
  }
}

/** Forget everything (tests). */
export function resetReads() {
  entries.clear();
}

export function useKeyedRead<T>(key: string | null, fetcher: () => Promise<T>): ReadState<T> {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (key === null) return () => undefined;
      const item = entry(key);
      item.listeners.add(notify);
      return () => {
        item.listeners.delete(notify);
        if (item.listeners.size === 0 && !item.inflight) entries.delete(key);
      };
    },
    [key],
  );
  const state = useSyncExternalStore(subscribe, () => (key === null ? EMPTY : entries.get(key)?.snapshot ?? EMPTY)) as ReadState<T>;
  useEffect(() => {
    if (key === null) return;
    const item = entry(key);
    load(key, item, fetcher);
    // The fetcher belongs to the key: a new key brings its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state]);
  return state;
}
