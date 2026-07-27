import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { errMsg } from '@/utils/error'

/**
 * パスワード再設定ページ。
 * メールの再設定リンクから来ると Supabase が一時セッションを張るので、
 * updateUser で新しいパスワードを設定できる。
 */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const rules = [
    { ok: /[a-z]/.test(password) },
    { ok: /[A-Z]/.test(password) },
    { ok: /[0-9]/.test(password) },
    { ok: /[^a-zA-Z0-9]/.test(password) },
    { ok: password.length >= 6 },
  ]
  const valid = rules.every((r) => r.ok)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => navigate('/', { replace: true }), 1200)
    } catch (err) {
      setError(translate(err))
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6">
      <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center">
        <Plane className="w-7 h-7 text-white" />
      </div>
      <h1 className="mt-4 text-2xl font-bold gradient-text">たびろぐ</h1>

      <div className="mt-6 w-full max-w-sm">
        {done ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-accent2 mx-auto" />
            <p className="mt-3 font-medium">パスワードを変更しました</p>
            <p className="mt-1 text-sm text-muted">ホームに移動します…</p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <h2 className="font-bold text-lg">新しいパスワード</h2>
            <p className="mt-1 mb-4 text-sm text-muted">
              英大文字・小文字・数字・記号を含む6文字以上。
            </p>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
              placeholder="新しいパスワード"
            />

            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {[
                { label: '英小文字', ok: rules[0].ok },
                { label: '英大文字', ok: rules[1].ok },
                { label: '数字', ok: rules[2].ok },
                { label: '記号', ok: rules[3].ok },
                { label: '6文字以上', ok: rules[4].ok },
              ].map((r) => (
                <li
                  key={r.label}
                  className={`flex items-center gap-1.5 text-xs ${
                    r.ok ? 'text-accent2' : 'text-subtle'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      r.ok ? 'bg-accent2 text-white' : 'bg-surface2'
                    }`}
                  >
                    {r.ok ? '✓' : ''}
                  </span>
                  {r.label}
                </li>
              ))}
            </ul>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={busy || !valid}
              className="mt-5 w-full rounded-xl gradient-bg text-white font-medium py-3 flex items-center justify-center disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'パスワードを変更'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function translate(err: unknown): string {
  const msg = errMsg(err)
  if (/at least one character of each/i.test(msg))
    return 'パスワードには、英小文字・英大文字・数字・記号をそれぞれ1文字以上含めてください。'
  if (/should be at least/i.test(msg)) return 'パスワードが短すぎます。'
  if (/New password should be different/i.test(msg))
    return '今までと違うパスワードにしてください。'
  return msg
}
