// Maintainable medals: conquer every challenge in a continent to earn its medal,
// then defend it with an ultra-hard quiz every DEFEND_DAYS or it tarnishes.

import { COUNTRIES, CONTINENTS, ofContinent, type Continent, type Country } from "@/data/countries";
import { daysBetween } from "./format";
import type { Skill } from "./engine";

export const CHALLENGE_SKILLS: Skill[] = ["capital", "flag", "locate", "shape"];
export const CHALLENGE_PASS = 90; // % accuracy to conquer a challenge
export const DEFEND_PASS = 85; // % accuracy on the defense quiz
export const DEFEND_COUNT = 15; // questions in a defense quiz
export const DEFEND_DAYS = 14; // must defend within this many days
export const AT_RISK_DAYS = 10; // warning window starts here

export type MedalId = Continent | "World";

export const challengeKey = (cont: Continent, skill: Skill) => `${cont}|${skill}`;

/** Countries eligible for a given challenge (shape/map need drawable geometry). */
export function challengePool(cont: Continent, skill: Skill): Country[] {
  const pool = ofContinent(cont);
  if (skill === "shape") return pool.filter((c) => !c.tiny && !c.noShape);
  if (skill === "locate") return pool.filter((c) => !c.tiny);
  return pool;
}

export interface ChallengeRecord {
  best: number; // best accuracy %
  completedAt: string | null; // dayKey when first conquered (≥ CHALLENGE_PASS)
}

export function allChallengesComplete(
  cont: Continent,
  challenges: Record<string, ChallengeRecord>
): boolean {
  return CHALLENGE_SKILLS.every((s) => challenges[challengeKey(cont, s)]?.completedAt);
}

export interface MedalRecord {
  earnedAt: string;
  lastDefended: string;
}

export type MedalStatus = "shiny" | "at-risk" | "tarnished";

export function medalStatus(m: MedalRecord, today: string): { status: MedalStatus; daysLeft: number } {
  const age = daysBetween(m.lastDefended, today);
  if (age > DEFEND_DAYS) return { status: "tarnished", daysLeft: 0 };
  if (age >= AT_RISK_DAYS) return { status: "at-risk", daysLeft: DEFEND_DAYS - age };
  return { status: "shiny", daysLeft: DEFEND_DAYS - age };
}

export function defendPool(id: MedalId): Country[] {
  return id === "World" ? COUNTRIES : ofContinent(id);
}

export const ALL_MEDAL_IDS: MedalId[] = [...CONTINENTS, "World"];
