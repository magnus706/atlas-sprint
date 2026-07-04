"use client";
// Sandbox / Explore: tap the world, browse flags, practice with zero pressure.

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress, masteryState } from "@/lib/store";
import {
  byId,
  byNumeric,
  CONTINENTS,
  CONTINENT_META,
  COUNTRIES,
  ofContinent,
  type Continent,
  type Country,
} from "@/data/countries";
import { fmtArea, fmtPop } from "@/lib/format";
import { SKILL_META, type Skill } from "@/lib/engine";
import WorldMap from "@/components/WorldMap";
import Flag from "@/components/Flag";
import CountryShape from "@/components/CountryShape";
import { Btn, Card, Chip } from "@/components/ui";
import { sfx } from "@/lib/sfx";

type Tab = "map" | "flags" | "practice";

export default function SandboxPage() {
  const { state, ready, markExplored } = useProgress();
  const [tab, setTab] = useState<Tab>("map");
  const [focus, setFocus] = useState<Continent | "World">("World");
  const [selected, setSelected] = useState<Country | null>(null);
  const [flagCont, setFlagCont] = useState<Continent | "World">("World");
  const [flipped, setFlipped] = useState<string | null>(null);
  const [practiceCont, setPracticeCont] = useState<Continent | "World">("World");
  const [practiceSkill, setPracticeSkill] = useState<Skill | "mix">("mix");

  if (!ready) return null;

  const flagPool = flagCont === "World" ? COUNTRIES : ofContinent(flagCont);

  return (
    <div className="safe-bottom px-4 pt-6">
      <h1 className="mb-1 font-display text-3xl font-extrabold">Explore</h1>
      <p className="mb-4 text-sm font-bold text-ink-soft">
        No hearts. No timer. Just the world.
      </p>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(
          [
            ["map", "🗺️ Map"],
            ["flags", "🚩 Flags"],
            ["practice", "🎮 Practice"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <Chip key={t} active={tab === t} onClick={() => { sfx.tap(); setTab(t); }}>
            {label}
          </Chip>
        ))}
      </div>

      {/* ---------- MAP ---------- */}
      {tab === "map" && (
        <div>
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            <Chip active={focus === "World"} onClick={() => setFocus("World")}>
              🌍 World
            </Chip>
            {CONTINENTS.map((c) => (
              <Chip key={c} active={focus === c} onClick={() => setFocus(c)} className="whitespace-nowrap">
                {CONTINENT_META[c].emoji} {c}
              </Chip>
            ))}
          </div>
          <WorldMap
            focus={focus}
            explore
            height={focus === "World" ? 260 : 330}
            onTap={(numeric) => {
              const c = byNumeric.get(numeric);
              if (c) {
                sfx.tap();
                setSelected(c);
                markExplored(c.id);
              }
            }}
            className="border-2 border-sand"
          />
          <p className="mt-2 text-center text-xs font-bold text-ink-soft">
            Tap any colored country to inspect it · {state.explored.length} explored
          </p>
        </div>
      )}

      {/* ---------- FLAGS ---------- */}
      {tab === "flags" && (
        <div>
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            <Chip active={flagCont === "World"} onClick={() => setFlagCont("World")}>
              🌍 All
            </Chip>
            {CONTINENTS.map((c) => (
              <Chip key={c} active={flagCont === c} onClick={() => setFlagCont(c)} className="whitespace-nowrap">
                {CONTINENT_META[c].emoji} {c}
              </Chip>
            ))}
          </div>
          <p className="mb-3 text-xs font-bold text-ink-soft">Tap a flag to reveal the country.</p>
          <div className="grid grid-cols-3 gap-2">
            {flagPool.map((c) => (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  sfx.tap();
                  setFlipped(flipped === c.id ? null : c.id);
                  markExplored(c.id);
                }}
                className="flex h-[74px] flex-col items-center justify-center rounded-2xl border-2 border-sand bg-white p-2"
              >
                {flipped === c.id ? (
                  <motion.span
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    className="text-center"
                  >
                    <span className="block text-[11px] font-extrabold leading-tight">{c.name}</span>
                    <span className="block text-[10px] font-bold text-ink-soft">{c.capital}</span>
                  </motion.span>
                ) : (
                  <Flag countryId={c.id} size="sm" className="!h-8 !w-12" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ---------- PRACTICE ---------- */}
      {tab === "practice" && (
        <div>
          <Card className="p-4">
            <p className="mb-2 font-display text-base font-extrabold">Region</p>
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip active={practiceCont === "World"} onClick={() => setPracticeCont("World")}>
                🌍 World
              </Chip>
              {CONTINENTS.map((c) => (
                <Chip key={c} active={practiceCont === c} onClick={() => setPracticeCont(c)}>
                  {CONTINENT_META[c].emoji} {c}
                </Chip>
              ))}
            </div>
            <p className="mb-2 font-display text-base font-extrabold">Drill</p>
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip active={practiceSkill === "mix"} onClick={() => setPracticeSkill("mix")}>
                ✨ Mix
              </Chip>
              {(Object.keys(SKILL_META) as Skill[])
                .filter((s) => s !== "rank")
                .map((s) => (
                  <Chip key={s} active={practiceSkill === s} onClick={() => setPracticeSkill(s)}>
                    {SKILL_META[s].emoji} {SKILL_META[s].label}
                  </Chip>
                ))}
            </div>
            <Link
              href={`/play?mode=sandbox&continent=${encodeURIComponent(practiceCont)}${
                practiceSkill === "mix" ? "" : `&skill=${practiceSkill}`
              }`}
            >
              <Btn full tone="teal">
                Start free practice
              </Btn>
            </Link>
          </Card>
          <p className="mt-3 text-center text-xs font-bold text-ink-soft">
            Free practice never costs hearts. Mistakes still sharpen your review queue.
          </p>
        </div>
      )}

      {/* ---------- Country detail sheet ---------- */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-ink/40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-cream p-5 pb-8"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-sand" />
              <div className="flex items-start gap-4">
                <Flag countryId={selected.id} size="lg" className="!h-16 !w-24" />
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-extrabold">{selected.name}</h2>
                  <p className="text-sm font-bold text-ink-soft">
                    {CONTINENT_META[selected.continent].emoji} {selected.continent} ·{" "}
                    <span className="text-teal-deep">{masteryState(state.mastery[selected.id])}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border-2 border-sand bg-white p-3">
                  <p className="text-lg">🏛️</p>
                  <p className="text-[11px] font-bold text-ink-soft">Capital</p>
                  <p className="text-sm font-extrabold leading-tight">{selected.capital}</p>
                </div>
                <div className="rounded-2xl border-2 border-sand bg-white p-3">
                  <p className="text-lg">👥</p>
                  <p className="text-[11px] font-bold text-ink-soft">People</p>
                  <p className="text-sm font-extrabold">{fmtPop(selected.pop)}</p>
                </div>
                <div className="rounded-2xl border-2 border-sand bg-white p-3">
                  <p className="text-lg">📐</p>
                  <p className="text-[11px] font-bold text-ink-soft">Area</p>
                  <p className="text-sm font-extrabold">{fmtArea(selected.area)}</p>
                </div>
              </div>

              {!selected.noShape && !selected.tiny && (
                <div className="mt-3 flex justify-center rounded-2xl border-2 border-sand bg-white p-3">
                  <CountryShape countryId={selected.id} height={110} width={180} fill="#2EC4B6" />
                </div>
              )}

              {(selected.neighbors?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-extrabold text-ink-soft">NEIGHBORS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.neighbors!.map((n) => {
                      const nc = byId.get(n);
                      return nc ? (
                        <button
                          key={n}
                          onClick={() => { sfx.tap(); setSelected(nc); markExplored(nc.id); }}
                          className="rounded-full border-2 border-sand bg-white px-2.5 py-1 text-xs font-extrabold"
                        >
                          {nc.name}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
