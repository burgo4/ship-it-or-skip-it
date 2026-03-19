'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, ScoreEntry, Screen, Answer } from '@/types'
import { getDailyDeck, getTodayString } from '@/lib/deck'
import { calcRank, calcDist, calcToughest, fmtTime, getTitle } from '@/lib/helpers'

interface Props {
  initialCards: Card[]
}

const NAME_KEY = 'sios_name_v8'
const DEVICE_KEY = 'sios_device_id'

function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}



interface RevealCardProps {
  card: Card
  choice: 'ship' | 'skip' | null
}

const LOGO_TOKEN = 'pk_PWacoUqBROSn3GQ6mE1zbA'

function CompanyAvatar({ card }: { card: Card }) {
  const [failed, setFailed] = useState(false)
  if (card.domain && !failed) {
    return (
      <img
        src={`https://img.logo.dev/${card.domain}?token=${LOGO_TOKEN}&size=80`}
        alt={card.co}
        onError={() => setFailed(true)}
        className="cav-logo"
      />
    )
  }
  return (
    <div className="cav" style={{ background: card.color }}>
      {card.co.slice(0, 2).toUpperCase()}
    </div>
  )
}

const RevealCard = ({ card, choice }: RevealCardProps) => {
  const ok = choice === card.dec
  return (
    <div className="rev">
      <div className={`rpill ${ok ? 'rp-ok' : 'rp-no'}`}>
        {ok ? 'Correct' : 'Wrong'} — this was a {card.dec === 'ship' ? 'ship it' : 'skip it'}
      </div>
      <div className="crow">
        <CompanyAvatar card={card} />
        <div>
          <div className="cname">{card.co}</div>
          <div className="cyr">{card.yr}</div>
        </div>
      </div>
      <div className="expl">{card.expl}</div>
      <div className="pbox">
        <div className="plbl">The pattern</div>
        <div className="ptxt">{card.pat}</div>
      </div>
      {card.url && (
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="story-link"
        >
          Read full story
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      )}
    </div>
  )
}

const SITE_URL = 'https://ship-it-or-skip-it.vercel.app'

function buildShareUrl(score: number, answers: Answer[]): string {
  const dots = answers.map((a) => (a.correct ? 'G' : 'R')).join('')
  return `${SITE_URL}/share/${score}-${dots}`
}

function buildShareText(score: number, answers: Answer[], title: string): string {
  const dots = answers.map((a) => (a.correct ? '🟢' : '🔴')).join('')
  return `Ship It or Skip It — ${score}/10\n${dots}\n${title}\n\nWould you have made the call?`
}

interface ShareRowProps {
  score: number
  answers: Answer[]
  title: string
}

function ShareRow({ score, answers, title }: ShareRowProps) {
  const shareUrl = buildShareUrl(score, answers)
  const text = buildShareText(score, answers, title)

  const shareX = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
  }

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="share-row">
      <span className="share-lbl">Share your result</span>
      <div className="share-btns">
        <button className="btn share-btn share-x" onClick={shareX}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.828L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Post on X
        </button>
        <button className="btn share-btn share-li" onClick={shareLinkedIn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          Share on LinkedIn
        </button>
      </div>
    </div>
  )
}

