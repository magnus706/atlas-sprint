"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CompassIcon, HomeIcon, MapIcon, PodiumIcon, ProfileIcon } from "./icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/learn", label: "Learn", Icon: MapIcon },
  { href: "/sandbox", label: "Explore", Icon: CompassIcon },
  { href: "/rankings", label: "Top 10", Icon: PodiumIcon },
  { href: "/stats", label: "You", Icon: ProfileIcon },
];

const HIDDEN = ["/play", "/onboarding"];

export default function BottomNav() {
  const path = usePathname();
  if (HIDDEN.some((h) => path.startsWith(h))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5 pb-[max(6px,env(safe-area-inset-bottom))]">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`relative mx-1 flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1.5 ${
                  active ? "border-brand-light bg-brand-tint" : "border-transparent"
                }`}
              >
                <Icon size={26} active={active} />
                <span className={`text-[10px] font-extrabold uppercase tracking-wide ${active ? "text-brand-dark" : "text-sub"}`}>
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
