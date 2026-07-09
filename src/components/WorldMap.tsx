"use client";
// Interactive SVG world map. Tap countries, highlight quiz states, explore with
// per-continent colors — now with pinch/scroll/double-tap zoom and drag pan.

import { useEffect, useMemo, useRef, useState } from "react";
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
const MIN_K = 1;
const MAX_K = 8;

const STATE_FILL: Record<TileState, string> = {
  selected: "#FFC800",
  correct: "#00B2A9",
  wrong: "#FF4B4B",
  target: "#00B2A9",
};

interface View {
  x: number;
  y: number;
  k: number;
}

export default function WorldMap({
  focus = "World",
  onTap,
  states = {},
  explore = false,
  height = 300,
  className = "",
}: Props) {
  const features = worldFeatures();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  // gesture bookkeeping
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; view: View } | null>(null);
  const pan = useRef<{ x: number; y: number; view: View } | null>(null);
  const moved = useRef(false);
  const lastTap = useRef(0);

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

  // reset zoom when the focus region changes
  useEffect(() => {
    setView({ x: 0, y: 0, k: 1 });
  }, [focus]);

  const clampView = (v: View): View => {
    const k = Math.min(MAX_K, Math.max(MIN_K, v.k));
    // keep the content covering the viewport
    const x = Math.min(0, Math.max(W - W * k, v.x));
    const y = Math.min(0, Math.max(height - height * k, v.y));
    return { x, y, k };
  };

  /** client → svg viewBox coords */
  const toSvg = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * height,
    };
  };

  const zoomAt = (sx: number, sy: number, factor: number) => {
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      // keep the point under the cursor fixed
      const px = (sx - v.x) / v.k;
      const py = (sy - v.y) / v.k;
      return clampView({ k, x: sx - px * k, y: sy - py * k });
    });
  };

  // wheel zoom needs a non-passive listener to preventDefault page scroll
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { x, y } = toSvg(e.clientX, e.clientY);
      zoomAt(x, y, e.deltaY < 0 ? 1.25 : 0.8);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    svgRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    const pts = Array.from(pointers.current.values());
    if (pts.length === 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midClient = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      pinch.current = { dist, mid: toSvg(midClient.x, midClient.y), view: viewRef.current };
      pan.current = null;
    } else if (pts.length === 1) {
      pan.current = { x: e.clientX, y: e.clientY, view: viewRef.current };
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(pointers.current.values());

    if (pts.length === 2 && pinch.current) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const factor = dist / pinch.current.dist;
      if (Math.abs(factor - 1) > 0.02) moved.current = true;
      const { view: v0, mid } = pinch.current;
      const k = Math.min(MAX_K, Math.max(MIN_K, v0.k * factor));
      const px = (mid.x - v0.x) / v0.k;
      const py = (mid.y - v0.y) / v0.k;
      setView(clampView({ k, x: mid.x - px * k, y: mid.y - py * k }));
    } else if (pts.length === 1 && pan.current) {
      const dx = e.clientX - pan.current.x;
      const dy = e.clientY - pan.current.y;
      if (Math.hypot(dx, dy) > 6) moved.current = true;
      if (viewRef.current.k > 1 && moved.current) {
        const rect = svgRef.current!.getBoundingClientRect();
        const sx = (dx / rect.width) * W;
        const sy = (dy / rect.height) * height;
        setView(clampView({ k: pan.current.view.k, x: pan.current.view.x + sx, y: pan.current.view.y + sy }));
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      pan.current = null;
      // double-tap to zoom / reset
      if (!moved.current) {
        const now = Date.now();
        if (now - lastTap.current < 320) {
          const { x, y } = toSvg(e.clientX, e.clientY);
          if (viewRef.current.k > 1.5) setView({ x: 0, y: 0, k: 1 });
          else zoomAt(x, y, 2.5);
          lastTap.current = 0;
          moved.current = true; // suppress the country click on this tap
          return;
        }
        lastTap.current = now;
      }
    }
  };

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
      style={{ touchAction: "none" }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${height}`}
        className="block h-auto w-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
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
                vectorEffect="non-scaling-stroke"
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
                onClick={
                  tappable
                    ? (e) => {
                        // a drag/pinch that ends on a country must not count as a tap
                        if (moved.current) {
                          e.stopPropagation();
                          return;
                        }
                        onTap!(f.id);
                      }
                    : undefined
                }
                whileTap={tappable ? { opacity: 0.7 } : undefined}
              />
            );
          })}
        </g>
      </svg>

      {/* zoom controls */}
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <button
          aria-label="Zoom in"
          onClick={() => zoomAt(W / 2, height / 2, 1.5)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-line bg-white/90 text-lg font-extrabold text-ink"
        >
          +
        </button>
        <button
          aria-label="Zoom out"
          onClick={() =>
            view.k <= 1.3 ? setView({ x: 0, y: 0, k: 1 }) : zoomAt(W / 2, height / 2, 0.67)
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-line bg-white/90 text-lg font-extrabold text-ink"
        >
          −
        </button>
      </div>
      {view.k > 1 && (
        <button
          onClick={() => setView({ x: 0, y: 0, k: 1 })}
          className="absolute bottom-2 right-2 rounded-lg border-2 border-line bg-white/90 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-sub"
        >
          Reset
        </button>
      )}
    </div>
  );
}
