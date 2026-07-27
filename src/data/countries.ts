// 主要な渡航先国（ISO 3166-1 alpha-2）。必要に応じて追記できる。
// 国旗絵文字は countryFlag() でコードから生成するのでデータには持たない。

export type Country = { code: string; name: string }

export const COUNTRIES: Country[] = [
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韓国' },
  { code: 'TW', name: '台湾' },
  { code: 'CN', name: '中国' },
  { code: 'HK', name: '香港' },
  { code: 'TH', name: 'タイ' },
  { code: 'VN', name: 'ベトナム' },
  { code: 'SG', name: 'シンガポール' },
  { code: 'MY', name: 'マレーシア' },
  { code: 'ID', name: 'インドネシア' },
  { code: 'PH', name: 'フィリピン' },
  { code: 'IN', name: 'インド' },
  { code: 'US', name: 'アメリカ' },
  { code: 'CA', name: 'カナダ' },
  { code: 'MX', name: 'メキシコ' },
  { code: 'GB', name: 'イギリス' },
  { code: 'FR', name: 'フランス' },
  { code: 'DE', name: 'ドイツ' },
  { code: 'IT', name: 'イタリア' },
  { code: 'ES', name: 'スペイン' },
  { code: 'PT', name: 'ポルトガル' },
  { code: 'CH', name: 'スイス' },
  { code: 'NL', name: 'オランダ' },
  { code: 'BE', name: 'ベルギー' },
  { code: 'AT', name: 'オーストリア' },
  { code: 'GR', name: 'ギリシャ' },
  { code: 'TR', name: 'トルコ' },
  { code: 'AE', name: 'アラブ首長国連邦' },
  { code: 'EG', name: 'エジプト' },
  { code: 'AU', name: 'オーストラリア' },
  { code: 'NZ', name: 'ニュージーランド' },
  { code: 'GU', name: 'グアム' },
  { code: 'BR', name: 'ブラジル' },
]

export function countryName(code: string | null | undefined): string {
  if (!code) return ''
  return COUNTRIES.find((c) => c.code === code)?.name ?? code
}
