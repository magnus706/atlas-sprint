"use client";
// End-of-session celebration: XP count-up, accuracy, streak impact, share.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { animate, motion } from "framer-motion";
import Confetti from "./Confetti";
import Flag from "./Flag";
import Mascot, { type MascotPose } from "./Mascot";
import { Btn, Card, Ring } from "./ui";
import { FlameIcon, ShareIcon, TargetIcon } from "./icons";
import { useProgress, STREAK_MILESTONES } from "@/lib/store";
import { byId, type Continent } from "@/data/countries";
import type { Question, Mode, Skill } from "@/lib/engine";
import { SKILL_META } from "@/lib/engine";
import { starsForAcc } from "@/lib/paths";
import { CHALLENGE_PASS, DEFEND_PASS, type MedalId } from "@/lib/medals";
import { dayKey } from "@/lib/format";
import { sfx } from "@/lib/sfx";
import MedalArt from "./MedalArt";
import { ChestIcon, GemIcon, XpIcon } from "./icons";

export interface SessionResult {
  q: Question;
  right: boolean;
}

export type SessionOutcome =
  | { kind: "path"; continent: Continent; nodeIdx: number; nodeCount: number; title: string }
  | { kind: "challenge"; continent: Continent; skill: Skill }
  | { kind: "defend"; medalId: MedalId };

interface Props {
  mode: Mode;
  results: SessionResult[];
  xp: number;
  bestCombo: number;
  sprintScore?: number;
  duel?: { target: number; from: string }; // friend challenge to beat
  endedEarly?: boolean;
  onAgain: () => void;
  outcome?: SessionOutcome;
}

