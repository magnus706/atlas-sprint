"use client";
// The challenge screen: every mode's play loop lives here.
// mode=daily|learn|sprint|review|sandbox|rankings, plus continent & skill params.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  buildQuizFor,
  generateSession,
  SKILL_META,
  type Mode,
  type Question,
  type Skill,
} from "@/lib/engine";
import { dueSrsKeys } from "@/lib/srs";
import MedalArt from "@/components/MedalArt";
import { useProgress } from "@/lib/store";
import { dayKey } from "@/lib/format";
import { byId, CONTINENT_META, ofContinent, type Continent } from "@/data/countries";
import { fmtArea, fmtPop } from "@/lib/format";
import { buildPath } from "@/lib/paths";
import { factFor } from "@/data/facts";
import {
  challengePool,
  defendPool,
  CHALLENGE_PASS,
  DEFEND_COUNT,
  DEFEND_PASS,
  type MedalId,
} from "@/lib/medals";
import { sfx } from "@/lib/sfx";
import Flag from "@/components/Flag";
import CountryShape from "@/components/CountryShape";
import WorldMap, { type TileState } from "@/components/WorldMap";
import SessionComplete, { type SessionResult } from "@/components/SessionComplete";
import Mascot from "@/components/Mascot";
import ContinentIcon from "@/components/ContinentIcon";
import { Bar, Btn, Hearts } from "@/components/ui";
import {
  BoltIcon,
  CheckIcon,
  CrossIcon,
  FlameIcon,
  PinIcon,
  SparkleIcon,
  Spinner,
} from "@/components/icons";

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
  const nodeIdx = parseInt(params.get("node") ?? "0", 10) || 0;
  const medalId = (params.get("medal") ?? "World") as MedalId;
  // daily is heart-free: it's the shared scored run — mistakes only cost
  // accuracy (and leaderboard position), they can never end the run early
  const usesHearts = mode === "learn" || mode === "review" || mode === "path";

  const pathNodes = useMemo(
    () => (mode === "path" && continent !== "World" ? buildPath(continent as Continent) : null),
    [mode, continent]
  );
  const pathNode = pathNodes?.[Math.min(nodeIdx, (pathNodes?.length ?? 1) - 1)] ?? null;

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
  // missed questions come back at the end of the lesson (once each)
  const retried = useRef(new Set<string>());
  // idempotency: each question index advances exactly once (guards double-taps)
  const advancedFrom = useRef(-1);
  const heartsRef = useRef(state.hearts);
  heartsRef.current = state.hearts;
  const [showQuit, setShowQuit] = useState(false);
  const quitHref = mode === "path" || mode === "challenge" || mode === "defend" ? "/learn" : "/";
  // friend-duel deep link: /play?mode=sprint&target=<score>&from=<name>
  const duelTarget = parseInt(params.get("target") ?? "0", 10) || 0;
  const duelFrom = params.get("from") ?? "";

  // Build the session
  useEffect(() => {
    if (!ready) return;
    // Reset per-run state on every (re)build. Next.js reuses this component when
    // navigating between lessons, so without this the old idx/results/advance-guard
    // leak into the next lesson and can strand the user on the completion screen.
    setIdx(0);
    setResults([]);
    setPicked(null);
    setMapStates({});
    setCombo(0);
    setBestCombo(0);
    setXp(0);
    setScore(0);
    setTimeLeft(SPRINT_SECONDS);
    setEndedEarly(false);
    advancedFrom.current = -1;
    retried.current = new Set();
    // personalization inputs — the shared seeded daily must stay identical for
    // everyone, so it gets no personal state
    const personal =
      mode === "daily"
        ? {}
        : { mastery: state.mastery, recent: state.recent, srs: state.srs, today: dayKey() };
    if (mode === "path" && pathNode) {
      setSession(
        generateSession({
          mode,
          continent,
          skill: pathNode.skill,
          count: pathNode.kind === "checkpoint" ? 12 : 8,
          countryIds: pathNode.countryIds,
          ...personal,
        })
      );
    } else if (mode === "challenge" && continent !== "World" && skill !== "mix") {
      const pool = challengePool(continent as Continent, skill);
      setSession(
        generateSession({
          mode,
          continent,
          skill,
          count: Math.min(pool.length, 45),
          countryIds: pool.map((c) => c.id),
          ...personal,
        })
      );
    } else if (mode === "defend") {
      const pool = defendPool(medalId);
      setSession(
        generateSession({
          mode,
          continent: medalId === "World" ? "World" : medalId,
          count: DEFEND_COUNT,
          countryIds: pool.map((c) => c.id),
          ...personal,
        })
      );
    } else {
      const count =
        mode === "daily" ? 10 : mode === "sprint" ? 80 : mode === "rankings" ? 8 : paceCount;
      // review covers explicit misses PLUS everything due for spaced repetition
      const dueAsQueue = dueSrsKeys(state.srs, dayKey()).map((k) => {
        const [s, id] = k.split(":");
        return `${id}|${s}`;
      });
      const reviewKeys = Array.from(new Set([...Object.keys(state.reviewQueue), ...dueAsQueue]));
      setSession(
        generateSession({
          mode,
          continent: mode === "daily" || mode === "sprint" ? "World" : continent,
          skill: skill === "mix" ? undefined : skill,
          count: mode === "review" ? Math.max(5, Math.min(12, reviewKeys.length)) : count,
          seed: mode === "daily" ? `daily-${dayKey()}` : undefined,
          reviewKeys,
          ...personal,
        })
      );
    }
    const hasIntro = ["learn", "daily", "sprint", "path", "challenge", "defend"].includes(mode);
    setPhase(hasIntro ? "intro" : "question");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, continent, skill, nodeIdx, medalId, runId]);

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
        // learning modes: the miss comes back at the end of this lesson so
        // the session isn't over until the fact stuck at least once
        const learning = mode === "path" || mode === "learn" || mode === "sandbox" || mode === "review";
        if (learning && q.countryId && !retried.current.has(q.key)) {
          retried.current.add(q.key);
          const again = buildQuizFor(q.skill, q.countryId, continent);
          if (again) setSession((s) => (s ? [...s, again] : s));
        }
      }

      // sprint auto-advances (speed mode); other modes wait for Continue so
      // the player has time to read the educational fact
      const fromIdx = idx;
      const delay = mode === "sprint" ? (right ? 550 : 900) : 0;
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

  // A fresh run is just a rebuild — the build effect resets all per-run state.
  const again = () => {
    setSession(null);
    setRunId((r) => r + 1);
  };

  if (!ready || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
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
        duel={mode === "sprint" && duelTarget > 0 ? { target: duelTarget, from: duelFrom } : undefined}
        endedEarly={endedEarly}
        onAgain={again}
        outcome={
          mode === "path" && pathNode && continent !== "World"
            ? { kind: "path", continent: continent as Continent, nodeIdx: pathNode.idx, nodeCount: pathNodes!.length, title: pathNode.title }
            : mode === "challenge" && continent !== "World" && skill !== "mix"
              ? { kind: "challenge", continent: continent as Continent, skill }
              : mode === "defend"
                ? { kind: "defend", medalId }
                : undefined
        }
      />
    );
  }

  // ---------- intro splash ----------
  if (phase === "intro") {
    const isLearnContinent = continent !== "World" && mode === "learn";
    const meta = isLearnContinent ? CONTINENT_META[continent as Continent] : null;
    const introTitle =
      mode === "sprint"
        ? "Sprint"
        : mode === "daily"
          ? "Daily Challenge"
          : mode === "path" && pathNode
            ? pathNode.kind === "checkpoint"
              ? pathNode.title
              : `Unit ${pathNode.unit} · ${pathNode.title}`
            : mode === "challenge"
              ? `${continent} · ${skill !== "mix" ? SKILL_META[skill].label : ""} Challenge`
              : mode === "defend"
                ? `Defend your ${medalId} medal`
                : `${continent}`;
    const introSub =
      mode === "sprint"
        ? `${SPRINT_SECONDS} seconds. Chain answers for combo points. Go fast.`
        : mode === "daily"
          ? "10 questions, same for everyone today. No hearts — every miss costs score. Extend your streak."
          : mode === "path" && pathNode
            ? pathNode.kind === "checkpoint"
              ? "Everything from this unit, mixed together. Show what stuck."
              : `${pathNode.countryIds.length} countries from this unit. Pass to unlock the next lesson.`
            : mode === "challenge"
              ? `Every country, one question each. Score ${CHALLENGE_PASS}%+ to conquer it. No hearts — just you and the map.`
              : mode === "defend"
                ? `${DEFEND_COUNT} hard questions. Score ${DEFEND_PASS}%+ to keep your medal shining.`
                : meta
                  ? `${meta.tagline} — ${ofContinent(continent as Continent).length} countries to master.`
                  : "A mixed round from across the whole world.";
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        {mode === "sprint" ? (
          <BoltIcon size={80} />
        ) : mode === "defend" ? (
          <MedalArt id={medalId} size={130} />
        ) : mode === "challenge" && continent !== "World" ? (
          <ContinentIcon continent={continent as Continent} size={96} />
        ) : isLearnContinent ? (
          <ContinentIcon continent={continent as Continent} size={96} />
        ) : mode === "path" ? (
          <Mascot size={130} pose={pathNode?.kind === "checkpoint" ? "thinking" : "happy"} />
        ) : (
          <Mascot size={140} pose="happy" />
        )}
        <h1 className="mt-5 text-3xl font-extrabold">{introTitle}</h1>
        <p className="mt-2 max-w-xs text-sm font-bold text-sub">{introSub}</p>
        {mode === "sprint" && duelTarget > 0 && (
          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className="mt-3 rounded-xl border-2 border-yellow bg-yellow-light px-4 py-2 text-sm font-extrabold text-yellow-dark"
          >
            {duelFrom ? `${duelFrom} challenged you!` : "Challenge!"} Beat {duelTarget} to win.
          </motion.p>
        )}
        {mode === "sprint" && state.sprintBest > 0 && (
          <p className="mt-3 rounded-xl border-2 border-line bg-white px-3 py-1.5 text-sm font-extrabold">
            Your best: {state.sprintBest}
          </p>
        )}
        <Btn className="mt-8 w-full max-w-xs" onClick={() => { sfx.tap(); setPhase("question"); }}>
          {mode === "sprint" ? "Start the clock" : mode === "defend" ? "Defend it" : "Start"}
        </Btn>
        <Link href={mode === "path" || mode === "challenge" ? "/learn" : "/"} className="mt-5 text-sm font-extrabold uppercase tracking-wide text-sub">
          Not now
        </Link>
      </div>
    );
  }

  if (!q) return null;

  // ---------- header ----------
  const header = (
    <div className="mb-4 flex items-center gap-3">
      <button
        onClick={() => { sfx.tap(); setShowQuit(true); }}
        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-line bg-white text-sub"
        aria-label="Quit"
      >
        <CrossIcon size={16} />
      </button>
      {mode === "sprint" ? (
        <>
          <div className="flex-1">
            <Bar value={timeLeft / SPRINT_SECONDS} tone={timeLeft <= 10 ? "#FF4B4B" : "#1CB0F6"} />
          </div>
          <span className={`w-10 text-right text-lg font-extrabold ${timeLeft <= 10 ? "text-red" : "text-blue-dark"}`}>
            {timeLeft}
          </span>
        </>
      ) : (
        <>
          <div className="flex-1">
            <Bar value={(idx + (phase === "feedback" ? 1 : 0)) / (total || 1)} />
          </div>
          {usesHearts ? (
            <Hearts count={state.hearts} compact />
          ) : (
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-sub">
              {mode === "daily" ? "Scored" : "Free play"}
            </span>
          )}
        </>
      )}
    </div>
  );

  // ---------- combo + score strip ----------
  const strip = (
    <div className="mb-2 flex h-9 items-center justify-between">
      <AnimatePresence>
        {combo >= 3 && (
          <motion.span
            key={combo}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-yellow px-3 py-1.5 text-sm font-extrabold text-ink shadow-[0_3px_0_#D6A800]"
          >
            <FlameIcon size={16} />
            {combo} combo
          </motion.span>
        )}
      </AnimatePresence>
      {mode === "sprint" && (
        <motion.span
          key={score}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          className="ml-auto text-xl font-extrabold text-blue-dark"
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
        {q.kind === "teach" && <TeachCard q={q} onGot={() => advance(idx)} />}
      </motion.div>

      {/* Answer sheet — result + country spotlight card */}
      <AnimatePresence>
        {phase === "feedback" &&
          (mode === "sprint" || !byId.get(q.countryId) ? (
            /* slim fast banner: sprint + rank/order questions */
            <motion.div
              initial={{ y: 90, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
              className={`fixed inset-x-0 bottom-0 z-40 border-t-2 ${
                lastRight ? "border-brand bg-brand-light" : "border-red bg-red-light"
              }`}
            >
              <div className="mx-auto flex max-w-md items-center justify-between gap-3 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      lastRight ? "bg-brand text-white" : "bg-red text-white"
                    }`}
                  >
                    {lastRight ? <CheckIcon size={22} /> : <CrossIcon size={18} />}
                  </span>
                  <div className={lastRight ? "text-brand-deep" : "text-red-dark"}>
                    <p className="text-lg font-extrabold leading-tight">
                      {lastRight
                        ? CORRECT_MSGS[results.length % CORRECT_MSGS.length]
                        : "Close — let's fix that."}
                    </p>
                    {!lastRight && <CorrectAnswerLine q={q} />}
                  </div>
                </div>
                {mode !== "sprint" && (
                  <Btn tone={lastRight ? "brand" : "red"} size="md" onClick={() => advance(idx)}>
                    Continue
                  </Btn>
                )}
              </div>
            </motion.div>
          ) : (
            <CountrySpotlight
              key="spotlight"
              q={q}
              right={lastRight}
              msg={
                lastRight
                  ? CORRECT_MSGS[results.length % CORRECT_MSGS.length]
                  : "Close — let's fix that."
              }
              onContinue={() => advance(idx)}
            />
          ))}
      </AnimatePresence>

      {/* Quit confirmation — leaving mid-lesson loses progress */}
      <AnimatePresence>
        {showQuit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuit(false)}
              className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
            />
            {/* flex-centered wrapper — framer's transform animation would
                overwrite CSS translate-centering and shove the card off-center */}
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="pointer-events-auto w-[min(340px,88vw)] rounded-3xl border-2 border-line bg-white/90 p-6 text-center shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl"
            >
              <div className="mb-2 flex justify-center">
                <Mascot pose="sad" size={104} />
              </div>
              <h3 className="text-xl font-extrabold">Leave the lesson?</h3>
              <p className="mt-1 text-sm font-bold text-sub">
                Your progress this round won&apos;t count. Pan would love it if you stayed.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <Btn tone="brand" full onClick={() => { sfx.tap(); setShowQuit(false); }}>
                  Keep learning
                </Btn>
                <button
                  onClick={() => { sfx.tap(); router.push(quitHref); }}
                  className="py-2 text-sm font-extrabold uppercase tracking-wide text-sub"
                >
                  Leave anyway
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Teach card: introduce a brand-new country before quizzing it ----------

function TeachCard({ q, onGot }: { q: Question; onGot: () => void }) {
  const c = byId.get(q.countryId)!;
  const fact = factFor(c.id);
  return (
    <div className="flex flex-1 flex-col">
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-xs font-extrabold uppercase tracking-widest text-brand"
      >
        New country
      </motion.p>
      <h2 className="mb-4 text-center text-2xl font-extrabold leading-tight">{q.prompt}</h2>

      <div className="rounded-2xl border-2 border-brand bg-white p-4">
        <div className="flex items-center gap-3">
          <Flag countryId={c.id} size="lg" className="!h-16 !w-24 rounded-xl" />
          <div>
            <p className="text-xl font-extrabold leading-tight">{c.name}</p>
            <p className="flex items-center gap-1.5 text-xs font-bold text-sub">
              <ContinentIcon continent={c.continent} size={14} /> {c.continent}
            </p>
            <p className="mt-1 text-sm font-extrabold text-brand-dark">Capital: {c.capital}</p>
          </div>
        </div>

        {!c.tiny && !c.noShape && (
          <div className="mt-3 flex justify-center rounded-xl border-2 border-line bg-panel p-2">
            <CountryShape countryId={c.id} height={110} width={190} fill="#00B2A9" />
          </div>
        )}

        {fact && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-yellow bg-yellow-light px-3 py-2.5">
            <SparkleIcon size={18} className="mt-0.5 shrink-0" />
            <p className="text-[13px] font-bold leading-snug text-ink">{fact}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Mascot size={40} float={false} />
        <p className="text-xs font-bold text-sub">Take a good look — Pan will quiz you on this.</p>
      </div>

      <div className="mt-auto pt-4">
        <Btn full onClick={() => { sfx.tap(); onGot(); }}>
          Got it — quiz me
        </Btn>
      </div>
    </div>
  );
}

// ---------- Country spotlight: rich answer sheet ----------

function CountrySpotlight({
  q,
  right,
  msg,
  onContinue,
}: {
  q: Question;
  right: boolean;
  msg: string;
  onContinue: () => void;
}) {
  const c = byId.get(q.countryId)!;
  const fact = factFor(c.id);
  const [showMap, setShowMap] = useState(false);
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md"
    >
      <div
        className={`rounded-t-3xl border-2 border-b-0 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] ${
          right ? "border-brand" : "border-red"
        }`}
      >
        {/* result strip */}
        <div
          className={`flex items-center justify-between gap-3 rounded-t-[22px] px-4 py-3 ${
            right ? "bg-brand-light" : "bg-red-light"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Mascot pose={right ? "celebrate" : "sad"} size={44} float={false} />
            <p className={`text-base font-extrabold leading-tight ${right ? "text-brand-deep" : "text-red-dark"}`}>
              {msg}
            </p>
          </div>
          <Btn tone={right ? "brand" : "red"} size="md" onClick={onContinue}>
            {right ? "Got it!" : "On it!"}
          </Btn>
        </div>

        <div className="relative overflow-hidden px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3.5">
          {/* decorative silhouette */}
          {!c.tiny && !c.noShape && (
            <div className="pointer-events-none absolute -right-4 -top-2 opacity-[0.08]">
              <CountryShape countryId={c.id} width={190} height={150} fill="#00726C" />
            </div>
          )}

          {/* country header */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            className="relative flex items-center gap-3"
          >
            <Flag countryId={c.id} size="md" className="!h-11 !w-[66px] rounded-lg" />
            <div>
              <p className="text-xl font-extrabold leading-tight">{c.name}</p>
              <p className="flex items-center gap-1.5 text-xs font-bold text-sub">
                <ContinentIcon continent={c.continent} size={14} /> {c.continent}
              </p>
            </div>
          </motion.div>

          {/* key stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mt-3 grid grid-cols-3 gap-2"
          >
            <div className="rounded-xl border-2 border-line bg-panel px-2 py-2 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sub">Capital</p>
              <p className="text-[13px] font-extrabold leading-tight">{c.capital}</p>
            </div>
            <div className="rounded-xl border-2 border-line bg-panel px-2 py-2 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sub">People</p>
              <p className="text-[13px] font-extrabold leading-tight">{fmtPop(c.pop)}</p>
            </div>
            <div className="rounded-xl border-2 border-line bg-panel px-2 py-2 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sub">Area</p>
              <p className="text-[13px] font-extrabold leading-tight">{fmtArea(c.area)}</p>
            </div>
          </motion.div>

          {/* fun fact */}
          {fact && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative mt-2.5 flex items-start gap-2 rounded-xl border-2 border-yellow bg-yellow-light px-3 py-2.5"
            >
              <SparkleIcon size={18} className="mt-0.5 shrink-0" />
              <p className="text-[13px] font-bold leading-snug text-ink">
                <span className="font-extrabold text-yellow-dark">Did you know? </span>
                {fact}
              </p>
            </motion.div>
          )}

          {/* show on map + learn more */}
          <div className="relative mt-2.5 flex gap-2">
            {!c.tiny && (
              <button
                onClick={() => { sfx.tap(); setShowMap((s) => !s); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-blue bg-blue-light py-2.5 text-sm font-extrabold text-blue-dark"
              >
                <PinIcon size={16} /> {showMap ? "Hide map" : "Show on map"}
              </button>
            )}
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(c.name.replace(/ /g, "_"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-line bg-white py-2.5 text-sm font-extrabold text-sub"
            >
              Learn more ↗
            </a>
          </div>

          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="relative overflow-hidden"
              >
                <div className="mt-2.5">
                  <WorldMap
                    focus={c.continent}
                    height={230}
                    states={{ [c.numeric]: "target" }}
                    className="border-2 border-line"
                  />
                  <p className="mt-1.5 text-center text-[11px] font-bold text-sub">
                    {c.name}, pulsing — pinch or scroll to zoom
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function CorrectAnswerLine({ q }: { q: Question }) {
  if (q.kind === "order") {
    const sorted = q.orderIds!
      .map((id) => byId.get(id)!)
      .sort((a, b) => b[q.metric!] - a[q.metric!]);
    return (
      <p className="text-sm font-bold opacity-80">{sorted.map((c) => c.name).join(" → ")}</p>
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
  return <p className="text-sm font-bold opacity-80">Answer: {label}</p>;
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
      <h2 className="mb-4 text-center text-2xl font-extrabold leading-tight">{q.prompt}</h2>

      {q.media?.type === "flag" && q.skill !== "capital" && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-5 flex justify-center"
        >
          <Flag countryId={q.media.countryId} size="lg" className="!h-24 !w-36 rounded-xl" />
        </motion.div>
      )}
      {q.media?.type === "shape" && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 flex justify-center rounded-2xl border-2 border-line bg-panel p-3"
        >
          <CountryShape countryId={q.media.countryId} height={150} fill="#B968F0" />
        </motion.div>
      )}

      <div className={`mt-auto grid gap-3 ${flagOptions ? "grid-cols-2" : "grid-cols-1"}`}>
        {q.options!.map((o) => {
          const isPicked = picked === o.id;
          const isAnswer = o.id === q.answer;
          const showState = phase === "feedback";
          const cls = showState
            ? isAnswer
              ? "border-brand bg-brand-light text-brand-deep"
              : isPicked
                ? "border-red bg-red-light text-red-dark animate-shake"
                : "border-line bg-white opacity-50"
            : "border-line bg-white shadow-[0_3px_0_#E5E5E5] active:translate-y-[2px] active:shadow-none";
          return (
            <motion.button
              key={o.id}
              whileTap={phase === "question" ? { scale: 0.98 } : undefined}
              disabled={phase !== "question"}
              onClick={() => onPick(o.id)}
              className={`rounded-2xl border-2 p-4 text-base font-extrabold transition-colors ${cls}`}
            >
              {o.flagOf ? (
                <span className="flex items-center justify-center">
                  <Flag countryId={o.flagOf} size="md" />
                </span>
              ) : (
                o.label
              )}
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
      <h2 className="mb-1 text-center text-2xl font-extrabold">{q.prompt}</h2>
      <p className="mb-4 flex items-center justify-center gap-1 text-center text-sm font-bold text-sub">
        <PinIcon size={16} /> {q.sub}
      </p>
      <WorldMap
        focus={q.continent ?? "World"}
        height={340}
        states={mapStates}
        onTap={phase === "question" ? onTap : undefined}
        className="border-2 border-line"
      />
      <p className="mt-3 text-center text-xs font-bold text-sub">
        Tap the sand-colored country you're looking for
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
      <h2 className="mb-1 text-center text-2xl font-extrabold">{q.prompt}</h2>
      <p className="mb-4 text-center text-sm font-bold text-sub">{q.sub}</p>

      <div className="flex flex-col gap-3">
        {(done ? correct : q.orderIds!).map((id, i) => {
          const c = byId.get(id)!;
          const pos = order.indexOf(id);
          const wasRight = done && q.orderIds && order.indexOf(id) === i;
          return (
            <motion.button
              key={id}
              layout
              whileTap={!done ? { scale: 0.98 } : undefined}
              onClick={!done ? () => toggle(id) : undefined}
              className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left font-extrabold ${
                done
                  ? wasRight
                    ? "border-brand bg-white"
                    : "border-line bg-white"
                  : pos >= 0
                    ? "border-purple bg-purple-light"
                    : "border-line bg-white shadow-[0_3px_0_#E5E5E5]"
              }`}
            >
              {done && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(c[q.metric!] / maxVal) * 100}%` }}
                  transition={{ delay: 0.15 * i, type: "spring", stiffness: 80, damping: 20 }}
                  className="absolute inset-y-0 left-0 bg-purple-light"
                />
              )}
              <span className="relative flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    done || pos >= 0 ? "bg-purple text-white" : "bg-line text-sub"
                  }`}
                >
                  {done ? i + 1 : pos >= 0 ? pos + 1 : "·"}
                </span>
                <Flag countryId={id} size="sm" />
                <span className="flex-1">{c.name}</span>
                {done && (
                  <span className="text-xs font-bold text-sub">
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
            tone="purple"
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
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <PlayInner />
    </Suspense>
  );
}
