import { describe, it, expect } from "vitest";
import { buildPath, starsForAcc, nextNodeIdx } from "./paths";
import { CONTINENTS, ofContinent } from "@/data/countries";

describe("buildPath", () => {
  it.each(CONTINENTS)("%s: every country in the continent lands in a unit", (cont) => {
    const nodes = buildPath(cont);
    const covered = new Set(nodes.flatMap((n) => n.unitIds));
    const expected = new Set(ofContinent(cont).map((c) => c.id));
    expect(covered).toEqual(expected);
  });

  it.each(CONTINENTS)("%s: every unit ends with a drill then a checkpoint", (cont) => {
    const nodes = buildPath(cont);
    const units = Array.from(new Set(nodes.map((n) => n.unit)));
    for (const u of units) {
      const kinds = nodes.filter((n) => n.unit === u).map((n) => n.kind);
      expect(kinds.at(-2)).toBe("drill");
      expect(kinds.at(-1)).toBe("checkpoint");
      expect(kinds.filter((k) => k === "learn").length).toBeGreaterThanOrEqual(1);
    }
  });

  it.each(CONTINENTS)("%s: learn nodes partition their unit exactly once", (cont) => {
    const nodes = buildPath(cont);
    const units = Array.from(new Set(nodes.map((n) => n.unit)));
    for (const u of units) {
      const unitNodes = nodes.filter((n) => n.unit === u);
      const learned = unitNodes.filter((n) => n.kind === "learn").flatMap((n) => n.countryIds);
      // no country is taught twice, and none is skipped before being drilled
      expect(new Set(learned).size).toBe(learned.length);
      expect([...learned].sort()).toEqual([...unitNodes[0].unitIds].sort());
    }
  });

  it.each(CONTINENTS)("%s: idx is contiguous and matches array position", (cont) => {
    const nodes = buildPath(cont);
    expect(nodes.map((n) => n.idx)).toEqual(nodes.map((_, i) => i));
  });

  it.each(CONTINENTS)("%s: drills and checkpoints cover the whole unit", (cont) => {
    for (const n of buildPath(cont)) {
      if (n.kind === "drill" || n.kind === "checkpoint") {
        expect([...n.countryIds].sort()).toEqual([...n.unitIds].sort());
      }
    }
  });

  it("folds a stubby trailing unit into the previous one", () => {
    // Oceania has 9 countries: a naive split leaves a trailing unit of 2, which
    // would be a sad little lesson. It should fold back instead.
    const nodes = buildPath("Oceania");
    const units = Array.from(new Set(nodes.map((n) => n.unit)));
    for (const u of units) {
      const size = nodes.find((n) => n.unit === u)!.unitIds.length;
      expect(size).toBeGreaterThanOrEqual(4);
    }
  });

  it("orders units by familiarity (population) so big countries come first", () => {
    const nodes = buildPath("Europe");
    const firstUnit = nodes[0].unitIds;
    const pop = (id: string) => ofContinent("Europe").find((c) => c.id === id)!.pop;
    const firstMin = Math.min(...firstUnit.map(pop));
    const rest = nodes.filter((n) => n.unit > 1).flatMap((n) => n.unitIds);
    expect(firstMin).toBeGreaterThanOrEqual(Math.max(...rest.map(pop)));
  });

  it("returns a stable result across calls", () => {
    expect(buildPath("Africa")).toEqual(buildPath("Africa"));
  });
});

describe("starsForAcc", () => {
  it("awards 3 only for a perfect run", () => {
    expect(starsForAcc(100)).toBe(3);
    expect(starsForAcc(99)).toBe(2);
  });

  it("awards 2 from 80%", () => {
    expect(starsForAcc(80)).toBe(2);
    expect(starsForAcc(79)).toBe(1);
  });

  it("awards 1 from 50% (the pass mark)", () => {
    expect(starsForAcc(50)).toBe(1);
    expect(starsForAcc(49)).toBe(0);
  });

  it("awards 0 for a wipeout", () => {
    expect(starsForAcc(0)).toBe(0);
  });
});

describe("nextNodeIdx", () => {
  const nodes = buildPath("Oceania");

  it("starts at the first node for a new player", () => {
    expect(nextNodeIdx(nodes, undefined)).toBe(0);
    expect(nextNodeIdx(nodes, [])).toBe(0);
  });

  it("points at the first unpassed node", () => {
    expect(nextNodeIdx(nodes, [3, 2, 0])).toBe(2);
  });

  it("treats a 1-star pass as unlocking the next node", () => {
    expect(nextNodeIdx(nodes, [1, 1])).toBe(2);
  });

  it("does not skip a hole left by a failed node", () => {
    // 0 stars on node 1 must block, even though node 2 was somehow scored.
    expect(nextNodeIdx(nodes, [3, 0, 3])).toBe(1);
  });

  it("returns length once the path is cleared", () => {
    expect(nextNodeIdx(nodes, nodes.map(() => 3))).toBe(nodes.length);
  });
});
