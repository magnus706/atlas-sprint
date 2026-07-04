"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/learn", label: "Learn", emoji: "🗺️" },
  { href: "/sandbox", label: "Explore", emoji: "🧭" },
  { href: "/rankings", label: "Top 10", emoji: "🏆" },
  { href: "/stats", label: "You", emoji: "⭐" },
];

const HIDDEN = ["/play", "/onboarding"];

export default function BottomNav() {
  const path = usePathname();
  if (HIDDEN.some((h) => path.startsWith(h))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-3">
      <div className="flex items-center justify-between rounded-3xl border-2 border-sand bg-white/95 px-2 py-1.5 shadow-[0_4px_0_#EFE0CA] backdrop-blur">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className="relative flex-1">
              <motion.div whileTap={{ scale: 0.9 }} className="relative flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5">
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-cream"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative text-xl leading-none">{t.emoji}</span>
                <span className={`relative text-[10px] font-extrabold ${active ? "text-ink" : "text-ink-soft"}`}>
                  {t.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
