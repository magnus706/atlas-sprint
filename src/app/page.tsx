"use client";
// Home — the game lobby: streak, daily challenge, momentum at a glance.

import { useEffect } from "react";
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
import { Bar, Btn, Card, Hearts, StreakBadge, Ring } from "@/components/ui";

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

  if (!ready || !state.prefs.onboarded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="text-4xl"
        >
          🌍
        </motion.div>
      </div>
    );
  }

  const lvl = levelFromXp(state.xp);
  const dailyDone = state.lastDaily === dayKey();
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Night owl" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const weakCount = Object.keys(state.reviewQueue).length;
  const badges = earnedBadges(state);
  const nextMilestone = STREAK_MILESTONES.find((m) => m > state.streak);

  return (
    <div className="safe-bottom px-4 pt-5">
      {/* Header */}
      <motion.header {...fadeUp} className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-ink-soft">{greeting}, Explorer</p>
          <h1 className="font-display text-3xl font-extrabold">Atlas Sprint</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StreakBadge streak={state.streak} freezes={state.freezes} />
          <Hearts count={state.hearts} compact />
        </div>
      </motion.header>

      {/* Notices */}
      {state.brokenStreak > 0 && (
        <motion.div {...fadeUp} className="mb-3 rounded-2xl border-2 border-sand bg-white p-3 text-sm font-bold">
          💔 Your {state.brokenStreak}-day streak slipped away. Today is a fresh start — one round brings it back.
        </motion.div>
      )}
      {state.freezeJustUsed && (
        <motion.div {...fadeUp} className="mb-3 rounded-2xl border-2 border-sky/40 bg-white p-3 text-sm font-bold">
          🧊 A streak freeze saved your {state.streak}-day streak. Keep it alive today!
        </motion.div>
      )}

      {/* Level / XP */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Card className="mb-4 flex items-center gap-4 p-4">
          <Ring value={lvl.into / lvl.span} tone="#FF6B4A" size={62}>
            <span className="font-display text-lg font-extrabold">{lvl.level}</span>
          </Ring>
          <div className="flex-1">
            <div className="mb-1 flex items-baseline justify-between">
              <p className="font-display text-base font-extrabold">Level {lvl.level}</p>
              <p className="text-xs font-bold text-ink-soft">
                {lvl.into}/{lvl.span} XP
              </p>
            </div>
            <Bar value={lvl.into / lvl.span} tone="#FF6B4A" />
            <p className="mt-1 text-xs font-bold text-ink-soft">{state.xp} XP total</p>
          </div>
        </Card>
      </motion.div>

      {/* Daily challenge hero */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <div
          className={`mb-4 overflow-hidden rounded-3xl p-5 text-white shadow-[0_6px_0_rgba(0,0,0,0.15)] ${
            dailyDone ? "bg-teal" : "bg-coral"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide opacity-90">
                Daily Challenge
              </p>
              <h2 className="font-display text-2xl font-extrabold leading-tight">
                {dailyDone ? "Done for today 🎉" : "10 questions. One world."}
              </h2>
              <p className="mt-1 text-sm font-bold opacity-90">
                {dailyDone
                  ? nextMilestone
                    ? `${nextMilestone - state.streak} days to the ${nextMilestone}-day milestone.`
                    : "Legendary streak. See you tomorrow."
                  : state.streak > 0
                    ? `One round keeps the ${state.streak}-day streak going.`
                    : "Start a streak today."}
              </p>
            </div>
            <motion.span
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="text-5xl"
            >
              {dailyDone ? "🏅" : "🌍"}
            </motion.span>
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
      <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="mb-4 grid grid-cols-2 gap-3">
        <Link href="/play?mode=sprint">
          <Card className="h-full p-4">
            <span className="text-2xl">⚡</span>
            <p className="mt-1 font-display text-base font-extrabold">Sprint</p>
            <p className="text-xs font-bold text-ink-soft">
              {state.sprintBest > 0 ? `Best: ${state.sprintBest}` : "60s score attack"}
            </p>
          </Card>
        </Link>
        <Link href="/review">
          <Card className="h-full p-4">
            <span className="text-2xl">🎯</span>
            <p className="mt-1 font-display text-base font-extrabold">Review</p>
            <p className="text-xs font-bold text-ink-soft">
              {weakCount > 0 ? `${weakCount} weak spot${weakCount > 1 ? "s" : ""}` : "All clear"}
            </p>
          </Card>
        </Link>
      </motion.div>

      {/* Continents */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold">Continents</h3>
          <Link href="/learn" className="text-sm font-extrabold text-coral">
            See all →
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {CONTINENTS.map((cont) => {
            const meta = CONTINENT_META[cont];
            const prog = continentProgress(state, cont);
            return (
              <Link key={cont} href={`/learn?open=${encodeURIComponent(cont)}`}>
                <Card className="w-36 shrink-0 p-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <p className="mt-1 truncate font-display text-sm font-extrabold">{cont}</p>
                  <Bar value={prog} tone={meta.color} height={7} className="mt-2" />
                  <p className="mt-1 text-[11px] font-bold text-ink-soft">
                    {Math.round(prog * 100)}% strong
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Sandbox + Top 10 */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="mb-4 grid grid-cols-2 gap-3">
        <Link href="/sandbox">
          <Card className="h-full bg-gradient-to-br from-white to-ocean p-4">
            <span className="text-2xl">🧭</span>
            <p className="mt-1 font-display text-base font-extrabold">Explore</p>
            <p className="text-xs font-bold text-ink-soft">No pressure. Just play.</p>
          </Card>
        </Link>
        <Link href="/rankings">
          <Card className="h-full bg-gradient-to-br from-white to-[#FFF3D6] p-4">
            <span className="text-2xl">🏆</span>
            <p className="mt-1 font-display text-base font-extrabold">Top 10</p>
            <p className="text-xs font-bold text-ink-soft">Rank the giants.</p>
          </Card>
        </Link>
      </motion.div>

      {/* Badges preview */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <Card className="mb-2 flex items-center justify-between p-4">
          <div>
            <p className="font-display text-base font-extrabold">Badges</p>
            <p className="text-xs font-bold text-ink-soft">
              {badges.length} earned
            </p>
          </div>
          <div className="flex -space-x-1 text-2xl">
            {badges.slice(0, 4).map((b) => (
              <span key={b.id} title={b.name}>
                {b.emoji}
              </span>
            ))}
            {badges.length === 0 && <span className="text-sm font-bold text-ink-soft">Play to earn ✨</span>}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
