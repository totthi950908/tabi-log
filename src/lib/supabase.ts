import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * 環境変数が設定されているか。App の接続確認画面で使う。
 */
export const hasSupabaseConfig = Boolean(url && anonKey)

export const supabase = createClient(url ?? '', anonKey ?? '', {
  // 推し活アプリと同じプロジェクトを共有するため、travel スキーマを既定にする。
  // ※ Supabase ダッシュボードの Settings > API > Exposed schemas に
  //    'travel' を追加しておくこと（ステップ2で実施）。
  db: { schema: 'travel' },
})
