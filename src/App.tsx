import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AuthPage from '@/pages/AuthPage'
import HomePage from '@/pages/HomePage'
import TripFormPage from '@/pages/TripFormPage'
import TripDetailPage from '@/pages/TripDetailPage'
import MapPage from '@/pages/MapPage'
import SettingsPage from '@/pages/SettingsPage'
import JoinPage from '@/pages/JoinPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import BottomNav from '@/components/layout/BottomNav'

export default function App() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  // 招待リンクを未ログインで開いた場合、トークンを保存しておく。
  // 新規登録＋メール確認でアプリ root に戻ってきてもトークンを失わないようにする。
  useEffect(() => {
    if (window.location.pathname === '/join') {
      const token = window.location.hash.replace(/^#/, '')
      if (token) {
        try {
          localStorage.setItem('pending_invite', token)
        } catch {
          /* ignore */
        }
      }
    }
  }, [])

  // ログイン後、保留中の招待があれば受諾ページへ回す。
  useEffect(() => {
    if (!session) return
    let pending: string | null = null
    try {
      pending = localStorage.getItem('pending_invite')
    } catch {
      /* ignore */
    }
    if (pending && window.location.pathname !== '/join') {
      navigate('/join', { replace: true })
    }
  }, [session, navigate])

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  // 未ログイン：認証画面のみ
  if (!session) {
    return <AuthPage />
  }

  // ログイン済み：アプリ本体
  return (
    <div className="min-h-full">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trips/new" element={<TripFormPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/trips/:id/edit" element={<TripFormPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
