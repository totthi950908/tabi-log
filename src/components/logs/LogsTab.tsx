import { useEffect, useState } from 'react'
import { Plus, Loader2, Star, MapPin } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Trip, VisitLog, Profile } from '@/types'
import { listLogs, profilesByIds, signedUrls } from '@/lib/logs'
import { errMsg } from '@/utils/error'
import { countryFlag } from '@/utils/format'
import { countryName } from '@/data/countries'
import LogForm, { LOG_CATEGORIES } from './LogForm'

export default function LogsTab({
  trip,
  userId,
  isOwner,
  canEdit,
}: {
  trip: Trip
  userId: string
  isOwner: boolean
  canEdit: boolean
}) {
  const [logs, setLogs] = useState<VisitLog[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<{ editing: VisitLog | null } | null>(null)

  async function reload() {
    try {
      const l = await listLogs(trip.id)
      setLogs(l)
      setProfiles(await profilesByIds(l.map((x) => x.author_id)))
      const paths = l
        .map((x) => x.photo_path)
        .filter((p): p is string => Boolean(p))
      setPhotoUrls(await signedUrls(paths))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id])

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  if (error) return <p className="text-sm text-danger">{error}</p>

  // 日付ごとにグループ化（時系列）
  const groups: { date: string; items: VisitLog[] }[] = []
  for (const log of logs) {
    const d = log.visited_at.slice(0, 10)
    const g = groups.find((x) => x.date === d)
    if (g) g.items.push(log)
    else groups.push({ date: d, items: [log] })
  }

  return (
    <div>
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <div className="mx-auto w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <p className="mt-3 text-sm text-muted">
            訪れた場所を記録して、旅の思い出を残しましょう。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-accent">
                  {format(parseISO(g.date), 'M月d日(E)', { locale: ja })}
                </span>
                <span className="text-xs text-subtle">{g.items.length}件</span>
              </div>
              <div className="space-y-2">
                {g.items.map((log) => (
                  <LogCard
                    key={log.id}
                    log={log}
                    author={profiles[log.author_id]}
                    photoUrl={log.photo_path ? photoUrls[log.photo_path] : undefined}
                    onClick={
                      canEdit && (log.author_id === userId || isOwner)
                        ? () => setForm({ editing: log })
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <button
          onClick={() => setForm({ editing: null })}
          className="mt-4 w-full rounded-xl border border-dashed border-border text-sm text-accent py-2.5 flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" /> 記録を追加
        </button>
      )}

      {form && (
        <LogForm
          tripId={trip.id}
          userId={userId}
          defaultCountry={trip.default_country}
          defaultDate={trip.start_date}
          existingSignedUrl={
            form.editing?.photo_path
              ? photoUrls[form.editing.photo_path]
              : undefined
          }
          editing={form.editing}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function LogCard({
  log,
  author,
  photoUrl,
  onClick,
}: {
  log: VisitLog
  author?: Profile
  photoUrl?: string
  onClick?: () => void
}) {
  const cat = LOG_CATEGORIES.find((c) => c.key === log.category)
  const time = format(parseISO(log.visited_at), 'HH:mm')
  const place =
    log.country_code === 'JP'
      ? log.prefecture ?? ''
      : `${countryFlag(log.country_code)} ${countryName(log.country_code)}`

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border bg-surface overflow-hidden ${
        onClick ? 'cursor-pointer active:scale-[0.99] transition' : ''
      }`}
    >
      {photoUrl && (
        <img src={photoUrl} alt="" className="w-full h-40 object-cover" />
      )}
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div className="w-12 shrink-0 text-sm font-medium text-accent tabular-nums">
            {time}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-1">
              {cat && <span className="mr-1">{cat.emoji}</span>}
              {log.place_name}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
              {place && <span>{place}</span>}
              {log.rating ? (
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: log.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-amber-400 text-amber-400"
                    />
                  ))}
                </span>
              ) : null}
            </div>
            {log.note && (
              <p className="text-sm text-muted mt-1 whitespace-pre-wrap">
                {log.note}
              </p>
            )}
          </div>
          {author && (
            <div
              className="w-7 h-7 rounded-full bg-surface2 flex items-center justify-center text-sm shrink-0"
              title={author.display_name}
            >
              {author.emoji}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
