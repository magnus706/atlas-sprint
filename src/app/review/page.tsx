"use client";
// Review: your personal weak-spot queue, ready to fix.

import Link from "next/link";
import { motion } from "framer-motion";
import { useProgress } from "@/lib/store";
import { byId } from "@/data/countries";
import { SKILL_META, type Skill } from "@/lib/engine";
import Flag from "@/components/Flag";
import { Btn, Card } from "@/components/ui";

export default function ReviewPage() {
  const { state, ready } = useProgress();
  if (!ready) return null;

  // group queue entries by country
  const grouped = new Map<string, { skill: Skill; misses: number }[]>();
  for (const [key, misses] of Object.entries(state.reviewQueue)) {
    const [id, skill] = key.split("|") as [string, Skill];
    if (!byId.get(id)) continue;
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id)!.push({ skill, misses });
  }
  const items = Array.from(grouped.entries()).sort(
    (a, b) =>
      b[1].reduce((s, x) => s + x.misses, 0) - a[1].reduce((s, x) => s + x.misses, 0)
  );

  return (
    <div className="safe-bottom px-4 pt-6">
      <h1 className="mb-1 font-display text-3xl font-extrabold">Review</h1>
      <p className="mb-5 text-sm font-bold text-ink-soft">
        {items.length > 0
          ? "These tripped you up. Two clean answers clear each one."
          : "Mistakes land here so you can crush them later."}
      </p>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center p-8 text-center">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-5xl"
          >
            🕊️
          </motion.span>
          <p className="mt-3 font-display text-lg font-extrabold">All clear</p>
          <p className="mt-1 text-sm font-bold text-ink-soft">
            No weak spots right now. Play a round and see if it stays that way.
          </p>
          <Link href="/play?mode=daily" className="mt-4 w-full">
            <Btn full tone="teal">Play a round</Btn>
          </Link>
        </Card>
      ) : (
        <>
          <Link href="/play?mode=review">
            <Btn full className="mb-4">
              Fix {items.length} weak spot{items.length > 1 ? "s" : ""} 🎯
            </Btn>
          </Link>
          <div className="flex flex-col gap-3">
            {items.map(([id, skills], i) => {
              const c = byId.get(id)!;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="flex items-center gap-3 p-4">
                    <Flag countryId={id} size="md" className="!h-9 !w-14" />
                    <div className="flex-1">
                      <p className="font-display text-base font-extrabold">{c.name}</p>
                      <p className="text-xs font-bold text-ink-soft">
                        {c.capital} · {c.continent}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {skills.map((s) => (
                        <span
                          key={s.skill}
                          className="rounded-full bg-rose/10 px-2 py-1 text-[11px] font-extrabold text-rose"
                        >
                          {SKILL_META[s.skill].emoji} ×{s.misses}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
