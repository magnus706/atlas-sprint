# Pangea

A fast, joyful, mobile-first geography mastery game. Countries, capitals, flags, shapes,
neighbours, map placement, and top-10 rankings — built as short, tactile rounds around a
daily streak habit loop. *"One more round?"*

**Live:** https://magnus706.github.io/atlas-sprint/ · installable PWA

> The app is named **Pangea**; the repo and URL are still `atlas-sprint`. Renaming the
> repo is a deliberate future task (it means updating `basePath` in the deploy workflow
> and `next.config.mjs` in lockstep), not an oversight.

## Run it

```bash
npm install
npm run dev        # http://localhost:3210
npm test           # unit tests (vitest) — pure game logic
npm run test:watch # tests in watch mode
npx tsc --noEmit   # typecheck
npm run build      # static export → out/
```

Tests cover the pure logic only — `engine`/`srs`/`paths`/`medals`/`format`. No DOM or
component tests: the UI is verified by playing it. CI runs `npm test` before building, so
a red test blocks the deploy.

No backend, no env vars, no accounts. All progress persists in `localStorage` under the
key `atlas-sprint-v1` — renaming that key wipes every player's progress.

> **Never run `npm run build` while the dev server is running.** Both write to `.next/`,
> and the dev server starts serving broken chunks (blank page). Stop dev, `rm -rf .next`,
> build, then restart dev fresh.

## Deploy

Push to `main` → GitHub Actions builds and deploys to Pages automatically (~90s). Nothing
else needed. The Pages build sets `NEXT_PUBLIC_BASE_PATH=/atlas-sprint`; local dev serves
at root. Any new asset or manifest link must respect the base path — see `layout.tsx` and
`InstallPrompt.tsx`.

## Design system

Brand v2 — white surfaces, hairline borders, one signature teal, flat accents. No soft
shadows; pressed 3D buttons. Source of truth is `tailwind.config.ts`.

| Token | Value | Use |
|---|---|---|
| `brand` `#00B2A9` | signature teal | primary CTAs, XP, active states |
| `ink` `#4B4B4B` / `sub` `#8F8F8F` | text | body / secondary (never black) |
| `line` `#E5E5E5` | hairline borders | card and divider edges |
| `panel` `#F7F7F7` | soft surface | inset panels |
| `blue` `#1CB0F6` · `purple` `#B968F0` | accents | maps, rankings, shapes |
| `orange` `#FF9600` · `yellow` `#FFC800` | accents | combos, badges, reveals |
| `green` `#2EC45E` / `red` `#FF4B4B` | feedback | correct / wrong |

- **Type:** Nunito 800/900 throughout — rounded, friendly, bold hierarchy.
- **Buttons:** chunky, thick pressed 3D shadow, UPPERCASE labels, compress on press
  (`Btn` in `components/ui.tsx`).
- **Cards:** white, hairline border, rounded, on a soft teal canvas.
- **Icons:** custom SVG only (`components/icons.tsx`). **No emoji anywhere in the UI.**
- **Mascot:** **Pan** — teal dragon-ish creature with a map-pin tail. Art in
  `public/mascot/`, sources in `mascot-src/`, processed by `scripts/process-mascot.mjs`.
- **Motion:** springy Framer Motion — slide-in questions, shake on wrong, pop on correct,
  count-up XP, confetti on milestones. Progression never waits on an exit animation
  (background-throttling safe).

## Screens

| Route | What it is |
|---|---|
| `/onboarding` | 4-step setup: focus → pace → region → play |
| `/` | Game lobby: streak, hearts, level ring, daily hero card, mode tiles |
| `/play?mode=…` | One engine, nine moods (see below) |
| `/learn` | Continent path + per-skill drill picker (bottom sheet) |
| `/review` | Personal weak-spot queue, grouped by country |
| `/sandbox` | Free play: explorable world map, country cards, flag browser |
| `/rankings` | Ranked ordering rounds + guess-then-reveal top-10 lists |
| `/stats` | Level, streaks, accuracy, continent report, badges, medals |

**Play modes:** `daily` · `learn` · `sprint` · `review` · `sandbox` · `rankings` ·
`path` · `challenge` · `defend`

## Architecture

