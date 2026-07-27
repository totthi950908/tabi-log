import { supabase } from '@/lib/supabase'

/** 自分のアカウントを完全に削除する（関連データも連鎖削除）。 */
export async function deleteOwnAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_own_account')
  if (error) throw error
  // 削除後はセッションを破棄してログイン画面へ戻す
  await supabase.auth.signOut()
}
