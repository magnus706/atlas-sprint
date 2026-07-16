// Where progress lives, and how we find it after a rename.
//
// The app was Atlas Sprint, then Pangea, now Globli — and the storage key
// trailed the repo name. Renaming the key without reading the old ones first
// would silently wipe every existing player's streak, XP and medals on their
// next visit. Keep this file boring and keep the legacy list intact.

export const STORAGE_KEY = "globli-v1";

/** Keys previous versions wrote to. Read-only: never written, never deleted
 *  (they stay as a backup). Newest first. */
export const LEGACY_STORAGE_KEYS = ["atlas-sprint-v1"];

/** Current key wins; otherwise fall back to the first legacy key holding data. */
export function pickStoredRaw(get: (k: string) => string | null): string | null {
  const current = get(STORAGE_KEY);
  if (current) return current;
  for (const k of LEGACY_STORAGE_KEYS) {
    const legacy = get(k);
    if (legacy) return legacy;
  }
  return null;
}
