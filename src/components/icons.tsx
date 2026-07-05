"use client";
// Atlas Sprint icon set — original flat two-tone SVGs on a 24px grid.
// No emoji, no icon libraries. Each icon takes a pixel size and renders inline.

import React from "react";
import type { Skill } from "@/lib/engine";

export interface IconProps {
  size?: number;
  className?: string;
}

const Svg = ({
  size = 24,
  className = "",
  children,
}: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden
  >
    {children}
  </svg>
);

/* ---------- game systems ---------- */

export const FlameIcon = ({ lit = true, ...p }: IconProps & { lit?: boolean }) => (
  <Svg {...p}>
    <path
      d="M12 2.5c.6 3-1.1 4.6-2.7 6.2C7.6 10.4 6 12.1 6 15a6 6 0 0 0 12 0c0-2.3-1-4.1-2.2-5.8-.5 1-1.2 1.7-2 2.1.3-3.4-.3-6.6-1.8-8.8Z"
      fill={lit ? "#FF9600" : "#D6D6D6"}
    />
    <path
      d="M12 21a4 4 0 0 1-4-4c0-1.8 1-3 2.2-4.2.3 1 .9 1.6 1.8 1.9-.1-1.2.2-2.4.9-3.3C14.6 12.8 16 14.6 16 17a4 4 0 0 1-4 4Z"
      fill={lit ? "#FFC800" : "#EBEBEB"}
    />
  </Svg>
);

export const HeartIcon = ({ empty = false, ...p }: IconProps & { empty?: boolean }) => (
  <Svg {...p}>
    <path
      d="M12 20.6 4.6 13A5.2 5.2 0 0 1 12 5.8 5.2 5.2 0 0 1 19.4 13L12 20.6Z"
      fill={empty ? "#E5E5E5" : "#FF4B4B"}
    />
    {!empty && <path d="M8.2 8.2a2.3 2.3 0 0 1 2.6.5" stroke="#FF9D9D" strokeWidth="1.6" strokeLinecap="round" />}
  </Svg>
);

export const FreezeIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" fill="#8FE0FF" />
    <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" stroke="#1CB0F6" strokeWidth="1.6" />
    <path d="M12 7.5v9M8.2 9.7l7.6 4.6M15.8 9.7l-7.6 4.6" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const BoltIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.4 2.5 5.5 13.4h5l-1.5 8 8.4-11.3h-5.2l1.2-7.6Z" fill="#FFC800" />
    <path d="M13.4 2.5 5.5 13.4h5l-.6 3.2 6.8-5.5h-4.4l1.1-8.6Z" fill="#FFDE59" />
  </Svg>
);

export const XpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8 14.6 9l6.6.5-5 4.3 1.5 6.4L12 16.7l-5.7 3.5 1.5-6.4-5-4.3L9.4 9 12 2.8Z" fill="#FFC800" />
    <path d="M12 6.4 13.5 10l3.8.3-2.9 2.5.9 3.7L12 14.6l-3.3 2 .9-3.8-2.9-2.5 3.8-.3L12 6.4Z" fill="#FFDE59" />
  </Svg>
);

export const TargetIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" fill="#FF4B4B" />
    <circle cx="12" cy="12" r="6" fill="#FFFFFF" />
    <circle cx="12" cy="12" r="3.2" fill="#FF4B4B" />
    <circle cx="12" cy="12" r="1.2" fill="#FFFFFF" />
  </Svg>
);

export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h10v6a5 5 0 0 1-10 0V3Z" fill="#FFC800" />
    <path d="M7 4H3.8c0 3.4 1.4 5.4 3.6 6M17 4h3.2c0 3.4-1.4 5.4-3.6 6" stroke="#FFC800" strokeWidth="1.8" />
    <path d="M10.8 13.5h2.4V17h-2.4z" fill="#D6A800" />
    <path d="M7.8 19.5a2 2 0 0 1 2-2h4.4a2 2 0 0 1 2 2v1H7.8v-1Z" fill="#B98A11" />
    <path d="M9.5 5.5c0 2 .4 3.6 1.2 4.8" stroke="#FFDE59" strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

export const MedalIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m7.3 2.5 3 5.5-3.2 1.8-3-5.6 3.2-1.7ZM16.7 2.5l-3 5.5 3.2 1.8 3-5.6-3.2-1.7Z" fill="#1CB0F6" />
    <circle cx="12" cy="14.5" r="6.5" fill="#FFC800" />
    <circle cx="12" cy="14.5" r="4.3" fill="#FFDE59" />
    <path d="m12 11.6 1 2h2.1l-1.6 1.5.5 2.1-2-1.2-2 1.2.5-2.1-1.6-1.5H11l1-2Z" fill="#D6A800" />
  </Svg>
);

