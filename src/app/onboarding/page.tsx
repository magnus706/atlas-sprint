"use client";
// Onboarding: 4 quick, tactile steps → straight into play.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProgress, type Prefs } from "@/lib/store";
import { CONTINENTS, CONTINENT_META, type Continent } from "@/data/countries";
import { Btn } from "@/components/ui";
import { sfx } from "@/lib/sfx";

type Focus = Prefs["focus"];
type Pace = Prefs["pace"];

const FOCUS: { id: Focus; emoji: string; label: string; sub: string }[] = [
  { id: "countries", emoji: "🗺️", label: "Countries", sub: "Find them, place them" },
  { id: "capitals", emoji: "🏛️", label: "Capitals", sub: "Every city, locked in" },
  { id: "flags", emoji: "🚩", label: "Flags", sub: "Spot them instantly" },
  { id: "world", emoji: "🌍", label: "World mastery", sub: "All of it. Everything." },
];

const PACE: { id: Pace; emoji: string; label: string; sub: string }[] = [
  { id: "quick", emoji: "☕", label: "Quick rounds", sub: "5 questions, in and out" },
  { id: "balanced", emoji: "🎒", label: "Balanced", sub: "8 questions per round" },
  { id: "intense", emoji: "🔥", label: "Intense", sub: "12 questions, full focus" },
];

// Enter-only slide: progression must never wait on an exit animation
// (mobile browsers throttle rAF aggressively when backgrounded).
const slide = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 30 },
};

export default function Onboarding() {
  const router = useRouter();
  const { setPrefs } = useProgress();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<Focus>("world");
  const [pace, setPace] = useState<Pace>("balanced");
  const [region, setRegion] = useState<Continent | "World">("World");

  const next = () => {
    sfx.tap();
    setStep((s) => s + 1);
  };

  const finish = () => {
    sfx.fanfare();
    setPrefs({ onboarded: true, focus, pace, region });
    router.replace("/");
  };

  const OptionCard = ({
    active,
    onClick,
    emoji,
    label,
    sub,
  }: {
    active: boolean;
    onClick: () => void;
    emoji: string;
    label: string;
    sub: string;
  }) => (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => {
        sfx.tap();
        onClick();
      }}
      className={`flex w-full items-center gap-3 rounded-3xl border-2 p-4 text-left transition-colors ${
        active ? "border-coral bg-white shadow-[0_4px_0_#FFD9CE]" : "border-sand bg-white/70"
      }`}
    >
      <span className="text-3xl">{emoji}</span>
      <span>
        <span className="block font-display text-lg font-extrabold">{label}</span>
        <span className="block text-sm font-bold text-ink-soft">{sub}</span>
      </span>
      {active && <span className="ml-auto text-xl text-coral">●</span>}
    </motion.button>
  );

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-10">
      {/* progress dots */}
      <div className="mb-8 flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ width: i === step ? 24 : 8, backgroundColor: i <= step ? "#FF6B4A" : "#F6E9D6" }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      {step === 0 && (
          <motion.div key="s0" {...slide} className="flex flex-1 flex-col items-center justify-center text-center">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0], y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="mb-6 text-8xl"
            >
              🌍
            </motion.div>
            <h1 className="mb-2 font-display text-4xl font-extrabold">Atlas Sprint</h1>
            <p className="mb-10 max-w-xs text-base font-bold text-ink-soft">
              Master the world one round at a time. Countries, capitals, flags — fast, fun, yours.
            </p>
            <Btn full onClick={next}>
              Let's go →
            </Btn>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" {...slide} className="flex flex-1 flex-col">
            <h2 className="mb-1 font-display text-2xl font-extrabold">What's your thing?</h2>
            <p className="mb-5 text-sm font-bold text-ink-soft">We'll tune your rounds around it.</p>
            <div className="flex flex-col gap-3">
              {FOCUS.map((f) => (
                <OptionCard key={f.id} active={focus === f.id} onClick={() => setFocus(f.id)} {...f} />
              ))}
            </div>
            <div className="mt-auto pt-6">
              <Btn full onClick={next}>
                Next
              </Btn>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" {...slide} className="flex flex-1 flex-col">
            <h2 className="mb-1 font-display text-2xl font-extrabold">Pick your pace</h2>
            <p className="mb-5 text-sm font-bold text-ink-soft">You can change this vibe anytime.</p>
            <div className="flex flex-col gap-3">
              {PACE.map((p) => (
                <OptionCard key={p.id} active={pace === p.id} onClick={() => setPace(p.id)} {...p} />
              ))}
            </div>
            <div className="mt-auto pt-6">
              <Btn full onClick={next}>
                Next
              </Btn>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" {...slide} className="flex flex-1 flex-col">
            <h2 className="mb-1 font-display text-2xl font-extrabold">Where do we start?</h2>
            <p className="mb-5 text-sm font-bold text-ink-soft">Home turf or the whole planet.</p>
            <div className="grid grid-cols-2 gap-3">
              <OptionCard
                active={region === "World"}
                onClick={() => setRegion("World")}
                emoji="🌍"
                label="World mix"
                sub="Everything"
              />
              {CONTINENTS.map((c) => (
                <OptionCard
                  key={c}
                  active={region === c}
                  onClick={() => setRegion(c)}
                  emoji={CONTINENT_META[c].emoji}
                  label={c}
                  sub={CONTINENT_META[c].tagline}
                />
              ))}
            </div>
            <div className="mt-auto pt-6">
              <Btn full onClick={finish}>
                Start playing 🚀
              </Btn>
            </div>
          </motion.div>
      )}
    </div>
  );
}
