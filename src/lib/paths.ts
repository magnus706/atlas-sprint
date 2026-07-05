// Duolingo-style lesson path: each continent becomes a sequence of units,
// each unit = a handful of countries drilled through 3 skill lessons + a checkpoint.

import { ofContinent, type Continent } from "@/data/countries";
import { SKILL_META, type Skill } from "./engine";

export interface PathNode {
  idx: number;
  unit: number;
  kind: "lesson" | "checkpoint";
  skill?: Skill; // undefined → mixed (checkpoints)
  countryIds: string[];
  title: string;
}

const UNIT_SIZE = 7;

// rotate skill sets so units feel different from each other
const UNIT_SKILLS: Skill[][] = [
  ["flag", "capital", "locate"],
  ["capital", "shape", "locate"],
  ["flag", "capital", "neighbor"],
];

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
    const skills = UNIT_SKILLS[u % UNIT_SKILLS.length];
    for (const s of skills) {
      nodes.push({
        idx: nodes.length,
        unit: u + 1,
        kind: "lesson",
        skill: s,
        countryIds: ids,
        title: SKILL_META[s].label,
      });
    }
    nodes.push({
      idx: nodes.length,
      unit: u + 1,
      kind: "checkpoint",
      countryIds: ids,
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
