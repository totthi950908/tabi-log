// 主要通貨のプリセット。これ以外は3文字コードを手入力できる。
// rateHint は「1通貨 = 約何円か」のおおよその初期値（あくまで目安）。

export type CurrencyPreset = {
  code: string
  label: string
  symbol: string
  rateHint: number
}

export const CURRENCY_PRESETS: CurrencyPreset[] = [
  { code: 'USD', label: '米ドル', symbol: '$', rateHint: 155 },
  { code: 'EUR', label: 'ユーロ', symbol: '€', rateHint: 165 },
  { code: 'KRW', label: '韓国ウォン', symbol: '₩', rateHint: 0.11 },
  { code: 'TWD', label: '台湾ドル', symbol: 'NT$', rateHint: 4.8 },
  { code: 'THB', label: 'タイバーツ', symbol: '฿', rateHint: 4.3 },
  { code: 'GBP', label: '英ポンド', symbol: '£', rateHint: 195 },
  { code: 'AUD', label: '豪ドル', symbol: 'A$', rateHint: 100 },
  { code: 'CNY', label: '中国元', symbol: '¥', rateHint: 21 },
  { code: 'HKD', label: '香港ドル', symbol: 'HK$', rateHint: 20 },
  { code: 'SGD', label: 'シンガポールドル', symbol: 'S$', rateHint: 115 },
  { code: 'VND', label: 'ベトナムドン', symbol: '₫', rateHint: 0.006 },
]

export function currencySymbol(code: string | null | undefined): string {
  if (!code || code === 'JPY') return '¥'
  return CURRENCY_PRESETS.find((c) => c.code === code)?.symbol ?? code + ' '
}
