import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

// プロフィール行が無ければ作る（自動作成トリガーより前に作られた既存ユーザー対策）。
// 既に在れば何もしない（ignoreDuplicates）。
async function ensureProfile(userId: string) {
  await supabase
    .from('profiles')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初回：現在のセッションを取得（メール確認リンクからの復帰も含む）
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) ensureProfile(data.session.user.id)
      setLoading(false)
    })

    // 以降：ログイン/ログアウト/トークン更新を監視
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) ensureProfile(s.user.id)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    loading,
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth は AuthProvider の中で使ってください')
  return ctx
}
