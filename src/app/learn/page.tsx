"use client";
// Learn: continent progression with per-skill practice picker.

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress, continentProgress, masteryState } from "@/lib/store";
import { CONTINENTS, CONTINENT_META, ofContinent, type Continent } from "@/data/countries";
import { SKILL_META, type Skill } from "@/lib/engine";
import { Bar, Btn, Card } from "@/components/ui";
import { sfx } from "@/lib/sfx";

const SKILLS: (Skill | "mix")[] = ["mix", "capital", "flag", "shape", "locate", "neighbor"];

function LearnInner() {
  const { state, ready } = useProgress();
  const params = useSearchParams();
  const [open, setOpen] = useState<Continent | "World" | null>(
    (params.get("open") as Continent | null) ?? null
  );

  if (!ready) return null;

  return (
    <div className="safe-bottom px-4 pt-6">
      <h1 className="mb-1 font-display text-3xl font-extrabold">Learn</h1>
      <p className="mb-5 text-sm font-bold text-ink-soft">
        Work continent by continent. Strong is good — Mastered is better.
      </p>

      <div className="flex flex-col gap-3">
        {/* World mix card */}
        <Card onClick={() => { sfx.tap(); setOpen("World"); }} className="flex w-full items-center gap-4 p-4">
          <span className="text-3xl">🌍</span>
          <div className="flex-1">
            <p className="font-display text-lg font-extrabold">World Mix</p>
            <p className="text-xs font-bold text-ink-soft">Everything, everywhere, all at once</p>
          </div>
          <span className="text-xl text-ink-soft">›</span>
        </Card>

        {CONTINENTS.map((cont, i) => {
          const meta = CONTINENT_META[cont];
          const pool = ofContinent(cont);
          const prog = continentProgress(state, cont);
          const mastered = pool.filter((c) => masteryState(state.mastery[c.id]) === "Mastered").length;
          return (
            <motion.div
              key={cont}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card onClick={() => { sfx.tap(); setOpen(cont); }} className="w-full p-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{meta.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <p className="font-display text-lg font-extrabold">{cont}</p>
                      <p className="text-xs font-bold text-ink-soft">
                        {mastered}/{pool.length} mastered
                      </p>
                    </div>
                    <Bar value={prog} tone={meta.color} height={8} className="mt-1.5" />
                  </div>
                  <span className="text-xl text-ink-soft">›</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Skill picker sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
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
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl">
                  {open === "World" ? "🌍" : CONTINENT_META[open as Continent].emoji}
                </span>
                <div>
                  <p className="font-display text-xl font-extrabold">{open === "World" ? "World Mix" : open}</p>
                  <p className="text-xs font-bold text-ink-soft">Pick a drill</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SKILLS.map((s) => (
                  <Link
                    key={s}
                    href={`/play?mode=learn&continent=${encodeURIComponent(open)}${s === "mix" ? "" : `&skill=${s}`}`}
                  >
                    <Btn tone={s === "mix" ? "coral" : "white"} size="md" full>
                      {s === "mix" ? "✨ Mixed round" : `${SKILL_META[s as Skill].emoji} ${SKILL_META[s as Skill].label}`}
                    </Btn>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
