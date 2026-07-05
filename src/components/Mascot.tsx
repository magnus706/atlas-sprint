"use client";
// "Orbi" — Atlas Sprint's mascot.
//
// Two render paths:
//  1. If a Lottie file is present (public/mascot.json, and optionally
//     public/mascot-celebrate.json), big/positive mascot spots play the
//     professional animation. Drop the file in and it appears automatically.
//  2. Otherwise, a hand-built bold-flat penguin SVG (huge eyes, brows, beak,
//     four poses) — the fallback, used for small sizes and sad/thinking too.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";

export type MascotPose = "happy" | "celebrate" | "sad" | "thinking";

interface Props {
  pose?: MascotPose;
  size?: number;
  float?: boolean;
  className?: string;
}

// ---------- Lottie loading (fetched once, cached) ----------

const dataCache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function loadLottie(url: string): Promise<unknown> {
  if (dataCache.has(url)) return Promise.resolve(dataCache.get(url));
  if (!inflight.has(url)) {
    inflight.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((d) => {
          dataCache.set(url, d);
          return d;
        })
    );
  }
  return inflight.get(url)!;
}

function useLottie(name: string, enabled: boolean): unknown {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const url = `${bp}/${name}.json`;
  const [data, setData] = useState<unknown>(() => dataCache.get(url) ?? null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadLottie(url).then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [url, enabled]);
  return enabled ? data : null;
}

// ---------- component ----------

export default function Mascot({ pose = "happy", size = 120, float = true, className = "" }: Props) {
  const wantsLottie = size >= 80 && (pose === "happy" || pose === "celebrate");
  const idle = useLottie("mascot", wantsLottie);
  const celebrate = useLottie("mascot-celebrate", wantsLottie && pose === "celebrate");
  const anim = pose === "celebrate" ? celebrate ?? idle : idle;

  if (wantsLottie && anim) {
    return (
      <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
        <Lottie animationData={anim} loop autoplay style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

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
      <Penguin pose={pose} />
    </motion.div>
  );
}

// ---------- bold-flat penguin SVG ----------

const TEAL = "#00B2A9";
const SHADE = "#00938B";
const CREST = "#00A69D";
const BELLY = "#E9F8EE";
const INK = "#243244";
const ORANGE = "#FF9600";
const ORANGE_D = "#E67F00";

function Penguin({ pose }: { pose: MascotPose }) {
  const [gx, gy] =
    pose === "happy" ? [4, 3] : pose === "sad" ? [0, 7] : pose === "thinking" ? [-5, -3] : [0, 0];

  const eyes =
    pose === "celebrate" ? (
      <>
        <path d="M42 84c5-9 26-9 31 0" stroke={INK} strokeWidth="6.5" strokeLinecap="round" fill="none" />
        <path d="M87 84c5-9 26-9 31 0" stroke={INK} strokeWidth="6.5" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <circle cx="60" cy="82" r="22" fill="#fff" />
        <circle cx="100" cy="82" r="22" fill="#fff" />
        <circle cx={62 + gx} cy={84 + gy} r="13" fill={INK} />
        <circle cx={102 + gx} cy={84 + gy} r="13" fill={INK} />
        <circle cx={67 + gx} cy={79 + gy} r="5" fill="#fff" />
        <circle cx={107 + gx} cy={79 + gy} r="5" fill="#fff" />
        <circle cx={58 + gx} cy={89 + gy} r="2.4" fill="#fff" />
        <circle cx={98 + gx} cy={89 + gy} r="2.4" fill="#fff" />
      </>
    );

  const brows = {
    happy: (
      <>
        <path d="M40 56q16-8 33-3" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M120 56q-16-8-33-3" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
      </>
    ),
    celebrate: (
      <>
        <path d="M40 50q16-7 32-2" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M120 50q-16-7-32-2" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
      </>
    ),
    sad: (
      <>
        <path d="M42 50q15 3 28 13" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M118 50q-15 3-28 13" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
      </>
    ),
    thinking: (
      <>
        <path d="M40 58q16-6 33-2" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M120 46q-16-6-32 1" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
      </>
    ),
  }[pose];

  const beak = {
    happy: (
      <>
        <path d="M70 100q10 3 20 0-3 10-10 10t-10-10z" fill={ORANGE} />
        <path d="M70 100q10 3 20 0-2 3-10 3t-10-3z" fill={ORANGE_D} />
      </>
    ),
    celebrate: (
      <>
        <path d="M66 100q14 4 28 0-4 15-14 15t-14-15z" fill={ORANGE} />
        <path d="M70 104q10 3 20 0-3 8-10 8t-10-8z" fill="#C94B34" />
      </>
    ),
    sad: <path d="M72 108q8-5 16 0-3-8-8-8t-8 8z" fill={ORANGE} />,
    thinking: <path d="M72 103h16l-8 7z" fill={ORANGE} />,
  }[pose];

  const wingL =
    pose === "celebrate" ? (
      <path d="M34 92C20 82 14 70 20 60c8 6 16 18 20 30z" fill={SHADE} />
    ) : (
      <path d="M33 98c-13 1-20 10-18 21 9-2 16-9 20-18z" fill={SHADE} />
    );
  const wingR =
    pose === "celebrate" ? (
      <path d="M126 92c14-10 20-22 14-32-8 6-16 18-20 30z" fill={SHADE} />
    ) : pose === "thinking" ? (
      <path d="M120 104c10-1 16-2 20 5-6 6-16 4-22-1z" fill={SHADE} />
    ) : (
      <path d="M127 98c13 1 20 10 18 21-9-2-16-9-20-18z" fill={SHADE} />
    );

  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" aria-hidden>
      <ellipse cx="80" cy="151" rx="34" ry="6" fill="#00726C" opacity="0.13" />
      <path d="M58 140c-9 0-14 5-14 10h20z" fill={ORANGE_D} />
      <path d="M102 140c9 0 14 5 14 10h-20z" fill={ORANGE_D} />
      <ellipse cx="62" cy="148" rx="13" ry="6" fill={ORANGE} />
      <ellipse cx="98" cy="148" rx="13" ry="6" fill={ORANGE} />
      {wingL}
      {wingR}
      <path d="M74 44c-5-11-11-13-9-1zM86 44c5-11 11-13 9-1z" fill={CREST} />
      <path d="M80 40c-3-12 0-16 4-6 2-9 8-6 4 4z" fill={TEAL} />
      <path d="M80 40C112 40 128 66 128 96C128 126 108 148 80 148C52 148 32 126 32 96C32 66 48 40 80 40Z" fill={TEAL} />
      <path d="M35 108c8 24 25 40 45 40s37-16 45-40c-12 12-78 12-90 0z" fill={SHADE} />
      <ellipse cx="80" cy="106" rx="37" ry="35" fill={BELLY} />
      {eyes}
      {brows}
      {beak}
      {pose === "sad" && (
        <path d="M120 92c0 4-2.6 7-6 7s-6-3-6-7c0-3 4-8 6-10 2 2 6 7 6 10z" fill="#8FD9FB" />
      )}
      {pose === "celebrate" && (
        <>
          <path d="m20 24 3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#FFC800" />
          <circle cx="140" cy="26" r="4.5" fill="#1CB0F6" />
          <circle cx="32" cy="122" r="4" fill="#FF4B4B" />
          <path d="m138 118 2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#B968F0" />
        </>
      )}
      {pose === "thinking" && (
        <>
          <circle cx="128" cy="52" r="3.2" fill="#C9C9C9" />
          <circle cx="137" cy="41" r="4.6" fill="#C9C9C9" />
        </>
      )}
    </svg>
  );
}
