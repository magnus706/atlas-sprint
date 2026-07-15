"use client";
// Onboarding: prefs (focus, pace, region) + a 5-question placement check
// that decides where your journey starts. Rule-based — no backend, no AI.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProgress, type Prefs, type Placement } from "@/lib/store";
import { CONTINENTS, type Continent } from "@/data/countries";
import { Btn } from "@/components/ui";
import Mascot from "@/components/Mascot";
import ContinentIcon from "@/components/ContinentIcon";
import Flag from "@/components/Flag";
import { BoltIcon, FlagIcon, GlobeIcon, PillarIcon, PinIcon, SparkleIcon } from "@/components/icons";
import { sfx } from "@/lib/sfx";

type Focus = Prefs["focus"];
type Pace = Prefs["pace"];

const FOCUS: { id: Focus; icon: React.ReactNode; label: string; sub: string }[] = [
  { id: "countries", icon: <PinIcon size={30} />, label: "Countries", sub: "Find them, place them" },
  { id: "capitals", icon: <PillarIcon size={30} />, label: "Capitals", sub: "Every city, locked in" },
  { id: "flags", icon: <FlagIcon size={30} />, label: "Flags", sub: "Spot them instantly" },
  { id: "world", icon: <GlobeIcon size={30} />, label: "World mastery", sub: "All of it. Everything." },
];

const PACE: { id: Pace; icon: React.ReactNode; label: string; sub: string }[] = [
  { id: "quick", icon: <SparkleIcon size={30} />, label: "Quick rounds", sub: "5 questions, in and out" },
  { id: "balanced", icon: <GlobeIcon size={30} />, label: "Balanced", sub: "8 questions per round" },
  { id: "intense", icon: <BoltIcon size={30} />, label: "Intense", sub: "12 questions, full focus" },
];

// Fixed difficulty ladder, easy → hard. First option is always correct;
// display order is shuffled per session.
const PLACEMENT_QS: { prompt: string; flag?: string; options: string[] }[] = [
  { prompt: "What's the capital of France?", options: ["Paris", "Rome", "Berlin", "Madrid"] },
  { prompt: "Whose flag is this?", flag: "jp", options: ["Japan", "South Korea", "China", "Thailand"] },
  { prompt: "Which of these borders Brazil?", options: ["Peru", "Chile", "Mexico", "Cuba"] },
  { prompt: "What's the capital of Canada?", options: ["Ottawa", "Toronto", "Vancouver", "Montreal"] },
  { prompt: "What's the capital of Kazakhstan?", options: ["Astana", "Tashkent", "Bishkek", "Baku"] },
];

const LEVELS: Record<Placement, { title: string; desc: string }> = {
  explorer: {
    title: "Explorer",
    desc: "Fresh boots, whole world ahead. Your journey starts at the very beginning — perfect.",
  },
  traveler: {
    title: "Traveler",
    desc: "You know your way around a map. We've skipped you past the first lessons.",
  },
  globetrotter: {
    title: "Globetrotter",
    desc: "Seriously sharp. The first two units are already cleared for you.",
  },
};

// Enter-only slide: progression must never wait on an exit animation.
const slide = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 30 },
};

