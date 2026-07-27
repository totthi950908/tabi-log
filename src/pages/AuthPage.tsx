import { useState, type FormEvent } from 'react'
import { Plane, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'forgot'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [resetSentTo, setResetSentTo] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset`,
        })
        if (error) throw error
        setResetSentTo(email)
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        // メール確認オンのため、この時点ではまだログインされない。
        setSentTo(email)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // 成功すると onAuthStateChange が発火し、画面が切り替わる。
      }
    } catch (err) {
      setError(translateError(err))
    } finally {
      setBusy(false)
    }
  }

  // ---- 確認メール送信後の案内画面 ----
  if (sentTo) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent2/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-accent2" />
          </div>
          <h2 className="mt-4 font-bold text-lg">確認メールを送りました</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            <span className="text-ink font-medium break-all">{sentTo}</span>{' '}
            宛のメールを開いて、確認リンクをタップしてください。リンクを開くと自動でログインされます。
          </p>
          <button
            onClick={() => {
              setSentTo(null)
              setMode('login')
            }}
            className="mt-6 text-sm text-accent font-medium"
          >
            ログイン画面に戻る
          </button>
        </div>
      </Shell>
    )
  }

  // ---- リセットメール送信後の案内画面 ----
  if (resetSentTo) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-accent" />
          </div>
          <h2 className="mt-4 font-bold text-lg">再設定メールを送りました</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            <span className="text-ink font-medium break-all">{resetSentTo}</span>{' '}
            宛のメールを開いて、リンクをタップすると新しいパスワードを設定できます。
          </p>
          <button
            onClick={() => {
              setResetSentTo(null)
              setMode('login')
            }}
            className="mt-6 text-sm text-accent font-medium"
          >
            ログイン画面に戻る
          </button>
        </div>
      </Shell>
    )
  }

  // ---- パスワード再設定リクエスト画面 ----
  if (mode === 'forgot') {
    return (
      <Shell>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <h2 className="font-bold text-lg">パスワードの再設定</h2>
          <p className="mt-1 mb-5 text-sm text-muted leading-relaxed">
            登録したメールアドレスに、再設定用のリンクを送ります。
          </p>

          <label className="block text-sm font-medium text-muted mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder="you@example.com"
          />

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-xl gradient-bg text-white font-medium py-3 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : '再設定メールを送る'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className="mt-4 w-full text-sm text-accent font-medium"
          >
            ログイン画面に戻る
          </button>
        </form>
      </Shell>
    )
  }

  // ---- ログイン / 新規登録フォーム ----
  return (
    <Shell>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <div className="flex rounded-xl bg-surface2 p-1 mb-6">
          <TabButton active={mode === 'login'} onClick={() => setMode('login')}>
            ログイン
          </TabButton>
          <TabButton active={mode === 'signup'} onClick={() => setMode('signup')}>
            新規登録
          </TabButton>
        </div>

        <label className="block text-sm font-medium text-muted mb-1">
          メールアドレス
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
          placeholder="you@example.com"
        />

        <label className="block text-sm font-medium text-muted mb-1 mt-4">
          パスワード
        </label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
          placeholder={mode === 'signup' ? '英大文字・小文字・数字・記号を含む' : 'パスワード'}
        />

        {mode === 'signup' && <PasswordChecklist value={password} />}

        {error && (
          <p className="mt-3 text-sm text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl gradient-bg text-white font-medium py-3 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : mode === 'login' ? (
            'ログイン'
          ) : (
            'この内容で登録'
          )}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setMode('forgot')
              setError(null)
            }}
            className="mt-4 w-full text-sm text-muted"
          >
            パスワードをお忘れですか？
          </button>
        )}

        {mode === 'signup' && (
          <p className="mt-3 text-xs text-subtle flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            登録後、確認メールのリンクをタップするとログインできます。
          </p>
        )}
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6">
      <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-accent/20">
        <Plane className="w-7 h-7 text-white" strokeWidth={2.2} />
      </div>
      <h1 className="mt-4 text-2xl font-bold gradient-text">たびろぐ</h1>
      <p className="mt-1 text-xs text-muted">旅の記録と旅費を、旅行ごとに</p>
      <div className="mt-6 w-full max-w-sm">{children}</div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
        active ? 'bg-surface text-ink shadow-sm' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}

function PasswordChecklist({ value }: { value: string }) {
  const rules = [
    { label: '英小文字（a〜z）', ok: /[a-z]/.test(value) },
    { label: '英大文字（A〜Z）', ok: /[A-Z]/.test(value) },
    { label: '数字（0〜9）', ok: /[0-9]/.test(value) },
    { label: '記号（! @ # など）', ok: /[^a-zA-Z0-9]/.test(value) },
    { label: '6文字以上', ok: value.length >= 6 },
  ]
  return (
    <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
      {rules.map((r) => (
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
  )
}

function translateError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/Invalid login credentials/i.test(msg))
    return 'メールアドレスまたはパスワードが違います。'
  if (/Email not confirmed/i.test(msg))
    return 'メール確認がまだです。届いた確認メールのリンクをタップしてください。'
  if (/User already registered/i.test(msg))
    return 'このメールアドレスは登録済みです。ログインをお試しください。'
  if (/Password should contain at least one character of each/i.test(msg))
    return 'パスワードには、英小文字・英大文字・数字・記号をそれぞれ1文字以上含めてください。（例：Tabi2026!）'
  if (/Password should be at least/i.test(msg)) {
    const n = msg.match(/at least (\d+)/i)?.[1] ?? '6'
    return `パスワードは${n}文字以上にしてください。`
  }
  if (/Password is too weak|weak password/i.test(msg))
    return 'パスワードが単純すぎます。英大文字・小文字・数字・記号を組み合わせてください。'
  if (/rate limit|too many requests/i.test(msg))
    return '試行が多すぎます。しばらく待ってから再度お試しください。'
  return msg
}
