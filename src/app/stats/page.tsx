"use client";
// Profile / stats: momentum, mastery, badges.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  useProgress,
  levelFromXp,
  continentProgress,
  accuracy,
  earnedBadges,
  BADGES,
  masteryState,
} from "@/lib/store";
import { CONTINENTS, CONTINENT_META, ofContinent } from "@/data/countries";
import { Bar, Btn, Card, Ring } from "@/components/ui";

export default function StatsPage() {
  const { state, ready, resetAll } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!ready) return null;

  const lvl = levelFromXp(state.xp);
  const acc = accuracy(state);
  const earned = new Set(earnedBadges(state).map((b) => b.id));

  const contProgress = CONTINENTS.map((c) => ({ cont: c, p: continentProgress(state, c) }));
  const sorted = [...contProgress].sort((a, b) => b.p - a.p);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const masteredCount = Object.values(state.mastery).filter(
    (m) => masteryState(m) === "Mastered"
  ).length;

  const Stat = ({ label, value, emoji }: { label: string; value: string | number; emoji: string }) => (
    <div className="rounded-2xl border-2 border-sand bg-white p-3 text-center">
      <p className="text-lg">{emoji}</p>
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="text-[11px] font-bold text-ink-soft">{label}</p>
    </div>
  );

  return (
    <div className="safe-bottom px-4 pt-6">
      <div className="mb-5 flex items-center gap-4">
        <Ring value={lvl.into / lvl.span} tone="#FF6B4A" size={78} stroke={8}>
          <span className="font-display text-2xl font-extrabold">{lvl.level}</span>
        </Ring>
        <div>
          <h1 className="font-display text-2xl font-extrabold">Explorer</h1>
          <p className="text-sm font-bold text-ink-soft">
            Level {lvl.level} · {state.xp} XP · {masteredCount} mastered
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat emoji="🔥" label="Streak" value={state.streak} />
        <Stat emoji="🏔️" label="Best streak" value={state.bestStreak} />
        <Stat emoji="🧊" label="Freezes" value={state.freezes} />
        <Stat emoji="🎯" label="Accuracy" value={`${acc}%`} />
        <Stat emoji="🎒" label="Rounds" value={state.sessions} />
        <Stat emoji="⚡" label="Sprint best" value={state.sprintBest} />
      </div>

      {state.answers > 0 && (
        <Card className="mb-4 p-4">
          <p className="mb-1 font-display text-base font-extrabold">Continent report</p>
          <p className="mb-3 text-xs font-bold text-ink-soft">
            Strongest: {CONTINENT_META[strongest.cont].emoji} {strongest.cont} · Growth area:{" "}
            {CONTINENT_META[weakest.cont].emoji} {weakest.cont}
          </p>
          <div className="flex flex-col gap-2.5">
            {contProgress.map(({ cont, p }, i) => (
              <motion.div
                key={cont}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="mb-0.5 flex justify-between text-xs font-extrabold">
                  <span>
                    {CONTINENT_META[cont].emoji} {cont}
                  </span>
                  <span className="text-ink-soft">
                    {Math.round(p * ofContinent(cont).length)}/{ofContinent(cont).length} strong
                  </span>
                </div>
                <Bar value={p} tone={CONTINENT_META[cont].color} height={8} />
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-4 p-4">
        <p className="mb-3 font-display text-base font-extrabold">
          Badges · {earned.size}/{BADGES.length}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            return (
              <motion.div
                key={b.id}
                whileTap={{ scale: 0.92 }}
                title={`${b.name} — ${b.desc}`}
                className={`flex flex-col items-center rounded-2xl border-2 p-2 text-center ${
                  has ? "border-sun bg-sun/10" : "border-sand bg-cream opacity-50"
                }`}
              >
                <span className="text-2xl">{has ? b.emoji : "🔒"}</span>
                <span className="mt-0.5 text-[9px] font-extrabold leading-tight">{b.name}</span>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {!confirmReset ? (
        <button
          onClick={() => setConfirmReset(true)}
          className="mx-auto block text-xs font-bold text-ink-soft underline"
        >
          Reset all progress
        </button>
      ) : (
        <Card className="p-4 text-center">
          <p className="mb-3 text-sm font-extrabold">Wipe everything? This can't be undone.</p>
          <div className="flex gap-2">
            <Btn tone="white" size="md" full onClick={() => setConfirmReset(false)}>
              Keep it
            </Btn>
            <Btn
              tone="ink"
              size="md"
              full
              onClick={() => {
                resetAll();
                setConfirmReset(false);
              }}
            >
              Reset
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
