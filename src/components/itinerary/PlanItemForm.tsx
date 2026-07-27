import { useState, type FormEvent } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import Modal, { modalInputCls } from '@/components/layout/Modal'
import {
  createPlanItem,
  updatePlanItem,
  deletePlanItem,
  type PlanItemInput,
} from '@/lib/plan'
import { errMsg } from '@/utils/error'
import type { PlanItem, PlanCategory } from '@/types'

export const PLAN_CATEGORIES: { key: PlanCategory; emoji: string }[] = [
  { key: '移動', emoji: '🚕' },
  { key: '食事', emoji: '🍚' },
  { key: '観光', emoji: '📸' },
  { key: '買い物', emoji: '🛍️' },
  { key: '宿泊', emoji: '🛏️' },
  { key: 'その他', emoji: '📌' },
]

export default function PlanItemForm({
  tripId,
  userId,
  dayDate,
  editing,
  onClose,
  onSaved,
}: {
  tripId: string
  userId: string
  dayDate: string
  editing: PlanItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const [time, setTime] = useState(editing?.start_time?.slice(0, 5) ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [category, setCategory] = useState<PlanCategory | ''>(
    editing?.category ?? '',
  )
  const [place, setPlace] = useState(editing?.place ?? '')
  const [memo, setMemo] = useState(editing?.memo ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const input: PlanItemInput = {
      day_date: editing?.day_date ?? dayDate,
      start_time: time || null,
      title: title.trim(),
      category: category || null,
      place: place.trim() || null,
      memo: memo.trim() || null,
      sort_order: editing?.sort_order ?? 0,
    }
    setBusy(true)
    try {
      if (editing) await updatePlanItem(editing.id, input)
      else await createPlanItem(tripId, userId, input)
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
      await deletePlanItem(editing.id)
      onSaved()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={editing ? '予定を編集' : '予定を追加'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-sm font-medium text-muted mb-1">
              時刻（任意）
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={modalInputCls}
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-muted mb-1">
            内容<span className="text-danger ml-0.5">*</span>
          </span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：明洞で買い物"
            className={modalInputCls}
          />
        </label>

        <div>
          <span className="block text-sm font-medium text-muted mb-2">
            カテゴリ
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PLAN_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(category === c.key ? '' : c.key)}
                className={`rounded-xl py-2 text-sm flex items-center justify-center gap-1 transition ${
                  category === c.key
                    ? 'bg-accent/10 ring-2 ring-accent text-accent'
                    : 'bg-surface2 text-muted'
                }`}
              >
                <span>{c.emoji}</span>
                {c.key}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-muted mb-1">
            場所（任意）
          </span>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="例：明洞"
            className={modalInputCls}
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-muted mb-1">
            メモ（任意）
          </span>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            className={modalInputCls}
          />
        </label>

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
