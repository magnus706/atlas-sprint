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
import { byId, CONTINENTS, CONTINENT_META, ofContinent } from "@/data/countries";
import { ALL_MEDAL_IDS, medalStatus } from "@/lib/medals";
import { SKILL_META, type Skill } from "@/lib/engine";
import { dayKey } from "@/lib/format";
import { Bar, Btn, Card, Ring } from "@/components/ui";
import ContinentIcon from "@/components/ContinentIcon";
import MedalArt from "@/components/MedalArt";
import Mascot from "@/components/Mascot";
import Flag from "@/components/Flag";
import Link from "next/link";
import {
  BoltIcon,
  CrownIcon,
  FlameIcon,
  FreezeIcon,
  GemIcon,
  LockIcon,
  MedalIcon,
  TargetIcon,
} from "@/components/icons";

// custom badge artwork per badge id
const BADGE_ICON: Record<string, React.ReactNode> = {
  first: <MedalIcon size={28} />,
  sharp: <TargetIcon size={28} />,
  streak3: <FlameIcon size={28} />,
  streak7: <FlameIcon size={28} />,
  streak30: <FlameIcon size={28} />,
  combo8: <BoltIcon size={28} />,
  sprint600: <BoltIcon size={28} />,
  century: <MedalIcon size={28} />,
  explorer: <MedalIcon size={28} />,
  atlas25: <MedalIcon size={28} />,
  master10: <CrownIcon size={28} />,
  continents: <CrownIcon size={28} />,
};

const RANKS: [number, string][] = [
  [15, "Pangea Legend"],
  [10, "Cartographer"],
  [6, "Globetrotter"],
  [3, "Traveler"],
  [0, "Explorer"],
];

