"use client";
// "Orbi" v3 — Atlas Sprint's mascot: a glossy globe-explorer with aviator goggles.
// Dimensional (radial-gradient sphere, gloss highlights, soft shadow), four poses,
// with idle breathing + occasional blink for life.

import { useId } from "react";
import { motion } from "framer-motion";

export type MascotPose = "happy" | "celebrate" | "sad" | "thinking";

interface Props {
  pose?: MascotPose;
  size?: number;
  float?: boolean;
  className?: string;
}

export default function Mascot({ pose = "happy", size = 120, float = true, className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `${uid}-${name}`;

  const blink = pose === "sad" || pose === "celebrate" ? {} : { scaleY: [1, 1, 1, 0.1, 1] };

  return (
    <motion.div
      animate={
        float
          ? pose === "celebrate"
            ? { y: [0, -12, 0], rotate: [0, -3, 3, 0] }
            : { y: [0, -6, 0], scale: [1, 1.025, 1] }
          : undefined
      }
      transition={{ repeat: Infinity, duration: pose === "celebrate" ? 1.3 : 3.6, ease: "easeInOut" }}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id={g("body")} cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#5FE6DE" />
            <stop offset="52%" stopColor="#00B2A9" />
            <stop offset="100%" stopColor="#008179" />
          </radialGradient>
          <radialGradient id={g("face")} cx="45%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#EAFCF9" />
            <stop offset="100%" stopColor="#C4F1EC" />
          </radialGradient>
          <linearGradient id={g("lens")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D3F1FF" />
            <stop offset="100%" stopColor="#7FC6EE" />
          </linearGradient>
          <linearGradient id={g("strap")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E7B268" />
            <stop offset="100%" stopColor="#C6893C" />
          </linearGradient>
          <radialGradient id={g("gold")} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFDE6B" />
            <stop offset="100%" stopColor="#FFB800" />
          </radialGradient>
          <radialGradient id={g("wing")} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#00A69D" />
            <stop offset="100%" stopColor="#007D76" />
          </radialGradient>
        </defs>

        {/* ground shadow */}
        <ellipse cx="70" cy="128" rx="34" ry="7" fill="#00726C" opacity="0.14" />

        {/* feet */}
        <ellipse cx="55" cy="123" rx="12" ry="6" fill="#F0A93A" />
        <ellipse cx="85" cy="123" rx="12" ry="6" fill="#F0A93A" />
        <ellipse cx="55" cy="121.5" rx="12" ry="5" fill="#FFC15A" />
        <ellipse cx="85" cy="121.5" rx="12" ry="5" fill="#FFC15A" />

        {/* wings */}
        {pose === "celebrate" ? (
          <>
            <path d="M28 74C13 63 9 45 15 35c8 6 17 17 21 31z" fill={`url(#${g("wing")})`} />
            <path d="M112 74c15-11 19-29 13-39-8 6-17 17-21 31z" fill={`url(#${g("wing")})`} />
          </>
        ) : pose === "thinking" ? (
          <>
            <path d="M26 82c-10 4-16 14-14 24 8-2 16-9 20-18z" fill={`url(#${g("wing")})`} />
            <path d="M112 96c12-2 18-10 18-20-9 0-18 5-24 13z" fill={`url(#${g("wing")})`} />
          </>
        ) : pose === "sad" ? (
          <>
            <path d="M27 88c-8 8-10 20-6 28 7-4 12-13 13-23z" fill={`url(#${g("wing")})`} />
            <path d="M113 88c8 8 10 20 6 28-7-4-12-13-13-23z" fill={`url(#${g("wing")})`} />
          </>
        ) : (
          <>
            <path d="M27 80c-11 2-18 11-18 22 9-1 17-7 23-16z" fill={`url(#${g("wing")})`} />
            <path d="M113 80c11 2 18 11 18 22-9-1-17-7-23-16z" fill={`url(#${g("wing")})`} />
          </>
        )}

        {/* body sphere */}
        <circle cx="70" cy="76" r="46" fill={`url(#${g("body")})`} />
        {/* rim light bottom-right */}
        <path d="M108 92a44 44 0 0 1-3 8 46 46 0 0 1-52 22 46 46 0 0 0 55-30z" fill="#5FE6DE" opacity="0.25" />
        {/* gloss highlight top-left */}
        <ellipse cx="52" cy="50" rx="22" ry="15" fill="#FFFFFF" opacity="0.28" transform="rotate(-24 52 50)" />
        {/* subtle continents */}
        <path d="M34 74c6-3 12 0 11 6-1 5-8 6-12 2-3-3-3-6 1-8z" fill="#3ACFC6" opacity="0.55" />
        <path d="M104 66c5-2 9 1 8 6-1 4-7 5-10 2-2.5-2.5-2-6 2-8z" fill="#3ACFC6" opacity="0.55" />

        {/* face patch */}
        <ellipse cx="70" cy="82" rx="32" ry="29" fill={`url(#${g("face")})`} />

        {/* goggles on forehead */}
        <path d="M27 48c11-7 75-7 86 0l-2 8c-13-6-69-6-82 0z" fill={`url(#${g("strap")})`} />
        <circle cx="53" cy="47" r="12.5" fill={`url(#${g("strap")})`} />
        <circle cx="87" cy="47" r="12.5" fill={`url(#${g("strap")})`} />
        <circle cx="53" cy="47" r="8.5" fill={`url(#${g("lens")})`} />
        <circle cx="87" cy="47" r="8.5" fill={`url(#${g("lens")})`} />
        <path d="M48 43c2-2 5-2 7 0" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M82 43c2-2 5-2 7 0" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9" />

        {/* eyes (blink-capable group) */}
        {pose === "celebrate" ? (
          <>
            <path d="M43 72c4-6 12-6 16 0" stroke="#2B2B2B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M81 72c4-6 12-6 16 0" stroke="#2B2B2B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <motion.g
            animate={blink}
            transition={{ repeat: Infinity, duration: 4.5, times: [0, 0.9, 0.94, 0.965, 1], ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
          >
            <ellipse cx="54" cy="76" rx="12.5" ry="15.5" fill="#FFFFFF" />
            <ellipse cx="86" cy="76" rx="12.5" ry="15.5" fill="#FFFFFF" />
            {pose === "sad" ? (
              <>
                <circle cx="54" cy="81" r="5.6" fill="#2B2B2B" />
                <circle cx="86" cy="81" r="5.6" fill="#2B2B2B" />
                <circle cx="56" cy="79" r="1.9" fill="#FFFFFF" />
                <circle cx="88" cy="79" r="1.9" fill="#FFFFFF" />
              </>
            ) : pose === "thinking" ? (
              <>
                <circle cx="49" cy="70" r="6" fill="#2B2B2B" />
                <circle cx="81" cy="70" r="6" fill="#2B2B2B" />
                <circle cx="51.5" cy="68" r="2.1" fill="#FFFFFF" />
                <circle cx="83.5" cy="68" r="2.1" fill="#FFFFFF" />
              </>
            ) : (
              <>
                <circle cx="55" cy="78" r="6.6" fill="#2B2B2B" />
                <circle cx="87" cy="78" r="6.6" fill="#2B2B2B" />
                <circle cx="57.5" cy="75" r="2.5" fill="#FFFFFF" />
                <circle cx="89.5" cy="75" r="2.5" fill="#FFFFFF" />
                <circle cx="52.5" cy="80.5" r="1.3" fill="#FFFFFF" opacity="0.85" />
                <circle cx="84.5" cy="80.5" r="1.3" fill="#FFFFFF" opacity="0.85" />
              </>
            )}
          </motion.g>
        )}

        {/* sad brows */}
        {pose === "sad" && (
          <path d="M41 63l15 5M99 63l-15 5" stroke="#008179" strokeWidth="3.2" strokeLinecap="round" />
        )}
        {pose === "thinking" && <path d="M41 60l14-2" stroke="#008179" strokeWidth="3.2" strokeLinecap="round" />}

        {/* cheeks */}
        {pose !== "sad" && (
          <>
            <ellipse cx="38" cy="90" rx="6" ry="4" fill="#FF8FA3" opacity="0.75" />
            <ellipse cx="102" cy="90" rx="6" ry="4" fill="#FF8FA3" opacity="0.75" />
          </>
        )}

        {/* mouth */}
        {pose === "celebrate" ? (
          <>
            <path d="M56 90c5 12 23 12 28 0-4 2-24 2-28 0z" fill="#00625C" />
            <path d="M63 97c2.5 2.5 11.5 2.5 14 0-1.5 4-12.5 4-14 0z" fill="#FF8FA3" />
          </>
        ) : pose === "sad" ? (
          <path d="M60 102c4-5 16-5 20 0" stroke="#00625C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        ) : pose === "thinking" ? (
          <path d="M62 99h16" stroke="#00625C" strokeWidth="4.5" strokeLinecap="round" />
        ) : (
          <>
            <path d="M58 95c5 7 19 7 24 0" stroke="#00625C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M66 100c2 1.8 6 1.8 8 0-1 3-7 3-8 0z" fill="#FF8FA3" />
          </>
        )}

        {/* pose extras */}
        {pose === "celebrate" && (
          <>
            <path d="m20 20 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z" fill={`url(#${g("gold")})`} />
            <path d="m116 14 2.3 4.6 4.7 2.4-4.7 2.3-2.3 4.7-2.3-4.7-4.7-2.3 4.7-2.4 2.3-4.6Z" fill="#1CB0F6" />
            <circle cx="36" cy="10" r="3.5" fill="#FF4B4B" />
            <circle cx="104" cy="30" r="2.6" fill="#B968F0" />
          </>
        )}
        {pose === "thinking" && (
          <>
            <circle cx="118" cy="52" r="3" fill="#C9C9C9" />
            <circle cx="126" cy="42" r="4.4" fill="#C9C9C9" />
          </>
        )}
        {pose === "sad" && (
          <path d="M100 78c0 3.5-2.3 6-5 6s-5-2.5-5-6c0-2.8 3.4-7.4 5-9 1.6 1.6 5 6.2 5 9z" fill="#8FD9FB" transform="translate(6 4)" />
        )}
      </svg>
    </motion.div>
  );
}
