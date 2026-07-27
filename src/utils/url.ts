/**
 * ユーザー入力のURLを安全に扱う。
 * http / https 以外（javascript:, data: など）は無効として null を返す。
 * これにより、共有相手が仕込んだ危険なリンクのクリックを防ぐ。
 */
export function safeUrl(input: string | null | undefined): string | null {
  if (!input) return null
  const s = input.trim()
  try {
    const u = new URL(s)
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href
    return null
  } catch {
    return null
  }
}
