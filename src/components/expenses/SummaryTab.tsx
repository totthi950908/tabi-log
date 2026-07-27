import { useEffect, useState } from 'react'
import { Loader2, PieChart } from 'lucide-react'
import type { Trip, ExpenseJpy, TripMember } from '@/types'
import { listExpenses, listMembers } from '@/lib/expenses'
import { errMsg } from '@/utils/error'
import { yen } from '@/utils/format'
import { EXPENSE_CATEGORIES } from './ExpenseForm'

const BAR_COLORS = [
  'bg-sky-400',
  'bg-teal-400',
  'bg-amber-400',
  'bg-indigo-400',
  'bg-rose-400',
  'bg-slate-400',
]

export default function SummaryTab({ trip }: { trip: Trip }) {
  const [expenses, setExpenses] = useState<ExpenseJpy[]>([])
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listExpenses(trip.id), listMembers(trip.id)])
      .then(([e, m]) => {
        setExpenses(e)
        setMembers(m)
      })
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false))
  }, [trip.id])

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  if (error) return <p className="text-sm text-danger">{error}</p>

  const total = expenses.reduce((s, e) => s + e.amount_jpy, 0)

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <div className="mx-auto w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-accent" />
        </div>
        <p className="mt-3 text-sm text-muted">
          支出を登録すると、ここに内訳が表示されます。
        </p>
      </div>
    )
  }

  // カテゴリ別
  const byCat = EXPENSE_CATEGORIES.map((c) => ({
    label: c.key,
    emoji: c.emoji,
    total: expenses
      .filter((e) => (e.category ?? 'その他') === c.key)
      .reduce((s, e) => s + e.amount_jpy, 0),
  })).filter((x) => x.total > 0)
  byCat.sort((a, b) => b.total - a.total)

  // 支払者別
  const byPayer = members
    .map((m) => ({
      ...m,
      total: expenses
        .filter((e) => e.payer_id === m.user_id)
        .reduce((s, e) => s + e.amount_jpy, 0),
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)

  const budgetPct =
    trip.budget && trip.budget > 0
      ? Math.min(100, Math.round((total / trip.budget) * 100))
      : null

  return (
    <div className="space-y-6">
      {/* 予算消化 */}
      {trip.budget != null && trip.budget > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">予算</span>
            <span className="font-medium">
              {yen(total)} / {yen(trip.budget)}
            </span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-surface2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (budgetPct ?? 0) >= 100 ? 'bg-danger' : 'gradient-bg'
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-subtle text-right">
            {budgetPct}% 消化
            {total > trip.budget && `（${yen(total - trip.budget)}オーバー）`}
          </p>
        </section>
      )}

      {/* カテゴリ別 */}
      <section>
        <h3 className="font-semibold text-sm mb-3">カテゴリ別</h3>
        <div className="space-y-3">
          {byCat.map((c, i) => {
            const pct = Math.round((c.total / total) * 100)
            return (
              <div key={c.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    <span className="mr-1">{c.emoji}</span>
                    {c.label}
                  </span>
                  <span className="text-muted">
                    {yen(c.total)}
                    <span className="text-subtle ml-1">{pct}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 支払者別 */}
      {byPayer.length > 0 && (
        <section>
          <h3 className="font-semibold text-sm mb-3">誰がいくら払ったか</h3>
          <div className="space-y-2">
            {byPayer.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <div className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center text-lg">
                  {p.emoji}
                </div>
                <span className="flex-1 text-sm">{p.display_name}</span>
                <span className="font-semibold">{yen(p.total)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-subtle">
            ※ 精算（誰が誰にいくら返すか）は今後の機能で対応予定です。
          </p>
        </section>
      )}
    </div>
  )
}
