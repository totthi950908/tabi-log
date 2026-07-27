import { Link } from 'react-router-dom'
import { MapPin, Camera, Wallet } from 'lucide-react'
import type { Trip } from '@/types'
import type { TripStats } from '@/lib/trips'
import {
  dateRange,
  nights,
  yen,
  countryFlag,
  tripStatus,
  STATUS_META,
} from '@/utils/format'

// カバー写真が無いときのグラデーション（旅行idから決定的に選ぶ）
const GRADIENTS = [
  'from-sky-400 to-teal-400',
  'from-indigo-400 to-sky-400',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-500',
  'from-fuchsia-400 to-indigo-400',
]

function pickGradient(id: string): string {
  let h = 0
  for (const ch of id) h = (h + ch.charCodeAt(0)) % GRADIENTS.length
  return GRADIENTS[h]
}

export default function TripCard({
  trip,
  stats,
}: {
  trip: Trip
  stats?: TripStats
}) {
  const overseas = Boolean(trip.local_currency)
  const n = nights(trip.start_date, trip.end_date)
  const status = STATUS_META[tripStatus(trip.start_date, trip.end_date)]

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block rounded-2xl border border-border bg-surface overflow-hidden active:scale-[0.99] transition"
    >
      <div
        className={`h-24 bg-gradient-to-br ${pickGradient(trip.id)} relative flex items-end p-3`}
      >
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${status.cls}`}
          >
            {status.label}
          </span>
        </div>
        {overseas && (
          <span className="absolute top-2.5 right-2.5 text-lg">
            {countryFlag(trip.default_country)}
          </span>
        )}
        <h3 className="text-white font-bold text-lg drop-shadow-sm line-clamp-1">
          {trip.title}
        </h3>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{dateRange(trip.start_date, trip.end_date)}</span>
          <span className="text-subtle">・</span>
          <span>{n === 0 ? '日帰り' : `${n}泊${n + 1}日`}</span>
          {trip.destination && (
            <>
              <span className="text-subtle">・</span>
              <span className="flex items-center gap-0.5 line-clamp-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {trip.destination}
              </span>
            </>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted">
            <Camera className="w-4 h-4" />
            {stats?.logCount ?? 0}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Wallet className="w-4 h-4 text-accent3" />
            {yen(stats?.totalJpy ?? 0)}
          </span>
          {trip.budget != null && (
            <span className="text-xs text-subtle ml-auto">
              予算 {yen(trip.budget)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
