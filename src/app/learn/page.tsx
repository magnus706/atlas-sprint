"use client";
// Learn: two worlds in one tab —
//  Journey: Duolingo-style lesson path per continent (units → lessons → checkpoint)
//  Challenges: full-coverage marathons that earn maintainable medals.

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useProgress } from "@/lib/store";
import { CONTINENTS, CONTINENT_META, type Continent } from "@/data/countries";
import { SKILL_META, type Skill } from "@/lib/engine";
import { buildPath, nextNodeIdx, type PathNode } from "@/lib/paths";
import {
  CHALLENGE_SKILLS,
  CHALLENGE_PASS,
  challengeKey,
  challengePool,
  medalStatus,
  type MedalId,
} from "@/lib/medals";
import { dayKey } from "@/lib/format";
import { Btn, Card, Chip } from "@/components/ui";
import ContinentIcon from "@/components/ContinentIcon";
import MedalArt from "@/components/MedalArt";
import Mascot from "@/components/Mascot";
import {
  CheckIcon,
  ChevronIcon,
  LockIcon,
  SkillIcon,
  TrophyIcon,
  XpIcon,
} from "@/components/icons";
import { sfx } from "@/lib/sfx";

type Tab = "journey" | "challenges";

// zigzag offsets so the path winds like a trail
const WIND = [0, 46, 74, 46, 0, -46, -74, -46];

