import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Loader2,
  ExternalLink,
  Ticket,
  CalendarDays,
} from 'lucide-react'
import type { Trip, Booking, PlanItem } from '@/types'
import { listBookings, listPlanItems } from '@/lib/plan'
import { errMsg } from '@/utils/error'
import { eachDay, fmtDateTime, fmtDate, jpDate, tripStatus } from '@/utils/format'
import { safeUrl } from '@/utils/url'
import BookingForm, { BOOKING_TYPES } from './BookingForm'
import PlanItemForm, { PLAN_CATEGORIES } from './PlanItemForm'
import BookingLinks from '@/components/booking/BookingLinks'

export default function ItineraryTab({
  trip,
  userId,
  canEdit,
}: {
  trip: Trip
  userId: string
  canEdit: boolean
}) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [items, setItems] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // モーダル状態
  const [bookingForm, setBookingForm] = useState<
    { editing: Booking | null } | null
  >(null)
  const [planForm, setPlanForm] = useState<
    { day: string; editing: PlanItem | null } | null
  >(null)

  const days = useMemo(
    () => eachDay(trip.start_date, trip.end_date),
    [trip.start_date, trip.end_date],
  )
  const [activeDay, setActiveDay] = useState(days[0])

  async function reload() {
    try {
      const [b, p] = await Promise.all([
        listBookings(trip.id),
        listPlanItems(trip.id),
      ])
      setBookings(b)
      setItems(p)
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

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  if (error) return <p className="text-sm text-danger">{error}</p>

  const dayItems = items.filter((i) => i.day_date === activeDay)

  // 完了した旅行では予約検索を出さない。まだ手配していない種類だけ誘導する。
  const isPast = tripStatus(trip.start_date, trip.end_date) === 'past'
  const hasFlight = bookings.some((b) => b.type === 'flight')
  const hasHotel = bookings.some((b) => b.type === 'hotel')
  const searchKinds: ('flight' | 'hotel')[] = isPast
    ? []
    : [
        ...(hasFlight ? [] : (['flight'] as const)),
        ...(hasHotel ? [] : (['hotel'] as const)),
      ]

  return (
    <div className="space-y-6">
      {/* ===== 予約 ===== */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="flex items-center gap-1.5 font-semibold text-sm">
            <Ticket className="w-4 h-4 text-accent2" /> 予約
          </h3>
          {canEdit && (
            <button
              onClick={() => setBookingForm({ editing: null })}
              className="flex items-center gap-1 text-sm text-accent font-medium"
            >
              <Plus className="w-4 h-4" /> 追加
            </button>
          )}
        </div>

        {bookings.length > 0 && (
          <div className="space-y-2">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onClick={
                  canEdit ? () => setBookingForm({ editing: b }) : undefined
                }
              />
            ))}
          </div>
        )}

        {/* まだ手配していない種類だけ「探す」を出す（自然な予約誘導） */}
        {searchKinds.length > 0 && (
          <div className={bookings.length > 0 ? 'mt-2' : ''}>
            <BookingLinks trip={trip} kinds={searchKinds} />
          </div>
        )}

        {bookings.length === 0 && searchKinds.length === 0 && (
          <EmptyBox text="航空券やホテルの予約を登録できます" />
        )}
      </section>

      {/* ===== 日程 ===== */}
      <section>
        <h3 className="flex items-center gap-1.5 font-semibold text-sm mb-2">
          <CalendarDays className="w-4 h-4 text-accent2" /> 日程
        </h3>

        {/* 日タブ */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {days.map((d, i) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeDay === d
                  ? 'gradient-bg text-white'
                  : 'bg-surface2 text-muted'
              }`}
            >
              {i + 1}日目 {fmtDate(d + 'T00:00:00')}
            </button>
          ))}
        </div>

        {/* 予定リスト */}
        <div className="mt-3">
          {dayItems.length === 0 ? (
            <EmptyBox text={`${jpDate(activeDay)} の予定はまだありません`} />
          ) : (
            <div className="space-y-2">
              {dayItems.map((it) => (
                <PlanItemRow
                  key={it.id}
                  item={it}
                  onClick={
                    canEdit
                      ? () => setPlanForm({ day: activeDay, editing: it })
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {canEdit && (
            <button
              onClick={() => setPlanForm({ day: activeDay, editing: null })}
              className="mt-2 w-full rounded-xl border border-dashed border-border text-sm text-accent py-2.5 flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> この日に予定を追加
            </button>
          )}
        </div>
      </section>

      {/* モーダル */}
      {bookingForm && (
        <BookingForm
          tripId={trip.id}
          userId={userId}
          editing={bookingForm.editing}
          onClose={() => setBookingForm(null)}
          onSaved={() => {
            setBookingForm(null)
            reload()
          }}
        />
      )}
      {planForm && (
        <PlanItemForm
          tripId={trip.id}
          userId={userId}
          dayDate={planForm.day}
          editing={planForm.editing}
          onClose={() => setPlanForm(null)}
          onSaved={() => {
            setPlanForm(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function BookingCard({
  booking,
  onClick,
}: {
  booking: Booking
  onClick?: () => void
}) {
  const meta = BOOKING_TYPES.find((t) => t.key === booking.type)
  const route =
    booking.from_place || booking.to_place
      ? `${booking.from_place ?? ''} → ${booking.to_place ?? ''}`
      : null
  const when =
    booking.type === 'hotel'
      ? [fmtDate(booking.start_at), fmtDate(booking.end_at)]
          .filter(Boolean)
          .join(' 〜 ')
      : [fmtDateTime(booking.start_at), fmtDateTime(booking.end_at)]
          .filter(Boolean)
          .join(' 〜 ')

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border bg-surface p-3.5 ${
        onClick ? 'cursor-pointer active:scale-[0.99] transition' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{meta?.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium line-clamp-1">{booking.title}</p>
          {route && <p className="text-sm text-muted">{route}</p>}
          {when && <p className="text-xs text-muted mt-0.5">{when}</p>}
          {booking.provider && (
            <p className="text-xs text-subtle mt-0.5">{booking.provider}</p>
          )}
          {booking.confirmation_no && (
            <p className="text-xs text-subtle mt-0.5">
              予約番号 {booking.confirmation_no}
            </p>
          )}
          {booking.memo && (
            <p className="text-xs text-muted mt-1 whitespace-pre-wrap">
              {booking.memo}
            </p>
          )}
          {safeUrl(booking.url) && (
            <a
              href={safeUrl(booking.url)!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 inline-flex items-center gap-1 text-xs text-accent"
            >
              <ExternalLink className="w-3 h-3" /> 予約ページを開く
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function PlanItemRow({
  item,
  onClick,
}: {
  item: PlanItem
  onClick?: () => void
}) {
  const cat = PLAN_CATEGORIES.find((c) => c.key === item.category)
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 rounded-2xl border border-border bg-surface p-3 ${
        onClick ? 'cursor-pointer active:scale-[0.99] transition' : ''
      }`}
    >
      <div className="w-12 shrink-0 text-sm font-medium text-accent tabular-nums">
        {item.start_time ? item.start_time.slice(0, 5) : '—'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium line-clamp-1">
          {cat && <span className="mr-1">{cat.emoji}</span>}
          {item.title}
        </p>
        {item.place && <p className="text-xs text-muted">{item.place}</p>}
        {item.memo && (
          <p className="text-xs text-muted mt-0.5 whitespace-pre-wrap">
            {item.memo}
          </p>
        )}
      </div>
    </div>
  )
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
      <p className="text-sm text-muted">{text}</p>
    </div>
  )
}
