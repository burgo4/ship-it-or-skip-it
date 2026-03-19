import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// ─── In-memory IP rate limiter ────────────────────────────────────────────────
// 5 submissions per IP per 10-minute window
const RATE_LIMIT = 5
const WINDOW_MS = 10 * 60 * 1000

const ipLog = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (ipLog.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (hits.length >= RATE_LIMIT) return true
  ipLog.set(ip, [...hits, now])
  return false
}

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ─── GET /api/scores ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  let query = supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .order('ts', { ascending: true })

  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

// ─── POST /api/scores ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getIp(request)
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Leaderboard not configured' }, { status: 503 })
  }

  const body = await request.json()
  const { name, score, date, ts, card_wrong, device_id } = body

  // Validate
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }
  if (typeof score !== 'number' || score < 0 || score > 10) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }
  if (!ts || typeof ts !== 'number') {
    return NextResponse.json({ error: 'Invalid ts' }, { status: 400 })
  }
  if (!device_id || typeof device_id !== 'string') {
    return NextResponse.json({ error: 'Invalid device_id' }, { status: 400 })
  }

  const cleanName = name.trim().slice(0, 24)
  if (!cleanName) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('scores')
    .insert([{ name: cleanName, score, date, ts, card_wrong: card_wrong ?? [], device_id }])
    .select()
    .single()

  if (error) {
    // Unique constraint violation = already submitted from this device today
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already submitted today' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
