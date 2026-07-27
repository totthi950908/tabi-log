import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle, Plane } from 'lucide-react'
import { acceptInvite } from '@/lib/members'
import { errMsg } from '@/utils/error'

type State =
  | { s: 'working' }
  | { s: 'ok' }
  | { s: 'error'; message: string }

/**
 * 招待受諾ページ。トークンは URL のハッシュ（/join#<token>）で受け取る。
 * ハッシュにするのは、Referer やサーバーログにトークンを残さないため。
 */
export default function JoinPage() {
  const [state, setState] = useState<State>({ s: 'working' })
  const navigate = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    // トークンはハッシュ優先、無ければ保存しておいたものを使う
    let token = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (!token) {
      try {
        token = localStorage.getItem('pending_invite') ?? ''
      } catch {
        /* ignore */
      }
    }
    const clearPending = () => {
      try {
        localStorage.removeItem('pending_invite')
      } catch {
        /* ignore */
      }
    }

    if (!token) {
      setState({ s: 'error', message: 'リンクが正しくありません。' })
      return
    }

    acceptInvite(token)
      .then((tripId) => {
        clearPending()
        setState({ s: 'ok' })
        // ハッシュを消してから旅行へ
        window.history.replaceState(null, '', '/join')
        setTimeout(() => navigate(`/trips/${tripId}`, { replace: true }), 800)
      })
      .catch((e) => {
        clearPending()
        setState({ s: 'error', message: errMsg(e) })
      })
  }, [navigate])

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center">
        <Plane className="w-7 h-7 text-white" />
      </div>

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        {state.s === 'working' && (
          <div className="flex flex-col items-center gap-3 text-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">旅行に参加しています…</p>
          </div>
        )}
        {state.s === 'ok' && (
          <div className="flex flex-col items-center gap-3 text-accent2">
            <CheckCircle2 className="w-8 h-8" />
            <p className="text-sm font-medium">参加しました！移動します…</p>
          </div>
        )}
        {state.s === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-8 h-8 text-danger" />
            <p className="text-sm text-danger">{state.message}</p>
            <Link to="/" className="text-sm text-accent font-medium mt-1">
              ホームへ
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
