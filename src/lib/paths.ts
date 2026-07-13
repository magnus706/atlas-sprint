// Duolingo-style lesson path: each continent is a sequence of units.
// A unit (~7 countries) = two FOCUS-SET lessons (3-4 new countries drilled
// repeatedly), a map-heavy power drill over the whole unit, and a checkpoint.

import { ofContinent, type Continent } from "@/data/countries";

export type PathNodeKind = "learn" | "drill" | "checkpoint";

export interface PathNode {
  idx: number;
  unit: number;
  kind: PathNodeKind;
  countryIds: string[]; // the focus set (learn) or the whole unit (drill/checkpoint)
  unitIds: string[]; // every country in this unit
  title: string;
}

const UNIT_SIZE = 7;

const cache = new Map<Continent, PathNode[]>();

export function buildPath(cont: Continent): PathNode[] {
  if (cache.has(cont)) return cache.get(cont)!;
  // most-known countries first (population as a familiarity proxy)
  const pool = [...ofContinent(cont)].sort((a, b) => b.pop - a.pop);
  const units: string[][] = [];
  for (let i = 0; i < pool.length; i += UNIT_SIZE) {
    units.push(pool.slice(i, i + UNIT_SIZE).map((c) => c.id));
  }
  // fold a too-small trailing unit into the previous one
  if (units.length > 1 && units[units.length - 1].length < 4) {
    const last = units.pop()!;
    units[units.length - 1].push(...last);
  }

  const nodes: PathNode[] = [];
  units.forEach((ids, u) => {
    const setA = ids.slice(0, Math.ceil(ids.length / 2));
    const setB = ids.slice(Math.ceil(ids.length / 2));
    nodes.push({
      idx: nodes.length,
      unit: u + 1,
      kind: "learn",
      countryIds: setA,
      unitIds: ids,
      title: "New countries",
    });
    if (setB.length) {
      nodes.push({
        idx: nodes.length,
        unit: u + 1,
        kind: "learn",
        countryIds: setB,
        unitIds: ids,
        title: "New countries",
      });
    }
    nodes.push({
      idx: nodes.length,
      unit: u + 1,
      kind: "drill",
      countryIds: ids,
      unitIds: ids,
      title: "Power drill",
    });
    nodes.push({
      idx: nodes.length,
      unit: u + 1,
      kind: "checkpoint",
      countryIds: ids,
      unitIds: ids,
      title: `Unit ${u + 1} checkpoint`,
    });
  });
  cache.set(cont, nodes);
  return nodes;
}

/** 3 stars = perfect, 2 = 80%+, 1 = 50%+ (pass), 0 = retry. */
export const starsForAcc = (acc: number) => (acc >= 100 ? 3 : acc >= 80 ? 2 : acc >= 50 ? 1 : 0);

/** First playable node index given the stars array (node unlocks when previous passed). */
export function nextNodeIdx(nodes: PathNode[], stars: number[] | undefined): number {
  if (!stars) return 0;
  for (let i = 0; i < nodes.length; i++) {
    if (!(stars[i] >= 1)) return i;
  }
  return nodes.length; // path fully cleared
}
