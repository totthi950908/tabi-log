import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Plane, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { listTrips, getTripStats, type TripStats } from '@/lib/trips'
import type { Profile, Trip } from '@/types'
import TripCard from '@/components/TripCard'
import { errMsg } from '@/utils/error'
import { tripStatus } from '@/utils/format'

type Segment = 'upcoming' | 'past'

export default function HomePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [stats, setStats] = useState<Record<string, TripStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [segment, setSegment] = useState<Segment>('upcoming')

  // これから（計画中・旅行中）は開始日が近い順、おわった（完了）は新しい順
  const { upcoming, past } = useMemo(() => {
    const up: Trip[] = []
    const pa: Trip[] = []
    for (const t of trips) {
      if (tripStatus(t.start_date, t.end_date) === 'past') pa.push(t)
      else up.push(t)
    }
    up.sort((a, b) => a.start_date.localeCompare(b.start_date))
    pa.sort((a, b) => b.start_date.localeCompare(a.start_date))
    return { upcoming: up, past: pa }
  }, [trips])

  const shown = segment === 'upcoming' ? upcoming : past

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => data && setProfile(data as Profile))

    Promise.all([listTrips(), getTripStats()])
      .then(([t, s]) => {
        setTrips(t)
        setStats(s)
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="max-w-md mx-auto px-5 pt-safe-top pb-nav-safe">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-surface2 flex items-center justify-center text-2xl">
          {profile?.emoji ?? '🧳'}
        </div>
        <div>
          <p className="text-xs text-muted">こんにちは</p>
          <p className="font-bold">{profile?.display_name ?? 'たびびと'} さん</p>
        </div>
      </div>

      <h1 className="mt-6 text-xl font-bold">旅行</h1>

      {/* これから / おわった の切替 */}
      <div className="mt-3 flex rounded-xl bg-surface2 p-1">
        <SegBtn
          active={segment === 'upcoming'}
          onClick={() => setSegment('upcoming')}
        >
          これから{upcoming.length > 0 && `（${upcoming.length}）`}
        </SegBtn>
        <SegBtn active={segment === 'past'} onClick={() => setSegment('past')}>
          おわった{past.length > 0 && `（${past.length}）`}
        </SegBtn>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-danger">{error}</p>
      ) : trips.length === 0 ? (
        <EmptyState />
      ) : shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          {segment === 'upcoming'
            ? 'これからの旅行はまだありません。'
            : 'おわった旅行はまだありません。'}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {shown.map((t) => (
            <TripCard key={t.id} trip={t} stats={stats[t.id]} />
          ))}
        </div>
      )}

      {/* 新規作成 FAB */}
      <Link
        to="/trips/new"
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full gradient-bg text-white flex items-center justify-center shadow-lg shadow-accent/30 active:scale-95 transition"
        aria-label="新しい旅行"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  )
}

function SegBtn({
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
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
        active ? 'bg-surface text-ink shadow-sm' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
        <Plane className="w-6 h-6 text-accent" />
      </div>
      <p className="mt-4 font-medium">まだ旅行がありません</p>
      <p className="mt-1 text-sm text-muted leading-relaxed">
        右下の＋ボタンから、<br />
        最初の旅行を作ってみましょう。
      </p>
    </div>
  )
}
