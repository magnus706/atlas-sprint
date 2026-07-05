// Question engine: builds varied, seeded sessions from the country dataset.

import {
  COUNTRIES,
  byId,
  ofContinent,
  type Continent,
  type Country,
} from "@/data/countries";
import { hashSeed, mulberry32, pickN, shuffled } from "./format";

export type Skill = "capital" | "flag" | "shape" | "locate" | "neighbor" | "rank";
export type Mode =
  | "daily"
  | "learn"
  | "sprint"
  | "review"
  | "sandbox"
  | "rankings"
  | "path"
  | "challenge"
  | "defend";

export interface Option {
  id: string; // option id (country id or synthetic)
  label: string;
  flagOf?: string; // render a flag instead of text
}

export interface Question {
  key: string;
  kind: "mc" | "map" | "order";
  skill: Skill;
  prompt: string;
  sub?: string;
  media?: { type: "flag" | "shape"; countryId: string };
  options?: Option[];
  answer?: string; // option id (mc)
  countryId: string; // primary country (review tracking); "" for order
  continent?: Continent; // map focus for locate questions
  metric?: "pop" | "area";
  orderIds?: string[]; // present the countries in this order; user sorts desc
}

export interface SessionConfig {
  mode: Mode;
  continent?: Continent | "World";
  skill?: Skill | "mix";
  count: number;
  seed?: string;
  reviewKeys?: string[]; // "countryId|skill"
  countryIds?: string[]; // explicit scope: one question per country (path/challenge/defend)
}

const poolFor = (cont?: Continent | "World"): Country[] =>
  !cont || cont === "World" ? COUNTRIES : ofContinent(cont);

function distractors(target: Country, pool: Country[], n: number, rng: () => number): Country[] {
  const same = pool.filter((c) => c.id !== target.id && c.continent === target.continent);
  const rest = pool.filter((c) => c.id !== target.id && c.continent !== target.continent);
  const picked = pickN(same, n, rng);
  if (picked.length < n) picked.push(...pickN(rest, n - picked.length, rng));
  return picked;
}

let qSeq = 0;
const qKey = (skill: string, id: string) => `${skill}:${id}:${qSeq++}`;

function capitalQ(c: Country, pool: Country[], rng: () => number): Question {
  const others = distractors(c, pool, 3, rng);
  if (rng() < 0.5) {
    const options = shuffled(
      [c, ...others].map((x) => ({ id: x.id, label: x.capital })),
      rng
    );
    return {
      key: qKey("capital", c.id),
      kind: "mc",
      skill: "capital",
      prompt: `What's the capital of ${c.name}?`,
      media: { type: "flag", countryId: c.id },
      options,
      answer: c.id,
      countryId: c.id,
    };
  }
  const options = shuffled([c, ...others].map((x) => ({ id: x.id, label: x.name })), rng);
  return {
    key: qKey("capital", c.id),
    kind: "mc",
    skill: "capital",
    prompt: `${c.capital} is the capital of…`,
    options,
    answer: c.id,
    countryId: c.id,
  };
}

function flagQ(c: Country, pool: Country[], rng: () => number): Question {
  const others = distractors(c, pool, 3, rng);
  if (rng() < 0.6) {
    const options = shuffled([c, ...others].map((x) => ({ id: x.id, label: x.name })), rng);
    return {
      key: qKey("flag", c.id),
      kind: "mc",
      skill: "flag",
      prompt: "Whose flag is this?",
      media: { type: "flag", countryId: c.id },
      options,
      answer: c.id,
      countryId: c.id,
    };
  }
  const options = shuffled(
    [c, ...others].map((x) => ({ id: x.id, label: x.name, flagOf: x.id })),
    rng
  );
  return {
    key: qKey("flag", c.id),
    kind: "mc",
    skill: "flag",
    prompt: `Find the flag of ${c.name}`,
    options,
    answer: c.id,
    countryId: c.id,
  };
}

function shapeQ(c: Country, pool: Country[], rng: () => number): Question {
  const others = distractors(c, pool, 3, rng);
  const options = shuffled([c, ...others].map((x) => ({ id: x.id, label: x.name })), rng);
  return {
    key: qKey("shape", c.id),
    kind: "mc",
    skill: "shape",
    prompt: "Which country is this?",
    media: { type: "shape", countryId: c.id },
    options,
    answer: c.id,
    countryId: c.id,
  };
}

