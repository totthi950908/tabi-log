// アプリ共通の型定義

export type Role = 'owner' | 'editor' | 'viewer'

export type Profile = {
  user_id: string
  display_name: string
  emoji: string
  created_at?: string
}

export type LogCategory =
  | '観光地'
  | '食事'
  | '宿泊'
  | '移動'
  | '買い物'
  | '温泉'
  | 'その他'

export type VisitLog = {
  id: string
  trip_id: string
  author_id: string
  place_name: string
  visited_at: string
  country_code: string
  prefecture: string | null
  category: LogCategory | null
  rating: number | null
  note: string | null
  photo_path: string | null
  created_at: string
}

export type ExpenseCategory =
  | '交通費'
  | '宿泊費'
  | '食費'
  | '観光費'
  | 'お土産'
  | 'その他'

export type Expense = {
  id: string
  trip_id: string
  author_id: string
  payer_id: string
  spent_on: string
  category: ExpenseCategory | null
  amount: number
  currency: string
  memo: string | null
  log_id: string | null
  created_at: string
}

/** expenses_jpy ビュー（円換算額つき）。 */
export type ExpenseJpy = Expense & { amount_jpy: number }

/** 支払者選択やメンバー表示に使う。 */
export type TripMember = {
  user_id: string
  role: Role
  display_name: string
  emoji: string
}

export type BookingType = 'flight' | 'hotel' | 'transport' | 'other'

export type Booking = {
  id: string
  trip_id: string
  type: BookingType
  title: string
  provider: string | null
  confirmation_no: string | null
  start_at: string | null
  end_at: string | null
  from_place: string | null
  to_place: string | null
  location: string | null
  url: string | null
  memo: string | null
  created_by: string
  created_at: string
}

export type PlanCategory = '移動' | '食事' | '観光' | '買い物' | '宿泊' | 'その他'

export type PlanItem = {
  id: string
  trip_id: string
  day_date: string
  start_time: string | null
  title: string
  category: PlanCategory | null
  place: string | null
  memo: string | null
  sort_order: number
  created_by: string
  created_at: string
}

export type Trip = {
  id: string
  owner_id: string
  title: string
  destination: string | null
  start_date: string
  end_date: string
  cover_path: string | null
  budget: number | null
  default_country: string
  local_currency: string | null
  exchange_rate: number | null
  memo: string | null
  created_at: string
  updated_at: string
}
