import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://ship-it-or-skip-it.vercel.app'),
  title: 'Ship It or Skip It',
  description: 'A daily product trivia game. 10 real decisions from companies you know.',
  openGraph: {
    title: 'Ship It or Skip It',
    description: '10 real product decisions. One daily deck. Would you have made the call?',
    url: 'https://shipitorskipit.vercel.app',
    siteName: 'Ship It or Skip It',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ship It or Skip It',
    description: '10 real product decisions. One daily deck. Would you have made the call?',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=DM+Sans:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