export default function Game({ initialCards }: Props) {
  const TODAY = getTodayString()
  const deck = getDailyDeck(initialCards, TODAY)

  const [screen, setScreen] = useState<Screen>('intro')
  const [prevScreen, setPrevScreen] = useState<Screen>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [choice, setChoice] = useState<'ship' | 'skip' | null>(null)
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [lb, setLb] = useState<ScoreEntry[]>([])
  const [myTs, setMyTs] = useState<number | null>(null)
  const [reviewIdx, setReviewIdx] = useState(0)
  const [lbLoading, setLbLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const flyLock = useRef(false)
  const isDragging = useRef(false)
  const dragStart = useRef(0)
  const activeDx = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const shipBadgeRef = useRef<HTMLDivElement>(null)
  const skipBadgeRef = useRef<HTMLDivElement>(null)
  const keysOn = useRef(false)

  // Load saved name + restore today's session if already played
  useEffect(() => {
    try {
      // Prune old sios_answers_YYYY-MM-DD keys (keep only today's)
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sios_answers_') && k !== 'sios_answers_' + TODAY)
        .forEach((k) => localStorage.removeItem(k))

      const saved = localStorage.getItem(NAME_KEY)
      if (saved) setName(saved)

      const savedAnswers = localStorage.getItem('sios_answers_' + TODAY)
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers))
        setScreen('score')
      }

      const submittedDate = localStorage.getItem('sios_submitted_date')
      const submittedTs = localStorage.getItem('sios_submitted_ts')
      if (submittedDate === TODAY && submittedTs) {
        setMyTs(Number(submittedTs))
        setSubmitted(true)
      }
    } catch {}
  }, [TODAY])

  const loadLb = useCallback(async (): Promise<ScoreEntry[]> => {
    try {
      setLbLoading(true)
      const res = await fetch(`/api/scores?date=${TODAY}`)
      if (!res.ok) return []
      const data: ScoreEntry[] = await res.json()
      setLb(data)
      return data
    } catch {
      return []
    } finally {
      setLbLoading(false)
    }
  }, [TODAY])

  // Auto-load leaderboard when score screen is shown after a submission
  useEffect(() => {
    if (screen === 'score' && submitted) {
      loadLb()
    }
  }, [screen, submitted, loadLb])

  const score = answers.filter((a) => a.correct).length

  // Dot indicators
  const renderDots = (currentIdx: number, reviewMode = false) =>
    deck.map((_, i) => {
      let cls = ''
      if (reviewMode) {
        if (answers[i]) cls = answers[i].correct ? ' dot-d' : ' dot-w'
        if (i === currentIdx) cls = ' dot-c'
      } else {
        if (i < currentIdx) cls = answers[i] && answers[i].correct ? ' dot-d' : ' dot-w'
        else if (i === currentIdx) cls = ' dot-c'
      }
      return cls
    })

  // ─── DRAG ────────────────────────────────────────────────────────────────────
  const choose = useCallback(
    (c: 'ship' | 'skip') => {
      if (flyLock.current) return
      flyLock.current = true
      const card = cardRef.current
      if (card) {
        card.style.transform = ''
        card.style.transition = ''
        card.classList.add(c === 'ship' ? 'fly-r' : 'fly-l')
      }
      setTimeout(() => {
        setChoice(c)
        setScreen('reveal')
        flyLock.current = false
        isDragging.current = false
        activeDx.current = 0
      }, 380)
    },
    []
  )

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (flyLock.current) return
    isDragging.current = true
    dragStart.current = e.clientX
    activeDx.current = 0
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current
    activeDx.current = dx
    const card = cardRef.current
    if (card) {
      card.style.transform = `translateX(${dx}px) rotate(${dx * 0.07}deg)`
      card.style.transition = 'none'
    }
    if (shipBadgeRef.current)
      shipBadgeRef.current.style.opacity = String(Math.max(0, Math.min(dx / 80, 1)))
    if (skipBadgeRef.current)
      skipBadgeRef.current.style.opacity = String(Math.max(0, Math.min(-dx / 80, 1)))
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = activeDx.current
    if (dx > 80) {
      choose('ship')
    } else if (dx < -80) {
      choose('skip')
    } else {
      const card = cardRef.current
      if (card) {
        card.style.transform = ''
        card.style.transition = ''
      }
    }
    activeDx.current = 0
  }, [choose])

  const handlePointerCancel = useCallback(() => {
    isDragging.current = false
    activeDx.current = 0
    const card = cardRef.current
    if (card) {
      card.style.transform = ''
      card.style.transition = ''
    }
  }, [])

  // ─── KEYBOARD ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (keysOn.current) return
    keysOn.current = true
    const handler = (e: KeyboardEvent) => {
      if (screen === 'playing') {
        if (e.key === 'ArrowLeft') choose('skip')
        if (e.key === 'ArrowRight') choose('ship')
      }
      if (screen === 'review') {
        if (e.key === 'ArrowLeft')
          setReviewIdx((r) => Math.max(0, r - 1))
        if (e.key === 'ArrowRight')
          setReviewIdx((r) => Math.min(deck.length - 1, r + 1))
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      keysOn.current = false
    }
  }, [screen, choose, deck.length])

  // ─── NEXT ────────────────────────────────────────────────────────────────────
  const next = useCallback(() => {
    const newAnswers = [...answers, { correct: choice === deck[index].dec, choice: choice! }]
    setAnswers(newAnswers)
    if (index >= deck.length - 1) {
      try { localStorage.setItem('sios_answers_' + TODAY, JSON.stringify(newAnswers)) } catch {}
      setScreen('score')
    } else {
      setIndex((i) => i + 1)
      setChoice(null)
      setScreen('playing')
    }
  }, [answers, choice, deck, index, TODAY])

  // ─── SUBMIT SCORE ────────────────────────────────────────────────────────────
  const submitScore = useCallback(async () => {
    const nm = name.trim()
    if (!nm) return
    const ts = Date.now()
    const deviceId = getOrCreateDeviceId()
    const wrongIds = answers.map((a, i) => (a.correct ? null : deck[i].id)).filter(Boolean) as number[]
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nm, score, date: TODAY, ts, card_wrong: wrongIds, device_id: deviceId }),
      })
      if (res.status === 409) {
        setSubmitError('You already submitted today from this device.')
        return
      }
      if (!res.ok) throw new Error(await res.text())
      try {
        localStorage.setItem(NAME_KEY, nm)
        localStorage.setItem('sios_submitted_date', TODAY)
        localStorage.setItem('sios_submitted_ts', String(ts))
      } catch {}
      setMyTs(ts)
      setSubmitted(true)
      setSubmitError(null)
      const newLb = await loadLb()
      setLb(newLb)
    } catch {
      setSubmitError('Could not submit score. Please try again.')
    }
  }, [name, answers, deck, score, TODAY, loadLb])

  // ─── SCREENS ─────────────────────────────────────────────────────────────────
  const card = deck[index]
  const dotClasses = renderDots(index)
  const reviewDotClasses = renderDots(reviewIdx, true)

  if (screen === 'intro') {
    return (
      <div className="card-wrap">
        <div className="hero">
          <h1>Would you have made the call?</h1>
          <p>10 real decisions from companies you know. One daily deck. Same cards for everyone.</p>
        </div>
        {name && <p className="attr">Welcome back, {name}</p>}
        <button
          className="btn btn-orange btn-w"
          onClick={() => setScreen('playing')}
        >
          Start playing
        </button>
        <button
          className="btn btn-ghost btn-w"
          onClick={async () => {
            await loadLb()
            setPrevScreen('intro')
            setScreen('leaderboard')
          }}
        >
          View leaderboard
        </button>
      </div>
    )
  }

  if (screen === 'playing') {
    return (
      <div className="card-wrap">
        <div className="hdr">
          <span className="cnt">{index + 1} / 10</span>
        </div>
        <div className="dots">
          {dotClasses.map((cls, i) => (
            <div key={i} className={`dot${cls}`} />
          ))}
        </div>
        <div
          className="game-card"
          ref={cardRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className="badge sb-s" ref={shipBadgeRef}>Ship it</div>
          <div className="badge sb-k" ref={skipBadgeRef}>Skip it</div>
          <div className="ctag">Real decision</div>
          <div className="cstmt">{card.stmt}</div>
          <div className="chint">Drag, tap the buttons, or use arrow keys</div>
        </div>
        <div className="brow">
          <button className="btn btn-sk" onClick={() => choose('skip')}>Skip it</button>
          <button className="btn btn-sh" onClick={() => choose('ship')}>Ship it</button>
        </div>
      </div>
    )
  }

  if (screen === 'reveal') {
    const isLast = index >= deck.length - 1
    return (
      <div className="card-wrap">
        <div className="hdr">
          <span className="cnt">{index + 1} / 10</span>
        </div>
        <div className="dots">
          {dotClasses.map((cls, i) => (
            <div key={i} className={`dot${cls}`} />
          ))}
        </div>
        <RevealCard card={card} choice={choice} />
        <button className="btn btn-orange btn-w" onClick={next}>
          {isLast ? 'See results' : 'Next'}
        </button>
      </div>
    )
  }

  if (screen === 'review') {
    const rc = deck[reviewIdx]
    const reviewChoice = answers[reviewIdx]?.choice ?? null
    return (
      <div className="card-wrap">
        <div className="hdr">
          <span className="cnt">{reviewIdx + 1} / 10</span>
        </div>
        <div className="dots">
          {reviewDotClasses.map((cls, i) => (
            <div
              key={i}
              className={`dot${cls}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setReviewIdx(i)}
            />
          ))}
        </div>
        <RevealCard card={rc} choice={reviewChoice} />
        <div className="rv-nav">
          <button
            className="btn btn-ghost"
            disabled={reviewIdx === 0}
            onClick={() => setReviewIdx((r) => Math.max(0, r - 1))}
          >
            Previous
          </button>
          <button
            className="btn btn-ghost"
            disabled={reviewIdx >= deck.length - 1}
            onClick={() => setReviewIdx((r) => Math.min(deck.length - 1, r + 1))}
          >
            Next
          </button>
        </div>
        <button className="btn btn-ghost btn-w" onClick={() => setScreen('score')}>
          Back to results
        </button>
      </div>
    )
  }

  if (screen === 'score') {
    const r = getTitle(score)
    let rankHtml = null
    if (submitted && myTs !== null && lb.length > 0) {
      const rk = calcRank(lb, score, myTs, TODAY)
      rankHtml = (
        <div className="rank-box">
          <div className="rank-row">
            <span className="rank-lbl">Rank among {score}/10 scorers today</span>
            <span className="rank-val">#{rk.pos} of {rk.sameCount}</span>
          </div>
          <div className="rank-div" />
          {rk.total > 1 && (
            <div className="rank-row">
              <span className="rank-lbl">Total players today</span>
              <span className="rank-val">{rk.total}</span>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="card-wrap">
        <div className="sc-wrap">
          <div>
            <span className="sc-num">{score}</span>
            <span className="sc-den">/10</span>
          </div>
          <div className="sc-title">{r.title}</div>
          <div className="sc-sub">{r.sub}</div>
        </div>
        <div className="sdots">
          {answers.map((a, i) => (
            <div key={i} className={`sdot ${a.correct ? 'sdot-y' : 'sdot-n'}`} />
          ))}
        </div>
        {rankHtml}
        {!submitted && (
          <div className="name-wrap">
            <span className="nlbl">Add your score to the global leaderboard</span>
            <div className="name-row">
              <input
                type="text"
                placeholder="Your name..."
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) submitScore() }}
              />
              <button
                className="btn btn-orange"
                disabled={!name.trim()}
                onClick={submitScore}
              >
                Submit
              </button>
            </div>
            {submitError && (
              <span style={{ fontSize: 12, color: '#993c1d' }}>{submitError}</span>
            )}
          </div>
        )}
        <div className="two-btn">
          <button
            className="btn btn-orange"
            style={{ flex: 1 }}
            onClick={() => { setReviewIdx(0); setScreen('review') }}
          >
            Review cards
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={async () => {
              await loadLb()
              setPrevScreen('score')
              setScreen('leaderboard')
            }}
          >
            Leaderboard
          </button>
        </div>
        <ShareRow score={score} answers={answers} title={getTitle(score).title} />
        <p className="tomorrow">Come back tomorrow for fresh decisions.</p>
      </div>
    )
  }

  if (screen === 'leaderboard') {
    const todayAll = [...lb]
      .filter((e) => e.date === TODAY)
      .sort((a, b) => b.score - a.score || a.ts - b.ts)
    const { dist, total } = calcDist(lb, TODAY)
    const maxDist = Math.max(...Object.values(dist), 1)
    const myScore = submitted && myTs ? lb.find((e) => e.ts === myTs)?.score ?? null : null
    const tough = calcToughest(lb, deck, TODAY)

    const topPctBanner = null

    return (
      <div className="card-wrap">
        <div className="hdr">
          <span className="lbtitle">Today&apos;s leaderboard</span>
        </div>
        {lbLoading ? (
          <p className="attr" style={{ padding: '1rem 0' }}>Loading...</p>
        ) : (
          <>
            {topPctBanner}
            <div className="dist-box">
              <span className="dist-title">
                Score distribution{myScore !== null ? ' — your score highlighted' : ''}
              </span>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((sc) => (
                <div className="dist-row" key={sc}>
                  <span className="dist-lbl">{sc}</span>
                  <div className="dist-bar-wrap">
                    <div
                      className={`dist-bar${sc === myScore ? ' mine' : ''}`}
                      style={{ width: `${Math.round(((dist[sc] || 0) / maxDist) * 100)}%` }}
                    />
                  </div>
                  <span className="dist-cnt">{dist[sc] || 0}</span>
                </div>
              ))}
            </div>
            {tough && (
              <div className="tough-box">
                <span className="tough-lbl">Today&apos;s toughest card</span>
                <div className="tough-co">{tough.card.co} — {tough.card.yr}</div>
                <span className="tough-stat">
                  {tough.wrong} of {tough.total} players got it wrong
                </span>
              </div>
            )}
            <div className="lb-list">
              {todayAll.length === 0 ? (
                <div className="empty">No scores yet today. Be the first!</div>
              ) : (
                todayAll.slice(0, 20).map((e, i) => {
                  const isMe = myTs !== null && e.ts === myTs
                  return (
                    <div key={e.id ?? i} className={`lb-row${i < 3 ? ' lb-top' : ''}${isMe ? ' me' : ''}`}>
                      <span className="lb-rank">{i + 1}</span>
                      <span className="lb-name">{e.name}{isMe ? ' (you)' : ''}</span>
                      <span className="lb-score">{e.score}/10</span>
                      <span className="lb-time">{fmtTime(e.ts)}</span>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
        <button className="btn btn-orange btn-w" onClick={() => setScreen(prevScreen)}>
          Back
        </button>
      </div>
    )
  }

  return null
}
