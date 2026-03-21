import { Card } from '@/types'

// First day using LRU-aware deck selection.
// All cards start at 0 uses from this date — guarantees no card repeats
// until every card has been shown at least once (~9-10 day cycle).
const EPOCH = '2026-03-22'

const MIN_SKIPS = 2

// ─── PRNG ────────────────────────────────────────────────────────────────────

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed)
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function dateToSeed(date: string): number {
  return date.split('-').reduce((a, n) => a * 1000 + Number(n), 0)
}

function addOneDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// ─── CORE PICK ───────────────────────────────────────────────────────────────
// Picks 10 cards for a given date given pre-computed usage counts.
// Within the same usage tier, the seeded daily shuffle determines order
// so each day still feels random.

function pickDeck(cards: Card[], date: string, usage: Map<number, number>): Card[] {
  // 1. Shuffle with today's seed (randomises within usage tiers)
  const seed = dateToSeed(date)
  const shuffled = seededShuffle(cards, seed)

  // 2. Stable sort by usage count ascending — JS sort is stable (ES2019+)
  //    Cards never shown come first; ties keep the shuffled order
  const sorted = [...shuffled].sort(
    (a, b) => (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0)
  )

  // 3. Pick 10, one card per company
  const seen = new Set<string>()
  const deck: Card[] = []
  for (const card of sorted) {
    if (!seen.has(card.co)) {
      seen.add(card.co)
      deck.push(card)
      if (deck.length === 10) break
    }
  }

  // 4. Guarantee MIN_SKIPS skip cards
  const skipCount = deck.filter((c) => c.dec === 'skip').length
  const deficit = MIN_SKIPS - skipCount
  if (deficit <= 0) return deck

  const deckIds = new Set(deck.map((c) => c.id))
  const availableSkips = sorted.filter(
    (c) => c.dec === 'skip' && !deckIds.has(c.id) && !seen.has(c.co)
  )

  let replaced = 0
  for (let i = deck.length - 1; i >= 0 && replaced < deficit && replaced < availableSkips.length; i--) {
    if (deck[i].dec === 'ship') {
      seen.delete(deck[i].co)
      seen.add(availableSkips[replaced].co)
      deck[i] = availableSkips[replaced]
      replaced++
    }
  }

  return deck
}

// ─── USAGE COUNTER ───────────────────────────────────────────────────────────
// Simulates every deck from EPOCH up to (not including) `date`.
// Since pickDeck is deterministic, this is pure computation — no DB needed.

function computeUsage(cards: Card[], date: string): Map<number, number> {
  const counts = new Map<number, number>(cards.map((c) => [c.id, 0]))
  let d = EPOCH
  while (d < date) {
    const deck = pickDeck(cards, d, counts)
    for (const card of deck) {
      counts.set(card.id, (counts.get(card.id) ?? 0) + 1)
    }
    d = addOneDay(d)
  }
  return counts
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export function getDailyDeck(cards: Card[], date: string): Card[] {
  if (date < EPOCH) {
    // Legacy behaviour for dates before LRU tracking started
    const seed = dateToSeed(date)
    const shuffled = seededShuffle(cards, seed)
    const seen = new Set<string>()
    const deck: Card[] = []
    for (const card of shuffled) {
      if (!seen.has(card.co)) {
        seen.add(card.co)
        deck.push(card)
        if (deck.length === 10) break
      }
    }
    return deck
  }

  const usage = computeUsage(cards, date)
  return pickDeck(cards, date, usage)
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}
