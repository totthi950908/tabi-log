import { useState, type FormEvent } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import Modal, { modalInputCls } from '@/components/layout/Modal'
import {
  createBooking,
  updateBooking,
  deleteBooking,
  type BookingInput,
} from '@/lib/plan'
import { isoToLocalInput, localInputToIso } from '@/utils/format'
import { errMsg } from '@/utils/error'
import type { Booking, BookingType } from '@/types'

export const BOOKING_TYPES: { key: BookingType; label: string; emoji: string }[] =
  [
    { key: 'flight', label: '航空券', emoji: '✈️' },
    { key: 'hotel', label: '宿泊', emoji: '🏨' },
    { key: 'transport', label: '移動', emoji: '🚄' },
    { key: 'other', label: 'その他', emoji: '📌' },
  ]

export default function BookingForm({
  tripId,
  userId,
  editing,
  onClose,
  onSaved,
}: {
  tripId: string
  userId: string
  editing: Booking | null
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<BookingType>(editing?.type ?? 'flight')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [provider, setProvider] = useState(editing?.provider ?? '')
  const [fromPlace, setFromPlace] = useState(editing?.from_place ?? '')
  const [toPlace, setToPlace] = useState(editing?.to_place ?? '')
  const [startAt, setStartAt] = useState(isoToLocalInput(editing?.start_at))
  const [endAt, setEndAt] = useState(isoToLocalInput(editing?.end_at))
  const [location, setLocation] = useState(editing?.location ?? '')
  const [confirmation, setConfirmation] = useState(editing?.confirmation_no ?? '')
  const [url, setUrl] = useState(editing?.url ?? '')
  const [memo, setMemo] = useState(editing?.memo ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const input: BookingInput = {
      type,
      title: title.trim(),
      provider: provider.trim() || null,
      from_place: fromPlace.trim() || null,
      to_place: toPlace.trim() || null,
      start_at: localInputToIso(startAt),
      end_at: localInputToIso(endAt),
      location: location.trim() || null,
      confirmation_no: confirmation.trim() || null,
      url: url.trim() || null,
      memo: memo.trim() || null,
    }
    setBusy(true)
    try {
      if (editing) await updateBooking(editing.id, input)
      else await createBooking(tripId, userId, input)
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
      await deleteBooking(editing.id)
      onSaved()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  const startLabel = type === 'hotel' ? 'チェックイン' : '出発日時'
  const endLabel = type === 'hotel' ? 'チェックアウト' : '到着日時'
  const showRoute = type === 'flight' || type === 'transport'

  return (
    <Modal title={editing ? '予約を編集' : '予約を追加'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {/* 種別 */}
        <div className="grid grid-cols-4 gap-2">
          {BOOKING_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`rounded-xl py-2.5 flex flex-col items-center gap-1 text-xs transition ${
                type === t.key
                  ? 'bg-accent/10 ring-2 ring-accent text-accent'
                  : 'bg-surface2 text-muted'
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        <L label={type === 'hotel' ? 'ホテル名' : type === 'flight' ? '便名' : '内容'} req>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === 'hotel'
                ? '例：ロッテホテル ソウル'
                : type === 'flight'
                  ? '例：KE702'
                  : '例：KTX ソウル→釜山'
            }
            className={modalInputCls}
          />
        </L>

        {(type === 'flight' || type === 'other' || type === 'transport') && (
          <L label={type === 'flight' ? '航空会社' : '提供元'}>
            <input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder={type === 'flight' ? '例：大韓航空' : ''}
              className={modalInputCls}
            />
          </L>
        )}

        {showRoute && (
          <div className="grid grid-cols-2 gap-3">
            <L label="出発地">
              <input
                value={fromPlace}
                onChange={(e) => setFromPlace(e.target.value)}
                placeholder="羽田"
                className={modalInputCls}
              />
            </L>
            <L label="到着地">
              <input
                value={toPlace}
                onChange={(e) => setToPlace(e.target.value)}
                placeholder="仁川"
                className={modalInputCls}
              />
            </L>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <L label={startLabel}>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className={modalInputCls}
            />
          </L>
          <L label={endLabel}>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className={modalInputCls}
            />
          </L>
        </div>

        {type === 'hotel' && (
          <L label="場所・住所">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={modalInputCls}
            />
          </L>
        )}

        <L label="予約番号">
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className={modalInputCls}
          />
        </L>

        <L label="リンク（任意）">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className={modalInputCls}
          />
        </L>

        <L label="メモ（任意）">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
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