export default function StatsPage() {
  const { state, ready, resetAll, setPrefs } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  if (!ready) return null;

  const lvl = levelFromXp(state.xp);
  const acc = accuracy(state);
  const earned = new Set(earnedBadges(state).map((b) => b.id));
  const rank = RANKS.find(([min]) => lvl.level >= min)![1];
  const name = state.prefs.name?.trim() || "Explorer";

  // favorite category = skill with the most correct answers
  const favSkill = Object.entries(state.skillStats).sort((a, b) => b[1].r - a[1].r)[0]?.[0];

  const contProgress = CONTINENTS.map((c) => ({ cont: c, p: continentProgress(state, c) }));
  const sorted = [...contProgress].sort((a, b) => b.p - a.p);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const masteredCount = Object.values(state.mastery).filter(
    (m) => masteryState(m) === "Mastered"
  ).length;
  // recently learned = last answered countries that are now Strong/Mastered
  const recentlyLearned = [...state.recent]
    .reverse()
    .map((k) => k.split(":")[1])
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .filter((id) => {
      const st = masteryState(state.mastery[id]);
      return st === "Strong" || st === "Mastered";
    })
    .slice(0, 5);

  const Stat = ({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) => (
    <div className="rounded-2xl border-2 border-line bg-white p-3 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
      <p className="text-[11px] font-bold text-sub">{label}</p>
    </div>
  );

  return (
    <div className="safe-bottom px-4 pt-6">
      {/* profile header: avatar + editable name + rank */}
      <div className="mb-5 flex items-center gap-4">
        <div className="relative">
          <div className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full border-4 border-brand bg-brand-tint">
            <Mascot size={64} float={false} />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand text-sm font-extrabold text-white">
            {lvl.level}
          </span>
        </div>
        <div className="flex-1">
          {editingName ? (
            <input
              autoFocus
              defaultValue={state.prefs.name ?? ""}
              placeholder="Your name"
              maxLength={18}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => { setPrefs({ name: draftName.trim() || state.prefs.name }); setEditingName(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="w-full rounded-xl border-2 border-brand bg-white px-3 py-1.5 text-xl font-extrabold outline-none"
            />
          ) : (
            <button onClick={() => { setDraftName(state.prefs.name ?? ""); setEditingName(true); }} className="text-left">
              <h1 className="text-2xl font-extrabold">{name}</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-sub">tap to edit name</span>
            </button>
          )}
          <p className="mt-0.5 text-sm font-bold text-brand-dark">{rank}</p>
          <p className="text-xs font-bold text-sub">
            {state.xp} XP · {masteredCount} mastered{favSkill ? ` · loves ${SKILL_META[favSkill as Skill].label}` : ""}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat icon={<FlameIcon size={22} lit={state.streak > 0} />} label="Streak" value={state.streak} />
        <Stat icon={<FlameIcon size={22} />} label="Best streak" value={state.bestStreak} />
        <Stat icon={<FreezeIcon size={22} />} label="Freezes" value={state.freezes} />
        <Stat icon={<TargetIcon size={22} />} label="Accuracy" value={`${acc}%`} />
        <Stat icon={<MedalIcon size={22} />} label="Rounds" value={state.sessions} />
        <Stat icon={<BoltIcon size={22} />} label="Sprint best" value={state.sprintBest} />
        <Stat icon={<GemIcon size={22} />} label="Gems" value={state.gems} />
        <Stat icon={<CrownIcon size={22} />} label="Mastered" value={masteredCount} />
        <Stat icon={<MedalIcon size={22} />} label="Explored" value={state.explored.length} />
      </div>

      {state.answers > 0 && (
        <Card className="mb-4 p-4">
          <p className="mb-1 font-extrabold">Continent report</p>
          <p className="mb-3 text-xs font-bold text-sub">
            Strongest: {strongest.cont} · Growth area: {weakest.cont}
          </p>
          <div className="flex flex-col gap-2.5">
            {contProgress.map(({ cont, p }, i) => (
              <motion.div
                key={cont}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="mb-1 flex items-center justify-between text-xs font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <ContinentIcon continent={cont} size={16} /> {cont}
                  </span>
                  <span className="text-sub">
                    {Math.round(p * ofContinent(cont).length)}/{ofContinent(cont).length} strong
                  </span>
                </div>
                <Bar value={p} tone={CONTINENT_META[cont].color} height={10} />
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Recently learned */}
      {recentlyLearned.length > 0 && (
        <Card className="mb-4 p-4">
          <p className="mb-2 font-extrabold">Recently learned</p>
          <div className="flex flex-wrap gap-2">
            {recentlyLearned.map((id) => (
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

      {/* Medals — earned by conquest, kept by defense */}
      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-extrabold">
            Medals · {ALL_MEDAL_IDS.filter((id) => state.medals[id]).length}/{ALL_MEDAL_IDS.length}
          </p>
          <Link href="/learn?tab=challenges" className="text-xs font-extrabold uppercase tracking-wide text-brand">
            Earn more
          </Link>
        </div>
        {ALL_MEDAL_IDS.some((id) => state.medals[id]) ? (
          <div className="grid grid-cols-4 gap-2">
            {ALL_MEDAL_IDS.map((id) => {
              const m = state.medals[id];
              const status = m ? medalStatus(m, dayKey()).status : null;
              return (
                <div key={id} className="flex flex-col items-center rounded-2xl border-2 border-line bg-white p-2 text-center">
                  {m ? (
                    <MedalArt id={id} status={status!} size={44} />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center opacity-50">
                      <LockIcon size={26} />
                    </div>
                  )}
                  <span className="mt-1 text-[9px] font-extrabold leading-tight">{id}</span>
                  {status && status !== "shiny" && (
                    <span className={`text-[8px] font-extrabold uppercase ${status === "tarnished" ? "text-sub" : "text-orange-dark"}`}>
                      {status === "tarnished" ? "Tarnished" : "At risk"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-bold text-sub">
            Conquer every challenge in a continent to earn its medal — then defend it to keep the shine.
          </p>
        )}
      </Card>

      <Card className="mb-4 p-4">
        <p className="mb-3 font-extrabold">
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
                  has ? "border-yellow bg-yellow-light" : "border-line bg-panel opacity-60"
                }`}
              >
                {has ? BADGE_ICON[b.id] ?? <MedalIcon size={28} /> : <LockIcon size={28} />}
                <span className="mt-1 text-[9px] font-extrabold leading-tight">{b.name}</span>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {!confirmReset ? (
        <button
          onClick={() => setConfirmReset(true)}
          className="mx-auto block text-xs font-bold text-sub underline"
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
            <Btn tone="red" size="md" full onClick={() => { resetAll(); setConfirmReset(false); }}>
              Reset
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
