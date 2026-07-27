import { useEffect, useState } from 'react'
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from 'react-router-dom'
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Loader2,
  Map as MapIcon,
  Camera,
  Wallet,
  PieChart,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getTrip, deleteTrip, getMyRole } from '@/lib/trips'
import type { Trip, Role } from '@/types'
import { jpDate, nights, yen, countryFlag } from '@/utils/format'
import { countryName } from '@/data/countries'
import { errMsg } from '@/utils/error'
import ItineraryTab from '@/components/itinerary/ItineraryTab'
import LogsTab from '@/components/logs/LogsTab'
import ExpensesTab from '@/components/expenses/ExpensesTab'
import SummaryTab from '@/components/expenses/SummaryTab'
import MembersTab from '@/components/members/MembersTab'

type TabKey = 'plan' | 'logs' | 'expenses' | 'summary' | 'members'

const TABS: { key: TabKey; label: string; icon: typeof Camera }[] = [
  { key: 'plan', label: 'しおり', icon: MapIcon },
  { key: 'logs', label: '記録', icon: Camera },
  { key: 'expenses', label: '支出', icon: Wallet },
  { key: 'summary', label: '集計', icon: PieChart },
  { key: 'members', label: '仲間', icon: Users },
]

export default function TripDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as TabKey) || 'plan'

  const [trip, setTrip] = useState<Trip | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (!id) return
    getTrip(id)
      .then((t) => setTrip(t))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false))
    if (user) getMyRole(id, user.id).then(setRole)
  }, [id, user])

  async function handleDelete() {
    if (!id) return
    await deleteTrip(id)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="max-w-md mx-auto px-5 pt-safe-top">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted">
          <ChevronLeft className="w-4 h-4" /> ホームへ
        </Link>
        <p className="mt-6 text-sm text-danger">
          {error ?? '旅行が見つかりませんでした。'}
        </p>
      </div>
    )
  }

  const isOwner = trip.owner_id === user?.id
  const overseas = Boolean(trip.local_currency)
  const n = nights(trip.start_date, trip.end_date)

  return (
    <div className="max-w-md mx-auto pb-nav-safe">
      {/* ヘッダー画像 */}
      <div className="relative h-40 gradient-bg flex items-end">
        <div className="absolute inset-0 pt-safe-top px-5 flex items-start justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-black/20 text-white flex items-center justify-center backdrop-blur"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {isOwner && (
            <div className="flex gap-2">
              <Link
                to={`/trips/${trip.id}/edit`}
                className="w-9 h-9 rounded-full bg-black/20 text-white flex items-center justify-center backdrop-blur"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setConfirmDel(true)}
                className="w-9 h-9 rounded-full bg-black/20 text-white flex items-center justify-center backdrop-blur"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="px-5 pb-4 text-white">
          {overseas && (
            <span className="text-sm">
              {countryFlag(trip.default_country)} {countryName(trip.default_country)}
            </span>
          )}
          <h1 className="text-2xl font-bold drop-shadow-sm">{trip.title}</h1>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
          <Row label="日程">
            {jpDate(trip.start_date)} 〜 {jpDate(trip.end_date)}（
            {n === 0 ? '日帰り' : `${n}泊${n + 1}日`}）
          </Row>
          {trip.destination && <Row label="行き先">{trip.destination}</Row>}
          {trip.budget != null && <Row label="予算">{yen(trip.budget)}</Row>}
          {overseas && (
            <Row label="為替レート">
              1 {trip.local_currency} = {trip.exchange_rate} 円
            </Row>
          )}
          {trip.memo && <Row label="メモ">{trip.memo}</Row>}
        </div>
      </div>

      {/* タブ */}
      <div className="px-5 mt-5">
        <div className="flex rounded-xl bg-surface2 p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setParams({ tab: key })}
              className={`flex-1 rounded-lg py-2 text-xs font-medium flex flex-col items-center gap-1 transition ${
                tab === key ? 'bg-surface text-accent shadow-sm' : 'text-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* タブ中身 */}
      <div className="px-5 mt-5">
        {tab === 'plan' ? (
          <ItineraryTab
            trip={trip}
            userId={user?.id ?? ''}
            canEdit={role === 'owner' || role === 'editor'}
          />
        ) : tab === 'logs' ? (
          <LogsTab
            trip={trip}
            userId={user?.id ?? ''}
            isOwner={isOwner}
            canEdit={role === 'owner' || role === 'editor'}
          />
        ) : tab === 'expenses' ? (
          <ExpensesTab
            trip={trip}
            userId={user?.id ?? ''}
            isOwner={isOwner}
            canEdit={role === 'owner' || role === 'editor'}
          />
        ) : tab === 'summary' ? (
          <SummaryTab trip={trip} />
        ) : (
          <MembersTab trip={trip} userId={user?.id ?? ''} isOwner={isOwner} />
        )}
      </div>

      {/* 削除確認 */}
      {confirmDel && (
        <ConfirmDialog
          title="この旅行を削除しますか？"
          message="記録・支出・メンバーもすべて削除され、元に戻せません。"
          onCancel={() => setConfirmDel(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="w-20 shrink-0 text-muted">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  )
}

function ConfirmDialog({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold">{title}</h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              setBusy(true)
              onConfirm()
            }}
            disabled={busy}
            className="flex-1 rounded-xl bg-danger text-white py-3 text-sm font-medium flex items-center justify-center disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : '削除する'}
          </button>
        </div>
      </div>
    </div>
  )
}
