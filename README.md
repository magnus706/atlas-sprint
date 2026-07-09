# 🌍 Pangea

A fast, joyful, mobile-first geography mastery game. Countries, capitals, flags, shapes,
neighbors, map placement, and top-10 rankings — built as short, tactile rounds around a
daily streak habit loop. *"One more round?"*

## Run it

```bash
npm install
npm run dev        # http://localhost:3210
npm run build      # production build (deploys to Vercel as-is)
```

No backend, no env vars. All progress persists in `localStorage`.

## Design system

| Token | Value | Use |
|---|---|---|
| `cream` `#FFF6EB` | warm background | app canvas |
| `ink` `#22304F` | deep navy | all text (never black) |
| `coral` `#FF6B4A` | primary | main CTAs, XP |
| `teal` `#2EC4B6` / `sky` `#4CC9F0` | support | success surfaces, water |
| `grape` `#7C5CE0` | support | rankings, shapes |
| `sun` `#FFC53D` | support | combos, badges, reveals |
| `mint` `#3DDC97` / `rose` `#FF5D8F` | feedback | correct / wrong |

- **Type:** Baloo 2 (display) + Nunito (body) — rounded, friendly, bold hierarchy.
- **Buttons:** chunky, solid 4–5px bottom shadow, compress on press (`Btn` in `components/ui.tsx`).
- **Cards:** white, 2px sand border, rounded-3xl, soft hard-shadow.
- **Motion:** springy Framer Motion everywhere — slide-in questions, shake on wrong,
  pop on correct, count-up XP, confetti on milestones. Progression never waits on an
  exit animation (background-throttling safe).

## Screens

| Route | What it is |
|---|---|
| `/onboarding` | 4-step setup: focus → pace → region → play |
| `/` | Game lobby: streak, hearts, level ring, daily hero card, mode tiles |
| `/play?mode=…` | One engine, six moods: `daily` `learn` `sprint` `review` `sandbox` `rankings` |
| `/learn` | Continent progression + per-skill drill picker (bottom sheet) |
| `/review` | Personal weak-spot queue, grouped by country |
| `/sandbox` | Free play: explorable world map + country cards, flag browser, custom practice |
| `/rankings` | Ranked ordering rounds + guess-then-reveal top-10 lists |
| `/stats` | Level, streaks, accuracy, continent report, 12 badges |

## Architecture

```
src/
  data/countries.ts     # 112 countries: capital, continent, ISO codes, pop, area, borders
  lib/
    engine.ts           # seeded question generation (6 skills × mc/map/order kinds)
    store.tsx           # ProgressProvider: XP, hearts, streak/freezes, mastery, review queue
    format.ts           # formatting, day math, mulberry32 seeded RNG
    sfx.ts              # tiny WebAudio synth (no assets)
  components/
    geo.ts              # world-atlas topojson → features (110m)
    WorldMap.tsx        # interactive d3-geo SVG map (tap, focus, quiz states, explore colors)
    CountryShape.tsx    # single-country silhouettes
    Flag.tsx            # flagcdn images
    ui.tsx              # Btn, Card, Chip, Bar, Ring, Hearts, StreakBadge
    SessionComplete.tsx # celebration screen + share card
    Confetti.tsx, BottomNav.tsx
  app/                  # one route per screen (App Router)
```

## Game systems

- **Streak:** daily challenge completion +1/day; missing a day breaks it unless a
  **streak freeze** auto-covers it (earned per 7 perfect dailies, max 3). Milestones
  celebrated at 3/7/14/30/50/100. Out-of-hearts dailies don't count.
- **Hearts:** 5/day, refill at local midnight. Spent on wrong answers in daily/learn/review.
  Sprint, sandbox, and rankings are heart-free by design (different energy per mode).
- **XP & levels:** +10/correct, +5 combo bonus (3+), +25 perfect round; level n needs
  `30·n·(n+1)` total XP.
- **Sprint:** 60s wall-clock score attack; `50 + 10·combo` per answer, capped combo ×10.
- **Mastery:** per-country net score → New / Practicing / Strong / Mastered; continent
  progress = share of countries at Strong+.
- **Review queue:** every miss enqueues `country|skill`; two clean answers clear it.
  Review mode regenerates questions from the queue.
- **Daily challenge:** seeded by date (`mulberry32(hash("daily-YYYY-MM-DD"))`) — same
  10 questions for everyone on a given day, share-friendly.
- **Social (MVP-lite):** share/clipboard score cards, personal bests, "beat this" prompts.

## Next after MVP

1. **Real leaderboards** — daily challenge is already deterministic per day; a tiny KV
   backend turns it into a global race.
2. **Streak repair & widgets** — one-tap "repair yesterday" purchase-style mechanic,
   home-screen streak widget (PWA).
3. **Deeper content packs** — US states, rivers/mountains, city skylines, landmark photos.
4. **Confusion pairs** — the review queue already knows what you miss; surface
   "you mix up Slovakia ↔ Slovenia" drills.
5. **PWA install + offline** — bundle flags, add manifest + service worker.
6. **Friend duels** — same seeded round, two scores, one link.
