import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Ship It or Skip It — A daily product trivia game'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
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
          gap: '24px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo pill */}
        <div
          style={{
            background: '#d4622a',
            borderRadius: '16px',
            padding: '14px 32px',
            color: '#fff',
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '0.5px',
          }}
        >
          Ship It or Skip It
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: '700',
            color: '#1a1a1a',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '800px',
          }}
        >
          Would you have made the call?
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: '26px',
            color: '#666',
            textAlign: 'center',
          }}
        >
          10 real product decisions. One daily deck. Same cards for everyone.
        </div>

        {/* Dots decoration */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          {['#0f6e56','#0f6e56','#0f6e56','#0f6e56','#0f6e56','#0f6e56','#993c1d','#0f6e56','#0f6e56','#0f6e56'].map((c, i) => (
            <div
              key={i}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: c,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
