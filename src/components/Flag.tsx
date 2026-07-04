"use client";
import { byId, flagUrl } from "@/data/countries";

interface Props {
  countryId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "h-6 w-9", md: "h-12 w-[72px]", lg: "h-20 w-[120px]" };

export default function Flag({ countryId, size = "md", className = "" }: Props) {
  const c = byId.get(countryId);
  if (!c) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(countryId, size === "lg" ? 320 : 160)}
      alt={`Flag of ${c.name}`}
      draggable={false}
      className={`${SIZES[size]} select-none rounded-md border border-black/10 object-cover shadow-sm ${className}`}
      loading="lazy"
    />
  );
}
