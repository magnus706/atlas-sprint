// Shared world geometry loaded from the world-atlas topojson (110m).
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import { byNumeric, ofContinent, type Continent } from "@/data/countries";

export interface GeoFeature {
  type: "Feature";
  id: string;
  properties: { name: string };
  geometry: any;
}

let cache: GeoFeature[] | null = null;

export function worldFeatures(): GeoFeature[] {
  if (!cache) {
    const topo = worldData as any;
    cache = (feature(topo, topo.objects.countries) as any).features as GeoFeature[];
  }
  return cache;
}

export function featureOf(numeric: string): GeoFeature | undefined {
  return worldFeatures().find((f) => f.id === numeric);
}

// Features whose geometry wraps the antimeridian and wrecks fitSize bounds.
const FIT_EXCLUDE = new Set(["643", "840", "242", "554"]); // RU, US, FJ, NZ

/** Features used to frame a continent view (excludes wrap-around geometries). */
export function fitFeatures(cont: Continent): GeoFeature[] {
  const ids = new Set(ofContinent(cont).map((c) => c.numeric));
  return worldFeatures().filter((f) => ids.has(f.id) && !FIT_EXCLUDE.has(f.id));
}

export const countryOfFeature = (f: GeoFeature) => byNumeric.get(f.id);
