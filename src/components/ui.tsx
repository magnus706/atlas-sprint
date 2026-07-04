"use client";
// Atlas Sprint UI kit: chunky tactile buttons, cards, chips, meters.

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { MAX_HEARTS } from "@/lib/store";

// ---------- Button ----------

type Tone = "coral" | "teal" | "grape" | "sun" | "ink" | "white";

const TONES: Record<Tone, string> = {
  coral: "bg-coral text-white shadow-[0_5px_0_#D14B2E]",
  teal: "bg-teal text-white shadow-[0_5px_0_#1F9C90]",
  grape: "bg-grape text-white shadow-[0_5px_0_#5F41C0]",
  sun: "bg-sun text-ink shadow-[0_5px_0_#E0A420]",
  ink: "bg-ink text-white shadow-[0_5px_0_#101A30]",
  white: "bg-white text-ink border-2 border-sand shadow-[0_5px_0_#EFE0CA]",
};

interface BtnProps extends HTMLMotionProps<"button"> {
  tone?: Tone;
  size?: "md" | "lg";
  full?: boolean;
}

export function Btn({ tone = "coral", size = "lg", full, className = "", children, ...rest }: BtnProps) {
  return (
    <motion.button
      whileTap={{ y: 4, boxShadow: "0 1px 0 rgba(0,0,0,0.2)" }}
      transition={{ duration: 0.05 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-display font-bold leading-none
        ${size === "lg" ? "px-6 py-4 text-lg" : "px-4 py-3 text-base"}
        ${full ? "w-full" : ""} ${TONES[tone]} disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

// ---------- Card ----------

export function Card({
  className = "",
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const Comp: any = onClick ? motion.button : motion.div;
  return (
    <Comp
      onClick={onClick}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      className={`rounded-3xl border-2 border-sand bg-white shadow-card ${onClick ? "text-left" : ""} ${className}`}
    >
      {children}
    </Comp>
  );
}

// ---------- Chip ----------

export function Chip({
  active,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors
        ${active ? "bg-ink text-white" : "bg-white text-ink border-2 border-sand"} ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ---------- Progress bar ----------

export function Bar({
  value,
  tone = "#FF6B4A",
  className = "",
  height = 10,
}: {
  value: number; // 0..1
  tone?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-sand ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: tone }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

// ---------- Ring (mastery / accuracy) ----------

export function Ring({
  value,
  size = 64,
  stroke = 7,
  tone = "#2EC4B6",
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  tone?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F6E9D6" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - Math.min(1, value)) }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ---------- Hearts ----------

export function Hearts({ count, compact = false }: { count: number; compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-ink border-2 border-sand">
        ❤️ {count}
      </span>
    );
  }
  return (
    <div className="flex gap-1">
      {Array.from({ length: MAX_HEARTS }).map((_, i) => (
        <motion.span
          key={i}
          animate={i < count ? { scale: 1 } : { scale: 0.85, opacity: 0.9 }}
          className="text-xl"
        >
          {i < count ? "❤️" : "🩶"}
        </motion.span>
      ))}
    </div>
  );
}

// ---------- Streak flame ----------

export function StreakBadge({ streak, freezes }: { streak: number; freezes?: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border-2 border-sand bg-white px-3 py-1.5">
      <motion.span
        animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="text-lg"
      >
        {streak > 0 ? "🔥" : "🪵"}
      </motion.span>
      <span className="text-sm font-extrabold text-ink">{streak}</span>
      {!!freezes && freezes > 0 && (
        <span className="text-sm font-extrabold text-sky">🧊{freezes}</span>
      )}
    </div>
  );
}
