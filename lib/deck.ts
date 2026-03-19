import { Card } from '@/types'

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

const MIN_SKIPS = 2

export function getDailyDeck(cards: Card[], date: string): Card[] {
  const seed = date.split('-').reduce((a, n) => a * 1000 + Number(n), 0)
  const shuffled = seededShuffle(cards, seed)

  // Build initial deck — one card per company
  const seen = new Set<string>()
  const deck: Card[] = []
  for (const card of shuffled) {
    if (!seen.has(card.co)) {
      seen.add(card.co)
      deck.push(card)
      if (deck.length === 10) break
    }
  }

  // Guarantee at least MIN_SKIPS skip cards
  const skipCount = deck.filter((c) => c.dec === 'skip').length
  const deficit = MIN_SKIPS - skipCount
  if (deficit <= 0) return deck

  // Find skip cards not yet in the deck (unique company)
  const deckIds = new Set(deck.map((c) => c.id))
  const availableSkips = shuffled.filter(
    (c) => c.dec === 'skip' && !deckIds.has(c.id) && !seen.has(c.co)
  )

  // Replace the last N ship cards with available skips
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

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}
