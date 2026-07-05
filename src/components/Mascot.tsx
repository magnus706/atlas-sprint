"use client";
// "Orbi" — Atlas Sprint's mascot: a little globe with a yellow orbit ring.
// Original flat SVG, four poses, gentle idle float via framer-motion.

import { motion } from "framer-motion";

export type MascotPose = "happy" | "celebrate" | "sad" | "thinking";

interface Props {
  pose?: MascotPose;
  size?: number;
  float?: boolean;
  className?: string;
}

export default function Mascot({ pose = "happy", size = 120, float = true, className = "" }: Props) {
  const eyes = {
    happy: (
      <>
        <ellipse cx="47" cy="56" rx="7.5" ry="9" fill="#fff" />
        <ellipse cx="73" cy="56" rx="7.5" ry="9" fill="#fff" />
        <circle cx="48.5" cy="58" r="4" fill="#3C3C3C" />
        <circle cx="74.5" cy="58" r="4" fill="#3C3C3C" />
        <circle cx="50" cy="56.5" r="1.4" fill="#fff" />
        <circle cx="76" cy="56.5" r="1.4" fill="#fff" />
      </>
    ),
    celebrate: (
      <>
        {/* squeezed-shut joyful eyes */}
        <path d="M41 56c3.5-4.5 9-4.5 12.5 0" stroke="#3C3C3C" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M66.5 56c3.5-4.5 9-4.5 12.5 0" stroke="#3C3C3C" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      </>
    ),
    sad: (
      <>
        <ellipse cx="47" cy="58" rx="7" ry="8" fill="#fff" />
        <ellipse cx="73" cy="58" rx="7" ry="8" fill="#fff" />
        <circle cx="47" cy="61" r="3.8" fill="#3C3C3C" />
        <circle cx="73" cy="61" r="3.8" fill="#3C3C3C" />
        <path d="M39 49.5 53 53M81 49.5 67 53" stroke="#00726C" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    thinking: (
      <>
        <ellipse cx="47" cy="56" rx="7.5" ry="9" fill="#fff" />
        <ellipse cx="73" cy="56" rx="7.5" ry="9" fill="#fff" />
        <circle cx="44.5" cy="55" r="4" fill="#3C3C3C" />
        <circle cx="70.5" cy="55" r="4" fill="#3C3C3C" />
        <path d="M40 45.5 52 47" stroke="#00726C" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  }[pose];

  const mouth = {
    happy: <path d="M52 70c4.5 5 11.5 5 16 0" stroke="#00726C" strokeWidth="3.4" strokeLinecap="round" fill="none" />,
    celebrate: (
      <path d="M50 68c4 8 16 8 20 0-2.5 1.5-17.5 1.5-20 0Z" fill="#00726C" stroke="#00726C" strokeWidth="2" strokeLinejoin="round" />
    ),
    sad: <path d="M53 74c4-4.5 10-4.5 14 0" stroke="#00726C" strokeWidth="3.4" strokeLinecap="round" fill="none" />,
    thinking: <path d="M54 71h11" stroke="#00726C" strokeWidth="3.4" strokeLinecap="round" />,
  }[pose];

  return (
    <motion.div
      animate={
        float
          ? pose === "celebrate"
            ? { y: [0, -10, 0], rotate: [0, -3, 3, 0] }
            : { y: [0, -6, 0] }
          : undefined
      }
      transition={{ repeat: Infinity, duration: pose === "celebrate" ? 1.4 : 3.2, ease: "easeInOut" }}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
        {/* orbit ring, behind body */}
        <ellipse cx="60" cy="66" rx="52" ry="16" fill="none" stroke="#FFC800" strokeWidth="5" transform="rotate(-14 60 66)" opacity="0.9" />
        {/* body */}
        <circle cx="60" cy="62" r="38" fill="#00B2A9" />
        <path d="M60 100a38 38 0 0 0 32.9-19A38 38 0 0 1 27 81a38 38 0 0 0 33 19Z" fill="#008F88" opacity="0.55" />
        {/* land patches */}
        <path d="M35 44c6-2 10 2 9 7-1 4-7 5-10 2-2.5-2.6-2.5-7.4 1-9Z" fill="#7FE3DC" />
        <path d="M76 34c5 1 7 6 4 9.5-3 3.5-9 1.5-9.5-2.5-.4-3.5 2-7.5 5.5-7Z" fill="#7FE3DC" />
        <path d="M72 84c5-1.5 9 1.5 8.5 5-.6 3.6-6.5 4.6-9 2-2.2-2.3-2.5-6 0-7Z" fill="#7FE3DC" />
        <path d="M38 78c3.5-.5 6 2 5 5-.9 2.7-5.4 3-7 .7-1.4-2-.8-5.2 2-5.7Z" fill="#7FE3DC" />
        {/* face */}
        {eyes}
        {mouth}
        {/* cheeks */}
        {pose !== "sad" && (
          <>
            <ellipse cx="38" cy="66" rx="4.5" ry="3" fill="#FF9D9D" opacity="0.7" />
            <ellipse cx="82" cy="66" rx="4.5" ry="3" fill="#FF9D9D" opacity="0.7" />
          </>
        )}
        {/* orbit ring, front arc */}
        <path
          d="M9 79.5C22 89 42 93.5 62 90.5c20-3 38-11.5 46-21"
          fill="none"
          stroke="#FFC800"
          strokeWidth="5"
          strokeLinecap="round"
          transform="rotate(-2 60 66)"
        />
        {/* little satellite on the ring */}
        <circle cx="103" cy="72" r="5" fill="#FFC800" />
        <circle cx="103" cy="72" r="2" fill="#FFF5D6" />
        {pose === "celebrate" && (
          <>
            <path d="m22 22 2.4 5 5 2.4-5 2.4-2.4 5-2.4-5-5-2.4 5-2.4 2.4-5Z" fill="#FFC800" />
            <path d="m95 16 1.8 3.8 3.8 1.8-3.8 1.8-1.8 3.8-1.8-3.8-3.8-1.8 3.8-1.8 1.8-3.8Z" fill="#1CB0F6" />
            <circle cx="34" cy="14" r="3" fill="#FF4B4B" />
          </>
        )}
        {pose === "sad" && (
          <path d="M85 44c0 3.5-2.3 6-5 6s-5-2.5-5-6c0-2.8 3.4-7.4 5-9 1.6 1.6 5 6.2 5 9Z" fill="#8FD9FB" transform="translate(8 -14)" />
        )}
      </svg>
    </motion.div>
  );
}
