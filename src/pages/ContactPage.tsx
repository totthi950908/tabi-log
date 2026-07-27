import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react'

const CATEGORIES = ['バグ報告', '機能のご要望', '使い方のご質問', 'その他']

/**
 * お問い合わせフォーム。Formspree に送信する。
 * onBack があればそれを、なければブラウザ履歴を戻る（ルート表示用）。
 */
export default function ContactPage({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate()
  const back = onBack ?? (() => navigate(-1))

  const [category, setCategory] = useState(CATEGORIES[0])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const formId = import.meta.env.VITE_FORMSPREE_ID as string | undefined

  async function submit() {
    setError('')
    if (!message.trim()) {
      setError('メッセージを入力してください。')
      return
    }
    if (!formId) {
      setError('フォームの設定が完了していません（管理者向け：VITE_FORMSPREE_ID 未設定）。')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          アプリ: 'たびろぐ',
          種別: category,
          お名前: name || '（未入力）',
          返信先メール: email || '（未入力）',
          メッセージ: message,
        }),
      })
      if (res.ok) setSent(true)
      else setError('送信に失敗しました。しばらく経ってからお試しください。')
    } catch {
      setError('送信に失敗しました。通信環境をご確認ください。')
    }
    setLoading(false)
  }

  const inputCls =
    'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-accent'

  return (
    <div className="max-w-md mx-auto px-5 pt-safe-top pb-nav-safe">
      <div className="flex items-center gap-2">
        <button
          onClick={back}
          className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center text-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">お問い合わせ・ご要望</h1>
      </div>

      {sent ? (
        <div className="mt-10 flex flex-col items-center text-center gap-3">
          <CheckCircle2 className="w-14 h-14 text-accent2" />
          <h2 className="text-lg font-bold">送信しました</h2>
          <p className="text-sm text-muted leading-relaxed">
            ありがとうございます。<br />
            返信先メールをご記入いただいた場合、内容を確認のうえご連絡します。
          </p>
          <button
            onClick={back}
            className="mt-4 rounded-xl border border-border px-6 py-3 text-sm font-medium"
          >
            戻る
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            バグ報告・機能のご要望・ご質問など、お気軽にお送りください。
          </p>

          <div>
            <span className="block text-sm font-medium text-muted mb-2">種別</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                    category === c
                      ? 'bg-accent/10 ring-2 ring-accent text-accent'
                      : 'bg-surface2 text-muted'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-muted mb-1">
              お名前 <span className="text-subtle font-normal">（任意）</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-muted mb-1">
              返信先メール <span className="text-subtle font-normal">（任意）</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="返信が必要な場合はご記入ください"
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-muted mb-1">
              メッセージ<span className="text-danger ml-0.5">*</span>
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className={inputCls}
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl gradient-bg text-white font-medium py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '送信する'}
          </button>

          <p className="text-xs text-subtle text-center">
            送信により
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="underline mx-0.5"
            >
              プライバシーポリシー
            </button>
            に同意したものとみなします。
          </p>
        </div>
      )}
    </div>
  )
}
