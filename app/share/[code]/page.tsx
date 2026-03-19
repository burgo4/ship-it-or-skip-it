import { Metadata } from 'next'
import ClientRedirect from './client-redirect'

const SITE = 'https://ship-it-or-skip-it.vercel.app'

interface Props {
  params: Promise<{ code: string }>
}

function getTitle(score: number): string {
  if (score <= 2) return 'Intern energy'
  if (score <= 4) return 'Mid-level PM'
  if (score <= 6) return 'Senior PM'
  if (score <= 8) return 'VP material'
  return 'Lenny would hire you'
}

function parseCode(code: string): { score: number; dots: string; title: string } {
  try {
    const [scoreStr, dots] = code.split('-')
    const score = Number(scoreStr)
    return {
      score: isNaN(score) ? 0 : Math.min(10, Math.max(0, score)),
      dots: dots ?? '',
      title: getTitle(isNaN(score) ? 0 : score),
    }
  } catch {
    return { score: 0, dots: '', title: 'Play today' }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const { score, dots, title } = parseCode(code)

  const ogImageUrl = `${SITE}/api/og?s=${score}&d=${encodeURIComponent(dots)}&t=${encodeURIComponent(title)}`

  return {
    title: `I scored ${score}/10 — Ship It or Skip It`,
    description: `${title}. I scored ${score}/10 on Ship It or Skip It — a daily product trivia game. 10 real decisions from companies you know. Would you have made the call?`,
    openGraph: {
      title: `I scored ${score}/10 — Ship It or Skip It`,
      description: `${title}. 10 real product decisions from companies you know. One daily deck — same cards for everyone. Would you have made the call?`,
      url: `${SITE}/share/${code}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'My Ship It or Skip It score' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `I scored ${score}/10 — Ship It or Skip It`,
      description: `${title}. 10 real product decisions from companies you know. Would you have made the call?`,
      images: [ogImageUrl],
    },
  }
}

export default async function SharePage() {
  // Crawlers (no JS) see the HTML with OG meta tags above and render the card image.
  // Real users get client-side bounced back to the homepage immediately.
  return <ClientRedirect />
}
