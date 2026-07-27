import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

/** 国コード（例 'JP'）→ 国旗絵文字（🇯🇵）。画像もライブラリも不要。 */
export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '🏳️'
  const cc = code.toUpperCase()
  const base = 0x1f1e6 // Regional Indicator 'A'
  return (
    String.fromCodePoint(base + cc.charCodeAt(0) - 65) +
    String.fromCodePoint(base + cc.charCodeAt(1) - 65)
  )
}

/** 円を「¥12,300」形式に。 */
export function yen(n: number): string {
  return '¥' + Math.round(n).toLocaleString('ja-JP')
}

/** 数値をカンマ区切りに。 */
export function num(n: number): string {
  return n.toLocaleString('ja-JP')
}

/** '2026-09-13' → '2026年9月13日(土)' */
export function jpDate(iso: string): string {
  return format(parseISO(iso), 'yyyy年M月d日(E)', { locale: ja })
}

/** ' 2026-09-13' → '9/13' */
export function shortDate(iso: string): string {
  return format(parseISO(iso), 'M/d', { locale: ja })
}

/** 開始日〜終了日を「9/13〜9/15」形式に。同日なら1つだけ。 */
export function dateRange(start: string, end: string): string {
  if (start === end) return shortDate(start)
  return `${shortDate(start)}〜${shortDate(end)}`
}

/** 日付＋時刻の timestamptz を 'M/d(E) HH:mm' に（端末のローカル時刻）。 */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return format(parseISO(iso), 'M/d(E) HH:mm', { locale: ja })
}

/** timestamptz を 'M/d(E)' に。 */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return format(parseISO(iso), 'M/d(E)', { locale: ja })
}

/** datetime-local の入力値（ローカル時刻）→ 保存用 ISO（UTC）。 */
export function localInputToIso(v: string): string | null {
  if (!v) return null
  return new Date(v).toISOString()
}

/** 保存された ISO → datetime-local の入力値（ローカル時刻 'yyyy-MM-ddTHH:mm'）。 */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm")
}

/** 開始日〜終了日を1日ずつの日付文字列（'yyyy-MM-dd'）配列に。 */
export function eachDay(start: string, end: string): string[] {
  const days: string[] = []
  const s = parseISO(start)
  const e = parseISO(end)
  for (let d = s; d.getTime() <= e.getTime(); d = new Date(d.getTime() + 86400000)) {
    days.push(format(d, 'yyyy-MM-dd'))
  }
  return days
}

export type TripStatus = 'upcoming' | 'ongoing' | 'past'

/** 今日を基準に、計画中(upcoming)・旅行中(ongoing)・完了(past) を判定。 */
export function tripStatus(start: string, end: string): TripStatus {
  const today = format(new Date(), 'yyyy-MM-dd')
  if (end < today) return 'past'
  if (start > today) return 'upcoming'
  return 'ongoing'
}

export const STATUS_META: Record<
  TripStatus,
  { label: string; cls: string }
> = {
  upcoming: { label: '計画中', cls: 'bg-accent/10 text-accent' },
  ongoing: { label: '旅行中', cls: 'bg-accent3/15 text-accent3' },
  past: { label: '完了', cls: 'bg-surface2 text-muted' },
}

/** 泊数（終了日−開始日）。同日は0泊。 */
export function nights(start: string, end: string): number {
  const s = parseISO(start).getTime()
  const e = parseISO(end).getTime()
  return Math.max(0, Math.round((e - s) / 86400000))
}
