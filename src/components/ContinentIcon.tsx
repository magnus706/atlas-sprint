"use client";
// Real continent silhouettes as icons, generated from the map data.
// Unique to Pangea — no clipart, no emoji.

import { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { ofContinent, CONTINENT_META, type Continent } from "@/data/countries";
import { fitFeatures, worldFeatures } from "./geo";

const cache = new Map<Continent, string[]>();

function continentPaths(cont: Continent): string[] {
  if (cache.has(cont)) return cache.get(cont)!;
  const ids = new Set(ofContinent(cont).map((c) => c.numeric));
  const render = worldFeatures().filter((f) => ids.has(f.id));
  const proj = geoNaturalEarth1();
  proj.fitExtent(
    [
      [2, 2],
      [46, 46],
    ],
    { type: "FeatureCollection", features: fitFeatures(cont) } as any
  );
  const path = geoPath(proj);
  const ds = render.map((f) => path(f as any)).filter(Boolean) as string[];
  cache.set(cont, ds);
  return ds;
}

export default function ContinentIcon({
  continent,
  size = 36,
  color,
  className = "",
}: {
  continent: Continent;
  size?: number;
  color?: string;
  className?: string;
}) {
  const ds = useMemo(() => continentPaths(continent), [continent]);
  const fill = color ?? CONTINENT_META[continent].color;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <clipPath id={`cc-${continent.replace(/\s/g, "")}`}>
          <rect x="0" y="0" width="48" height="48" rx="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#cc-${continent.replace(/\s/g, "")})`}>
        {ds.map((d, i) => (
          <path key={i} d={d} fill={fill} />
        ))}
      </g>
    </svg>
  );
}
