"use client";
// The challenge screen: every mode's play loop lives here.
// mode=daily|learn|sprint|review|sandbox|rankings, plus continent & skill params.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  generateSession,
  type Mode,
  type Question,
  type Skill,
} from "@/lib/engine";
import { useProgress } from "@/lib/store";
import { dayKey } from "@/lib/format";
import { byId, byNumeric, CONTINENT_META, ofContinent, type Continent } from "@/data/countries";
import { fmtArea, fmtPop } from "@/lib/format";
import { sfx } from "@/lib/sfx";
import Flag from "@/components/Flag";
import CountryShape from "@/components/CountryShape";
import WorldMap, { type TileState } from "@/components/WorldMap";
import SessionComplete, { type SessionResult } from "@/components/SessionComplete";
import { Bar, Btn, Hearts } from "@/components/ui";

const CORRECT_MSGS = ["Nice one.", "Sharp.", "Locked in.", "Clean.", "You're on a roll."];
const SPRINT_SECONDS = 60;

type Phase = "intro" | "question" | "feedback" | "done";

function PlayInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, ready, recordAnswer, spendHeart } = useProgress();

  const mode = (params.get("mode") ?? "learn") as Mode;
  const continent = (params.get("continent") as Continent | "World" | null) ?? state.prefs.region;
  const skill = (params.get("skill") as Skill | "mix" | null) ?? "mix";
  const usesHearts = mode === "daily" || mode === "learn" || mode === "review";

  const paceCount = state.prefs.pace === "quick" ? 5 : state.prefs.pace === "intense" ? 12 : 8;

  const [session, setSession] = useState<Question[] | null>(null);
  const [runId, setRunId] = useState(0);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [picked, setPicked] = useState<string | null>(null);
  const [lastRight, setLastRight] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [score, setScore] = useState(0); // sprint points
  const [timeLeft, setTimeLeft] = useState(SPRINT_SECONDS);
  const [endedEarly, setEndedEarly] = useState(false);
  const [mapStates, setMapStates] = useState<Record<string, TileState>>({});
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // idempotency: each question index advances exactly once (guards double-taps)
  const advancedFrom = useRef(-1);
  const heartsRef = useRef(state.hearts);
  heartsRef.current = state.hearts;

  // Build the session
  useEffect(() => {
    if (!ready) return;
    const count =
      mode === "daily" ? 10 : mode === "sprint" ? 80 : mode === "rankings" ? 8 : paceCount;
    const focusSkill =
      mode === "learn" && skill === "mix" && state.prefs.focus !== "world"
        ? undefined // mixed but engine already varies; keep mix
        : undefined;
    void focusSkill;
    const reviewKeys = Object.keys(state.reviewQueue);
    setSession(
      generateSession({
        mode,
        continent: mode === "daily" || mode === "sprint" ? "World" : continent,
        skill: skill === "mix" ? undefined : skill,
        count: mode === "review" ? Math.max(5, Math.min(10, reviewKeys.length)) : count,
        seed: mode === "daily" ? `daily-${dayKey()}` : undefined,
        reviewKeys,
      })
    );
    setPhase(mode === "learn" || mode === "daily" || mode === "sprint" ? "intro" : "question");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, continent, skill, runId]);

  // Sprint countdown — wall-clock based so background-tab timer throttling
  // can't freeze the clock; any tick snaps to true remaining time.
  useEffect(() => {
    if (mode !== "sprint" || phase === "intro" || phase === "done") return;
    const endAt = Date.now() + timeLeft * 1000;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(t);
        setPhase("done");
      }
    }, 250);
    return () => clearInterval(t);
  }, [mode, phase === "intro", phase === "done", runId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const q = session?.[idx];
  const total = mode === "sprint" ? null : session?.length ?? 0;

  const finishAnswer = useCallback(
    (right: boolean, pickedId: string | null) => {
      if (!q || phase !== "question") return;
      setPicked(pickedId);
      setLastRight(right);
      setPhase("feedback");
      setResults((r) => [...r, { q, right }]);
      if (q.countryId) recordAnswer(q.countryId, q.skill, right);

      if (right) {
        const newCombo = combo + 1;
        setCombo(newCombo);
        setBestCombo((b) => Math.max(b, newCombo));
        newCombo >= 3 && newCombo % 3 === 0 ? sfx.combo() : sfx.correct();
        setXp((x) => x + 10 + (newCombo >= 3 ? 5 : 0));
        if (mode === "sprint") setScore((s) => s + 50 + 10 * Math.min(newCombo, 10));
      } else {
        setCombo(0);
        sfx.wrong();
        if (usesHearts) spendHeart();
      }

      // auto-advance on correct (and always in sprint)
      const fromIdx = idx;
      const delay = mode === "sprint" ? (right ? 550 : 900) : right ? 850 : 0;
      if (delay > 0) {
        advanceTimer.current = setTimeout(() => advance(fromIdx), delay);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [q, phase, combo, mode, idx, usesHearts, recordAnswer, spendHeart]
  );

  const advance = useCallback(
    (fromIdx: number) => {
      if (advancedFrom.current === fromIdx) return; // already advanced (double-tap / stale timer)
      advancedFrom.current = fromIdx;
      setPicked(null);
      setMapStates({});
      // heartsRef holds the post-spend value by the time we advance
      if (usesHearts && heartsRef.current <= 0) {
        setEndedEarly(true);
        setPhase("done");
        return;
      }
      setIdx((i) => {
        const next = i + 1;
        if (session && next >= session.length) {
          setPhase("done");
          return i;
        }
        setPhase("question");
        return next;
      });
    },
    [session, usesHearts]
  );

  const again = () => {
    advancedFrom.current = -1;
    setIdx(0);
    setResults([]);
    setCombo(0);
    setBestCombo(0);
    setXp(0);
    setScore(0);
    setTimeLeft(SPRINT_SECONDS);
    setEndedEarly(false);
    setPicked(null);
    setMapStates({});
    setSession(null);
    setRunId((r) => r + 1);
  };

  if (!ready || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
          className="text-4xl"
        >
          🌍
        </motion.span>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <SessionComplete
        mode={mode}
        results={results}
        xp={mode === "sprint" ? Math.round(score / 20) : xp + (results.length > 0 && results.every((r) => r.right) && !endedEarly ? 25 : 0)}
        bestCombo={bestCombo}
        sprintScore={mode === "sprint" ? score : undefined}
        endedEarly={endedEarly}
        onAgain={again}
      />
    );
  }

  // ---------- intro splash ----------
  if (phase === "intro") {
    const meta =
      continent !== "World" && mode === "learn" ? CONTINENT_META[continent as Continent] : null;
    const introEmoji = mode === "sprint" ? "⚡" : mode === "daily" ? "🌍" : meta?.emoji ?? "🌍";
    const introTitle =
      mode === "sprint" ? "Sprint" : mode === "daily" ? "Daily Challenge" : `${continent}`;
    const introSub =
      mode === "sprint"
        ? `${SPRINT_SECONDS} seconds. Chain answers for combo points. Go fast.`
        : mode === "daily"
          ? "10 mixed questions from all over the world. Extend your streak."
          : meta
            ? `${meta.tagline} — ${ofContinent(continent as Continent).length} countries to master.`
            : "A mixed round from across the whole world.";
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
          className="text-7xl"
        >
          {introEmoji}
        </motion.span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">{introTitle}</h1>
        <p className="mt-2 max-w-xs text-sm font-bold text-ink-soft">{introSub}</p>
        {mode === "sprint" && state.sprintBest > 0 && (
          <p className="mt-2 rounded-full border-2 border-sand bg-white px-3 py-1 text-sm font-extrabold">
            🏅 Your best: {state.sprintBest}
          </p>
        )}
        <Btn className="mt-8 w-full max-w-xs" onClick={() => { sfx.tap(); setPhase("question"); }}>
          {mode === "sprint" ? "Start the clock ⏱️" : "Start"}
        </Btn>
        <Link href="/" className="mt-4 text-sm font-extrabold text-ink-soft">
          Not now
        </Link>
      </div>
    );
  }

  if (!q) return null;

  // ---------- header ----------
  const header = (
    <div className="mb-4 flex items-center gap-3">
      <Link href="/" className="rounded-full border-2 border-sand bg-white px-3 py-1.5 text-sm font-extrabold">
        ✕
      </Link>
      {mode === "sprint" ? (
        <>
          <div className="flex-1">
            <Bar value={timeLeft / SPRINT_SECONDS} tone={timeLeft <= 10 ? "#FF5D8F" : "#4CC9F0"} />
          </div>
          <span className={`w-10 text-right font-display text-lg font-extrabold ${timeLeft <= 10 ? "text-rose" : ""}`}>
            {timeLeft}
          </span>
        </>
      ) : (
        <>
          <div className="flex-1">
            <Bar value={(idx + (phase === "feedback" ? 1 : 0)) / (total || 1)} tone="#FF6B4A" />
          </div>
          {usesHearts ? <Hearts count={state.hearts} compact /> : <span className="text-xs font-extrabold text-ink-soft">FREE PLAY</span>}
        </>
      )}
    </div>
  );

  // ---------- combo + score strip ----------
  const strip = (
    <div className="mb-2 flex h-8 items-center justify-between">
      <AnimatePresence>
        {combo >= 3 && (
          <motion.span
            key={combo}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-full bg-sun px-3 py-1 font-display text-sm font-extrabold text-ink shadow-[0_3px_0_#E0A420]"
          >
            🔥 {combo} combo
          </motion.span>
        )}
      </AnimatePresence>
      {mode === "sprint" && (
        <motion.span
          key={score}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          className="ml-auto font-display text-xl font-extrabold text-grape"
        >
          {score}
        </motion.span>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-6 pt-5">
      {header}
      {strip}
      {/* enter-only transition: never gate the next question on an exit animation */}
      <motion.div
        key={q.key}
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="flex flex-1 flex-col"
      >
          {q.kind === "mc" && (
            <McQuestion q={q} picked={picked} phase={phase} onPick={(id) => finishAnswer(id === q.answer, id)} />
          )}
          {q.kind === "map" && (
            <MapQuestion
              q={q}
              phase={phase}
              mapStates={mapStates}
              onTap={(numeric) => {
                const target = byId.get(q.countryId)!.numeric;
                const right = numeric === target;
                setMapStates(
                  right
                    ? { [target]: "correct" }
                    : { [numeric]: "wrong", [target]: "target" }
                );
                finishAnswer(right, numeric);
              }}
            />
          )}
          {q.kind === "order" && (
            <OrderQuestion q={q} phase={phase} onDone={(right) => finishAnswer(right, null)} />
          )}
      </motion.div>

      {/* Feedback banner */}
      <AnimatePresence>
        {phase === "feedback" && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
            className={`fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md rounded-t-3xl p-4 pb-6 ${
              lastRight ? "bg-mint" : "bg-rose"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-white">
                <p className="font-display text-lg font-extrabold">
                  {lastRight
                    ? CORRECT_MSGS[results.length % CORRECT_MSGS.length]
                    : "Close — let's fix that."}
                </p>
                {!lastRight && <CorrectAnswerLine q={q} />}
              </div>
              {!lastRight && mode !== "sprint" && (
                <Btn tone="white" size="md" onClick={() => advance(idx)}>
                  Continue
                </Btn>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CorrectAnswerLine({ q }: { q: Question }) {
  if (q.kind === "order") {
    const sorted = q.orderIds!
      .map((id) => byId.get(id)!)
      .sort((a, b) => b[q.metric!] - a[q.metric!]);
    return (
      <p className="text-sm font-bold text-white/90">
        {sorted.map((c) => c.name).join(" → ")}
      </p>
    );
  }
  const c = byId.get(q.countryId);
  if (!c) return null;
  const label =
    q.skill === "capital" && q.prompt.startsWith("What")
      ? `${c.name} → ${c.capital}`
      : q.kind === "map"
        ? `That's where ${c.name} is — now you know.`
        : q.options?.find((o) => o.id === q.answer)?.label ?? c.name;
  return <p className="text-sm font-bold text-white/90">Answer: {label}</p>;
}

// ---------- Multiple choice ----------

function McQuestion({
  q,
  picked,
  phase,
  onPick,
}: {
  q: Question;
  picked: string | null;
  phase: Phase;
  onPick: (id: string) => void;
}) {
  const flagOptions = q.options!.some((o) => o.flagOf);
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mb-4 text-center font-display text-2xl font-extrabold leading-tight">
        {q.prompt}
      </h2>

      {q.media?.type === "flag" && q.skill !== "capital" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-5 flex justify-center"
        >
          <Flag countryId={q.media.countryId} size="lg" className="!h-24 !w-36 rounded-xl" />
        </motion.div>
      )}
      {q.media?.type === "shape" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 flex justify-center rounded-3xl bg-white p-3 border-2 border-sand"
        >
          <CountryShape countryId={q.media.countryId} height={150} />
        </motion.div>
      )}

      <div className={`mt-auto grid gap-3 ${flagOptions ? "grid-cols-2" : "grid-cols-1"}`}>
        {q.options!.map((o) => {
          const isPicked = picked === o.id;
          const isAnswer = o.id === q.answer;
          const showState = phase === "feedback";
          const cls = showState
            ? isAnswer
              ? "border-mint bg-mint/15 text-ink"
              : isPicked
                ? "border-rose bg-rose/10 text-ink animate-shake"
                : "border-sand bg-white opacity-60"
            : "border-sand bg-white active:translate-y-[2px]";
          return (
            <motion.button
              key={o.id}
              whileTap={phase === "question" ? { scale: 0.97 } : undefined}
              disabled={phase !== "question"}
              onClick={() => onPick(o.id)}
              className={`rounded-2xl border-2 p-4 font-display text-base font-extrabold shadow-card transition-colors ${cls}`}
            >
              {o.flagOf ? (
                <span className="flex items-center justify-center">
                  <Flag countryId={o.flagOf} size="md" />
                </span>
              ) : (
                o.label
              )}
              {showState && isAnswer && <span className="ml-2">✓</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Map tap ----------

function MapQuestion({
  q,
  phase,
  mapStates,
  onTap,
}: {
  q: Question;
  phase: Phase;
  mapStates: Record<string, TileState>;
  onTap: (numeric: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mb-1 text-center font-display text-2xl font-extrabold">{q.prompt}</h2>
      <p className="mb-4 text-center text-sm font-bold text-ink-soft">📍 {q.sub}</p>
      <WorldMap
        focus={q.continent ?? "World"}
        height={340}
        states={mapStates}
        onTap={phase === "question" ? onTap : undefined}
        className="border-2 border-sand"
      />
      <p className="mt-3 text-center text-xs font-bold text-ink-soft">
        Tap the highlighted region's country
      </p>
    </div>
  );
}

// ---------- Order / ranking ----------

function OrderQuestion({
  q,
  phase,
  onDone,
}: {
  q: Question;
  phase: Phase;
  onDone: (right: boolean) => void;
}) {
  const [order, setOrder] = useState<string[]>([]);
  const countries = useMemo(() => q.orderIds!.map((id) => byId.get(id)!), [q]);
  const correct = useMemo(
    () => [...countries].sort((a, b) => b[q.metric!] - a[q.metric!]).map((c) => c.id),
    [countries, q.metric]
  );
  const done = phase === "feedback";
  const maxVal = Math.max(...countries.map((c) => c[q.metric!]));

  const toggle = (id: string) => {
    sfx.tap();
    setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  };

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mb-1 text-center font-display text-2xl font-extrabold">{q.prompt}</h2>
      <p className="mb-4 text-center text-sm font-bold text-ink-soft">{q.sub}</p>

      <div className="flex flex-col gap-3">
        {(done ? correct : q.orderIds!).map((id, i) => {
          const c = byId.get(id)!;
          const pos = order.indexOf(id);
          const userPos = order.indexOf(id);
          const wasRight = done && q.orderIds && userPos === i;
          return (
            <motion.button
              key={id}
              layout
              whileTap={!done ? { scale: 0.97 } : undefined}
              onClick={!done ? () => toggle(id) : undefined}
              className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left font-display font-extrabold shadow-card ${
                done
                  ? wasRight
                    ? "border-mint bg-white"
                    : "border-sand bg-white"
                  : pos >= 0
                    ? "border-grape bg-grape/10"
                    : "border-sand bg-white"
              }`}
            >
              {done && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(c[q.metric!] / maxVal) * 100}%` }}
                  transition={{ delay: 0.15 * i, type: "spring", stiffness: 80, damping: 20 }}
                  className="absolute inset-y-0 left-0 bg-grape/15"
                />
              )}
              <span className="relative flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    done
                      ? "bg-grape text-white"
                      : pos >= 0
                        ? "bg-grape text-white"
                        : "bg-sand text-ink-soft"
                  }`}
                >
                  {done ? i + 1 : pos >= 0 ? pos + 1 : "·"}
                </span>
                <Flag countryId={id} size="sm" />
                <span className="flex-1">{c.name}</span>
                {done && (
                  <span className="text-xs font-bold text-ink-soft">
                    {q.metric === "pop" ? fmtPop(c.pop) : fmtArea(c.area)}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {!done && (
        <div className="mt-auto pt-4">
          <Btn
            full
            disabled={order.length !== q.orderIds!.length}
            onClick={() => onDone(order.join(",") === correct.join(","))}
          >
            {order.length === q.orderIds!.length
              ? "Lock it in"
              : `Tap in order (${order.length}/${q.orderIds!.length})`}
          </Btn>
        </div>
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-4xl">🌍</div>
      }
    >
      <PlayInner />
    </Suspense>
  );
}