function locateQ(c: Country): Question {
  return {
    key: qKey("locate", c.id),
    kind: "map",
    skill: "locate",
    prompt: `Tap ${c.name}`,
    sub: c.continent,
    countryId: c.id,
    continent: c.continent,
  };
}

function neighborQ(c: Country, pool: Country[], rng: () => number): Question | null {
  const nbs = (c.neighbors ?? []).map((id) => byId.get(id)!).filter(Boolean);
  if (!nbs.length) return null;
  const nbSet = new Set(c.neighbors);
  const wrong = pool.filter(
    (x) => x.id !== c.id && !nbSet.has(x.id) && x.continent === c.continent
  );
  const wrongWide = pool.filter((x) => x.id !== c.id && !nbSet.has(x.id));
  const picks = pickN(wrong.length >= 3 ? wrong : wrongWide, 3, rng);
  if (picks.length < 3) return null;
  const right = pickN(nbs, 1, rng)[0];
  const options = shuffled([right, ...picks].map((x) => ({ id: x.id, label: x.name })), rng);
  return {
    key: qKey("neighbor", c.id),
    kind: "mc",
    skill: "neighbor",
    prompt: `Which of these borders ${c.name}?`,
    media: { type: "shape", countryId: c.id },
    options,
    answer: right.id,
    countryId: c.id,
  };
}

function rankMcQ(pool: Country[], rng: () => number): Question {
  const metric: "pop" | "area" = rng() < 0.5 ? "pop" : "area";
  const four = pickN(pool, 4, rng);
  const best = [...four].sort((a, b) => b[metric] - a[metric])[0];
  const options = shuffled(four.map((x) => ({ id: x.id, label: x.name })), rng);
  return {
    key: qKey("rank", best.id),
    kind: "mc",
    skill: "rank",
    prompt: metric === "pop" ? "Which has the biggest population?" : "Which is biggest by area?",
    options,
    answer: best.id,
    countryId: best.id,
    metric,
  };
}

function orderQ(pool: Country[], rng: () => number): Question {
  const metric: "pop" | "area" = rng() < 0.5 ? "pop" : "area";
  // Retry a few times for clearly-separated values so the ranking is fair.
  let four = pickN(pool, 4, rng);
  for (let tries = 0; tries < 8; tries++) {
    const sorted = [...four].sort((a, b) => b[metric] - a[metric]);
    const ok = sorted.every((c, i) => i === 0 || sorted[i - 1][metric] / c[metric] >= 1.25);
    if (ok) break;
    four = pickN(pool, 4, rng);
  }
  return {
    key: qKey("order", four.map((x) => x.id).join("-")),
    kind: "order",
    skill: "rank",
    prompt: metric === "pop" ? "Order by population" : "Order by area",
    sub: "Biggest first — tap in order",
    countryId: "",
    metric,
    orderIds: shuffled(four.map((x) => x.id), rng),
  };
}

const shapeable = (c: Country) => !c.tiny && !c.noShape;
const locatable = (c: Country) => !c.tiny;
const neighborable = (c: Country) => (c.neighbors?.length ?? 0) > 0;

function buildOne(skill: Skill, pool: Country[], used: Set<string>, rng: () => number): Question | null {
  const fresh = pool.filter((c) => !used.has(c.id));
  const from = fresh.length >= 4 ? fresh : pool;
  switch (skill) {
    case "capital":
      return capitalQ(pickN(from, 1, rng)[0], pool, rng);
    case "flag":
      return flagQ(pickN(from, 1, rng)[0], pool, rng);
    case "shape": {
      const ok = from.filter(shapeable);
      if (!ok.length) return null;
      return shapeQ(pickN(ok, 1, rng)[0], pool, rng);
    }
    case "locate": {
      const ok = from.filter(locatable);
      if (!ok.length) return null;
      return locateQ(pickN(ok, 1, rng)[0]);
    }
    case "neighbor": {
      const ok = from.filter(neighborable);
      if (!ok.length) return null;
      return neighborQ(pickN(ok, 1, rng)[0], pool, rng);
    }
    case "rank":
      return rng() < 0.5 ? rankMcQ(pool, rng) : orderQ(pool, rng);
  }
}

