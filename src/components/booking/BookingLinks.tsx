import { useState } from 'react'
import { Plane, Building2, ExternalLink } from 'lucide-react'
import Modal from '@/components/layout/Modal'
import {
  FLIGHT_PROVIDERS,
  HOTEL_PROVIDERS,
  type Provider,
  type BookingParams,
} from '@/config/bookingLinks'
import type { Trip } from '@/types'
import { countryName } from '@/data/countries'

/**
 * 予約を「まだ手配していない種類」だけ、さりげなく検索へ誘導する。
 * kinds で表示する種類を指定する（空なら何も出さない）。
 * アプリ内では予約せず、行き先・日付・人数を渡して外部サイトへ送客する。
 */
export default function BookingLinks({
  trip,
  kinds,
}: {
  trip: Trip
  kinds: ('flight' | 'hotel')[]
}) {
  const [sheet, setSheet] = useState<null | 'flight' | 'hotel'>(null)

  const destination =
    trip.destination?.trim() ||
    countryName(trip.default_country) ||
    ''

  if (kinds.length === 0) return null

  return (
    <section>
      <div className={`grid gap-2 ${kinds.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {kinds.includes('flight') && (
          <button
            onClick={() => setSheet('flight')}
            className="rounded-2xl border border-dashed border-border bg-surface p-3 flex items-center gap-2 active:scale-[0.99] transition"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Plane className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-medium">航空券を探す</span>
          </button>
        )}
        {kinds.includes('hotel') && (
          <button
            onClick={() => setSheet('hotel')}
            className="rounded-2xl border border-dashed border-border bg-surface p-3 flex items-center gap-2 active:scale-[0.99] transition"
          >
            <div className="w-9 h-9 rounded-xl bg-accent2/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent2" />
            </div>
            <span className="text-sm font-medium">宿を探す</span>
          </button>
        )}
      </div>

      {sheet && (
        <ProviderSheet
          kind={sheet}
          title={sheet === 'flight' ? '航空券を探す' : '宿を探す'}
          providers={sheet === 'flight' ? FLIGHT_PROVIDERS : HOTEL_PROVIDERS}
          destination={destination}
          trip={trip}
          onClose={() => setSheet(null)}
        />
      )}
    </section>
  )
}

/** 「パリ、ローマ・バルセロナ」などを都市の配列に分解する。 */
function splitCities(s: string): string[] {
  return s
    .split(/[、，,・/／\n]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function ProviderSheet({
  kind,
  title,
  providers,
  destination,
  trip,
  onClose,
}: {
  kind: 'flight' | 'hotel'
  title: string
  providers: Provider[]
  destination: string
  trip: Trip
  onClose: () => void
}) {
  const [people, setPeople] = useState(2)
  const cities = splitCities(destination)
  const [city, setCity] = useState(cities[0] ?? destination)
  const [startDate, setStartDate] = useState(trip.start_date)
  const [endDate, setEndDate] = useState(trip.end_date)

  const params: BookingParams = {
    destination: city,
    startDate,
    endDate,
    people,
  }

  const startLabel = kind === 'flight' ? '出発日' : 'チェックイン'
  const endLabel = kind === 'flight' ? '帰りの日' : 'チェックアウト'
  const dateCls =
    'w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent'

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        {/* 日付（周遊では都市ごとに変えられる） */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1">
              {startLabel}
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (endDate < e.target.value) setEndDate(e.target.value)
              }}
              className={dateCls}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1">
              {endLabel}
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={dateCls}
            />
          </label>
        </div>

        {/* 都市の選択（周遊で複数ある場合） */}
        {cities.length > 1 && (
          <div>
            <span className="block text-sm font-medium text-muted mb-2">
              どの都市を探しますか？
            </span>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    city === c
                      ? 'gradient-bg text-white font-medium'
                      : 'bg-surface2 text-muted'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {cities.length <= 1 && (
          <p className="text-sm text-muted">
            行き先 <span className="text-ink font-medium">{city || '（未設定）'}</span>
          </p>
        )}

        {/* 人数 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">人数（大人）</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPeople((n) => Math.max(1, n - 1))}
              className="w-8 h-8 rounded-full bg-surface2 text-lg"
            >
              −
            </button>
            <span className="w-6 text-center font-medium">{people}</span>
            <button
              onClick={() => setPeople((n) => Math.min(8, n + 1))}
              className="w-8 h-8 rounded-full bg-surface2 text-lg"
            >
              ＋
            </button>
          </div>
        </div>

        {/* 提携先リンク */}
        <div className="space-y-2">
          {providers.map((p) => (
            <a
              key={p.id}
              href={p.build(params)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-3.5 active:scale-[0.99] transition"
            >
              <div>
                <p className="font-medium">{p.label}</p>
                {p.note && <p className="text-xs text-muted mt-0.5">{p.note}</p>}
              </div>
              <ExternalLink className="w-4 h-4 text-muted" />
            </a>
          ))}
        </div>

        <p className="text-xs text-subtle leading-relaxed">
          ⚠️ 外部サイト（PR）へ移動します。予約・支払いは各サイト上で行われます。当アプリは予約情報を受け取りません。
        </p>
      </div>
    </Modal>
  )
}
