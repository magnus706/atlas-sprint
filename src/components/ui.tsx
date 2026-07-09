"use client";
// Pangea UI kit v2 — clean white surfaces, hairline borders,
// thick pressed 3D buttons, uppercase labels. No emoji anywhere.

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { MAX_HEARTS } from "@/lib/store";
import { FlameIcon, FreezeIcon, HeartIcon } from "./icons";

// ---------- Button ----------

type Tone = "brand" | "blue" | "purple" | "red" | "yellow" | "white" | "ghost";

const TONES: Record<Tone, string> = {
  brand: "bg-brand text-white shadow-[0_4px_0_#008F88]",
  blue: "bg-blue text-white shadow-[0_4px_0_#1899D6]",
  purple: "bg-purple text-white shadow-[0_4px_0_#9A4ED1]",
  red: "bg-red text-white shadow-[0_4px_0_#D63A3A]",
  yellow: "bg-yellow text-ink shadow-[0_4px_0_#D6A800]",
  white: "bg-white text-brand border-2 border-line shadow-[0_4px_0_#E5E5E5]",
  ghost: "bg-transparent text-sub",
};

interface BtnProps extends HTMLMotionProps<"button"> {
  tone?: Tone;
  size?: "md" | "lg";
  full?: boolean;
}

export function Btn({ tone = "brand", size = "lg", full, className = "", children, ...rest }: BtnProps) {
  return (
    <motion.button
      whileTap={{ y: 4, boxShadow: "0 0px 0 rgba(0,0,0,0)" }}
      transition={{ duration: 0.05 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold uppercase tracking-wide leading-none
        ${size === "lg" ? "px-6 py-4 text-[15px]" : "px-4 py-3 text-sm"}
        ${full ? "w-full" : ""} ${TONES[tone]} disabled:opacity-40 ${className}`}
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
      whileTap={onClick ? { scale: 0.98, y: 2 } : undefined}
      className={`rounded-2xl border-2 border-line bg-white ${
        onClick ? "text-left shadow-[0_3px_0_#E5E5E5]" : ""
      } ${className}`}
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
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition-colors
        ${active ? "border-blue bg-blue-light text-blue-dark" : "border-line bg-white text-sub"} ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ---------- Progress bar (chunky, glossy top stripe) ----------

export function Bar({
  value,
  tone = "#00B2A9",
  className = "",
  height = 14,
}: {
  value: number; // 0..1
  tone?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-line ${className}`} style={{ height }}>
      <motion.div
        className="relative h-full rounded-full"
        style={{ background: tone }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <div
          className="absolute rounded-full bg-white/30"
          style={{ left: 8, right: 8, top: height * 0.22, height: height * 0.24 }}
        />
      </motion.div>
    </div>
  );
}

// ---------- Ring ----------

export function Ring({
  value,
  size = 64,
  stroke = 7,
  tone = "#00B2A9",
  children,
}: {
  value: number;
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
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E5E5" strokeWidth={stroke} fill="none" />
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

// ---------- Stat pill (streak / hearts in headers) ----------

export function StatPill({
  icon,
  value,
  tint = "text-ink",
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  tint?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-line bg-white px-3 py-1.5 text-sm font-extrabold ${tint}`}>
      {icon}
      {value}
    </span>
  );
}

// ---------- Hearts ----------

export function Hearts({ count, compact = false }: { count: number; compact?: boolean }) {
  if (compact) {
    return (
      <StatPill icon={<HeartIcon size={18} />} value={count} tint={count === 0 ? "text-red" : "text-ink"} />
    );
  }
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: MAX_HEARTS }).map((_, i) => (
        <motion.span key={i} animate={i < count ? { scale: 1 } : { scale: 0.85 }}>
          <HeartIcon size={22} empty={i >= count} />
        </motion.span>
      ))}
    </div>
  );
}

// ---------- Streak ----------

export function StreakBadge({ streak, freezes }: { streak: number; freezes?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-line bg-white px-3 py-1.5 text-sm font-extrabold">
      <motion.span
        animate={streak > 0 ? { scale: [1, 1.12, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="inline-flex"
      >
        <FlameIcon size={18} lit={streak > 0} />
      </motion.span>
      <span className={streak > 0 ? "text-orange-dark" : "text-sub"}>{streak}</span>
      {!!freezes && freezes > 0 && (
        <>
          <FreezeIcon size={16} />
          <span className="text-blue-dark">{freezes}</span>
        </>
      )}
    </span>
  );
}

// ---------- Section header ----------

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h3 className="text-lg font-extrabold">{children}</h3>
      {action}
    </div>
  );
}
