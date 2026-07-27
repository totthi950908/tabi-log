import { supabase } from '@/lib/supabase'
import type { ExpenseJpy, TripMember, Profile } from '@/types'

export type ExpenseInput = {
  spent_on: string
  category: ExpenseJpy['category']
  amount: number
  currency: string
  payer_id: string
  memo: string | null
}

/** 支出一覧（円換算額つき、日付の新しい順）。 */
export async function listExpenses(tripId: string): Promise<ExpenseJpy[]> {
  const { data, error } = await supabase
    .from('expenses_jpy')
    .select('*')
    .eq('trip_id', tripId)
    .order('spent_on', { ascending: false })
  if (error) throw error
  return (data ?? []).map((e) => ({
    ...(e as ExpenseJpy),
    amount: Number((e as ExpenseJpy).amount),
    amount_jpy: Number((e as ExpenseJpy).amount_jpy),
  }))
}

export async function createExpense(
  tripId: string,
  authorId: string,
  input: ExpenseInput,
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .insert({ ...input, trip_id: tripId, author_id: authorId })
  if (error) throw error
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
): Promise<void> {
  const { error } = await supabase.from('expenses').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

/** 支払者選択・集計用に、旅行のメンバー（プロフィールつき）を取得。 */
export async function listMembers(tripId: string): Promise<TripMember[]> {
  const { data: members, error } = await supabase
    .from('trip_members')
    .select('user_id, role')
    .eq('trip_id', tripId)
  if (error) throw error
  const rows = (members ?? []) as { user_id: string; role: TripMember['role'] }[]

  const ids = rows.map((m) => m.user_id)
  const map: Record<string, Profile> = {}
  if (ids.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', ids)
    for (const p of (profs ?? []) as Profile[]) map[p.user_id] = p
  }

  return rows.map((m) => ({
    user_id: m.user_id,
    role: m.role,
    display_name: map[m.user_id]?.display_name ?? 'たびびと',
    emoji: map[m.user_id]?.emoji ?? '🧳',
  }))
}
