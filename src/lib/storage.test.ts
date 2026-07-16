import { describe, it, expect } from "vitest";
import { pickStoredRaw, STORAGE_KEY, LEGACY_STORAGE_KEYS } from "./storage";

// The Globli rename moved the storage key off "atlas-sprint-v1". If this
// fallback is wrong, every existing player silently loses their streak, XP and
// medals on first open — the single most destructive bug this app could ship.
const store = (entries: Record<string, string>) => (k: string) => entries[k] ?? null;

describe("pickStoredRaw", () => {
  it("returns null for a genuinely new player", () => {
    expect(pickStoredRaw(store({}))).toBeNull();
  });

  it("reads the current key when present", () => {
    expect(pickStoredRaw(store({ [STORAGE_KEY]: '{"xp":10}' }))).toBe('{"xp":10}');
  });

  it("falls back to pre-rename progress when the new key is empty", () => {
    expect(pickStoredRaw(store({ "atlas-sprint-v1": '{"xp":999}' }))).toBe('{"xp":999}');
  });

  it("prefers the current key over legacy when both exist", () => {
    // A player who has already migrated must not be dragged back to their old
    // snapshot on a later visit.
    const raw = pickStoredRaw(
      store({ [STORAGE_KEY]: '{"xp":50}', "atlas-sprint-v1": '{"xp":999}' })
    );
    expect(raw).toBe('{"xp":50}');
  });

  it("does not treat an empty string as real progress", () => {
    expect(pickStoredRaw(store({ [STORAGE_KEY]: "", "atlas-sprint-v1": '{"xp":7}' }))).toBe(
      '{"xp":7}'
    );
  });

  it("covers every legacy key it advertises", () => {
    for (const k of LEGACY_STORAGE_KEYS) {
      expect(pickStoredRaw(store({ [k]: '{"xp":1}' }))).toBe('{"xp":1}');
    }
  });

  it("still names the original Atlas Sprint key", () => {
    // Guard against someone "tidying" this list and wiping real users.
    expect(LEGACY_STORAGE_KEYS).toContain("atlas-sprint-v1");
  });

  it("never lists the current key as legacy (would self-shadow)", () => {
    expect(LEGACY_STORAGE_KEYS).not.toContain(STORAGE_KEY);
  });
});
