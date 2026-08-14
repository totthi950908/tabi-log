# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

（コード内のコメント・UI文言・コミットメッセージは日本語で統一されている。合わせること。）

## コマンド

```bash
npm run dev      # 開発サーバー（Vite）
npm run build    # tsc の型チェック + 本番ビルド
npm run preview  # ビルド結果をローカル確認
```

テストフレームワークも Lint 設定も導入していない（`eslint-disable` コメントが1箇所あるが ESLint 自体は未インストール）。**変更後の検証は `npm run build` の型チェックが唯一の自動チェック**なので、必ず通すこと。ロジックの動作確認は `npm run dev` で実機確認する。

環境変数は `.env.local` に `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` の2つ（`.env.local.example` 参照）。

## 仕様の出典

**`旅行アプリ_要件定義書.md`（v1.2）が仕様の一次資料。** 機能追加・仕様変更の前にこれを読む。要件は `TRIP-01` `EXP-10` `SHARE-03` `BOOK-06` `PLAN-08` のような ID で管理されているので、実装や会話でもこの ID で参照できる。「3.2 将来」「3.3 非対象」に**意図的に作らないもの**（割り勘の自動精算、為替APIの自動取得、アプリ内予約完結など）が明記されているため、機能を足す前に必ずここを確認する。

### 定義書と実装の既知の差分

定義書は実装より古い箇所がある。**実装が正**なので、定義書に合わせて直そうとしないこと。

- **写真**：定義書 3.1 / 5.5 は「旅行ごとにカバー写真1枚（`trips/{trip_id}/cover.webp`）」だが、実装は LOG-11（v1.3 メモ）どおり**訪問記録ごとに1枚**。`travel.trips.cover_path` 列と `Trip.cover_path` 型は残っているが**どこからも使われていない**
- **ルーティング**：`/login` は無く、未ログイン時に `AuthPage` を出す方式。旅行詳細のデフォルトタブは `logs` ではなく `plan`（しおり）。定義書に無い `/contact` `/privacy` `/reset` を追加済み
- **未実装**：AUTH-02 の Google ログイン（優先度・推奨）。BOOK-04 のアフィリエイトパラメータも提携審査待ちで未付与

## アーキテクチャ

React 18 + TypeScript + Vite + Tailwind + Supabase の SPA（PWA）。状態管理ライブラリもデータ取得ライブラリも使わず、**ページコンポーネントが `useEffect` で `src/lib/*` の関数を呼び、`useState` に載せる**だけの素朴な構成。

- `src/pages/` … 画面（ルーティングは `App.tsx`）
- `src/lib/` … Supabase アクセス層。**DB を触るコードはすべてここに置く**。コンポーネントから `supabase` クライアントを直接呼ばない
- `src/components/` … 機能ごと（itinerary / logs / expenses / members / map / booking / layout）
- `src/utils/`, `src/data/`, `src/config/` … 整形・定数・提携先設定
- `supabase/*.sql` … スキーマ定義（後述）
- import は `@/` エイリアス（= `src/`）

### 認証とルーティング

`AuthProvider`（`src/context/AuthContext.tsx`）が Supabase セッションを保持し、`App.tsx` が **セッション無し = `AuthPage` のみ / セッション有り = 全ルート + `BottomNav`** で分岐する。個別のルートガードは無い。

`TripDetailPage` はタブ（しおり/記録/支出/集計/仲間）を `?tab=` クエリで切り替える。タブ本体は `src/components/<機能>/…Tab.tsx`。

### Supabase：`travel` スキーマ相乗り

**別アプリ（推し活アプリ）と同じ Supabase プロジェクトを共有し、`travel` スキーマで分離している。** クライアントは `db: { schema: 'travel' }` を既定にしているので、`supabase.from('trips')` は `travel.trips` を指す。ダッシュボードの Settings > API > Exposed schemas に `travel` の登録が必要。

SQL は手動適用（マイグレーションツール無し）。**新規セットアップ時の実行順は `schema.sql` → `schema_plan.sql` → `schema_logs.sql` → `schema_account.sql`。** スキーマを変更するときは、対象ファイルを冪等（`if not exists` / `drop policy if exists`）に保ったまま追記する。

### 権限モデル（RLS が正）

権限判定は DB 側の SECURITY DEFINER 関数 `travel.is_member` / `can_edit` / `is_owner` に集約されている（RLS ポリシーから `trip_members` を直接参照すると無限再帰するため）。ロールは `owner` / `editor` / `viewer`。

- 参照＝メンバー全員、作成＝`can_edit`、更新/削除＝**投稿者本人または旅行オーナー**
- フロント側は `getMyRole()` の結果で編集 UI を出し分けるだけ。**UI の出し分けはあくまで表示上の都合で、実際の防御は RLS。** 新しいテーブルを足すときは必ず RLS を有効化し、同じヘルパー関数でポリシーを書く
- 権限まわりを変更したら `SECURITY_TEST.md` の2アカウント手動テストを実施する

### 押さえておくべき実装上の癖

- **UUID をクライアントで発番する**（`createTrip`、`createLog`）。INSERT の RETURNING で読み戻そうとすると、`trip_members` 行がまだ無い一瞬に RLS で自分のデータが読めない問題が起きるため。この回避は意図的なので戻さないこと
- **金額は必ず `Number()` で変換する**。PostgREST は `numeric` を文字列で返す
- **円換算はビュー `expenses_jpy` が行う**（`travel.trips.exchange_rate` を使用、`security_invoker = true` 必須）。支出の読み取りはテーブルでなくこのビューから
- **招待リンク**：`create_invite` / `accept_invite` RPC 経由のみ。平文トークンは発行時に1度だけ返り、DB にはハッシュのみ。トークンは URL の**ハッシュ部**（`/join#<token>`）に載せてサーバーログに残さない。未ログインで開かれた場合は `localStorage` の `pending_invite` に退避し、ログイン後に `/join` へ戻す（`App.tsx`）
- **`accept_invite` は失敗時に例外ではなく NULL を返す**（SHARE 5.3 のレート制限＝1分5回のため）。`raise exception` にするとトランザクションが巻き戻り、直前に書いた `invite_attempts` の失敗記録まで消えて制限が効かなくなる。文言への変換は `src/lib/members.ts` 側の責務。`travel.invite_attempts` は RLS 有効・ポリシー無し・`authenticated` から権限剥奪で、RPC 以外からは触れない
- **写真**：非公開バケット `trip-photos`、パス規約は `logs/<trip_id>/<log_id>.webp`（Storage の RLS がこのパスから trip_id を取り出して判定するので**規約を崩さない**）。アップロード前に WebP へ圧縮し、表示は1時間の署名付き URL
- **エラー表示は `errMsg()`（`src/utils/error.ts`）を通す**。Supabase のエラーは `Error` ではないため `String(err)` だと `[object Object]` になる
- **ユーザー入力の URL は `safeUrl()`（`src/utils/url.ts`）を通す**。`javascript:` 等を弾く
- 色は Tailwind のセマンティックトークン（`bg` / `surface` / `ink` / `accent` / `muted` など、`tailwind.config.js` で定義）を使い、生の色名は使わない

## デプロイ

`main` に push すると Vercel が自動デプロイ（`DEPLOY.md` に手順と Supabase の Redirect URLs 設定あり）。`.vscode/settings.json` でコミット時に自動 push する設定になっている点に注意。