const MODE_SKILLS: Record<Mode, Skill[]> = {
  daily: ["capital", "flag", "shape", "locate", "neighbor", "rank"],
  learn: ["capital", "flag", "shape", "locate", "neighbor"],
  sprint: ["capital", "flag"],
  review: [],
  sandbox: ["capital", "flag", "shape", "locate", "neighbor"],
  rankings: ["rank"],
  path: ["capital", "flag", "shape", "locate", "neighbor"],
  challenge: ["capital", "flag", "shape", "locate"],
  defend: ["capital", "flag", "shape", "locate", "neighbor"],
};

export function generateSession(cfg: SessionConfig): Question[] {
  const rng = mulberry32(hashSeed(cfg.seed ?? `${Math.random()}`));
  const pool = poolFor(cfg.continent);
  const used = new Set<string>();
  const out: Question[] = [];

  // Explicit scope (path lessons, challenges, medal defenses): one question
  // per country, distractors drawn from the wider continent/world pool.
  if (cfg.countryIds?.length) {
    const scope = cfg.countryIds.map((id) => byId.get(id)!).filter(Boolean);
    const targets = shuffled(scope, rng).slice(0, cfg.count);
    const mixSkills = MODE_SKILLS[cfg.mode].length ? MODE_SKILLS[cfg.mode] : MODE_SKILLS.learn;
    for (const c of targets) {
      const skill =
        cfg.skill && cfg.skill !== "mix" ? cfg.skill : pickN(mixSkills, 1, rng)[0];
      const q = buildForCountry(skill, c, pool, rng);
      if (q) out.push(q);
    }
    return shuffled(out, rng);
  }

  if (cfg.mode === "review" && cfg.reviewKeys?.length) {
    for (const key of shuffled(cfg.reviewKeys, rng).slice(0, cfg.count)) {
      const [id, skill] = key.split("|") as [string, Skill];
      const c = byId.get(id);
      if (!c) continue;
      const q =
        skill === "rank"
          ? rankMcQ(pool, rng)
          : buildForCountry(skill, c, pool, rng);
      if (q) {
        out.push(q);
        used.add(c.id);
      }
    }
    // top up with mixed world questions if the queue is short
    while (out.length < Math.min(cfg.count, 5)) {
      const q = buildOne(pickN(MODE_SKILLS.daily, 1, rng)[0], pool, used, rng);
      if (q) {
        out.push(q);
        used.add(q.countryId);
      }
    }
    return out;
  }

  let skills: Skill[] =
    cfg.skill && cfg.skill !== "mix" ? [cfg.skill] : MODE_SKILLS[cfg.mode];

  // rankings mode alternates order rounds and biggest-of MCs
  if (cfg.mode === "rankings") {
    for (let i = 0; i < cfg.count; i++) {
      out.push(i % 2 === 0 ? orderQ(pool, rng) : rankMcQ(pool, rng));
    }
    return out;
  }

  let guard = 0;
  while (out.length < cfg.count && guard++ < cfg.count * 12) {
    const skill = skills[out.length % skills.length];
    const q = buildOne(skill, pool, used, rng);
    if (!q) {
      // pool can't serve this skill (e.g. no neighbors) → drop it
      skills = skills.filter((s) => s !== skill);
      if (!skills.length) skills = ["capital", "flag"];
      continue;
    }
    if (q.countryId) used.add(q.countryId);
    out.push(q);
  }
  return shuffled(out, rng);
}

function buildForCountry(skill: Skill, c: Country, pool: Country[], rng: () => number): Question | null {
  switch (skill) {
    case "capital":
      return capitalQ(c, pool, rng);
    case "flag":
      return flagQ(c, pool, rng);
    case "shape":
      return shapeable(c) ? shapeQ(c, pool, rng) : capitalQ(c, pool, rng);
    case "locate":
      return locatable(c) ? locateQ(c) : flagQ(c, pool, rng);
    case "neighbor":
      return neighborable(c) ? neighborQ(c, pool, rng) : capitalQ(c, pool, rng);
    default:
      return null;
  }
}

export const SKILL_META: Record<Skill, { label: string }> = {
  capital: { label: "Capitals" },
  flag: { label: "Flags" },
  shape: { label: "Shapes" },
  locate: { label: "Map" },
  neighbor: { label: "Neighbors" },
  rank: { label: "Top 10" },
};
