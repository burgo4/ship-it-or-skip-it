-- ─── Ship It or Skip It — Supabase Schema ────────────────────────────────────
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ─── CARDS ───────────────────────────────────────────────────────────────────
create table if not exists cards (
  id      integer primary key,
  stmt    text    not null,
  dec     text    not null check (dec in ('ship', 'skip')),
  co      text    not null,
  yr      text    not null,
  color   text    not null,
  expl    text    not null,
  pat     text    not null,
  url     text                  -- Lenny's newsletter / podcast URL
);

-- ─── SCORES ──────────────────────────────────────────────────────────────────
create table if not exists scores (
  id         uuid    default gen_random_uuid() primary key,
  name       text    not null,
  score      integer not null check (score >= 0 and score <= 10),
  date       text    not null,  -- YYYY-MM-DD
  ts         bigint  not null,  -- Unix ms timestamp
  card_wrong integer[] default '{}'
);

create index if not exists scores_date_idx on scores (date);

-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────────────────────
alter table cards  enable row level security;
alter table scores enable row level security;

-- Cards: public read only
create policy "cards_public_read"
  on cards for select
  using (true);

-- Scores: public read + insert (no update / delete)
create policy "scores_public_read"
  on scores for select
  using (true);

create policy "scores_public_insert"
  on scores for insert
  with check (true);

-- ─── SEED CARDS ──────────────────────────────────────────────────────────────
-- After running the schema, seed your cards by going to:
--   Dashboard → Table Editor → cards → Insert rows
-- or by running a bulk INSERT from cards-database.json.
--
-- Quick seed via the REST API (run from terminal after filling in your vars):
--
--   curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/cards" \
--     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
--     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
--     -H "Content-Type: application/json" \
--     -H "Prefer: return=minimal" \
--     --data-binary @cards-database.json