```
src/
  data/
    countries.ts        # 146 countries: capital, continent, ISO codes, pop, area, borders
    facts.ts            # one fun fact per country (answer sheet "Did you know?")
  lib/
    engine.ts           # seeded question generation. 6 skills × mc/map/order/intro/match.
                        # generateFocusLesson, generateDrill, generateSession
    srs.ts              # spaced repetition (Leitner boxes, 1/2/4/9/21/60d)
    paths.ts            # continent path: units of 7 → learn/learn/drill/checkpoint
    medals.ts           # per-continent challenges, medals, defence quizzes
    store.tsx           # ProgressProvider: XP, hearts, streak/freezes, gems, mastery,
                        # srs, reviewQueue, medals, challenges, pathProgress, prefs
    format.ts           # formatting, day math, mulberry32 seeded RNG
    sfx.ts              # tiny WebAudio synth (no assets)
  components/
    geo.ts              # world-atlas topojson → features (110m)
    WorldMap.tsx        # zoomable d3-geo SVG map (pinch/wheel/double-tap/pan)
    CountryShape.tsx    # single-country silhouettes
    Flag.tsx            # flagcdn images
    ui.tsx              # Btn, Card, Chip, Bar, Ring, Hearts, StreakBadge
    icons.tsx           # custom SVG icon set
    Mascot.tsx, ContinentIcon.tsx, MedalArt.tsx
    SessionComplete.tsx # celebration screen + share card
    InstallPrompt.tsx   # PWA install (base-path aware)
    Confetti.tsx, BottomNav.tsx
  app/                  # one route per screen (App Router)
scripts/
  process-mascot.mjs    # flood-fill background keying for mascot art
  gen-icons.mjs         # icons + manifest from mascot art (sharp)
```

**Skills:** `capital` · `flag` · `shape` · `locate` · `neighbor` · `rank`

## Game systems

- **Lessons are focus sets:** meet 3–4 countries → match pairs → easy MC each → match
  reversed → hard recall each. Every fact gets ≥4 touches per lesson.
- **SRS runs invisibly:** `recordAnswer` schedules each fact by Leitner box. Due facts
  fuel lesson warm-ups, Review mode, and the home screen's review count.
- **Streak:** daily challenge completion +1/day; missing a day breaks it unless a
  **streak freeze** auto-covers it (earned per 7 perfect dailies, max 3). Milestones at
  3/7/14/30/50/100. Out-of-hearts dailies don't count.
- **Hearts:** 5/day, refill at local midnight. Gate `learn`/`review`/`path` only.
  Entering with 0 hearts shows a friendly gate — never an instant fail; only a *wrong*
  answer can end a run at 0. Sprint, sandbox, rankings and match exercises are heart-free
  by design (different energy per mode).
- **XP & levels:** +10/correct, +5 combo bonus (3+), +25 perfect round; level *n* needs
  `30·n·(n+1)` total XP.
- **Sprint:** 60s wall-clock score attack; `50 + 10·combo` per answer, combo capped at ×10.
- **Path:** each continent splits into units of 7 countries → learn(setA) / learn(setB) /
  drill / checkpoint. Stars per node: 3 at 100%, 2 at 80%+, 1 at 50%+.
- **Medals:** conquer all 4 challenges per continent (`capital`/`flag`/`locate`/`shape`,
  90% accuracy each) → medal. Defend it every 14 days via a 15-question ultra quiz at 85%
  or it tarnishes; the at-risk warning starts at day 10.
- **Mastery:** per-country net score → New / Practicing / Strong / Mastered; continent
  progress = share of countries at Strong+.
- **Review queue:** every miss enqueues `country|skill`; two clean answers clear it.
- **Daily challenge:** seeded by date (`mulberry32(hash("daily-YYYY-MM-DD"))`) — the same
  questions for everyone on a given day, leaderboard-ready and share-friendly.

## Engineering gotchas

- Next reuses the `/play` component across lessons → per-run state resets live in the
  session-build effect. Don't remove it (it fixed the stuck-completion bug).
- Misses recycle at end of session **once per fact key `skill:countryId`** — keying by
  question id caused an infinite retry loop.
- `advance(fromIdx)` has an idempotency guard (`advancedFrom` ref) against double-taps and
  stale timers. The sprint timer is wall-clock (background tabs throttle intervals).
- Framer transform animations override CSS transform centering — centre modals with flex
  wrappers, never `-translate-x-1/2` on a `motion.div`.
- Metadata icon/manifest fields in `layout.tsx` must be manually base-path-prefixed;
  Next's `manifest` metadata field strips the prefix (use a manual `<link>`).
- URL params (duel `from`/`target`) are clamped — keep treating params as untrusted.

## Roadmap

1. **Supabase backend** — accounts, cross-device sync, global daily leaderboard, real
   friends. The daily challenge is already deterministic per day, so the hard part is
   done: a small backend turns it into a global race. OpenAI-powered personalised
   explanations wait on this too (never put API keys in this static site — Supabase's
   anon key with RLS is the right shape).
2. Type-the-answer questions; expand from 146 to all ~195 countries; sound toggle;
   streak-danger nudge.
3. Localisation: English / Norwegian / Spanish (structured for more later).
4. Repo rename to `pangea`; Play Store via TWA; analytics (GoatCounter) and Sentry, both
   free tier.
