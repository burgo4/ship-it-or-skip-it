// Returns the streak length counting backwards from `endDate` (inclusive)
export function calculateStreak(dates: string[], endDate: string): number {
  if (!dates.length) return 0
  const set = new Set(dates)
  let streak = 0
  const cur = new Date(endDate + 'T00:00:00Z')
  while (set.has(cur.toISOString().slice(0, 10))) {
    streak++
    cur.setUTCDate(cur.getUTCDate() - 1)
  }
  return streak
}

export type WeekDot = {
  label: string
  played: boolean
  isToday: boolean
}

// Returns Mon–Sun dots for the ISO week containing `today`
export function getWeekDots(dates: string[], today: string): WeekDot[] {
  const set = new Set(dates)
  const todayDate = new Date(today + 'T00:00:00Z')
  const dow = todayDate.getUTCDay() // 0=Sun … 6=Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(todayDate)
  monday.setUTCDate(todayDate.getUTCDate() + mondayOffset)

  return ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((label, i) => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    return { label, played: set.has(dateStr), isToday: dateStr === today }
  })
}
