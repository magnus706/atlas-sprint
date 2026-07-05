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
import { byId } from "@/data/countries";
import type { Question, Mode } from "@/lib/engine";
import { sfx } from "@/lib/sfx";

export interface SessionResult {
  q: Question;
  right: boolean;
}

interface Props {
  mode: Mode;
  results: SessionResult[];
  xp: number;
  bestCombo: number;
  sprintScore?: number;
  endedEarly?: boolean;
  onAgain: () => void;
}

export default function SessionComplete({
  mode,
  results,
  xp,
  bestCombo,
  sprintScore,
  endedEarly,
  onAgain,
}: Props) {
  const { state, finishSession } = useProgress();
  const committed = useRef(false);
  const [shownXp, setShownXp] = useState(0);
  const [copied, setCopied] = useState(false);

  const total = results.length;
  const right = results.filter((r) => r.right).length;
  const acc = total ? Math.round((100 * right) / total) : 0;
  const perfect = total > 0 && right === total && !endedEarly;
  const wrongCountries = Array.from(
    new Set(results.filter((r) => !r.right && r.q.countryId).map((r) => r.q.countryId))
  );
  const isNewSprintBest = sprintScore !== undefined && sprintScore > 0 && sprintScore >= state.sprintBest;

  useEffect(() => {
    if (committed.current) return;
    committed.current = true;
    // an out-of-hearts daily doesn't count as completed — no streak credit
    const creditMode = endedEarly && mode === "daily" ? "learn" : mode;
    finishSession({ mode: creditMode, xp, perfect, bestCombo, sprintScore });
    if (perfect || (sprintScore ?? 0) > 400) sfx.fanfare();
    else sfx.combo();
  }, [finishSession, mode, xp, perfect, bestCombo, sprintScore, endedEarly]);

  useEffect(() => {
    const c = animate(0, xp, { duration: 1, onUpdate: (v) => setShownXp(Math.round(v)) });
    return () => c.stop();
  }, [xp]);

  const isDaily = mode === "daily";
  const milestone = isDaily && STREAK_MILESTONES.includes(state.streak) ? state.streak : null;
  const celebrate = perfect || milestone !== null || isNewSprintBest;

  const share = async () => {
    const text =
      sprintScore !== undefined
        ? `I scored ${sprintScore} in Atlas Sprint's 60-second Sprint. Beat that.`
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
    : sprintScore !== undefined
      ? isNewSprintBest
        ? "New personal best!"
        : "Time!"
      : perfect
        ? "Flawless."
        : acc >= 70
          ? "Strong round."
          : "Good practice.";

  const pose: MascotPose = endedEarly ? "sad" : celebrate ? "celebrate" : acc >= 70 ? "happy" : "thinking";

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
      </Card>

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
        <Btn tone="blue" full onClick={share}>
          <ShareIcon size={18} />
          {copied ? "Copied!" : "Challenge a friend"}
        </Btn>
        {wrongCountries.length > 0 && (
          <Link href="/review">
            <Btn tone="yellow" full>
              Fix weak spots
            </Btn>
          </Link>
        )}
        <Btn tone="brand" full onClick={onAgain}>
          One more round
        </Btn>
        <Link href="/">
          <Btn tone="white" full>
            Home
          </Btn>
        </Link>
      </div>
    </div>
  );
}
