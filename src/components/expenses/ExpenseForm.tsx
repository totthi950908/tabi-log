import { useState, type FormEvent } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import Modal, { modalInputCls } from '@/components/layout/Modal'
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInput,
} from '@/lib/expenses'
import { errMsg } from '@/utils/error'
import { yen } from '@/utils/format'
import type { Trip, ExpenseJpy, ExpenseCategory, TripMember } from '@/types'

export const EXPENSE_CATEGORIES: { key: ExpenseCategory; emoji: string }[] = [
  { key: '交通費', emoji: '🚄' },
  { key: '宿泊費', emoji: '🏨' },
  { key: '食費', emoji: '🍚' },
  { key: '観光費', emoji: '🎡' },
  { key: 'お土産', emoji: '🎁' },
  { key: 'その他', emoji: '📌' },
]

export default function ExpenseForm({
  trip,
  userId,
  members,
  editing,
  onClose,
  onSaved,
}: {
  trip: Trip
  userId: string
  members: TripMember[]
  editing: ExpenseJpy | null
  onClose: () => void
  onSaved: () => void
}) {
  const hasForeign = Boolean(trip.local_currency)

  const [spentOn, setSpentOn] = useState(
    editing?.spent_on ?? trip.start_date,
  )
  const [category, setCategory] = useState<ExpenseCategory | ''>(
    editing?.category ?? '',
  )
  const [amount, setAmount] = useState(
    editing ? String(editing.amount) : '',
  )
  const [currency, setCurrency] = useState(
    editing?.currency ?? (hasForeign ? trip.local_currency! : 'JPY'),
  )
  const [payer, setPayer] = useState(editing?.payer_id ?? userId)
  const [memo, setMemo] = useState(editing?.memo ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amtNum = Number(amount) || 0
  const jpyPreview =
    currency === 'JPY'
      ? Math.round(amtNum)
      : Math.round(amtNum * (trip.exchange_rate ?? 1))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (amtNum <= 0) {
      setError('金額は0より大きい値を入力してください。')
      return
    }
    const input: ExpenseInput = {
      spent_on: spentOn,
      category: category || null,
      amount: amtNum,
      currency,
      payer_id: payer,
      memo: memo.trim() || null,
    }
    setBusy(true)
    try {
      if (editing) await updateExpense(editing.id, input)
      else await createExpense(trip.id, userId, input)
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
      await deleteExpense(editing.id)
      onSaved()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={editing ? '支出を編集' : '支出を追加'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {/* 金額＋通貨 */}
        <div>
          <span className="block text-sm font-medium text-muted mb-1">
            金額<span className="text-danger ml-0.5">*</span>
          </span>
          <div className="flex gap-2">
            {hasForeign && (
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-xl border border-border bg-bg px-3 py-3 text-sm outline-none focus:border-accent"
              >
                <option value={trip.local_currency!}>
                  {trip.local_currency}
                </option>
                <option value="JPY">JPY</option>
              </select>
            )}
            <input
              type="number"
              inputMode="decimal"
              required
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={`${modalInputCls} flex-1 text-right text-lg`}
            />
          </div>
          {hasForeign && currency !== 'JPY' && amtNum > 0 && (
            <p className="mt-1.5 text-xs text-muted text-right">
              ≈ {yen(jpyPreview)}
            </p>
          )}
        </div>

        {/* カテゴリ */}
        <div>
          <span className="block text-sm font-medium text-muted mb-2">
            カテゴリ
          </span>
          <div className="grid grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.map((c) => (
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

        {/* 日付 */}
        <label className="block">
          <span className="block text-sm font-medium text-muted mb-1">日付</span>
          <input
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            className={modalInputCls}
          />
        </label>

        {/* 支払者 */}
        <label className="block">
          <span className="block text-sm font-medium text-muted mb-1">
            支払った人
          </span>
          <select
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            className={modalInputCls}
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.emoji} {m.display_name}
                {m.user_id === userId ? '（自分）' : ''}
              </option>
            ))}
          </select>
        </label>

        {/* メモ */}
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

        {hasForeign && (
          <p className="text-xs text-subtle leading-relaxed">
            ⚠️ 円換算額は設定レート（1 {trip.local_currency} ={' '}
            {trip.exchange_rate} 円）に基づく概算です。カード決済では実際の請求額と異なる場合があります。
          </p>
        )}

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
