import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import type { VisitLog, Profile } from '@/types'

const BUCKET = 'trip-photos'

export type LogInput = {
  place_name: string
  visited_at: string
  country_code: string
  prefecture: string | null
  category: VisitLog['category']
  rating: number | null
  note: string | null
  photo_path: string | null
}

/** 訪問記録を時系列（訪問日時の昇順）で取得。 */
export async function listLogs(tripId: string): Promise<VisitLog[]> {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('trip_id', tripId)
    .order('visited_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as VisitLog[]
}

/** 写真アップロードのために id は呼び出し側で発番して渡す。 */
export async function createLog(
  tripId: string,
  authorId: string,
  id: string,
  input: LogInput,
): Promise<void> {
  const { error } = await supabase
    .from('logs')
    .insert({ ...input, id, trip_id: tripId, author_id: authorId })
  if (error) throw error
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export async function updateLog(id: string, input: LogInput): Promise<void> {
  const { error } = await supabase.from('logs').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteLog(log: VisitLog): Promise<void> {
  if (log.photo_path) {
    await supabase.storage.from(BUCKET).remove([log.photo_path]).catch(() => {})
  }
  const { error } = await supabase.from('logs').delete().eq('id', log.id)
  if (error) throw error
}

// ---------- 写真 ----------

/** 画像を圧縮して WebP でアップロードし、保存パスを返す。 */
export async function uploadLogPhoto(
  tripId: string,
  logId: string,
  file: File,
): Promise<string> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1280,
    maxSizeMB: 0.3,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.7,
  })
  const path = `logs/${tripId}/${logId}.webp`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { upsert: true, contentType: 'image/webp' })
  if (error) throw error
  return path
}

/** 複数パスの署名付きURLをまとめて取得（1時間有効）。 */
export async function signedUrls(
  paths: string[],
): Promise<Record<string, string>> {
  const clean = paths.filter(Boolean)
  if (clean.length === 0) return {}
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(clean, 3600)
  if (error) return {}
  const map: Record<string, string> = {}
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl
  }
  return map
}

// ---------- 投稿者プロフィール ----------

export async function profilesByIds(
  ids: string[],
): Promise<Record<string, Profile>> {
  const uniq = [...new Set(ids)].filter(Boolean)
  if (uniq.length === 0) return {}
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', uniq)
  const map: Record<string, Profile> = {}
  for (const p of (data ?? []) as Profile[]) map[p.user_id] = p
  return map
}
