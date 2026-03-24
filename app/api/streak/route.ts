import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const device_id = searchParams.get('device_id')

  if (!device_id || typeof device_id !== 'string' || device_id.trim() === '') {
    return NextResponse.json({ error: 'Invalid device_id' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ dates: [] })

  const { data, error } = await supabase
    .from('scores')
    .select('date')
    .eq('device_id', device_id)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplicate dates (shouldn't happen but defensive)
  const dates = [...new Set((data ?? []).map((r: { date: string }) => r.date))]
  return NextResponse.json({ dates })
}
