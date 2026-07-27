import { supabase } from '@/lib/supabase'
import type { Trip, Role } from '@/types'

/** 自分のこの旅行での権限（owner/editor/viewer）。メンバーでなければ null。 */
export async function getMyRole(
  tripId: string,
  userId: string,
): Promise<Role | null> {
  const { data } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as { role: Role } | null)?.role ?? null
}

export type TripInput = {
  title: string
  destination: string | null
  start_date: string
  end_date: string
  budget: number | null
  default_country: string
  local_currency: string | null
  exchange_rate: number | null
  memo: string | null
}

export type TripStats = { logCount: number; totalJpy: number }

/** 旅行一覧（開始日が新しい順）。 */
export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Trip[]
}

/** 一覧カード用の集計（記録数・円換算総額）をまとめて取得。 */
export async function getTripStats(): Promise<Record<string, TripStats>> {
  const stats: Record<string, TripStats> = {}

  const [{ data: logs }, { data: exp }] = await Promise.all([
    supabase.from('logs').select('trip_id'),
    supabase.from('expenses_jpy').select('trip_id, amount_jpy'),
  ])

  for (const l of logs ?? []) {
    const id = (l as { trip_id: string }).trip_id
    stats[id] = stats[id] ?? { logCount: 0, totalJpy: 0 }
    stats[id].logCount += 1
  }
  for (const e of exp ?? []) {
    const row = e as { trip_id: string; amount_jpy: number }
    stats[row.trip_id] = stats[row.trip_id] ?? { logCount: 0, totalJpy: 0 }
    stats[row.trip_id].totalJpy += Number(row.amount_jpy) || 0
  }
  return stats
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Trip) ?? null
}

export async function createTrip(input: TripInput, ownerId: string): Promise<string> {
  // ID をクライアントで発番して渡す。
  // こうすると INSERT の RETURNING（＝挿入直後の読み戻し）が不要になり、
  // 「作成直後は自分がまだメンバー扱いにならず読めない」系の RLS 問題を回避できる。
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : undefined
  const { error } = await supabase
    .from('trips')
    .insert({ ...input, ...(id ? { id } : {}), owner_id: ownerId })
  if (error) throw error
  if (id) return id
  // フォールバック：id 未発番環境では作成直後の1件を引く
  const { data } = await supabase
    .from('trips')
    .select('id')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? ''
}

export async function updateTrip(id: string, input: TripInput): Promise<void> {
  const { error } = await supabase.from('trips').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw error
}