export const CrownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 8 3.6 3L12 5.5 16.4 11 20 8l-1.4 9.5H5.4L4 8Z" fill="#FFC800" />
    <path d="M5.4 17.5h13.2v2H5.4z" fill="#D6A800" />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5.5" y="10" width="13" height="10" rx="2.5" fill="#C9C9C9" />
    <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="#C9C9C9" strokeWidth="2.4" />
    <circle cx="12" cy="14.5" r="1.6" fill="#8F8F8F" />
  </Svg>
);

/* ---------- navigation ---------- */

export const HomeIcon = ({ active = false, ...p }: IconProps & { active?: boolean }) => (
  <Svg {...p}>
    <path d="m12 3.2 8.5 7v9.6a1.2 1.2 0 0 1-1.2 1.2H14.6v-6.4H9.4V21H4.7a1.2 1.2 0 0 1-1.2-1.2v-9.6l8.5-7Z" fill={active ? "#00B2A9" : "#C9C9C9"} />
  </Svg>
);

export const MapIcon = ({ active = false, ...p }: IconProps & { active?: boolean }) => (
  <Svg {...p}>
    <path d="M3.5 5.6 9 3.8v14.6l-5.5 1.8V5.6Z" fill={active ? "#00B2A9" : "#C9C9C9"} />
    <path d="M9.6 3.8 14.4 6v14.5l-4.8-2.1V3.8Z" fill={active ? "#7FD8D2" : "#DFDFDF"} />
    <path d="M15 6.1 20.5 4.3v14.6L15 20.6V6.1Z" fill={active ? "#00B2A9" : "#C9C9C9"} />
  </Svg>
);

export const CompassIcon = ({ active = false, ...p }: IconProps & { active?: boolean }) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" fill={active ? "#00B2A9" : "#C9C9C9"} />
    <circle cx="12" cy="12" r="7" fill="#FFFFFF" />
    <path d="m15.8 8.2-2.4 5.2-5.2 2.4 2.4-5.2 5.2-2.4Z" fill={active ? "#FF4B4B" : "#A6A6A6"} />
    <circle cx="12" cy="12" r="1.1" fill="#FFFFFF" />
  </Svg>
);

export const PodiumIcon = ({ active = false, ...p }: IconProps & { active?: boolean }) => (
  <Svg {...p}>
    <rect x="9" y="8" width="6" height="12.5" rx="1" fill={active ? "#00B2A9" : "#C9C9C9"} />
    <rect x="2.8" y="12" width="6" height="8.5" rx="1" fill={active ? "#7FD8D2" : "#DFDFDF"} />
    <rect x="15.2" y="14" width="6" height="6.5" rx="1" fill={active ? "#7FD8D2" : "#DFDFDF"} />
    <path d="m12 2.6.9 1.8 2 .3-1.4 1.4.3 2L12 7.2l-1.8.9.3-2-1.4-1.4 2-.3.9-1.8Z" fill={active ? "#FFC800" : "#B5B5B5"} />
  </Svg>
);

export const ProfileIcon = ({ active = false, ...p }: IconProps & { active?: boolean }) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4.6" fill={active ? "#00B2A9" : "#C9C9C9"} />
    <path d="M3.8 21a8.2 8.2 0 0 1 16.4 0H3.8Z" fill={active ? "#7FD8D2" : "#DFDFDF"} />
  </Svg>
);

/* ---------- skills / misc ---------- */

export const GlobeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" fill="#1CB0F6" />
    <path d="M6.2 8.4c1.4-.8 2.9.2 4.4-.5 1.4-.7.6-2.3 2.2-2.9 1-.4 2.3 0 3.2.7A9.2 9.2 0 0 0 5 7.6c.4.2.8.5 1.2.8ZM4 14.3c1.9-.5 3.6 1 5 2.3.9.9-.3 2.4.7 3.4.4.4 1 .6 1.6.7A9.2 9.2 0 0 1 4 14.3ZM19.6 16.6c-1.4-.8-2-2.7-3.7-2.7-1.2 0-2.5.4-2.6-1.2-.1-1.5 1.5-2.2 2.9-2.2 1.7 0 3.6.6 4.9 1.9a9.2 9.2 0 0 1-1.5 4.2Z" fill="#58D66C" />
  </Svg>
);

