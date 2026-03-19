# Ship It or Skip It

A daily product trivia game. 10 real decisions from companies you know — one daily deck, same cards for everyone, global leaderboard.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** — cards database + leaderboard scores
- Vanilla CSS (no Tailwind) — pixel-faithful port of the original prototype

## Setup

### 1. Clone & install

```bash
cd ship-it-or-skip-it
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor → New query**, paste the contents of `schema.sql`, and run it.

### 3. Seed the cards

In the same SQL Editor run the curl command shown at the bottom of `schema.sql`, or paste-import `cards-database.json` via the Table Editor.

Quick curl seed (fill in your values first):

```bash
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/cards" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  --data-binary @/Users/pavol.poljak/Downloads/cards-database.json
```

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your Supabase **Project URL** and **anon public key** (found in Dashboard → Settings → API).

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **No Supabase yet?** The app works without env vars — it falls back to the bundled 120-card dataset and skips the leaderboard API calls gracefully.

## How it works

| Feature | Implementation |
|---|---|
| Daily deck | Seeded shuffle (mulberry32) using today's date — same 10 cards for all players |
| Drag mechanic | Pointer Events API — works on mobile & desktop |
| Keyboard support | ← Skip it / → Ship it |
| Leaderboard | Supabase `scores` table, loaded fresh on demand |
| Card fallback | All 120 cards bundled in `lib/fallback-cards.ts` — works offline |

## Project structure

```
app/
  layout.tsx          Root layout (fonts, metadata)
  globals.css         All styles (ported from prototype)
  page.tsx            Server component — fetches cards from Supabase
  api/
    cards/route.ts    GET /api/cards
    scores/route.ts   GET /api/scores  •  POST /api/scores
components/
  Game.tsx            Client component — all game logic & screens
lib/
  deck.ts             Seeded daily shuffle
  helpers.ts          Rank, distribution, toughest card calculations
  supabase.ts         Supabase client
  fallback-cards.ts   120 bundled cards (auto-generated from cards-database.json)
types/
  index.ts            Card, ScoreEntry, Screen, Answer
schema.sql            Supabase table definitions + RLS policies
```
