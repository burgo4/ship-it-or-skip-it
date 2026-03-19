export const revalidate = 3600 // re-fetch cards at most once per hour

import Game from '@/components/Game'
import { Card } from '@/types'
import { FALLBACK_CARDS } from '@/lib/fallback-cards'

async function getCards(): Promise<Card[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

    if (!url || !key) {
      console.warn('Supabase env vars not set — using fallback cards')
      return FALLBACK_CARDS
    }

    const res = await fetch(`${url}/rest/v1/cards?select=*&order=id.asc`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      console.warn('Failed to fetch cards from Supabase — using fallback cards')
      return FALLBACK_CARDS
    }

    const data: Card[] = await res.json()
    return data.length > 0 ? data : FALLBACK_CARDS
  } catch {
    console.warn('Error fetching cards — using fallback cards')
    return FALLBACK_CARDS
  }
}

export default async function Home() {
  const cards = await getCards()

  return (
    <>
      <div className="page-logo">Ship It or Skip It</div>
      <Game initialCards={cards} />
      <p className="page-attr">
        Built on · <a href="https://www.lennysdata.com/" target="_blank" rel="noopener noreferrer">Lenny&apos;s Data</a> · 349 newsletters · 289 podcasts
      </p>
    </>
  )
}
