import { describe, it, expect } from "vitest";
import {
  medalStatus,
  allChallengesComplete,
  challengeKey,
  challengePool,
  defendPool,
  CHALLENGE_SKILLS,
  CHALLENGE_PASS,
  ALL_MEDAL_IDS,
  DEFEND_DAYS,
  AT_RISK_DAYS,
  type ChallengeRecord,
} from "./medals";
import { COUNTRIES, CONTINENTS, ofContinent } from "@/data/countries";
import { addDaysKey } from "./srs";

const EARNED = "2026-07-01";
const at = (days: number) => addDaysKey(EARNED, days);
const medal = { earnedAt: EARNED, lastDefended: EARNED };

describe("medalStatus", () => {
  it("is shiny straight after defending", () => {
    expect(medalStatus(medal, EARNED)).toEqual({ status: "shiny", daysLeft: DEFEND_DAYS });
  });

  it("stays shiny up to the day before the warning window", () => {
    expect(medalStatus(medal, at(AT_RISK_DAYS - 1)).status).toBe("shiny");
  });

  it("turns at-risk exactly on the warning day", () => {
    expect(medalStatus(medal, at(AT_RISK_DAYS))).toEqual({
      status: "at-risk",
      daysLeft: DEFEND_DAYS - AT_RISK_DAYS,
    });
  });

  it("is still at-risk (not tarnished) on the final day", () => {
    expect(medalStatus(medal, at(DEFEND_DAYS))).toEqual({ status: "at-risk", daysLeft: 0 });
  });

  it("tarnishes the day after the deadline", () => {
    expect(medalStatus(medal, at(DEFEND_DAYS + 1))).toEqual({ status: "tarnished", daysLeft: 0 });
  });

  it("stays tarnished long after", () => {
    expect(medalStatus(medal, at(365)).status).toBe("tarnished");
  });

  it("never reports negative daysLeft", () => {
    for (let d = 0; d <= 40; d++) {
      expect(medalStatus(medal, at(d)).daysLeft).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("allChallengesComplete", () => {
  const done = (): ChallengeRecord => ({ best: 95, completedAt: "2026-07-01" });
  const attempted = (): ChallengeRecord => ({ best: 80, completedAt: null });

  const full = Object.fromEntries(
    CHALLENGE_SKILLS.map((s) => [challengeKey("Europe", s), done()])
  );

  it("is true only when all four challenges are conquered", () => {
    expect(allChallengesComplete("Europe", full)).toBe(true);
  });

  it("is false when one is merely attempted", () => {
    const partial = { ...full, [challengeKey("Europe", "shape")]: attempted() };
    expect(allChallengesComplete("Europe", partial)).toBe(false);
  });

  it("is false when one is missing entirely", () => {
    const partial = { ...full };
    delete partial[challengeKey("Europe", "flag")];
    expect(allChallengesComplete("Europe", partial)).toBe(false);
  });

  it("is false for an untouched continent", () => {
    expect(allChallengesComplete("Africa", full)).toBe(false);
  });

  it("does not leak completion across continents", () => {
    // keys are "Continent|skill" — a bug here would hand out free medals.
    expect(allChallengesComplete("Asia", full)).toBe(false);
  });
});

describe("challengePool", () => {
  it.each(CONTINENTS)("%s: shape excludes tiny and shapeless countries", (cont) => {
    expect(challengePool(cont, "shape").every((c) => !c.tiny && !c.noShape)).toBe(true);
  });

  it.each(CONTINENTS)("%s: locate excludes tiny countries", (cont) => {
    expect(challengePool(cont, "locate").every((c) => !c.tiny)).toBe(true);
  });

  it.each(CONTINENTS)("%s: capital and flag use the whole continent", (cont) => {
    expect(challengePool(cont, "capital")).toHaveLength(ofContinent(cont).length);
    expect(challengePool(cont, "flag")).toHaveLength(ofContinent(cont).length);
  });

  it.each(CONTINENTS)("%s: every challenge has something to ask about", (cont) => {
    for (const skill of CHALLENGE_SKILLS) {
      expect(challengePool(cont, skill).length).toBeGreaterThan(0);
    }
  });

  it.each(CONTINENTS)("%s: the continent can always fill 4 MC options", (cont) => {
    // distractors() draws from the whole continent (generateSession passes
    // poolFor(continent)), NOT from the narrowed challenge pool — so this is
    // the count that actually has to hold, not the pool size above.
    expect(ofContinent(cont).length).toBeGreaterThanOrEqual(4);
  });

  it("Oceania's shape challenge is all-or-nothing — known quirk, not endorsed", () => {
    // Oceania has 7 countries; fj is noShape and sb/vu/ws are tiny, leaving only
    // au/nz/pg. Challenge count is min(pool.length, 45) = 3, and CHALLENGE_PASS
    // is 90%, so 2/3 (66.7%) fails and 3/3 is the only pass. Every other
    // continent tolerates a miss. This pins the behaviour so a fix is a
    // deliberate, visible change rather than a silent one.
    const pool = challengePool("Oceania", "shape");
    expect(pool.map((c) => c.id).sort()).toEqual(["au", "nz", "pg"]);
    expect((2 / 3) * 100).toBeLessThan(CHALLENGE_PASS);
  });
});

describe("defendPool", () => {
  it("uses the whole dataset for the World medal", () => {
    expect(defendPool("World")).toHaveLength(COUNTRIES.length);
  });

  it.each(CONTINENTS)("%s: uses just that continent", (cont) => {
    expect(defendPool(cont)).toHaveLength(ofContinent(cont).length);
  });

  it("covers every medal id", () => {
    expect(ALL_MEDAL_IDS).toHaveLength(CONTINENTS.length + 1);
    for (const id of ALL_MEDAL_IDS) expect(defendPool(id).length).toBeGreaterThan(0);
  });
});
