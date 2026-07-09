"use client";
// "Pan" — the Pangea mascot. Real illustrated art (public/mascot/<pose>.png),
// background pre-removed. Falls back to a flat-vector penguin only if an image
// fails to load. Wrapped in framer-motion for idle float / celebrate bounce.

import { useState } from "react";
import { motion } from "framer-motion";

export type MascotPose = "happy" | "celebrate" | "sad" | "thinking";

interface Props {
  pose?: MascotPose;
  size?: number;
  float?: boolean;
  className?: string;
}

export default function Mascot({ pose = "happy", size = 120, float = true, className = "" }: Props) {
  const [broken, setBroken] = useState(false);
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const motionProps = float
    ? pose === "celebrate"
      ? { animate: { y: [0, -12, 0], rotate: [0, -3, 3, 0] }, transition: { repeat: Infinity, duration: 1.3, ease: "easeInOut" as const } }
      : { animate: { y: [0, -6, 0] }, transition: { repeat: Infinity, duration: 3.4, ease: "easeInOut" as const } }
    : {};

  return (
    <motion.div {...motionProps} className={`inline-block ${className}`} style={{ width: size, height: size }}>
      {broken ? (
        <Penguin pose={pose} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${bp}/mascot/${pose}.png`}
          alt="Pan the mascot"
          width={size}
          height={size}
          draggable={false}
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }}
        />
      )}
    </motion.div>
  );
}

// ---------- flat-vector penguin fallback ----------

const TEAL = "#00B2A9", SHADE = "#00938B", CREST = "#00A69D";
const BELLY = "#E9F8EE", INK = "#243244", ORANGE = "#FF9600", ORANGE_D = "#E67F00";

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
      </>
    );
  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%" aria-hidden>
      <ellipse cx="80" cy="151" rx="34" ry="6" fill="#00726C" opacity="0.13" />
      <ellipse cx="62" cy="148" rx="13" ry="6" fill={ORANGE} />
      <ellipse cx="98" cy="148" rx="13" ry="6" fill={ORANGE} />
      <path d="M74 44c-5-11-11-13-9-1zM86 44c5-11 11-13 9-1z" fill={CREST} />
      <path d="M80 40C112 40 128 66 128 96C128 126 108 148 80 148C52 148 32 126 32 96C32 66 48 40 80 40Z" fill={TEAL} />
      <path d="M35 108c8 24 25 40 45 40s37-16 45-40c-12 12-78 12-90 0z" fill={SHADE} />
      <ellipse cx="80" cy="106" rx="37" ry="35" fill={BELLY} />
      {eyes}
      <path d="M70 100q10 3 20 0-3 10-10 10t-10-10z" fill={ORANGE} />
    </svg>
  );
}