export const PillarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5 12 3l8 5.5H4Z" fill="#B968F0" />
    <path d="M5 9.5h2.6V17H5V9.5Zm5.7 0h2.6V17h-2.6V9.5Zm5.7 0H19V17h-2.6V9.5Z" fill="#D9B3F5" />
    <rect x="3.5" y="17.8" width="17" height="2.7" rx="1" fill="#B968F0" />
  </Svg>
);

export const FlagIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="2.8" width="2.2" height="18.4" rx="1.1" fill="#B98A11" />
    <path d="M7.8 4h11.4l-2.8 3.8 2.8 3.8H7.8V4Z" fill="#FF4B4B" />
    <path d="M7.8 4h5.7v7.6H7.8z" fill="#FF7B7B" />
  </Svg>
);

export const PuzzleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 4.5a2 2 0 1 1 4 0H17a1.5 1.5 0 0 1 1.5 1.5v3.5a2 2 0 1 1 0 4V17a1.5 1.5 0 0 1-1.5 1.5h-3.5a2 2 0 1 0-4 0H6A1.5 1.5 0 0 1 4.5 17v-3.5a2 2 0 1 0 0-4V6A1.5 1.5 0 0 1 6 4.5h3.5Z" fill="#FF9600" />
    <path d="M9.5 4.5a2 2 0 1 1 4 0H17A1.5 1.5 0 0 1 18.5 6v3.5a2 2 0 1 1 0 4V17l-7-.5-1.5-6L6 4.5h3.5Z" fill="#FFB240" opacity="0.7" />
  </Svg>
);

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8a7 7 0 0 1 7 7c0 4.8-5.3 9.9-6.6 11.1a.6.6 0 0 1-.8 0C10.3 19.7 5 14.6 5 9.8a7 7 0 0 1 7-7Z" fill="#1CB0F6" />
    <circle cx="12" cy="9.8" r="2.9" fill="#FFFFFF" />
  </Svg>
);

export const LinkIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.6" y="9.4" width="9" height="5.2" rx="2.6" fill="#2EC45E" />
    <rect x="12.4" y="9.4" width="9" height="5.2" rx="2.6" fill="#7BDD9C" />
    <rect x="8.6" y="10.7" width="6.8" height="2.6" rx="1.3" fill="#FFFFFF" />
  </Svg>
);

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.2 17 8.4h-3.2v6h-3.6v-6H7L12 3.2Z" fill="currentColor" />
    <path d="M5 13.5v4.9A1.6 1.6 0 0 0 6.6 20h10.8a1.6 1.6 0 0 0 1.6-1.6v-4.9h-2.6v3.9H7.6v-3.9H5Z" fill="currentColor" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4.5 12.6 4.6 4.6L19.5 6.8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CrossIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

export const ChevronIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.3l-1.8-5.7L4.5 10.8 10.2 9 12 3.5Z" fill="#FFC800" />
    <path d="M18.8 15.2l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" fill="#FFDE59" />
  </Svg>
);

export const BirdIcon = (p: IconProps) => (
  // small paper plane / dove for "all clear" empty state
  <Svg {...p}>
    <path d="m3 11.2 18-7-6.2 16.6-3.4-6.4L3 11.2Z" fill="#1CB0F6" />
    <path d="m11.4 14.4 9.6-10.2-6.2 16.6-3.4-6.4Z" fill="#8FD9FB" />
  </Svg>
);

/* ---------- skill icon lookup ---------- */

export function SkillIcon({ skill, size = 24, className = "" }: { skill: Skill } & IconProps) {
  const map: Record<Skill, React.ReactNode> = {
    capital: <PillarIcon size={size} className={className} />,
    flag: <FlagIcon size={size} className={className} />,
    shape: <PuzzleIcon size={size} className={className} />,
    locate: <PinIcon size={size} className={className} />,
    neighbor: <LinkIcon size={size} className={className} />,
    rank: <TrophyIcon size={size} className={className} />,
  };
  return <>{map[skill]}</>;
}

/* ---------- loading spinner ---------- */

export const Spinner = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" className="animate-spin" aria-label="Loading">
    <circle cx="20" cy="20" r="16" stroke="#E5E5E5" strokeWidth="6" fill="none" />
    <path d="M36 20a16 16 0 0 0-16-16" stroke="#00B2A9" strokeWidth="6" fill="none" strokeLinecap="round" />
  </svg>
);
