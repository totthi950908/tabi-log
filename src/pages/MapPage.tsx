import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import japanMap from '@svg-maps/japan'
import worldMap from '@svg-maps/world'
import { getVisited } from '@/lib/map'
import { errMsg } from '@/utils/error'
import { PREFECTURES, PREF_TO_ID } from '@/data/prefectures'
import { COUNTRIES, countryName } from '@/data/countries'
import { countryFlag } from '@/utils/format'
import SvgMap from '@/components/map/SvgMap'

type Tab = 'jp' | 'world'

export default function MapPage() {
  const [tab, setTab] = useState<Tab>('jp')
  const [prefs, setPrefs] = useState<Set<string>>(new Set())
  const [countries, setCountries] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getVisited()
      .then(({ prefectures, countries }) => {
        setPrefs(prefectures)
        setCountries(countries)
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [])

  // 都道府県名 → 地図の id 集合
  const visitedPrefIds = useMemo(() => {
    const s = new Set<string>()
    prefs.forEach((p) => {
      const id = PREF_TO_ID[p]
      if (id) s.add(id)
    })
    return s
  }, [prefs])

  // 国コード（大文字）→ 世界地図の id（小文字）集合
  const visitedCountryIds = useMemo(() => {
    const s = new Set<string>()
    countries.forEach((c) => s.add(c.toLowerCase()))
    return s
  }, [countries])

  const prefCount = PREFECTURES.filter((p) => prefs.has(p)).length
  const visitedCountries = [...countries].filter((c) => c !== 'JP')

  return (
    <div className="max-w-md mx-auto px-5 pt-safe-top pb-nav-safe">
      <h1 className="text-xl font-bold">マップ</h1>

      <div className="mt-3 flex rounded-xl bg-surface2 p-1">
        <TabBtn active={tab === 'jp'} onClick={() => setTab('jp')}>
          日本
        </TabBtn>
        <TabBtn active={tab === 'world'} onClick={() => setTab('world')}>
          世界
        </TabBtn>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-danger">{error}</p>
      ) : tab === 'jp' ? (
        <div className="mt-5">
          <Achievement value={prefCount} total={47} unit="都道府県" />
          <div className="mt-5 rounded-2xl border border-border bg-surface p-3">
            <SvgMap map={japanMap} visited={visitedPrefIds} />
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <Achievement value={visitedCountries.length} total={null} unit="か国" />
          <div className="mt-5 rounded-2xl border border-border bg-surface p-3">
            <SvgMap map={worldMap} visited={visitedCountryIds} />
          </div>
          {visitedCountries.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {orderCountries(visitedCountries).map((code) => (
                <div
                  key={code}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-3"
                >
                  <span className="text-2xl">{countryFlag(code)}</span>
                  <span className="text-sm font-medium line-clamp-1">
                    {countryName(code)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function orderCountries(visited: string[]): string[] {
  return [
    ...COUNTRIES.filter(
      (c) => c.code !== 'JP' && visited.includes(c.code),
    ).map((c) => c.code),
    ...visited.filter((c) => !COUNTRIES.some((x) => x.code === c)),
  ]
}

function Achievement({
  value,
  total,
  unit,
}: {
  value: number
  total: number | null
  unit: string
}) {
  const pct = total ? Math.round((value / total) * 100) : 0
  const r = 34
  const circ = 2 * Math.PI * r
  const dash = total ? (pct / 100) * circ : 0

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
          {total && (
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{value}</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold">
          {value}
          {total && <span className="text-base text-muted"> / {total}</span>}
          <span className="text-base text-muted ml-1">{unit}</span>
        </p>
        <p className="text-sm text-muted mt-0.5">
          {total ? `達成率 ${pct}%` : 'これまでに訪れた国'}
        </p>
      </div>
    </div>
  )
}

function TabBtn({
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
