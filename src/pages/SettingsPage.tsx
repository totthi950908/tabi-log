import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Loader2, Check, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { deleteOwnAccount } from '@/lib/account'
import { errMsg } from '@/utils/error'
import type { Profile } from '@/types'

const EMOJI_CHOICES = [
  '🧳', '✈️', '🗺️', '🏔️', '🏖️', '⛩️', '🌏', '📷',
  '🚗', '🚅', '🧭', '🎒', '🌸', '🍜', '☕', '🐶',
]

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [emoji, setEmoji] = useState('🧳')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        if (data) {
          setProfile(data as Profile)
          setDisplayName(data.display_name)
          setEmoji(data.emoji)
        }
        setLoading(false)
      })
  }, [user])

  async function save() {
    if (!user) return
    setSaving(true)
    setSaved(false)
    setError(null)
    // トリガーで profiles 行は既に存在するため upsert で安全に更新。
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: displayName.trim() || 'たびびと',
      emoji,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-safe-top pb-nav-safe">
      <h1 className="text-xl font-bold">設定</h1>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-muted">プロフィール</h2>

        <div className="mt-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center text-3xl">
            {emoji}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted mb-1">
              表示名
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder="たびびと"
            />
          </div>
        </div>

        <label className="block text-xs font-medium text-muted mt-5 mb-2">
          アイコン（絵文字）
        </label>
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`aspect-square rounded-xl text-xl flex items-center justify-center transition ${
                emoji === e
                  ? 'bg-accent/10 ring-2 ring-accent'
                  : 'bg-surface2 hover:bg-border'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 w-full rounded-xl gradient-bg text-white font-medium py-3 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-5 h-5" /> 保存しました
            </>
          ) : (
            '保存'
          )}
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">ログイン中</p>
        <p className="text-sm font-medium break-all">{user?.email}</p>
        <button
          onClick={signOut}
          className="mt-4 w-full rounded-xl border border-border text-danger font-medium py-3 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> ログアウト
        </button>
      </section>

      {/* 危険ゾーン */}
      <section className="mt-4 rounded-2xl border border-danger/30 bg-surface p-5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <AlertTriangle className="w-4 h-4" /> アカウントの削除
        </p>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          アカウントを削除すると、あなたが作成した記録・支出・作成した旅行などがすべて削除され、元に戻せません。
        </p>
        <button
          onClick={() => setConfirmDel(true)}
          className="mt-4 w-full rounded-xl bg-danger/10 text-danger font-medium py-3"
        >
          アカウントを削除する
        </button>
      </section>

      <div className="mt-4 flex justify-center gap-4 text-sm text-muted">
        <button onClick={() => navigate('/contact')} className="underline">
          お問い合わせ・ご要望
        </button>
        <button onClick={() => navigate('/privacy')} className="underline">
          プライバシーポリシー
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-subtle">たびろぐ</p>

      {/* profile は将来のヘッダー表示等で使う想定（未使用警告回避のため参照） */}
      <span className="hidden">{profile?.user_id}</span>

      {confirmDel && (
        <DeleteAccountDialog onClose={() => setConfirmDel(false)} />
      )}
    </div>
  )
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const CONFIRM = '削除'

  async function doDelete() {
    setBusy(true)
    setError(null)
    try {
      await deleteOwnAccount()
      // signOut 済み。onAuthStateChange でログイン画面へ戻る。
    } catch (e) {
      setError(errMsg(e))
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-danger flex items-center gap-1.5">
          <AlertTriangle className="w-5 h-5" /> 本当に削除しますか？
        </h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          この操作は取り消せません。確認のため、下の欄に「{CONFIRM}」と入力してください。
        </p>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={CONFIRM}
          className="mt-3 w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-danger"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={doDelete}
            disabled={busy || text !== CONFIRM}
            className="flex-1 rounded-xl bg-danger text-white py-3 text-sm font-medium flex items-center justify-center disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : '完全に削除'}
          </button>
        </div>
      </div>
    </div>
  )
}
