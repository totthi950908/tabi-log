import { supabase } from '@/lib/supabase'
import type { Role } from '@/types'

export { listMembers } from '@/lib/expenses'

/** 招待リンクを発行し、共有用の完全な URL を返す（トークンはこの1回だけ取得可能）。 */
export async function createInvite(
  tripId: string,
  role: 'editor' | 'viewer',
  ttlDays: number,
  maxUses: number,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_invite', {
    p_trip_id: tripId,
    p_role: role,
    p_ttl_days: ttlDays,
    p_max_uses: maxUses,
  })
  if (error) throw error
  const token = data as string
  return `${window.location.origin}/join#${token}`
}

/**
 * トークンで招待を受諾し、参加した旅行の id を返す。
 *
 * RPC は失敗時に例外ではなく NULL を返す（例外だと受諾試行の失敗記録まで
 * ロールバックされ、レート制限が効かなくなるため）。ここで文言に変換する。
 * 「期限切れ」「存在しない」を区別しないのは、リンクの存在を探らせないため。
 */
export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invite', {
    p_token: token,
  })
  if (error) throw error
  const tripId = data as string | null
  if (!tripId) throw new Error('このリンクは使用できません')
  return tripId
}

export async function updateMemberRole(
  tripId: string,
  userId: string,
  role: Role,
): Promise<void> {
  const { error } = await supabase
    .from('trip_members')
    .update({ role })
    .eq('trip_id', tripId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function removeMember(
  tripId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId)
  if (error) throw error
}
