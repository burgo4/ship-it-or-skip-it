export interface Card {
  id: number
  stmt: string
  dec: 'ship' | 'skip'
  co: string
  yr: string
  color: string
  expl: string
  pat: string
  url?: string
  domain?: string
}

export interface ScoreEntry {
  id?: string
  name: string
  score: number
  date: string
  ts: number
  card_wrong: number[]
}

export type Screen = 'intro' | 'playing' | 'reveal' | 'score' | 'review' | 'leaderboard'

export interface Answer {
  correct: boolean
  choice: 'ship' | 'skip'
}
