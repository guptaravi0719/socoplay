/** Game-state utilities for SocoPlay. */
export const storageKeys = {
  solitaire: "socoplay:v2:save:solitaire",
  game2048: "socoplay:2048",
} as const;

export const legacyStorageKeys = {
  solitaire: "cardcove:v2:save:solitaire",
  game2048: "cardcove:2048",
} as const;

export function readStored<T>(key: string, legacyKey?: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = window.localStorage.getItem(key);
    if (raw === null && legacyKey) {
      raw = window.localStorage.getItem(legacyKey);
      if (raw !== null) window.localStorage.setItem(key, raw);
    }
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing and full storage are both valid ways to play.
  }
}

export function removeStored(...keys: string[]) {
  if (typeof window === "undefined") return;
  try {
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}
