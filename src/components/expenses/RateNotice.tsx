import type { Trip } from '@/types'

/**
 * 円換算の注意書き（EXP-15）。文言は要件定義書で確定済みなので変えないこと。
 * 現地通貨が未設定の旅行（国内旅行扱い）では何も表示しない。
 */
export default function RateNotice({
  trip,
  className = '',
}: {
  trip: Trip
  className?: string
}) {
  if (!trip.local_currency) return null
  return (
    <p className={`text-xs text-subtle leading-relaxed ${className}`}>
      ⚠️
      円換算額は設定した為替レートに基づく概算です。クレジットカード決済の場合、カード会社の適用レートや事務手数料により実際の請求金額とは異なります。
    </p>
  )
}
