import { useEffect, useState } from 'react'
import { Plus, Loader2, Receipt } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Trip, ExpenseJpy, TripMember } from '@/types'
import { listExpenses, listMembers } from '@/lib/expenses'
import { errMsg } from '@/utils/error'
import { yen, num } from '@/utils/format'
import { currencySymbol } from '@/data/currencies'
import ExpenseForm, { EXPENSE_CATEGORIES } from './ExpenseForm'

export default function ExpensesTab({
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
  const [expenses, setExpenses] = useState<ExpenseJpy[]>([])
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<{ editing: ExpenseJpy | null } | null>(null)

  async function reload() {
    try {
      const [e, m] = await Promise.all([
        listExpenses(trip.id),
        listMembers(trip.id),
      ])
      setExpenses(e)
      setMembers(m)
    } catch (err) {
      setError(errMsg(err))
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

  const total = expenses.reduce((s, e) => s + e.amount_jpy, 0)
  const perPerson = members.length ? Math.round(total / members.length) : total
  const emojiOf = (uid: string) =>
    members.find((m) => m.user_id === uid)?.emoji ?? '🧳'

  return (
    <div>
      {/* 総額 / 一人あたり */}
      <div className="rounded-2xl gradient-bg text-white p-4">
        <p className="text-xs opacity-80">総額</p>
        <p className="text-3xl font-bold">{yen(total)}</p>
        {members.length > 1 && (
          <p className="text-sm opacity-90 mt-1">
            一人あたり {yen(perPerson)}（{members.length}人）
          </p>
        )}
      </div>

      {expenses.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <div className="mx-auto w-11 h-11 rounded-full bg-accent3/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-accent3" />
          </div>
          <p className="mt-3 text-sm text-muted">
            旅費を記録して、かかったお金を把握しましょう。
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {expenses.map((e) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.key === e.category)
            const foreign = e.currency !== 'JPY'
            return (
              <div
                key={e.id}
                onClick={
                  canEdit && (e.author_id === userId || isOwner)
                    ? () => setForm({ editing: e })
                    : undefined
                }
                className={`rounded-2xl border border-border bg-surface p-3.5 flex items-center gap-3 ${
                  canEdit && (e.author_id === userId || isOwner)
                    ? 'cursor-pointer active:scale-[0.99] transition'
                    : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-surface2 flex items-center justify-center text-lg shrink-0">
                  {cat?.emoji ?? '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{e.category ?? 'その他'}</p>
                  <p className="text-xs text-muted">
                    {format(parseISO(e.spent_on), 'M/d(E)', { locale: ja })}
                    <span className="ml-1">{emojiOf(e.payer_id)}</span>
                    {e.memo && <span className="ml-1">・{e.memo}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">{yen(e.amount_jpy)}</p>
                  {foreign && (
                    <p className="text-xs text-subtle">
                      {currencySymbol(e.currency)}
                      {num(e.amount)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canEdit && (
        <button
          onClick={() => setForm({ editing: null })}
          className="mt-4 w-full rounded-xl border border-dashed border-border text-sm text-accent py-2.5 flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" /> 支出を追加
        </button>
      )}

      {form && (
        <ExpenseForm
          trip={trip}
          userId={userId}
          members={members}
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
