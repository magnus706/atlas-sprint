"use client";
// Persistent game state: XP, hearts, streak, mastery, review queue, prefs.
// Single provider, localStorage-backed, hydrated after mount to avoid SSR mismatch.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { dayKey, daysBetween } from "./format";
import { STORAGE_KEY, pickStoredRaw } from "./storage";
import { COUNTRIES, CONTINENTS, ofContinent, type Continent } from "@/data/countries";
import type { Skill } from "./engine";
import {
  allChallengesComplete,
  CHALLENGE_PASS,
  type ChallengeRecord,
  type MedalRecord,
} from "./medals";
import { buildPath } from "./paths";
import { srsNext, type SrsRec } from "./srs";

export type Placement = "explorer" | "traveler" | "globetrotter";

export interface Prefs {
  onboarded: boolean;
  focus: "countries" | "capitals" | "flags" | "world";
  pace: "quick" | "balanced" | "intense";
  region: Continent | "World";
  placement?: Placement;
  name?: string; // display name shown on the profile
}

export interface AppState {
  version: 1;
  xp: number;
  hearts: number;
  heartsDay: string;
  streak: number;
  bestStreak: number;
  freezes: number;
  freezeJustUsed: boolean;
  brokenStreak: number; // >0 → show "streak lost" notice once
  perfectDailies: number;
  lastDaily: string | null;
  sessions: number;
  answers: number;
  correct: number;
  perfectRounds: number;
  bestCombo: number;
  sprintBest: number;
  reviewQueue: Record<string, number>; // "countryId|skill" → miss count
  mastery: Record<string, { r: number; w: number }>;
  explored: string[]; // country ids inspected in sandbox
  pathProgress: Record<string, number[]>; // continent → stars per path node
  challenges: Record<string, ChallengeRecord>; // "Continent|skill" → record
  medals: Record<string, MedalRecord>; // continent name or "World"
  recent: string[]; // last-asked "skill:countryId" keys (repeat avoidance)
  gems: number; // reward currency
  skillStats: Record<string, { r: number; w: number }>; // per-skill accuracy
  srs: Record<string, SrsRec>; // spaced-repetition schedule per "skill:countryId"
  prefs: Prefs;
}

export const MAX_HEARTS = 5;
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];


const defaultState: AppState = {
  version: 1,
  xp: 0,
  hearts: MAX_HEARTS,
  heartsDay: "",
  streak: 0,
  bestStreak: 0,
  freezes: 0,
  freezeJustUsed: false,
  brokenStreak: 0,
  perfectDailies: 0,
  lastDaily: null,
  sessions: 0,
  answers: 0,
  correct: 0,
  perfectRounds: 0,
  bestCombo: 0,
  sprintBest: 0,
  reviewQueue: {},
  mastery: {},
  explored: [],
  pathProgress: {},
  challenges: {},
  medals: {},
  recent: [],
  gems: 0,
  skillStats: {},
  srs: {},
  prefs: { onboarded: false, focus: "world", pace: "balanced", region: "World" },
};

/** Daily rollover: refill hearts, apply streak freezes, break stale streaks. */
function rollover(s: AppState): AppState {
  const today = dayKey();
  const next = { ...s };
  if (next.heartsDay !== today) {
    next.hearts = MAX_HEARTS;
    next.heartsDay = today;
  }
  if (next.lastDaily && next.streak > 0) {
    const missed = daysBetween(next.lastDaily, today) - 1;
    if (missed === 1 && next.freezes > 0) {
      next.freezes -= 1;
      next.freezeJustUsed = true;
      next.lastDaily = dayKey(-1); // freeze covers the missed day
    } else if (missed >= 1) {
      next.brokenStreak = next.streak;
      next.streak = 0;
    }
  }
  return next;
}

