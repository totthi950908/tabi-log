// 予約サイトへの送客リンクを組み立てる設定。
// 提携先の追加・変更はこのファイル1箇所で済む。
//
// アフィリエイト提携が通ったら、各 build 関数の返り値URLに
// トラッキングパラメータを足すだけでよい（BOOK-04）。

export type BookingParams = {
  destination: string // 行き先（例「ソウル」）
  startDate: string // 'yyyy-MM-dd'
  endDate: string // 'yyyy-MM-dd'
  people: number // 人数（大人）
}

export type Provider = {
  id: string
  label: string
  note?: string
  build: (p: BookingParams) => string
}

const enc = encodeURIComponent

// ---- 航空券 ----
export const FLIGHT_PROVIDERS: Provider[] = [
  {
    id: 'google-flights',
    label: 'Google フライト',
    build: ({ destination, startDate }) =>
      `https://www.google.com/travel/flights?q=${enc(
        `${destination}行きの航空券 ${startDate}出発`,
      )}`,
  },
  {
    id: 'skyscanner',
    label: 'スカイスキャナー',
    note: 'サイトで出発地を選んで検索',
    build: () => 'https://www.skyscanner.jp/',
  },
]

// ---- 宿泊 ----
export const HOTEL_PROVIDERS: Provider[] = [
  {
    id: 'rakuten',
    label: '楽天トラベル',
    note: '国内の宿に強い',
    build: ({ destination }) =>
      `https://search.travel.rakuten.co.jp/ds/hotellist/?f_keyword=${enc(
        destination,
      )}`,
  },
  {
    id: 'booking',
    label: 'Booking.com',
    note: '海外の宿に強い',
    build: ({ destination, startDate, endDate, people }) =>
      `https://www.booking.com/searchresults.ja.html?ss=${enc(
        destination,
      )}&checkin=${startDate}&checkout=${endDate}&group_adults=${people}&no_rooms=1`,
  },
  {
    id: 'google-hotels',
    label: 'Google ホテル',
    build: ({ destination, startDate }) =>
      `https://www.google.com/travel/search?q=${enc(
        `${destination} ホテル ${startDate}`,
      )}`,
  },
]
