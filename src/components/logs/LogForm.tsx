import { useRef, useState, type FormEvent } from 'react'
import { Loader2, Trash2, Star, ImagePlus, X } from 'lucide-react'
import Modal, { modalInputCls } from '@/components/layout/Modal'
import {
  createLog,
  updateLog,
  deleteLog,
  uploadLogPhoto,
  newId,
  type LogInput,
} from '@/lib/logs'
import { isoToLocalInput, localInputToIso, countryFlag } from '@/utils/format'
import { COUNTRIES } from '@/data/countries'
import { PREFECTURES } from '@/data/prefectures'
import { errMsg } from '@/utils/error'
import type { VisitLog, LogCategory } from '@/types'

export const LOG_CATEGORIES: { key: LogCategory; emoji: string }[] = [
  { key: '観光地', emoji: '📸' },
  { key: '食事', emoji: '🍚' },
  { key: '宿泊', emoji: '🛏️' },
  { key: '移動', emoji: '🚕' },
  { key: '買い物', emoji: '🛍️' },
  { key: '温泉', emoji: '♨️' },
  { key: 'その他', emoji: '📌' },
]

export default function LogForm({
  tripId,
  userId,
  defaultCountry,
  defaultDate,
  existingSignedUrl,
  editing,
  onClose,
  onSaved,
}: {
  tripId: string
  userId: string
  defaultCountry: string
  defaultDate: string // 'yyyy-MM-dd'
  existingSignedUrl?: string
  editing: VisitLog | null
  onClose: () => void
  onSaved: () => void
}) {
  const [place, setPlace] = useState(editing?.place_name ?? '')
  const [visitedAt, setVisitedAt] = useState(
    editing ? isoToLocalInput(editing.visited_at) : `${defaultDate}T10:00`,
  )
  const [country, setCountry] = useState(editing?.country_code ?? defaultCountry)
  const [prefecture, setPrefecture] = useState(editing?.prefecture ?? '')
  const [category, setCategory] = useState<LogCategory | ''>(
    editing?.category ?? '',
  )
  const [rating, setRating] = useState<number>(editing?.rating ?? 0)
  const [note, setNote] = useState(editing?.note ?? '')

  // 写真
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(existingSignedUrl ?? null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isJP = country === 'JP'

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPhotoFile(f)
    setRemovePhoto(false)
    setPreview(URL.createObjectURL(f))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const id = editing?.id ?? newId()

      let photoPath: string | null = editing?.photo_path ?? null
      if (removePhoto) photoPath = null
      if (photoFile) photoPath = await uploadLogPhoto(tripId, id, photoFile)

      const input: LogInput = {
        place_name: place.trim(),
        visited_at: localInputToIso(visitedAt) ?? new Date().toISOString(),
        country_code: country,
        prefecture: isJP ? prefecture || null : null,
        category: category || null,
        rating: rating || null,
        note: note.trim() || null,
        photo_path: photoPath,
      }

      if (editing) await updateLog(id, input)
      else await createLog(tripId, userId, id, input)
      onSaved()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  async function remove() {
    if (!editing) return
    setBusy(true)
    try {
      await deleteLog(editing)
      onSaved()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={editing ? '記録を編集' : '記録を追加'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {/* 写真 */}
        <div>
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt=""
                className="w-full h-44 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null)
                  setPreview(null)
                  setRemovePhoto(true)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-28 rounded-xl border border-dashed border-border bg-surface2 flex flex-col items-center justify-center gap-1 text-muted"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-sm">写真を追加（任意）</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickPhoto}
          />
        </div>

        <L label="場所名" req>
          <input
            required
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="例：清水寺"
            className={modalInputCls}
          />
        </L>

        <L label="訪問日時" req>
          <input
            type="datetime-local"
            required
            value={visitedAt}
            onChange={(e) => setVisitedAt(e.target.value)}
            className={modalInputCls}
          />
        </L>

        <div className={isJP ? 'grid grid-cols-2 gap-3' : ''}>
          <L label="国">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={modalInputCls}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryFlag(c.code)} {c.name}
                </option>
              ))}
            </select>
          </L>
          {isJP && (
            <L label="都道府県">
              <select
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                className={modalInputCls}
              >
                <option value="">選択しない</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </L>
          )}
        </div>

        <div>
          <span className="block text-sm font-medium text-muted mb-2">
            カテゴリ
          </span>
          <div className="grid grid-cols-4 gap-2">
            {LOG_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(category === c.key ? '' : c.key)}
                className={`rounded-xl py-2 text-xs flex flex-col items-center gap-0.5 transition ${
                  category === c.key
                    ? 'bg-accent/10 ring-2 ring-accent text-accent'
                    : 'bg-surface2 text-muted'
                }`}
              >
                <span className="text-base">{c.emoji}</span>
                {c.key}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-muted mb-2">評価</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? 0 : n)}
              >
                <Star
                  className={`w-7 h-7 ${
                    n <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <L label="メモ（任意）">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="感想やおすすめポイントなど"
            className={modalInputCls}
          />
        </L>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2 pt-1">
          {editing && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-xl border border-border text-danger px-4 py-3 flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-xl gradient-bg text-white font-medium py-3 flex items-center justify-center disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function L({
  label,
  req,
  children,
}: {
  label: string
  req?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-muted mb-1">
        {label}
        {req && <span className="text-danger ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