export default function Onboarding() {
  const router = useRouter();
  const { setPrefs, setPlacement } = useProgress();
  const [step, setStep] = useState(0); // 0 welcome, 1 focus, 2 pace, 3 region, 4 quiz intro, 5 quiz, 6 result
  const [focus, setFocus] = useState<Focus>("world");
  const [pace, setPace] = useState<Pace>("balanced");
  const [region, setRegion] = useState<Continent | "World">("World");

  // placement quiz state
  const [qIdx, setQIdx] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const orders = useMemo(
    () => PLACEMENT_QS.map((q) => q.options.map((_, i) => i).sort(() => Math.random() - 0.5)),
    []
  );

  const level: Placement = rightCount <= 1 ? "explorer" : rightCount <= 3 ? "traveler" : "globetrotter";

  const next = () => {
    sfx.tap();
    setStep((s) => s + 1);
  };

  const finish = (lvl: Placement) => {
    sfx.fanfare();
    setPrefs({ onboarded: true, focus, pace, region });
    setPlacement(lvl, region);
    router.replace("/");
  };

  const pickAnswer = (optIdx: number) => {
    if (picked !== null) return;
    const right = optIdx === 0; // option 0 is always the correct one
    setPicked(optIdx);
    right ? sfx.correct() : sfx.wrong();
    if (right) setRightCount((c) => c + 1);
    setTimeout(() => {
      setPicked(null);
      if (qIdx + 1 >= PLACEMENT_QS.length) setStep(6);
      else setQIdx((i) => i + 1);
    }, 750);
  };

  const OptionCard = ({
    active,
    onClick,
    icon,
    label,
    sub,
    compact = false,
  }: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    sub: string;
    compact?: boolean;
  }) => (
    <motion.button
      whileTap={{ scale: 0.97, y: 2 }}
      onClick={() => {
        sfx.tap();
        onClick();
      }}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
        active
          ? "border-blue bg-blue-light shadow-[0_3px_0_#84D8FF]"
          : "border-line bg-white shadow-[0_3px_0_#E5E5E5]"
      } ${compact ? "flex-col gap-1.5 p-3 text-center" : ""}`}
    >
      {icon}
      <span>
        <span className={`block font-extrabold ${compact ? "text-sm" : "text-base"} ${active ? "text-blue-dark" : ""}`}>
          {label}
        </span>
        {!compact && <span className="block text-sm font-bold text-sub">{sub}</span>}
      </span>
    </motion.button>
  );

  const dots = Math.min(step, 4);
  const q = PLACEMENT_QS[qIdx];

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-10">
      {/* progress dots */}
      <div className="mb-8 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{ width: i === dots ? 26 : 8, backgroundColor: i <= dots ? "#00B2A9" : "#E5E5E5" }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      {step === 0 && (
        <motion.div key="s0" {...slide} className="flex flex-1 flex-col items-center justify-center text-center">
          <Mascot size={180} pose="happy" />
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight">Pangea</h1>
          <p className="mt-2 max-w-xs text-base font-bold text-sub">
            Master the world one round at a time. Countries, capitals, flags — fast, fun, yours.
          </p>
          <Btn full onClick={next} className="mt-10">
            Let's go
          </Btn>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div key="s1" {...slide} className="flex flex-1 flex-col">
          <h2 className="mb-1 text-2xl font-extrabold">What's your thing?</h2>
          <p className="mb-5 text-sm font-bold text-sub">We'll tune your rounds around it.</p>
          <div className="flex flex-col gap-3">
            {FOCUS.map((f) => (
              <OptionCard key={f.id} active={focus === f.id} onClick={() => setFocus(f.id)} icon={f.icon} label={f.label} sub={f.sub} />
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
          <h2 className="mb-1 text-2xl font-extrabold">Pick your pace</h2>
          <p className="mb-5 text-sm font-bold text-sub">You can change this anytime.</p>
          <div className="flex flex-col gap-3">
            {PACE.map((p) => (
              <OptionCard key={p.id} active={pace === p.id} onClick={() => setPace(p.id)} icon={p.icon} label={p.label} sub={p.sub} />
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
          <h2 className="mb-1 text-2xl font-extrabold">Where do we start?</h2>
          <p className="mb-5 text-sm font-bold text-sub">Home turf or the whole planet.</p>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              compact
              active={region === "World"}
              onClick={() => setRegion("World")}
              icon={<GlobeIcon size={34} />}
              label="World mix"
              sub=""
            />
            {CONTINENTS.map((c) => (
              <OptionCard
                key={c}
                compact
                active={region === c}
                onClick={() => setRegion(c)}
                icon={<ContinentIcon continent={c} size={34} />}
                label={c}
                sub=""
              />
            ))}
          </div>
          <div className="mt-auto pt-6">
            <Btn full onClick={next}>
              Next
            </Btn>
          </div>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div key="s4" {...slide} className="flex flex-1 flex-col items-center justify-center text-center">
          <Mascot size={140} pose="thinking" />
          <h2 className="mt-5 text-2xl font-extrabold">Quick check</h2>
          <p className="mt-2 max-w-xs text-sm font-bold text-sub">
            5 questions so your journey starts at the right spot. Ace them and you skip the easy stuff.
          </p>
          <Btn full className="mt-8 max-w-xs" onClick={next}>
            I'm ready
          </Btn>
          <button
            onClick={() => finish("explorer")}
            className="mt-4 text-sm font-extrabold uppercase tracking-wide text-sub"
          >
            Skip — start from zero
          </button>
        </motion.div>
      )}

      {step === 5 && (
        <motion.div key={`q${qIdx}`} {...slide} className="flex flex-1 flex-col">
          <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-widest text-sub">
            Question {qIdx + 1} of {PLACEMENT_QS.length}
          </p>
          <h2 className="mb-4 text-center text-2xl font-extrabold">{q.prompt}</h2>
          {q.flag && (
            <div className="mb-5 flex justify-center">
              <Flag countryId={q.flag} size="lg" className="!h-24 !w-36 rounded-xl" />
            </div>
          )}
          <div className="mt-auto grid gap-3">
            {orders[qIdx].map((optIdx) => {
              const showState = picked !== null;
              const cls = showState
                ? optIdx === 0
                  ? "border-brand bg-brand-light text-brand-deep"
                  : picked === optIdx
                    ? "border-red bg-red-light text-red-dark animate-shake"
                    : "border-line bg-white opacity-50"
                : "border-line bg-white shadow-[0_3px_0_#E5E5E5]";
              return (
                <motion.button
                  key={optIdx}
                  whileTap={picked === null ? { scale: 0.98 } : undefined}
                  disabled={picked !== null}
                  onClick={() => pickAnswer(optIdx)}
                  className={`rounded-2xl border-2 p-4 text-base font-extrabold transition-colors ${cls}`}
                >
                  {q.options[optIdx]}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {step === 6 && (
        <motion.div key="s6" {...slide} className="flex flex-1 flex-col items-center justify-center text-center">
          <Mascot size={160} pose={level === "explorer" ? "happy" : "celebrate"} />
          <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-brand">
            {rightCount}/{PLACEMENT_QS.length} correct
          </p>
          <h2 className="mt-1 text-3xl font-extrabold">You're a {LEVELS[level].title}</h2>
          <p className="mt-2 max-w-xs text-sm font-bold text-sub">{LEVELS[level].desc}</p>
          <Btn full className="mt-8 max-w-xs" onClick={() => finish(level)}>
            Start playing
          </Btn>
        </motion.div>
      )}
    </div>
  );
}
