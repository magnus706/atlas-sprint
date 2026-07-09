"use client";
// Home — the game lobby: streak, daily challenge, momentum at a glance.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  useProgress,
  levelFromXp,
  continentProgress,
  earnedBadges,
  STREAK_MILESTONES,
} from "@/lib/store";
import { dayKey } from "@/lib/format";
import { CONTINENTS, CONTINENT_META } from "@/data/countries";
import { Bar, Btn, Card, Hearts, StreakBadge, Ring, SectionTitle } from "@/components/ui";
import ContinentIcon from "@/components/ContinentIcon";
import Mascot from "@/components/Mascot";
import {
  BoltIcon,
  CompassIcon,
  FreezeIcon,
  GemIcon,
  MedalIcon,
  Spinner,
  TargetIcon,
  TrophyIcon,
} from "@/components/icons";

/** hh:mm:ss until local midnight — when the next daily challenge unlocks. */
function useMidnightCountdown(active: boolean): string {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const now = new Date();
      const mid = new Date(now);
      mid.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((mid.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setLeft(`${h}:${m}:${sec}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [active]);
  return left;
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const router = useRouter();
  const { state, ready, clearNotices } = useProgress();

  useEffect(() => {
    if (ready && !state.prefs.onboarded) router.replace("/onboarding");
  }, [ready, state.prefs.onboarded, router]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(clearNotices, 6000);
    return () => clearTimeout(t);
  }, [ready, clearNotices]);

  // hooks must run unconditionally — before the loading early-return
  const dailyDone = ready && state.lastDaily === dayKey();
  const countdown = useMidnightCountdown(dailyDone);

  if (!ready || !state.prefs.onboarded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const lvl = levelFromXp(state.xp);
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Night owl" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const weakCount = Object.keys(state.reviewQueue).length;
  const badges = earnedBadges(state);
  const nextMilestone = STREAK_MILESTONES.find((m) => m > state.streak);

  return (
    <div className="safe-bottom px-4 pt-5">
      {/* Header */}
      <motion.header {...fadeUp} className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mascot size={52} float={false} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sub">{greeting}</p>
            <h1 className="text-2xl font-extrabold leading-tight">Pangea</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StreakBadge streak={state.streak} freezes={state.freezes} />
          <div className="flex gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-xl border-2 border-line bg-white px-2.5 py-1.5 text-sm font-extrabold text-blue-dark">
              <GemIcon size={16} />
              {state.gems}
            </span>
            <Hearts count={state.hearts} compact />
          </div>
        </div>
      </motion.header>

      {/* Notices */}
      {state.brokenStreak > 0 && (
        <motion.div {...fadeUp} className="mb-3 flex items-center gap-3 rounded-2xl border-2 border-line bg-white p-3 text-sm font-bold">
          <Mascot size={40} pose="sad" float={false} />
          <span>
            Your {state.brokenStreak}-day streak slipped away. One round today starts a new one.
          </span>
        </motion.div>
      )}
      {state.freezeJustUsed && (
        <motion.div {...fadeUp} className="mb-3 flex items-center gap-3 rounded-2xl border-2 border-blue bg-blue-light p-3 text-sm font-bold text-blue-dark">
          <FreezeIcon size={28} />
          <span>A streak freeze saved your {state.streak}-day streak. Keep it alive today.</span>
        </motion.div>
      )}

      {/* Level / XP */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Card className="mb-4 flex items-center gap-4 p-4">
          <Ring value={lvl.into / lvl.span} size={62}>
            <span className="text-lg font-extrabold text-brand-dark">{lvl.level}</span>
          </Ring>
          <div className="flex-1">
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="font-extrabold">Level {lvl.level}</p>
              <p className="text-xs font-bold text-sub">
                {lvl.into}/{lvl.span} XP
              </p>
            </div>
            <Bar value={lvl.into / lvl.span} />
            <p className="mt-1.5 text-xs font-bold text-sub">{state.xp} XP total</p>
          </div>
        </Card>
      </motion.div>

      {/* Daily challenge hero */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <div
          className={`mb-4 overflow-hidden rounded-2xl p-5 ${
            dailyDone
              ? "border-2 border-brand bg-brand-tint"
              : "bg-brand text-white shadow-[0_4px_0_#008F88]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-extrabold uppercase tracking-widest ${dailyDone ? "text-brand-dark" : "text-white/80"}`}>
                Daily Challenge
              </p>
              <h2 className={`mt-0.5 text-xl font-extrabold leading-tight ${dailyDone ? "text-brand-deep" : ""}`}>
                {dailyDone ? "Done for today" : "10 questions. One world."}
              </h2>
              <p className={`mt-1 text-sm font-bold ${dailyDone ? "text-brand-dark" : "text-white/85"}`}>
                {dailyDone
                  ? nextMilestone
                    ? `${nextMilestone - state.streak} day${nextMilestone - state.streak > 1 ? "s" : ""} to the ${nextMilestone}-day milestone.`
                    : "Legendary streak. See you tomorrow."
                  : state.streak > 0
                    ? `One round keeps the ${state.streak}-day streak going.`
                    : "Start a streak today."}
              </p>
              {dailyDone && countdown && (
                <p className="mt-1.5 inline-flex rounded-lg bg-white/70 px-2 py-1 font-mono text-xs font-extrabold tracking-wider text-brand-deep">
                  Next challenge in {countdown}
                </p>
              )}
            </div>
            {dailyDone ? <MedalIcon size={52} /> : <Mascot size={72} pose="happy" />}
          </div>
          {!dailyDone && (
            <Link href="/play?mode=daily">
              <Btn tone="white" full className="mt-4">
                Play today's challenge
              </Btn>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="mb-5 grid grid-cols-2 gap-3">
        <Link href="/play?mode=sprint">
          <Card onClick={() => {}} className="h-full w-full p-4">
            <BoltIcon size={28} />
            <p className="mt-1.5 font-extrabold">Sprint</p>
            <p className="text-xs font-bold text-sub">
              {state.sprintBest > 0 ? `Best: ${state.sprintBest}` : "60s score attack"}
            </p>
          </Card>
        </Link>
        <Link href="/review">
          <Card onClick={() => {}} className="h-full w-full p-4">
            <TargetIcon size={28} />
            <p className="mt-1.5 font-extrabold">Review</p>
            <p className="text-xs font-bold text-sub">
              {weakCount > 0 ? `${weakCount} weak spot${weakCount > 1 ? "s" : ""}` : "All clear"}
            </p>
          </Card>
        </Link>
      </motion.div>

      {/* Continents */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mb-5">
        <SectionTitle
          action={
            <Link href="/learn" className="text-sm font-extrabold uppercase tracking-wide text-brand">
              See all
            </Link>
          }
        >
          Continents
        </SectionTitle>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {CONTINENTS.map((cont) => {
            const meta = CONTINENT_META[cont];
            const prog = continentProgress(state, cont);
            return (
              <Link key={cont} href={`/learn?open=${encodeURIComponent(cont)}`}>
                <Card onClick={() => {}} className="w-36 shrink-0 p-3">
                  <ContinentIcon continent={cont} size={40} />
                  <p className="mt-1.5 truncate text-sm font-extrabold">{cont}</p>
                  <Bar value={prog} tone={meta.color} height={8} className="mt-2" />
                  <p className="mt-1 text-[11px] font-bold text-sub">{Math.round(prog * 100)}% strong</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Sandbox + Top 10 */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="mb-4 grid grid-cols-2 gap-3">
        <Link href="/sandbox">
          <Card onClick={() => {}} className="h-full w-full p-4">
            <CompassIcon size={28} active />
            <p className="mt-1.5 font-extrabold">Explore</p>
            <p className="text-xs font-bold text-sub">No pressure. Just play.</p>
          </Card>
        </Link>
        <Link href="/rankings">
          <Card onClick={() => {}} className="h-full w-full p-4">
            <TrophyIcon size={28} />
            <p className="mt-1.5 font-extrabold">Top 10</p>
            <p className="text-xs font-bold text-sub">Rank the giants.</p>
          </Card>
        </Link>
      </motion.div>

      {/* Badges preview */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <Link href="/stats">
          <Card onClick={() => {}} className="mb-2 flex w-full items-center justify-between p-4">
            <div>
              <p className="font-extrabold">Badges</p>
              <p className="text-xs font-bold text-sub">{badges.length} earned</p>
            </div>
            <div className="flex items-center gap-1">
              {badges.length > 0 ? (
                <>
                  <MedalIcon size={26} />
                  <span className="text-sm font-extrabold text-sub">×{badges.length}</span>
                </>
              ) : (
                <span className="text-sm font-bold text-sub">Play to earn</span>
              )}
            </div>
          </Card>
        </Link>
      </motion.div>
    </div>
  );
}
