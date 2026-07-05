"use client";
// Onboarding: 4 quick, tactile steps → straight into play.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProgress, type Prefs } from "@/lib/store";
import { CONTINENTS, CONTINENT_META, type Continent } from "@/data/countries";
import { Btn } from "@/components/ui";
import Mascot from "@/components/Mascot";
import ContinentIcon from "@/components/ContinentIcon";
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

// Enter-only slide: progression must never wait on an exit animation.
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

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-10">
      {/* progress dots */}
      <div className="mb-8 flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ width: i === step ? 26 : 8, backgroundColor: i <= step ? "#00B2A9" : "#E5E5E5" }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      {step === 0 && (
        <motion.div key="s0" {...slide} className="flex flex-1 flex-col items-center justify-center text-center">
          <Mascot size={170} pose="happy" />
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight">Atlas Sprint</h1>
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
            <Btn full onClick={finish}>
              Start playing
            </Btn>
          </div>
        </motion.div>
      )}
    </div>
  );
}
