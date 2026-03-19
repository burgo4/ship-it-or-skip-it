import { ScoreEntry } from '@/types'

export function calcRank(
  lb: ScoreEntry[],
  score: number,
  myTs: number,
  today: string
) {
  const todayEntries = lb.filter((e) => e.date === today)
  const same = todayEntries.filter((e) => e.score === score).sort((a, b) => a.ts - b.ts)
  const idx = same.findIndex((e) => e.ts === myTs)
  const pos = idx >= 0 ? idx + 1 : same.length
  const lower = todayEntries.filter((e) => e.score < score).length
  const total = todayEntries.length
  const pct = total <= 1 ? 100 : Math.round((lower / (total - 1)) * 100)
  return { pos, sameCount: same.length, pct, topPct: Math.max(1, 100 - pct), total }
}

export function calcDist(lb: ScoreEntry[], today: string) {
  const todayEntries = lb.filter((e) => e.date === today)
  const dist: Record<number, number> = {}
  for (let i = 0; i <= 10; i++) dist[i] = 0
  todayEntries.forEach((e) => {
    dist[e.score] = (dist[e.score] || 0) + 1
  })
  return { dist, total: todayEntries.length }
}

export function calcToughest(
  lb: ScoreEntry[],
  cards: { id: number; co: string; yr: string }[],
  today: string
) {
  const counts: Record<number, number> = {}
  lb
    .filter((e) => e.date === today && e.card_wrong && e.card_wrong.length)
    .forEach((e) => {
      e.card_wrong.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1
      })
    })
  if (!Object.keys(counts).length) return null
  const topId = Object.keys(counts)
    .map(Number)
    .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0]
  const card = cards.find((c) => c.id === topId)
  const total = lb.filter((e) => e.date === today).length
  return card ? { card, wrong: counts[topId], total } : null
}

export function fmtTime(ts: number): string {
  const d = new Date(ts)
  return (
    d.getHours().toString().padStart(2, '0') +
    ':' +
    d.getMinutes().toString().padStart(2, '0')
  )
}

export function getTitle(s: number): { title: string; sub: string } {
  if (s <= 2) return { title: 'Intern energy', sub: 'Keep shipping and learning.' }
  if (s <= 4) return { title: 'Mid-level PM', sub: 'Good instincts, some blind spots.' }
  if (s <= 6) return { title: 'Senior PM', sub: 'You have been in the trenches.' }
  if (s <= 8) return { title: 'VP material', sub: 'Pattern recognition on point.' }
  return { title: 'Lenny would hire you', sub: 'Genuinely elite product instincts.' }
}

export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
