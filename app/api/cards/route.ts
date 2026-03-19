import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { FALLBACK_CARDS } from '@/lib/fallback-cards'

export async function GET() {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(FALLBACK_CARDS)
  }

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    return NextResponse.json(FALLBACK_CARDS)
  }

  return NextResponse.json(data?.length ? data : FALLBACK_CARDS)
}
