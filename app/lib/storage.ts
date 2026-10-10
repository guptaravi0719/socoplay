/**
 * Device-only persistence for SocoPlay.  The legacy values are read once so
 * people who played before the rename keep their in-progress games.
 */
export const storageKeys = {
  recent: "socoplay:recent",
  favourites: "socoplay:favourites",
  solitaire: "socoplay:v2:save:solitaire",
  tileShift: "socoplay:tile-shift",
  flipPairs: "socoplay:flip-pairs",
  wordBloom: "socoplay:word-bloom",
} as const;

export const legacyStorageKeys = {
  recent: "cardcove-recent",
  favourites: "cardcove-favourites",
  solitaire: "cardcove:v2:save:solitaire",
  tileShift: "cardcove-tile-shift",
  flipPairs: "cardcove-flip-pairs",
  wordBloom: "cardcove-word-bloom",
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