function LearnInner() {
  const { state, ready } = useProgress();
  const params = useSearchParams();
  const router = useRouter();
  const paramCont = params.get("open") as Continent | null;
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) ?? "journey");
  const [cont, setCont] = useState<Continent>(
    paramCont && CONTINENTS.includes(paramCont)
      ? paramCont
      : state.prefs.region !== "World" && CONTINENTS.includes(state.prefs.region as Continent)
        ? (state.prefs.region as Continent)
        : "Europe"
  );

  if (!ready) return null;

  const nodes = buildPath(cont);
  const stars = state.pathProgress[cont] ?? [];
  const current = nextNodeIdx(nodes, stars);
  const meta = CONTINENT_META[cont];
  const today = dayKey();

  const NodeCircle = ({ node }: { node: PathNode }) => {
    const st = stars[node.idx] ?? 0;
    const isDone = st >= 1;
    const isCurrent = node.idx === current;
    const locked = !isDone && !isCurrent;
    const size = node.kind === "checkpoint" ? 78 : 68;

    return (
      <div
        className="relative flex flex-col items-center"
        style={{ transform: `translateX(${WIND[node.idx % WIND.length]}px)` }}
      >
        {isCurrent && (
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute -top-9 z-10 rounded-xl px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white shadow-[0_3px_0_rgba(0,0,0,0.2)]"
            style={{ background: meta.color }}
          >
            Start
          </motion.div>
        )}
        <motion.button
          whileTap={!locked ? { scale: 0.92, y: 3 } : { x: [0, -5, 5, 0] }}
          onClick={() => {
            if (locked) return;
            sfx.tap();
            router.push(`/play?mode=path&continent=${encodeURIComponent(cont)}&node=${node.idx}`);
          }}
          className="flex items-center justify-center rounded-full border-4 bg-white"
          style={{
            width: size,
            height: size,
            borderColor: locked ? "#E5E5E5" : meta.color,
            boxShadow: locked ? "0 4px 0 #E5E5E5" : `0 4px 0 ${meta.dark}`,
            opacity: locked ? 0.8 : 1,
          }}
          aria-label={node.title}
        >
          {locked ? (
            <LockIcon size={26} />
          ) : node.kind === "checkpoint" ? (
            <TrophyIcon size={30} />
          ) : (
            <SkillIcon skill={node.skill!} size={28} />
          )}
        </motion.button>
        {/* stars under completed nodes */}
        <div className="mt-1 flex h-4 gap-0.5">
          {isDone &&
            [0, 1, 2].map((i) => (
              <XpIcon key={i} size={14} className={i < st ? "" : "opacity-20 grayscale"} />
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="safe-bottom px-4 pt-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Learn</h1>
        <Mascot size={48} pose="happy" />
      </div>
      <p className="mb-4 text-sm font-bold text-sub">
        Follow the journey, or go conquer a whole continent.
      </p>

      {/* Tabs */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border-2 border-line bg-panel p-1.5">
        {(["journey", "challenges"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { sfx.tap(); setTab(t); }}
            className={`rounded-xl py-2.5 text-sm font-extrabold uppercase tracking-wide ${
              tab === t ? "bg-white text-brand-dark shadow-[0_2px_0_#E5E5E5]" : "text-sub"
            }`}
          >
            {t === "journey" ? "Journey" : "Challenges"}
          </button>
        ))}
      </div>

      {tab === "journey" && (
        <>
          {/* continent picker */}
          <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
            {CONTINENTS.map((c) => (
              <Chip key={c} active={cont === c} onClick={() => { sfx.tap(); setCont(c); }} className="whitespace-nowrap">
                <ContinentIcon continent={c} size={16} /> {c}
              </Chip>
            ))}
          </div>

          {/* header card */}
          <div
            className="mb-6 flex items-center justify-between rounded-2xl p-4 text-white"
            style={{ background: meta.color, boxShadow: `0 4px 0 ${meta.dark}` }}
          >
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">
                {cont}
              </p>
              <p className="text-lg font-extrabold leading-tight">{meta.tagline}</p>
              <p className="mt-0.5 text-xs font-bold text-white/85">
                {Math.min(current, nodes.length)}/{nodes.length} lessons cleared
              </p>
            </div>
            <ContinentIcon continent={cont} size={56} color="#FFFFFF" />
          </div>

          {/* the path */}
          <div className="flex flex-col items-center gap-5 pb-4">
            {nodes.map((node) => (
              <div key={node.idx} className="flex w-full flex-col items-center">
                {node.kind === "lesson" && node.idx > 0 && nodes[node.idx - 1].unit !== node.unit && (
                  <div className="mb-5 mt-2 flex w-full items-center gap-3">
                    <div className="h-0.5 flex-1 bg-line" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-sub">
                      Unit {node.unit}
                    </span>
                    <div className="h-0.5 flex-1 bg-line" />
                  </div>
                )}
                <NodeCircle node={node} />
              </div>
            ))}
            {current >= nodes.length && (
              <div className="mt-2 flex flex-col items-center text-center">
                <Mascot size={110} pose="celebrate" />
                <p className="mt-2 font-extrabold">Journey complete!</p>
                <p className="text-sm font-bold text-sub">
                  Now conquer the {cont} challenges to earn the medal.
                </p>
                <button
                  onClick={() => setTab("challenges")}
                  className="mt-3 text-sm font-extrabold uppercase tracking-wide text-brand"
                >
                  To the challenges
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "challenges" && (
        <div className="flex flex-col gap-4">
          {/* World / ultimate medal banner */}
          <Card className="flex items-center gap-4 p-4">
            <MedalArt
              id="World"
              status={state.medals.World ? medalStatus(state.medals.World, today).status : "tarnished"}
              size={72}
            />
            <div className="flex-1">
              <p className="font-extrabold">The Ultimate Medal</p>
              <p className="text-xs font-bold text-sub">
                {state.medals.World
                  ? `Earned. Defend it every 14 days to keep the shine.`
                  : `Conquer all six continents to claim it. ${
                      CONTINENTS.filter((c) => state.medals[c]).length
                    }/6 done.`}
              </p>
              {state.medals.World && (
                <Link href={`/play?mode=defend&medal=World`}>
                  <Btn tone="yellow" size="md" className="mt-2">
                    Defend
                  </Btn>
                </Link>
              )}
            </div>
          </Card>

          {CONTINENTS.map((c) => {
            const medal = state.medals[c];
            const ms = medal ? medalStatus(medal, today) : null;
            return (
              <Card key={c} className="p-4">
                <div className="mb-3 flex items-center gap-3">
                  <ContinentIcon continent={c} size={36} />
                  <div className="flex-1">
                    <p className="font-extrabold">{c}</p>
                    <p className="text-xs font-bold text-sub">
                      {medal
                        ? ms!.status === "tarnished"
                          ? "Medal tarnished — pass the ultra quiz to restore it"
                          : ms!.status === "at-risk"
                            ? `Medal at risk — defend within ${ms!.daysLeft} day${ms!.daysLeft === 1 ? "" : "s"}`
                            : `Medal shining · defend in ${ms!.daysLeft} days`
                        : `Conquer all 4 to earn the ${c} medal`}
                    </p>
                  </div>
                  {medal && <MedalArt id={c as MedalId} status={ms!.status} size={52} />}
                </div>

                <div className="flex flex-col gap-2">
                  {CHALLENGE_SKILLS.map((s) => {
                    const rec = state.challenges[challengeKey(c, s)];
                    const done = !!rec?.completedAt;
                    const count = challengePool(c, s).length;
                    return (
                      <Link key={s} href={`/play?mode=challenge&continent=${encodeURIComponent(c)}&skill=${s}`}>
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
                            done ? "border-brand bg-brand-tint" : "border-line bg-white"
                          }`}
                        >
                          <SkillIcon skill={s} size={22} />
                          <div className="flex-1">
                            <p className="text-sm font-extrabold">
                              All {SKILL_META[s].label.toLowerCase()} of {c}
                            </p>
                            <p className="text-[11px] font-bold text-sub">
                              {count} questions · {rec ? `best ${rec.best}%` : `${CHALLENGE_PASS}% to conquer`}
                            </p>
                          </div>
                          {done ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
                              <CheckIcon size={14} />
                            </span>
                          ) : (
                            <ChevronIcon size={16} className="text-sub" />
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                  {medal && (
                    <Link href={`/play?mode=defend&medal=${encodeURIComponent(c)}`}>
                      <Btn tone={ms!.status === "shiny" ? "white" : "yellow"} size="md" full>
                        {ms!.status === "tarnished" ? "Restore medal" : "Defend medal"}
                      </Btn>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnInner />
    </Suspense>
  );
}
