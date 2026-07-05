"use client";
// Interactive SVG world map. Tap countries, highlight quiz states,
// or explore with per-continent colors.

import { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { motion } from "framer-motion";
import { byNumeric, CONTINENT_META, type Continent } from "@/data/countries";
import { fitFeatures, worldFeatures, type GeoFeature } from "./geo";

export type TileState = "selected" | "correct" | "wrong" | "target";

interface Props {
  focus?: Continent | "World";
  onTap?: (numeric: string) => void;
  /** numeric-id → state, for quiz feedback */
  states?: Record<string, TileState>;
  /** color dataset countries by continent (sandbox explore) */
  explore?: boolean;
  height?: number;
  className?: string;
}

const W = 400;

const STATE_FILL: Record<TileState, string> = {
  selected: "#FFC800",
  correct: "#00B2A9",
  wrong: "#FF4B4B",
  target: "#00B2A9",
};

export default function WorldMap({
  focus = "World",
  onTap,
  states = {},
  explore = false,
  height = 300,
  className = "",
}: Props) {
  const features = worldFeatures();

  const path = useMemo(() => {
    const proj = geoNaturalEarth1();
    if (focus === "World") {
      proj.fitExtent(
        [
          [6, 6],
          [W - 6, height - 6],
        ],
        { type: "Sphere" } as any
      );
    } else {
      proj.fitExtent(
        [
          [10, 10],
          [W - 10, height - 10],
        ],
        { type: "FeatureCollection", features: fitFeatures(focus) } as any
      );
    }
    return geoPath(proj);
  }, [focus, height]);

  const fillOf = (f: GeoFeature): string => {
    const st = states[f.id];
    if (st) return STATE_FILL[st];
    const c = byNumeric.get(f.id);
    if (!c) return "#E8E8E8"; // not in dataset → neutral gray
    if (explore) return CONTINENT_META[c.continent].color + "CC";
    return "#FFE3A6"; // tappable quiz country → warm sand
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-blue-light ${className}`}
      style={{ touchAction: "manipulation" }}
    >
      <svg viewBox={`0 0 ${W} ${height}`} className="block h-auto w-full">
        {features.map((f, i) => {
          const d = path(f as any);
          if (!d) return null;
          const c = byNumeric.get(f.id);
          const tappable = !!onTap && !!c;
          const st = states[f.id];
          return (
            <motion.path
              // some 110m features (disputed territories) lack unique ids
              key={`${f.id ?? "x"}-${i}`}
              d={d}
              fill={fillOf(f)}
              stroke="#FFFFFF"
              strokeWidth={0.6}
              initial={false}
              animate={
                st === "target"
                  ? { opacity: [1, 0.45, 1, 0.45, 1] }
                  : st === "correct"
                    ? { scale: [1, 1.015, 1] }
                    : { opacity: 1 }
              }
              transition={{ duration: st === "target" ? 1.1 : 0.35 }}
              style={{
                cursor: tappable ? "pointer" : "default",
                transformOrigin: "center",
              }}
              onClick={tappable ? () => onTap!(f.id) : undefined}
              whileTap={tappable ? { opacity: 0.7 } : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}
