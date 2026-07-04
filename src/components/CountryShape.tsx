"use client";
// Single-country silhouette card, sized to fit.

import { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { byId } from "@/data/countries";
import { featureOf } from "./geo";

interface Props {
  countryId: string;
  width?: number;
  height?: number;
  fill?: string;
  className?: string;
}

export default function CountryShape({
  countryId,
  width = 220,
  height = 160,
  fill = "#7C5CE0",
  className = "",
}: Props) {
  const d = useMemo(() => {
    const c = byId.get(countryId);
    if (!c) return null;
    const f = featureOf(c.numeric);
    if (!f) return null;
    const proj = geoNaturalEarth1();
    proj.fitExtent(
      [
        [10, 10],
        [width - 10, height - 10],
      ],
      f as any
    );
    return geoPath(proj)(f as any);
  }, [countryId, width, height]);

  if (!d) return null;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ width: "100%", height: "auto", maxWidth: width }}
    >
      <path d={d} fill={fill} />
    </svg>
  );
}
