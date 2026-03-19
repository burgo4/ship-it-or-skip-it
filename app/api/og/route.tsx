import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const subtitleMap: Record<string, string> = {
  'Intern energy': 'Keep shipping and learning.',
  'Mid-level PM': 'Good instincts, some blind spots.',
  'Senior PM': 'You have been in the trenches.',
  'VP material': 'Pattern recognition on point.',
  'Lenny would hire you': 'Genuinely elite product instincts.',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const score = Number(searchParams.get('s') ?? '0')
  const dots = searchParams.get('d') ?? ''
  const title = searchParams.get('t') ?? 'Play today'
  const subtitle = subtitleMap[title] ?? ''
  const dotList = dots.split('').map((c) => c === 'G')

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(160deg, #f5e4ce 0%, #edcfae 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        {/* Title above card */}
        <div
          style={{
            fontSize: '54px',
            fontWeight: 700,
            color: '#d4622a',
            marginBottom: '24px',
            fontStyle: 'italic',
            letterSpacing: '-0.5px',
          }}
        >
          Ship It or Skip It
        </div>

        {/* White card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '32px',
            padding: '48px 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 4px 40px rgba(180,80,20,0.10)',
          }}
        >
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', lineHeight: '1' }}>
            <span style={{ fontSize: '112px', fontWeight: 500, color: '#1a1a1a', lineHeight: '1' }}>
              {score}
            </span>
            <span style={{ fontSize: '48px', color: '#aaa', fontWeight: 400 }}>/10</span>
          </div>

          {/* Title */}
          <div style={{ fontSize: '36px', fontWeight: 600, color: '#1a1a1a' }}>{title}</div>

          {/* Subtitle */}
          {subtitle ? (
            <div style={{ fontSize: '22px', color: '#888', fontWeight: 400 }}>{subtitle}</div>
          ) : null}

          {/* Dots */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {dotList.map((ok, i) => (
              <div
                key={i}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: ok ? '#0f6e56' : '#8b2a0f',
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            fontSize: '18px',
            color: 'rgba(150,80,30,0.65)',
          }}
        >
          Built on · Lenny&apos;s Data · 349 newsletters · 289 podcasts
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
