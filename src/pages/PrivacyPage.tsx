import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/**
 * プライバシーポリシー。一般公開時に必要。
 * 運営者名は【要記入】をご自身のハンドル名に置き換えてください。
 */
export default function PrivacyPage({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate()
  const back = onBack ?? (() => navigate(-1))

  return (
    <div className="max-w-md mx-auto px-5 pt-safe-top pb-nav-safe">
      <div className="flex items-center gap-2">
        <button
          onClick={back}
          className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center text-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">プライバシーポリシー</h1>
      </div>

      <div className="mt-5 space-y-6 text-sm leading-relaxed text-ink">
        <p className="text-muted">
          「たびろぐ」（以下「本アプリ」）における、利用者の情報の取り扱いについて定めます。
        </p>

        <Section title="1. 取得する情報">
          本アプリは、サービスの提供のために次の情報を取得・保存します。
          <List
            items={[
              'アカウント情報：メールアドレス、パスワード（暗号化して保管）',
              'プロフィール：表示名、アイコン（絵文字）',
              '旅行データ：旅行のタイトル・日程・行き先、しおり（予約情報・日程）、訪問記録（場所・カテゴリ・評価・メモ・写真）、支出（金額・カテゴリ・支払者）',
              '共有情報：招待により同じ旅行に参加したメンバーが入力した内容',
            ]}
          />
          位置情報は、利用者ご自身が入力した地名・都道府県・国のみを扱い、端末のGPS等から自動取得することはありません。
        </Section>

        <Section title="2. 利用目的">
          取得した情報は、旅行の記録・旅費管理・メンバー間での共有という、本アプリの機能を提供する目的にのみ利用します。広告配信や、目的外の利用は行いません。
        </Section>

        <Section title="3. 外部サービスへの送信">
          本アプリは、機能提供のため以下の外部サービスを利用します。
          <List
            items={[
              'Supabase（データの保存・認証・写真の保管）',
              'Vercel（アプリの配信）',
              'Formspree（お問い合わせフォームの送信）',
              '予約サイト（航空券・宿の検索。リンクで遷移するのみで、本アプリが予約情報を受け取ることはありません）',
            ]}
          />
        </Section>

        <Section title="4. Cookie・ローカル保存について">
          ログイン状態を保つためのセッション情報や、招待リンクを開いた際の一時的な情報を、ブラウザ内に保存します。行動追跡を目的とした広告用Cookieは使用していません。
        </Section>

        <Section title="5. 第三者提供">
          法令に基づく場合を除き、利用者の情報を第三者に販売・提供することはありません。招待機能による共有は、利用者ご自身が招待したメンバーとの間でのみ行われます。
        </Section>

        <Section title="6. データの保存と削除">
          設定画面の「アカウントの削除」から、いつでもご自身のアカウントを削除できます。削除すると、ご自身が作成した記録・支出・写真・作成した旅行などの関連データも削除され、元に戻すことはできません。
        </Section>

        <Section title="7. 安全管理">
          通信はすべて暗号化（HTTPS）され、データベースは行レベルのアクセス制御により、権限のない利用者が他人のデータにアクセスできない設計としています。写真は非公開の保管領域に保存し、旅行のメンバーのみが閲覧できます。
        </Section>

        <Section title="8. 改定">
          本ポリシーは、必要に応じて改定することがあります。重要な変更がある場合は、本アプリ上でお知らせします。
        </Section>

        <Section title="9. お問い合わせ">
          本ポリシーおよび情報の取り扱いに関するお問い合わせは、アプリ内の「お問い合わせ・ご要望」フォームよりご連絡ください。
        </Section>

        <div className="pt-2 text-xs text-subtle">
          <p>制定日：2026年7月27日</p>
          <p className="mt-1">運営者：TOSHI（個人）</p>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-bold mb-1.5">{title}</h2>
      <div className="text-muted">{children}</div>
    </section>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-1.5 space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-subtle">・</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}
