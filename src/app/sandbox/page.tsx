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
import Mascot from "@/components/Mascot";
import Flag from "@/components/Flag";
import CountryShape from "@/components/CountryShape";
import ContinentIcon from "@/components/ContinentIcon";
import { Btn, Card, Chip } from "@/components/ui";
import { GlobeIcon, PillarIcon, PinIcon, SkillIcon, SparkleIcon } from "@/components/icons";
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

  const ContChips = ({
    value,
    onChange,
  }: {
    value: Continent | "World";
    onChange: (c: Continent | "World") => void;
  }) => (
    <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
      <Chip active={value === "World"} onClick={() => onChange("World")} className="whitespace-nowrap">
        <GlobeIcon size={16} /> World
      </Chip>
      {CONTINENTS.map((c) => (
        <Chip key={c} active={value === c} onClick={() => onChange(c)} className="whitespace-nowrap">
          <ContinentIcon continent={c} size={16} /> {c}
        </Chip>
      ))}
    </div>
  );

  return (
    <div className="safe-bottom px-4 pt-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Explore</h1>
        <Mascot size={48} pose="thinking" />
      </div>
      <p className="mb-4 text-sm font-bold text-sub">No hearts. No timer. Just the world.</p>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <Chip active={tab === "map"} onClick={() => { sfx.tap(); setTab("map"); }}>
          <PinIcon size={16} /> Map
        </Chip>
        <Chip active={tab === "flags"} onClick={() => { sfx.tap(); setTab("flags"); }}>
          <SkillIcon skill="flag" size={16} /> Flags
        </Chip>
        <Chip active={tab === "practice"} onClick={() => { sfx.tap(); setTab("practice"); }}>
          <SparkleIcon size={16} /> Practice
        </Chip>
      </div>

      {/* ---------- MAP ---------- */}
      {tab === "map" && (
        <div>
          <ContChips value={focus} onChange={setFocus} />
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
            className="border-2 border-line"
          />
          <p className="mt-2 text-center text-xs font-bold text-sub">
            Tap any colored country to inspect it · {state.explored.length} explored
          </p>
        </div>
      )}

      {/* ---------- FLAGS ---------- */}
      {tab === "flags" && (
        <div>
          <ContChips value={flagCont} onChange={setFlagCont} />
          <p className="mb-3 text-xs font-bold text-sub">Tap a flag to reveal the country.</p>
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
                className="flex h-[74px] flex-col items-center justify-center rounded-2xl border-2 border-line bg-white p-2 shadow-[0_2px_0_#E5E5E5]"
              >
                {flipped === c.id ? (
                  <motion.span
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    className="text-center"
                  >
                    <span className="block text-[11px] font-extrabold leading-tight">{c.name}</span>
                    <span className="block text-[10px] font-bold text-sub">{c.capital}</span>
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
            <p className="mb-2 font-extrabold">Region</p>
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip active={practiceCont === "World"} onClick={() => setPracticeCont("World")}>
                <GlobeIcon size={16} /> World
              </Chip>
              {CONTINENTS.map((c) => (
                <Chip key={c} active={practiceCont === c} onClick={() => setPracticeCont(c)}>
                  <ContinentIcon continent={c} size={16} /> {c}
                </Chip>
              ))}
            </div>
            <p className="mb-2 font-extrabold">Drill</p>
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip active={practiceSkill === "mix"} onClick={() => setPracticeSkill("mix")}>
                <SparkleIcon size={16} /> Mix
              </Chip>
              {(Object.keys(SKILL_META) as Skill[])
                .filter((s) => s !== "rank")
                .map((s) => (
                  <Chip key={s} active={practiceSkill === s} onClick={() => setPracticeSkill(s)}>
                    <SkillIcon skill={s} size={16} /> {SKILL_META[s].label}
                  </Chip>
                ))}
            </div>
            <Link
              href={`/play?mode=sandbox&continent=${encodeURIComponent(practiceCont)}${
                practiceSkill === "mix" ? "" : `&skill=${practiceSkill}`
              }`}
            >
              <Btn full>Start free practice</Btn>
            </Link>
          </Card>
          <p className="mt-3 text-center text-xs font-bold text-sub">
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
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border-t-2 border-line bg-white p-5 pb-8"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
              <div className="flex items-start gap-4">
                <Flag countryId={selected.id} size="lg" className="!h-16 !w-24" />
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold">{selected.name}</h2>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-sub">
                    <ContinentIcon continent={selected.continent} size={16} />
                    {selected.continent} ·{" "}
                    <span className="text-brand-dark">{masteryState(state.mastery[selected.id])}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border-2 border-line bg-white p-3">
                  <PillarIcon size={20} className="mx-auto" />
                  <p className="mt-1 text-[11px] font-bold text-sub">Capital</p>
                  <p className="text-sm font-extrabold leading-tight">{selected.capital}</p>
                </div>
                <div className="rounded-2xl border-2 border-line bg-white p-3">
                  <GlobeIcon size={20} className="mx-auto" />
                  <p className="mt-1 text-[11px] font-bold text-sub">People</p>
                  <p className="text-sm font-extrabold">{fmtPop(selected.pop)}</p>
                </div>
                <div className="rounded-2xl border-2 border-line bg-white p-3">
                  <PinIcon size={20} className="mx-auto" />
                  <p className="mt-1 text-[11px] font-bold text-sub">Area</p>
                  <p className="text-sm font-extrabold">{fmtArea(selected.area)}</p>
                </div>
              </div>

              {!selected.noShape && !selected.tiny && (
                <div className="mt-3 flex justify-center rounded-2xl border-2 border-line bg-panel p-3">
                  <CountryShape countryId={selected.id} height={110} width={180} fill="#00B2A9" />
                </div>
              )}

              {(selected.neighbors?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-sub">Neighbors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.neighbors!.map((n) => {
                      const nc = byId.get(n);
                      return nc ? (
                        <button
                          key={n}
                          onClick={() => { sfx.tap(); setSelected(nc); markExplored(nc.id); }}
                          className="rounded-xl border-2 border-line bg-white px-2.5 py-1 text-xs font-extrabold"
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
