"use client";
// Medal artwork: gold disc + ribbon + real continent silhouette (or laurel globe
// for the World medal). Tarnished medals render desaturated.

import { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { ofContinent, CONTINENT_META, type Continent } from "@/data/countries";
import { fitFeatures, worldFeatures } from "./geo";
import type { MedalId, MedalStatus } from "@/lib/medals";

const silCache = new Map<Continent, string[]>();

function silhouette(cont: Continent): string[] {
  if (silCache.has(cont)) return silCache.get(cont)!;
  const ids = new Set(ofContinent(cont).map((c) => c.numeric));
  const render = worldFeatures().filter((f) => ids.has(f.id));
  const proj = geoNaturalEarth1();
  proj.fitExtent(
    [
      [38, 40],
      [82, 84],
    ],
    { type: "FeatureCollection", features: fitFeatures(cont) } as any
  );
  const path = geoPath(proj);
  const ds = render.map((f) => path(f as any)).filter(Boolean) as string[];
  silCache.set(cont, ds);
  return ds;
}

export default function MedalArt({
  id,
  status = "shiny",
  size = 96,
  className = "",
}: {
  id: MedalId;
  status?: MedalStatus;
  size?: number;
  className?: string;
}) {
  const tarnished = status === "tarnished";
  const isWorld = id === "World";
  const ds = useMemo(() => (isWorld ? [] : silhouette(id as Continent)), [id, isWorld]);

  const gold = tarnished ? "#B8B8B8" : "#FFC800";
  const goldDark = tarnished ? "#9A9A9A" : "#D6A800";
  const goldLight = tarnished ? "#D6D6D6" : "#FFDE59";
  const field = tarnished ? "#CFCFCF" : isWorld ? "#1CB0F6" : CONTINENT_META[id as Continent].color;
  const sil = tarnished ? "#8F8F8F" : "#FFFFFF";
  const ribbonL = tarnished ? "#A8A8A8" : "#FF4B4B";
  const ribbonR = tarnished ? "#8F8F8F" : "#D63A3A";

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden>
      {/* ribbon */}
      <path d="M42 6h16l-4 34-16-4 4-30Z" fill={ribbonL} />
      <path d="M78 6H62l4 34 16-4-4-30Z" fill={ribbonR} />
      {/* disc */}
      <circle cx="60" cy="66" r="42" fill={goldDark} />
      <circle cx="60" cy="62" r="42" fill={gold} />
      <circle cx="60" cy="62" r="33" fill={goldDark} />
      <circle cx="60" cy="62" r="30" fill={field} />
      {/* shine */}
      <path d="M30 44a36 36 0 0 1 22-18" stroke={goldLight} strokeWidth="5" strokeLinecap="round" fill="none" />

      {isWorld ? (
        <>
          {/* globe grid */}
          <circle cx="60" cy="62" r="21" fill="none" stroke={sil} strokeWidth="3" />
          <ellipse cx="60" cy="62" rx="10" ry="21" fill="none" stroke={sil} strokeWidth="2.4" />
          <path d="M39.5 55h41M39.5 69h41" stroke={sil} strokeWidth="2.4" />
          {/* crown on top of disc */}
          <path d="m44 22 6 7 10-11 10 11 6-7-3 15H47l-3-15Z" fill={gold} stroke={goldDark} strokeWidth="2" strokeLinejoin="round" />
        </>
      ) : (
        <g>
          {ds.map((d, i) => (
            <path key={i} d={d} fill={sil} />
          ))}
        </g>
      )}

      {/* laurel */}
      <path d="M28 84c-6-8-8-18-5-27" stroke={tarnished ? "#9A9A9A" : "#26A04E"} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M92 84c6-8 8-18 5-27" stroke={tarnished ? "#9A9A9A" : "#26A04E"} strokeWidth="4" strokeLinecap="round" fill="none" />

      {status === "at-risk" && (
        <g>
          <circle cx="98" cy="96" r="13" fill="#FF9600" stroke="#FFFFFF" strokeWidth="3" />
          <path d="M98 89v8" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="98" cy="102" r="1.9" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
}