export default function SessionComplete({
  mode,
  results,
  xp,
  bestCombo,
  sprintScore,
  duel,
  endedEarly,
  onAgain,
  outcome,
}: Props) {
  const { state, finishSession, completePathNode, completeChallenge, defendMedal, addGems } = useProgress();
  const committed = useRef(false);
  const gemsRef = useRef({ total: 0, chest: false, chestBonus: 0 });
  const [shownXp, setShownXp] = useState(0);
  const [shownGems, setShownGems] = useState(0);
  const [chestOpen, setChestOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = results.length;
  const right = results.filter((r) => r.right).length;
  const acc = total ? Math.round((100 * right) / total) : 0;
  const perfect = total > 0 && right === total && !endedEarly;
  const wrongCountries = Array.from(
    new Set(results.filter((r) => !r.right && r.q.countryId).map((r) => r.q.countryId))
  );
  const isNewSprintBest = sprintScore !== undefined && sprintScore > 0 && sprintScore >= state.sprintBest;

  const stars = outcome?.kind === "path" && !endedEarly ? starsForAcc(acc) : 0;
  const conquered = outcome?.kind === "challenge" && acc >= CHALLENGE_PASS && !endedEarly;
  const defended = outcome?.kind === "defend" && acc >= DEFEND_PASS && !endedEarly;

  useEffect(() => {
    if (committed.current) return;
    committed.current = true;
    // an out-of-hearts daily doesn't count as completed — no streak credit
    const creditMode = endedEarly && mode === "daily" ? "learn" : mode;
    finishSession({ mode: creditMode, xp, perfect, bestCombo, sprintScore });
    if (outcome?.kind === "path" && stars > 0) {
      completePathNode(outcome.continent, outcome.nodeIdx, stars);
    }
    if (outcome?.kind === "challenge" && !endedEarly) {
      completeChallenge(outcome.continent, outcome.skill, acc);
    }
    if (outcome?.kind === "defend" && defended) {
      defendMedal(outcome.medalId);
    }
    // gems: 2 per correct + perfect bonus; every 5th session opens a chest
    const gemsBase = right * 2 + (perfect ? 15 : 0);
    const chest = !endedEarly && (state.sessions + 1) % 5 === 0;
    const chestBonus = chest ? 20 + Math.floor(Math.random() * 41) : 0; // 20–60
    gemsRef.current = { total: gemsBase + chestBonus, chest, chestBonus };
    if (gemsRef.current.total > 0) addGems(gemsRef.current.total);
    if (perfect || (sprintScore ?? 0) > 400 || conquered || defended) sfx.fanfare();
    else sfx.combo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const c = animate(0, xp, { duration: 1, onUpdate: (v) => setShownXp(Math.round(v)) });
    const g = animate(0, gemsRef.current.total, {
      duration: 1.1,
      delay: 0.4,
      onUpdate: (v) => setShownGems(Math.round(v)),
    });
    const t = gemsRef.current.chest ? setTimeout(() => { setChestOpen(true); sfx.fanfare(); }, 1200) : null;
    return () => {
      c.stop();
      g.stop();
      if (t) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp]);

  const isDaily = mode === "daily";
  const milestone = isDaily && STREAK_MILESTONES.includes(state.streak) ? state.streak : null;
  const today = dayKey();
  const medalJustEarned: MedalId | null =
    outcome?.kind === "challenge" && state.medals.World?.earnedAt === today
      ? "World"
      : outcome?.kind === "challenge" && state.medals[outcome.continent]?.earnedAt === today
        ? outcome.continent
        : null;
  const celebrate =
    perfect || milestone !== null || isNewSprintBest || stars === 3 || conquered || defended || !!medalJustEarned;

  const share = async () => {
    // deep link that opens straight into a beat-my-score sprint duel
    const name = state.prefs.name?.trim() || "A friend";
    const duelUrl =
      sprintScore !== undefined && typeof window !== "undefined"
        ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}/play/?mode=sprint&target=${sprintScore}&from=${encodeURIComponent(name)}`
        : null;
    const text =
      sprintScore !== undefined
        ? `I scored ${sprintScore} in Atlas Sprint's 60-second Sprint. Beat me here: ${duelUrl}`
        : `Atlas Sprint: ${acc}% accuracy, +${xp} XP${state.streak > 0 ? `, ${state.streak}-day streak` : ""}. Think you can beat me?`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const headline = endedEarly
    ? "Out of hearts!"
    : medalJustEarned === "World"
      ? "THE ULTIMATE MEDAL."
      : medalJustEarned
        ? `${medalJustEarned} conquered!`
        : outcome?.kind === "challenge"
          ? conquered
            ? "Challenge conquered!"
            : `So close — ${CHALLENGE_PASS}% conquers it.`
          : outcome?.kind === "defend"
            ? defended
              ? "Medal defended."
              : "Defense failed."
            : outcome?.kind === "path"
              ? stars === 3
                ? "Perfect lesson!"
                : stars > 0
                  ? "Lesson complete."
                  : "Almost — 50% passes."
              : sprintScore !== undefined
                ? isNewSprintBest
                  ? "New personal best!"
                  : "Time!"
                : perfect
                  ? "Flawless."
                  : acc >= 70
                    ? "Strong round."
                    : "Good practice.";

  const failedOutcome =
    (outcome?.kind === "challenge" && !conquered) ||
    (outcome?.kind === "defend" && !defended) ||
    (outcome?.kind === "path" && stars === 0);
  const pose: MascotPose = endedEarly || failedOutcome ? "sad" : celebrate ? "celebrate" : acc >= 70 ? "happy" : "thinking";

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-10">
      {celebrate && <Confetti />}

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mb-5 flex flex-col items-center text-center"
      >
        <Mascot size={130} pose={pose} />
        <h1 className="mt-3 text-3xl font-extrabold">{headline}</h1>
        {milestone && (
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-xl bg-orange-light px-3 py-1.5 text-base font-extrabold text-orange-dark"
          >
            <FlameIcon size={20} /> {milestone}-day streak milestone!
          </motion.p>
        )}
        {isDaily && !milestone && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-sub">
            <FlameIcon size={16} lit={state.streak > 0} />
            Streak: {state.streak} day{state.streak === 1 ? "" : "s"} — keep it alive.
          </p>
        )}

        {/* friend duel result */}
        {duel && sprintScore !== undefined && (
          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 14 }}
            className={`mt-2 rounded-xl border-2 px-4 py-2 text-sm font-extrabold ${
              sprintScore > duel.target
                ? "border-brand bg-brand-light text-brand-deep"
                : "border-yellow bg-yellow-light text-yellow-dark"
            }`}
          >
            {sprintScore > duel.target
              ? `You beat ${duel.from || "your friend"}'s ${duel.target}!`
              : `${duel.from || "Your friend"}'s ${duel.target} survives — try again!`}
          </motion.p>
        )}

        {/* path stars */}
        {outcome?.kind === "path" && !endedEarly && (
          <div className="mt-3 flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + i * 0.25, type: "spring", stiffness: 300, damping: 14 }}
              >
                <XpIcon size={44} className={i < stars ? "" : "opacity-25 grayscale"} />
              </motion.span>
            ))}
          </div>
        )}

        {/* medal earned / defended */}
        {(medalJustEarned || (outcome?.kind === "defend" && defended)) && (
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 14 }}
            className="mt-4 flex flex-col items-center"
          >
            <MedalArt id={medalJustEarned ?? (outcome as { medalId: MedalId }).medalId} size={130} />
            <p className="mt-1 max-w-xs text-sm font-bold text-sub">
              {medalJustEarned
                ? "Keep it shining — defend it with an ultra quiz every 14 days."
                : "Shining bright for another 14 days."}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Score card */}
      <Card className="mb-4 p-5">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-brand">+{shownXp}</p>
            <p className="text-xs font-extrabold uppercase tracking-wide text-sub">XP</p>
          </div>
          <Ring value={acc / 100} tone={acc >= 70 ? "#00B2A9" : "#FFC800"} size={76}>
            <span className="text-lg font-extrabold">{acc}%</span>
          </Ring>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-purple-dark">
              {sprintScore !== undefined ? sprintScore : `${right}/${total}`}
            </p>
            <p className="text-xs font-extrabold uppercase tracking-wide text-sub">
              {sprintScore !== undefined ? "Score" : "Correct"}
            </p>
          </div>
        </div>
        {bestCombo >= 3 && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-extrabold text-yellow-dark">
            <FlameIcon size={18} /> Best combo: {bestCombo} in a row
          </p>
        )}
        {gemsRef.current.total > 0 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 16 }}
            className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-extrabold text-blue-dark"
          >
            <GemIcon size={20} /> +{shownGems} gems
          </motion.p>
        )}
      </Card>

      {/* mystery chest — every 5th session */}
      {gemsRef.current.chest && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={() => { if (!chestOpen) { setChestOpen(true); sfx.fanfare(); } }}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border-2 border-yellow bg-yellow-light p-4"
        >
          <motion.span
            animate={chestOpen ? { rotate: [0, -8, 8, 0], scale: [1, 1.25, 1] } : { y: [0, -4, 0] }}
            transition={chestOpen ? { duration: 0.6 } : { repeat: Infinity, duration: 1.2 }}
          >
            <ChestIcon size={40} open={chestOpen} />
          </motion.span>
          <span className="flex-1 text-left">
            <span className="block font-extrabold text-yellow-dark">
              {chestOpen ? `Bonus: +${gemsRef.current.chestBonus} gems!` : "Mystery chest!"}
            </span>
            <span className="block text-xs font-bold text-sub">
              {chestOpen ? "Every 5 lessons earns another." : "You finished 5 lessons — tap to open"}
            </span>
          </span>
        </motion.button>
      )}

      {/* Weak spots */}
      {wrongCountries.length > 0 && (
        <Card className="mb-4 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold">
            <TargetIcon size={18} /> Added to review
          </p>
          <div className="flex flex-wrap gap-2">
            {wrongCountries.slice(0, 6).map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-line bg-panel px-2.5 py-1 text-xs font-extrabold"
              >
                <Flag countryId={id} size="sm" className="!h-4 !w-6" />
                {byId.get(id)?.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {outcome?.kind === "path" && stars > 0 && outcome.nodeIdx + 1 < outcome.nodeCount ? (
          <Link href={`/play?mode=path&continent=${encodeURIComponent(outcome.continent)}&node=${outcome.nodeIdx + 1}`}>
            <Btn tone="brand" full>
              Next lesson
            </Btn>
          </Link>
        ) : (
          <Btn tone="brand" full onClick={onAgain}>
            {failedOutcome || endedEarly ? "Try again" : "One more round"}
          </Btn>
        )}
        {(outcome?.kind === "path" && stars > 0) || failedOutcome ? null : (
          <Btn tone="blue" full onClick={share}>
            <ShareIcon size={18} />
            {copied ? "Copied!" : "Challenge a friend"}
          </Btn>
        )}
        {wrongCountries.length > 0 && !outcome && (
          <Link href="/review">
            <Btn tone="yellow" full>
              Fix weak spots
            </Btn>
          </Link>
        )}
        <Link href={outcome ? "/learn" : "/"}>
          <Btn tone="white" full>
            {outcome ? "Back to journey" : "Home"}
          </Btn>
        </Link>
      </div>
    </div>
  );
}