interface Store {
  state: AppState;
  ready: boolean;
  setPrefs: (p: Partial<Prefs>) => void;
  recordAnswer: (countryId: string, skill: Skill, right: boolean) => void;
  spendHeart: () => void;
  finishSession: (r: {
    mode: string;
    xp: number;
    perfect: boolean;
    bestCombo: number;
    sprintScore?: number;
  }) => void;
  markExplored: (countryId: string) => void;
  addGems: (n: number) => void;
  completePathNode: (continent: Continent, nodeIdx: number, stars: number) => void;
  completeChallenge: (continent: Continent, skill: Skill, acc: number) => void;
  defendMedal: (id: string) => void;
  setPlacement: (level: Placement, region: Continent | "World") => void;
  clearNotices: () => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    let s = defaultState;
    try {
      const raw = pickStoredRaw((k) => localStorage.getItem(k));
      if (raw) s = { ...defaultState, ...JSON.parse(raw), version: 1 };
    } catch {
      /* corrupted → fresh start */
    }
    setState(rollover(s));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full/blocked */
    }
  }, [state, ready]);

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    setState((s) => ({ ...s, prefs: { ...s.prefs, ...p } }));
  }, []);

  const recordAnswer = useCallback((countryId: string, skill: Skill, right: boolean) => {
    setState((s) => {
      const m = s.mastery[countryId] ?? { r: 0, w: 0 };
      const mastery = {
        ...s.mastery,
        [countryId]: right ? { ...m, r: m.r + 1 } : { ...m, w: m.w + 1 },
      };
      const key = `${countryId}|${skill}`;
      const queue = { ...s.reviewQueue };
      if (right) {
        if (queue[key]) {
          queue[key] -= 1;
          if (queue[key] <= 0) delete queue[key];
        }
      } else {
        queue[key] = (queue[key] ?? 0) + 1;
      }
      const ss = s.skillStats[skill] ?? { r: 0, w: 0 };
      const skillStats = {
        ...s.skillStats,
        [skill]: right ? { ...ss, r: ss.r + 1 } : { ...ss, w: ss.w + 1 },
      };
      // repeat-avoidance ring buffer (last ~70 skill:country pairings)
      const recent = [...s.recent.filter((k) => k !== `${skill}:${countryId}`), `${skill}:${countryId}`].slice(-70);
      // spaced repetition: schedule this fact's next review
      const srsKey = `${skill}:${countryId}`;
      const srs = { ...s.srs, [srsKey]: srsNext(s.srs[srsKey], right, dayKey()) };
      return {
        ...s,
        mastery,
        reviewQueue: queue,
        skillStats,
        recent,
        srs,
        answers: s.answers + 1,
        correct: s.correct + (right ? 1 : 0),
      };
    });
  }, []);

  const addGems = useCallback((n: number) => {
    setState((s) => ({ ...s, gems: Math.max(0, s.gems + n) }));
  }, []);

  const spendHeart = useCallback(() => {
    setState((s) => ({ ...s, hearts: Math.max(0, s.hearts - 1) }));
  }, []);

  const finishSession = useCallback(
    (r: { mode: string; xp: number; perfect: boolean; bestCombo: number; sprintScore?: number }) => {
      setState((s) => {
        const next: AppState = {
          ...s,
          xp: s.xp + r.xp,
          sessions: s.sessions + 1,
          perfectRounds: s.perfectRounds + (r.perfect ? 1 : 0),
          bestCombo: Math.max(s.bestCombo, r.bestCombo),
        };
        if (r.sprintScore !== undefined) {
          next.sprintBest = Math.max(s.sprintBest, r.sprintScore);
        }
        if (r.mode === "daily") {
          const today = dayKey();
          if (s.lastDaily !== today) {
            next.lastDaily = today;
            next.streak = s.lastDaily === dayKey(-1) || s.streak > 0 ? s.streak + 1 : 1;
            next.bestStreak = Math.max(next.streak, s.bestStreak);
            if (r.perfect) {
              next.perfectDailies = s.perfectDailies + 1;
              if (next.perfectDailies % 7 === 0) next.freezes = Math.min(3, s.freezes + 1);
            }
          }
        }
        return next;
      });
    },
    []
  );

  const markExplored = useCallback((countryId: string) => {
    setState((s) =>
      s.explored.includes(countryId) ? s : { ...s, explored: [...s.explored, countryId] }
    );
  }, []);

  const completePathNode = useCallback((continent: Continent, nodeIdx: number, stars: number) => {
    setState((s) => {
      const arr = [...(s.pathProgress[continent] ?? [])];
      arr[nodeIdx] = Math.max(arr[nodeIdx] ?? 0, stars);
      return { ...s, pathProgress: { ...s.pathProgress, [continent]: arr } };
    });
  }, []);

  const completeChallenge = useCallback((continent: Continent, skill: Skill, acc: number) => {
    setState((s) => {
      const today = dayKey();
      const key = `${continent}|${skill}`;
      const prev = s.challenges[key];
      const rec: ChallengeRecord = {
        best: Math.max(prev?.best ?? 0, acc),
        completedAt: prev?.completedAt ?? (acc >= CHALLENGE_PASS ? today : null),
      };
      const challenges = { ...s.challenges, [key]: rec };
      const medals = { ...s.medals };
      // conquer a whole continent → earn its medal
      if (!medals[continent] && allChallengesComplete(continent, challenges)) {
        medals[continent] = { earnedAt: today, lastDefended: today };
      }
      // every continent medal earned → the ultimate World medal
      if (!medals.World && CONTINENTS.every((c) => medals[c])) {
        medals.World = { earnedAt: today, lastDefended: today };
      }
      return { ...s, challenges, medals };
    });
  }, []);

  const defendMedal = useCallback((id: string) => {
    setState((s) => {
      const m = s.medals[id];
      if (!m) return s;
      return { ...s, medals: { ...s.medals, [id]: { ...m, lastDefended: dayKey() } } };
    });
  }, []);

  const setPlacement = useCallback((level: Placement, region: Continent | "World") => {
    setState((s) => {
      const next = { ...s, prefs: { ...s.prefs, placement: level } };
      // skip ahead: pre-pass the first lessons of the starting region
      const grant = level === "traveler" ? 3 : level === "globetrotter" ? 6 : 0;
      if (grant > 0) {
        const cont: Continent = region === "World" ? "Europe" : region;
        const nodes = buildPath(cont);
        const arr = [...(s.pathProgress[cont] ?? [])];
        for (let i = 0; i < Math.min(grant, nodes.length); i++) arr[i] = Math.max(arr[i] ?? 0, 1);
        next.pathProgress = { ...s.pathProgress, [cont]: arr };
      }
      return next;
    });
  }, []);

  const clearNotices = useCallback(() => {
    setState((s) =>
      s.brokenStreak || s.freezeJustUsed ? { ...s, brokenStreak: 0, freezeJustUsed: false } : s
    );
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...defaultState, heartsDay: dayKey() });
  }, []);

  const store = useMemo<Store>(
    () => ({
      state,
      ready,
      setPrefs,
      recordAnswer,
      spendHeart,
      finishSession,
      markExplored,
      addGems,
      completePathNode,
      completeChallenge,
      defendMedal,
      setPlacement,
      clearNotices,
      resetAll,
    }),
    [state, ready, setPrefs, recordAnswer, spendHeart, finishSession, markExplored, addGems, completePathNode, completeChallenge, defendMedal, setPlacement, clearNotices, resetAll]
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useProgress(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useProgress outside ProgressProvider");
  return s;
}

// ---------- derived helpers ----------

export function levelFromXp(xp: number) {
  // Level n requires 30·n·(n+1) total XP → ~60, 180, 360 …
  let level = 1;
  while (30 * level * (level + 1) <= xp) level++;
  const base = 30 * (level - 1) * level;
  const nextAt = 30 * level * (level + 1);
  return { level, into: xp - base, span: nextAt - base };
}

export type MasteryState = "New" | "Practicing" | "Strong" | "Mastered";

export function masteryState(m?: { r: number; w: number }): MasteryState {
  if (!m || m.r + m.w === 0) return "New";
  const net = m.r - m.w;
  if (net >= 8) return "Mastered";
  if (net >= 4) return "Strong";
  return "Practicing";
}

/** Fraction of a continent's countries at Strong or better. */
export function continentProgress(state: AppState, cont: Continent): number {
  const pool = ofContinent(cont);
  const strong = pool.filter((c) => {
    const st = masteryState(state.mastery[c.id]);
    return st === "Strong" || st === "Mastered";
  }).length;
  return pool.length ? strong / pool.length : 0;
}

export function touchedCountries(state: AppState): number {
  return Object.keys(state.mastery).length;
}

export function accuracy(state: AppState): number {
  return state.answers ? Math.round((100 * state.correct) / state.answers) : 0;
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  test: (s: AppState) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first", name: "First Steps", desc: "Finish your first round", test: (s) => s.sessions >= 1 },
  { id: "sharp", name: "Sharp", desc: "Score a perfect round", test: (s) => s.perfectRounds >= 1 },
  { id: "streak3", name: "Warming Up", desc: "3-day streak", test: (s) => s.bestStreak >= 3 },
  { id: "streak7", name: "On Fire", desc: "7-day streak", test: (s) => s.bestStreak >= 7 },
  { id: "streak30", name: "Unstoppable", desc: "30-day streak", test: (s) => s.bestStreak >= 30 },
  { id: "combo8", name: "Chain Lightning", desc: "8-answer combo", test: (s) => s.bestCombo >= 8 },
  { id: "sprint600", name: "Speedster", desc: "Score 600+ in Sprint", test: (s) => s.sprintBest >= 600 },
  { id: "century", name: "Century", desc: "100 correct answers", test: (s) => s.correct >= 100 },
  { id: "explorer", name: "Explorer", desc: "Inspect 15 countries in Sandbox", test: (s) => s.explored.length >= 15 },
  { id: "atlas25", name: "Globli Apprentice", desc: "Touch 25 countries", test: (s) => Object.keys(s.mastery).length >= 25 },
  {
    id: "master10", name: "Cartographer", desc: "Master 10 countries",
    test: (s) => Object.values(s.mastery).filter((m) => masteryState(m) === "Mastered").length >= 10,
  },
  {
    id: "continents", name: "World Tour", desc: "Answer on every continent",
    test: (s) => {
      const touched = new Set(
        COUNTRIES.filter((x) => s.mastery[x.id]).map((x) => x.continent)
      );
      return touched.size >= 6;
    },
  },
];

export function earnedBadges(s: AppState): Badge[] {
  return BADGES.filter((b) => b.test(s));
}
