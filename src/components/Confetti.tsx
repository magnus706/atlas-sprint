"use client";
// Lightweight confetti burst — pure divs + framer, no canvas.

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#FF6B4A", "#2EC4B6", "#7C5CE0", "#FFC53D", "#3DDC97", "#FF5D8F", "#4CC9F0"];

export default function Confetti({ count = 32 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.35,
        dur: 1.6 + Math.random() * 1.2,
        size: 7 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
        spin: (Math.random() - 0.5) * 720,
        drift: (Math.random() - 0.5) * 120,
        round: Math.random() > 0.5,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: -30, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", x: p.drift, rotate: p.spin, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.45),
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
          }}
        />
      ))}
    </div>
  );
}
