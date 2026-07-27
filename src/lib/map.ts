import { supabase } from '@/lib/supabase'

/** 全旅行の訪問記録から、行った都道府県と国コードを集計する。 */
export async function getVisited(): Promise<{
  prefectures: Set<string>
  countries: Set<string>
}> {
  const { data, error } = await supabase
    .from('logs')
    .select('country_code, prefecture')
  if (error) throw error

  const prefectures = new Set<string>()
  const countries = new Set<string>()
  for (const row of (data ?? []) as {
    country_code: string
    prefecture: string | null
  }[]) {
    if (row.country_code) countries.add(row.country_code)
    if (row.prefecture) prefectures.add(row.prefecture)
  }
  return { prefectures, countries }
}
