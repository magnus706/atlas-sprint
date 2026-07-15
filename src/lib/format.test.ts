import { describe, it, expect } from "vitest";
import { hashSeed, mulberry32, shuffled, pickN, daysBetween, fmtPop, fmtArea } from "./format";

// The daily challenge promises "same questions for everyone on a given day" and is
// leaderboard-ready on that basis. That promise IS these two functions being
// deterministic, so pin them hard.
describe("seeded randomness", () => {
  it("hashSeed is stable for the same string", () => {
    expect(hashSeed("daily-2026-07-15")).toBe(hashSeed("daily-2026-07-15"));
  });

  it("hashSeed separates adjacent days", () => {
    expect(hashSeed("daily-2026-07-15")).not.toBe(hashSeed("daily-2026-07-16"));
  });

  it("mulberry32 replays the identical stream for a seed", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("mulberry32 stays in [0, 1)", () => {
    const rng = mulberry32(hashSeed("daily-2026-07-15"));
    for (let i = 0; i < 500; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it("different seeds diverge", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(Array.from({ length: 10 }, () => a())).not.toEqual(
      Array.from({ length: 10 }, () => b())
    );
  });

  it("two players on the same day get the same shuffle", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const day = "daily-2026-07-15";
    expect(shuffled(items, mulberry32(hashSeed(day)))).toEqual(
      shuffled(items, mulberry32(hashSeed(day)))
    );
  });

  it("shuffled permutes without losing or duplicating items", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const out = shuffled(items, mulberry32(99));
    expect([...out].sort((x, y) => x - y)).toEqual(items);
  });

  it("shuffled does not mutate its input", () => {
    const items = [1, 2, 3, 4, 5];
    const copy = [...items];
    shuffled(items, mulberry32(7));
    expect(items).toEqual(copy);
  });

  it("pickN returns n distinct items", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const out = pickN(items, 10, mulberry32(3));
    expect(out).toHaveLength(10);
    expect(new Set(out).size).toBe(10);
  });

  it("pickN caps at pool size rather than padding", () => {
    expect(pickN([1, 2, 3], 10, mulberry32(3))).toHaveLength(3);
  });
});

describe("daysBetween", () => {
  it("counts whole days forward", () => {
    expect(daysBetween("2026-07-01", "2026-07-15")).toBe(14);
  });

  it("is zero for the same day", () => {
    expect(daysBetween("2026-07-15", "2026-07-15")).toBe(0);
  });

  it("goes negative when b precedes a", () => {
    expect(daysBetween("2026-07-15", "2026-07-01")).toBe(-14);
  });

  it("crosses month and year boundaries", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
  });

  it("counts the leap day in 2028", () => {
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });

  it("spans a DST transition without drifting", () => {
    // Europe/Oslo springs forward 2026-03-29. A naive ms/86400000 without
    // rounding would return 30.958… and floor to 30.
    expect(daysBetween("2026-03-01", "2026-04-01")).toBe(31);
  });
});

describe("formatting", () => {
  it("formats population across magnitudes", () => {
    expect(fmtPop(1417)).toBe("1.42B");
    expect(fmtPop(5.5)).toBe("6M");
    expect(fmtPop(0.038)).toBe("38K");
  });

  it("formats area across magnitudes", () => {
    expect(fmtArea(17_098_242)).toBe("17.1M km²");
    expect(fmtArea(385_207)).toBe("385K km²");
    expect(fmtArea(316)).toBe("316 km²");
  });
});
