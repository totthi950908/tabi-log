/**
 * Supabase / PostgREST のエラーは Error インスタンスではなく
 * { message, details, hint, code } を持つただのオブジェクト。
 * String(err) だと "[object Object]" になるため、読める文字列に変換する。
 */
export function errMsg(err: unknown): string {
  if (!err) return '不明なエラーが発生しました。'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>
    const parts = [e.message, e.details, e.hint]
      .filter((x): x is string => typeof x === 'string' && x.length > 0)
    // P0001 は Postgres 関数の raise exception。文言は自前で書いた日本語で
    // そのまま利用者向けなので、コードは付けない。
    // それ以外（権限エラー等）は原因調査の手がかりになるので残す。
    const code =
      typeof e.code === 'string' && e.code !== 'P0001' ? ` (${e.code})` : ''
    if (parts.length) return parts.join(' / ') + code
    try {
      return JSON.stringify(err)
    } catch {
      return String(err)
    }
  }
  return String(err)
}
