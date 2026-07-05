"use client";
// "Orbi" v2 — Atlas Sprint's mascot: a globe-explorer with aviator goggles.
// Original flat SVG with Duolingo-level character presence. Four poses.

import { motion } from "framer-motion";

export type MascotPose = "happy" | "celebrate" | "sad" | "thinking";

interface Props {
  pose?: MascotPose;
  size?: number;
  float?: boolean;
  className?: string;
}

export default function Mascot({ pose = "happy", size = 120, float = true, className = "" }: Props) {
  return (
    <motion.div
      animate={
        float
          ? pose === "celebrate"
            ? { y: [0, -12, 0], rotate: [0, -3, 3, 0] }
            : { y: [0, -6, 0] }
          : undefined
      }
      transition={{ repeat: Infinity, duration: pose === "celebrate" ? 1.3 : 3.4, ease: "easeInOut" }}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden>
        {/* ---------- feet ---------- */}
        <ellipse cx="54" cy="128" rx="12" ry="6" fill="#FF9600" />
        <ellipse cx="86" cy="128" rx="12" ry="6" fill="#FF9600" />
        <ellipse cx="54" cy="126.5" rx="12" ry="5" fill="#FFB240" />
        <ellipse cx="86" cy="126.5" rx="12" ry="5" fill="#FFB240" />

        {/* ---------- wings ---------- */}
        {pose === "celebrate" ? (
          <>
            {/* both wings thrown up */}
            <path d="M28 76C14 66 10 48 16 38c7 5 16 16 20 30z" fill="#008F88" />
            <path d="M112 76c14-10 18-28 12-38-7 5-16 16-20 30z" fill="#008F88" />
          </>
        ) : pose === "thinking" ? (
          <>
            <path d="M26 82c-10 4-16 14-14 24 8-2 16-9 20-18z" fill="#008F88" />
            {/* right wing up to chin */}
            <path d="M112 96c12-2 18-10 18-20-9 0-18 5-24 13z" fill="#008F88" />
          </>
        ) : pose === "sad" ? (
          <>
            <path d="M26 86c-8 8-10 20-6 28 7-4 12-13 13-23z" fill="#008F88" />
            <path d="M114 86c8 8 10 20 6 28-7-4-12-13-13-23z" fill="#008F88" />
          </>
        ) : (
          <>
            <path d="M26 82c-11 2-18 11-18 22 9-1 17-7 22-16z" fill="#008F88" />
            <path d="M114 82c11 2 18 11 18 22-9-1-17-7-22-16z" fill="#008F88" />
          </>
        )}

        {/* ---------- body ---------- */}
        <ellipse cx="70" cy="80" rx="47" ry="46" fill="#00B2A9" />
        {/* lower shading */}
        <path d="M70 126c22 0 40-13 45-31-13 14-70 14-90 0 5 18 23 31 45 31z" fill="#009A92" />
        {/* land patches peeking on the sides */}
        <path d="M30 62c6-3 12 0 12 5s-7 8-12 5c-4-2.5-4-8 0-10z" fill="#33C4BC" />
        <path d="M108 70c5-2 10 1 10 5s-6 7-10 4c-3.5-2.3-3.5-7 0-9z" fill="#33C4BC" />
        <path d="M40 106c5-2 10 1 9 5s-7 5.5-10 2.5c-2.6-2.5-2-6 1-7.5z" fill="#33C4BC" />

        {/* ---------- face patch ---------- */}
        <ellipse cx="70" cy="84" rx="33" ry="30" fill="#C9F4F0" />

        {/* ---------- aviator goggles (up on forehead) ---------- */}
        <path d="M25 46c10-7 80-7 90 0l-2 9c-12-6-74-6-86 0z" fill="#E0A458" />
        <circle cx="52" cy="45" r="12.5" fill="#E0A458" />
        <circle cx="88" cy="45" r="12.5" fill="#E0A458" />
        <circle cx="52" cy="45" r="8.5" fill="#BDEBFF" />
        <circle cx="88" cy="45" r="8.5" fill="#BDEBFF" />
        <path d="M47 41c2-2 5-2 7 0" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M83 41c2-2 5-2 7 0" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <rect x="66" y="42" width="8" height="6" rx="2" fill="#C88F3E" />

        {/* ---------- eyes ---------- */}
        {pose === "celebrate" ? (
          <>
            {/* joyful closed arcs */}
            <path d="M42 72c4-6 12-6 16 0" stroke="#2B2B2B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M82 72c4-6 12-6 16 0" stroke="#2B2B2B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="52" cy="74" rx="13.5" ry="16" fill="#FFFFFF" />
            <ellipse cx="88" cy="74" rx="13.5" ry="16" fill="#FFFFFF" />
            {pose === "sad" ? (
              <>
                <circle cx="52" cy="79" r="6" fill="#2B2B2B" />
                <circle cx="88" cy="79" r="6" fill="#2B2B2B" />
                <circle cx="54" cy="77" r="2" fill="#FFFFFF" />
                <circle cx="90" cy="77" r="2" fill="#FFFFFF" />
                {/* sad brows + lids */}
                <path d="M40 62l16 5M100 62l-16 5" stroke="#009A92" strokeWidth="4" strokeLinecap="round" />
                {/* tear */}
                <path d="M104 88c0 4.5-3 8-6.5 8S91 92.5 91 88c0-3.5 4-9 6.5-12 2.5 3 6.5 8.5 6.5 12z" fill="#8FD9FB" transform="translate(14 2) scale(0.8)" />
              </>
            ) : pose === "thinking" ? (
              <>
                {/* looking up-left */}
                <circle cx="47" cy="68" r="6.5" fill="#2B2B2B" />
                <circle cx="83" cy="68" r="6.5" fill="#2B2B2B" />
                <circle cx="49.5" cy="66" r="2.2" fill="#FFFFFF" />
                <circle cx="85.5" cy="66" r="2.2" fill="#FFFFFF" />
                <path d="M40 58l14-2" stroke="#009A92" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="53" cy="76" r="7" fill="#2B2B2B" />
                <circle cx="89" cy="76" r="7" fill="#2B2B2B" />
                <circle cx="55.5" cy="73" r="2.6" fill="#FFFFFF" />
                <circle cx="91.5" cy="73" r="2.6" fill="#FFFFFF" />
                <circle cx="51" cy="79" r="1.4" fill="#FFFFFF" opacity="0.8" />
                <circle cx="87" cy="79" r="1.4" fill="#FFFFFF" opacity="0.8" />
              </>
            )}
          </>
        )}

        {/* ---------- cheeks ---------- */}
        {pose !== "sad" && (
          <>
            <ellipse cx="37" cy="90" rx="6" ry="4" fill="#FFB3B3" opacity="0.85" />
            <ellipse cx="103" cy="90" rx="6" ry="4" fill="#FFB3B3" opacity="0.85" />
          </>
        )}

        {/* ---------- mouth ---------- */}
        {pose === "celebrate" ? (
          <>
            <path d="M56 88c5 12 23 12 28 0-4 2-24 2-28 0z" fill="#00726C" />
            <path d="M63 95c2.5 2.5 11.5 2.5 14 0-1.5 4-12.5 4-14 0z" fill="#FF9D9D" />
          </>
        ) : pose === "sad" ? (
          <path d="M60 100c4-5 16-5 20 0" stroke="#00726C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        ) : pose === "thinking" ? (
          <path d="M62 97h16" stroke="#00726C" strokeWidth="4.5" strokeLinecap="round" />
        ) : (
          <>
            <path d="M58 93c5 7 19 7 24 0" stroke="#00726C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M66 98c2 1.8 6 1.8 8 0-1 3-7 3-8 0z" fill="#FF9D9D" />
          </>
        )}

        {/* ---------- pose extras ---------- */}
        {pose === "celebrate" && (
          <>
            <path d="m20 20 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z" fill="#FFC800" />
            <path d="m116 14 2.3 4.6 4.7 2.4-4.7 2.3-2.3 4.7-2.3-4.7-4.7-2.3 4.7-2.4 2.3-4.6Z" fill="#1CB0F6" />
            <circle cx="36" cy="10" r="3.5" fill="#FF4B4B" />
            <circle cx="102" cy="30" r="2.6" fill="#B968F0" />
          </>
        )}
        {pose === "thinking" && (
          <>
            <circle cx="118" cy="52" r="3" fill="#C9C9C9" />
            <circle cx="126" cy="42" r="4.4" fill="#C9C9C9" />
          </>
        )}
      </svg>
    </motion.div>
  );
}
