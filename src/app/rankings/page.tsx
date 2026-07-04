"use client";
// Rankings / Top 10: play ranking rounds or browse animated top-10 lists.

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { COUNTRIES } from "@/data/countries";
import { fmtArea, fmtPop } from "@/lib/format";
import Flag from "@/components/Flag";
import { Btn, Card, Chip } from "@/components/ui";
import { sfx } from "@/lib/sfx";

type ListId = "area" | "pop" | "small" | "sparse";

const LISTS: { id: ListId; emoji: string; label: string; desc: string }[] = [
  { id: "area", emoji: "📐", label: "Largest countries", desc: "By total area" },
  { id: "pop", emoji: "👥", label: "Most populous", desc: "By population" },
  { id: "small", emoji: "🔎", label: "Smallest countries", desc: "Tiny but mighty" },
  { id: "sparse", emoji: "🌵", label: "Fewest people", desc: "Wide open spaces" },
];

export default function RankingsPage() {
  const [list, setList] = useState<ListId>("area");
  const [revealed, setRevealed] = useState(0);

  const top10 = useMemo(() => {
    const sorted = [...COUNTRIES];
    switch (list) {
      case "area":
        sorted.sort((a, b) => b.area - a.area);
        break;
      case "pop":
        sorted.sort((a, b) => b.pop - a.pop);
        break;
      case "small":
        sorted.sort((a, b) => a.area - b.area);
        break;
      case "sparse":
        sorted.sort((a, b) => a.pop - b.pop);
        break;
    }
    return sorted.slice(0, 10);
  }, [list]);

  const maxVal = useMemo(() => {
    const vals = top10.map((c) => (list === "area" || list === "small" ? c.area : c.pop));
    return Math.max(...vals);
  }, [top10, list]);

  return (
    <div className="safe-bottom px-4 pt-6">
      <h1 className="mb-1 font-display text-3xl font-extrabold">Top 10</h1>
      <p className="mb-4 text-sm font-bold text-ink-soft">
        The world's superlatives — guess them, then browse them.
      </p>

      {/* Play card */}
      <div className="mb-5 rounded-3xl bg-grape p-5 text-white shadow-[0_6px_0_#5F41C0]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide opacity-90">Ranked rounds</p>
            <h2 className="font-display text-xl font-extrabold">Can you order the giants?</h2>
            <p className="mt-1 text-sm font-bold opacity-90">
              8 ranking puzzles. No hearts — just bragging rights.
            </p>
          </div>
          <motion.span
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-5xl"
          >
            🏆
          </motion.span>
        </div>
        <Link href="/play?mode=rankings">
          <Btn tone="white" full className="mt-4">
            Play ranking round
          </Btn>
        </Link>
      </div>

      {/* Browse lists */}
      <p className="mb-2 font-display text-lg font-extrabold">Browse the lists</p>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {LISTS.map((l) => (
          <Chip
            key={l.id}
            active={list === l.id}
            onClick={() => {
              sfx.tap();
              setList(l.id);
              setRevealed(0);
            }}
            className="whitespace-nowrap"
          >
            {l.emoji} {l.label}
          </Chip>
        ))}
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-base font-extrabold">
            {LISTS.find((l) => l.id === list)!.emoji} {LISTS.find((l) => l.id === list)!.label}
          </p>
          {revealed < 10 && (
            <button
              onClick={() => { sfx.tap(); setRevealed((r) => Math.min(10, r + (r === 0 ? 3 : 10))); }}
              className="rounded-full bg-sun px-3 py-1.5 text-xs font-extrabold text-ink shadow-[0_3px_0_#E0A420]"
            >
              {revealed === 0 ? "Reveal top 3" : "Reveal all"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {top10.map((c, i) => {
            const val = list === "area" || list === "small" ? c.area : c.pop;
            const shown = i < revealed;
            return (
              <motion.div
                key={`${list}-${c.id}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: shown ? (i % 10) * 0.07 : 0 }}
                className="relative overflow-hidden rounded-xl border-2 border-sand bg-white"
              >
                {shown && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (list === "small" || list === "sparse"
                          ? (maxVal - val) / maxVal * 0.7 + 0.3
                          : val / maxVal) * 100
                      }%`,
                    }}
                    transition={{ delay: i * 0.07 + 0.15, type: "spring", stiffness: 70, damping: 20 }}
                    className="absolute inset-y-0 left-0 bg-sun/25"
                  />
                )}
                <div className="relative flex items-center gap-3 p-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${
                      i === 0 ? "bg-sun text-ink" : i < 3 ? "bg-sand text-ink" : "bg-cream text-ink-soft"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {shown ? (
                    <>
                      <Flag countryId={c.id} size="sm" />
                      <span className="flex-1 text-sm font-extrabold">{c.name}</span>
                      <span className="text-xs font-bold text-ink-soft">
                        {list === "area" || list === "small" ? fmtArea(c.area) : fmtPop(c.pop)}
                      </span>
                    </>
                  ) : (
                    <span className="flex-1 text-sm font-extrabold tracking-widest text-ink-soft">
                      ??? ??????
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        {revealed === 0 && (
          <p className="mt-3 text-center text-xs font-bold text-ink-soft">
            Guess the order in your head first — then reveal.
          </p>
        )}
      </Card>
    </div>
  );
}
