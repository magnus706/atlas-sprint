"use client";
// Rankings / Top 10: play ranking rounds or browse animated top-10 lists.

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { COUNTRIES } from "@/data/countries";
import { fmtArea, fmtPop } from "@/lib/format";
import Mascot from "@/components/Mascot";
import Flag from "@/components/Flag";
import { Btn, Card, Chip } from "@/components/ui";
import { GlobeIcon, PinIcon, TrophyIcon } from "@/components/icons";
import { sfx } from "@/lib/sfx";

type ListId = "area" | "pop" | "small" | "sparse";

const LISTS: { id: ListId; label: string }[] = [
  { id: "area", label: "Largest countries" },
  { id: "pop", label: "Most populous" },
  { id: "small", label: "Smallest countries" },
  { id: "sparse", label: "Fewest people" },
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
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Top 10</h1>
        <Mascot size={48} pose="celebrate" />
      </div>
      <p className="mb-4 text-sm font-bold text-sub">
        The world's superlatives — guess them, then browse them.
      </p>

      {/* Play card */}
      <div className="mb-5 rounded-2xl bg-purple p-5 text-white shadow-[0_4px_0_#9A4ED1]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">Ranked rounds</p>
            <h2 className="mt-0.5 text-xl font-extrabold">Can you order the giants?</h2>
            <p className="mt-1 text-sm font-bold text-white/85">
              8 ranking puzzles. No hearts — just bragging rights.
            </p>
          </div>
          <motion.div
            animate={{ rotate: [0, -6, 6, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <TrophyIcon size={56} />
          </motion.div>
        </div>
        <Link href="/play?mode=rankings">
          <Btn tone="white" full className="mt-4 !text-purple-dark">
            Play ranking round
          </Btn>
        </Link>
      </div>

      {/* Browse lists */}
      <p className="mb-2.5 text-lg font-extrabold">Browse the lists</p>
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
            {l.id === "area" || l.id === "small" ? <PinIcon size={15} /> : <GlobeIcon size={15} />}
            {l.label}
          </Chip>
        ))}
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-extrabold">{LISTS.find((l) => l.id === list)!.label}</p>
          {revealed < 10 && (
            <button
              onClick={() => { sfx.tap(); setRevealed((r) => Math.min(10, r + (r === 0 ? 3 : 10))); }}
              className="rounded-xl bg-yellow px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink shadow-[0_3px_0_#D6A800]"
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
                className="relative overflow-hidden rounded-xl border-2 border-line bg-white"
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
                    className="absolute inset-y-0 left-0 bg-yellow-light"
                  />
                )}
                <div className="relative flex items-center gap-3 p-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                      i === 0 ? "bg-yellow text-ink" : i < 3 ? "bg-line text-ink" : "bg-panel text-sub"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {shown ? (
                    <>
                      <Flag countryId={c.id} size="sm" />
                      <span className="flex-1 text-sm font-extrabold">{c.name}</span>
                      <span className="text-xs font-bold text-sub">
                        {list === "area" || list === "small" ? fmtArea(c.area) : fmtPop(c.pop)}
                      </span>
                    </>
                  ) : (
                    <span className="flex-1 text-sm font-extrabold tracking-widest text-line">
                      ■■■ ■■■■■■
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        {revealed === 0 && (
          <p className="mt-3 text-center text-xs font-bold text-sub">
            Guess the order in your head first — then reveal.
          </p>
        )}
      </Card>
    </div>
  );
}
