# たびろぐ 本番公開（Vercel）手順

推し活アプリと同じ Vercel + Supabase 構成で公開します。所要 15〜20分ほど。

---

## 事前チェック

- `.env.local` に Supabase の URL と anon キーが入っている（ローカルで動いている状態）
- `.gitignore` に `.env.local` と `node_modules` が入っている（→ 秘密情報とサイズの大きいフォルダは Git に上げない。設定済み）

---

## 手順1：GitHub にプッシュ

VS Code のターミナルで、`tabi-log` フォルダにいる状態で実行します。

```bash
cd ~/Desktop/VS\ CODE/tabi-log

# まだ git 管理していなければ初期化
git init
git add .
git commit -m "たびろぐ 初期リリース"
```

次に GitHub で**新しい空のリポジトリ**（例：`tabi-log`）を作り、表示される URL をコピーして：

```bash
git remote add origin https://github.com/あなたのID/tabi-log.git
git branch -M main
git push -u origin main
```

> 推し活アプリとは**別リポジトリ**にしてください。

---

## 手順2：Vercel でインポート

1. [https://vercel.com](https://vercel.com) にログイン（GitHub アカウントでOK）
2. 「Add New… → Project」→ さきほどの `tabi-log` リポジトリを選ぶ
3. 設定は基本そのままでOK（Vite を自動検出。Build=`npm run build` / Output=`dist`。SPA 用の書き換えは `vercel.json` が担当）
4. **Environment Variables** に以下2つを追加（値は `.env.local` と同じ）：

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://pfufcjswblmyzkpmieoi.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `.env.local` の anon キー |

5. 「Deploy」を押す → 数分で `https://tabi-log-xxxx.vercel.app` のような URL が発行される

---

## 手順3：Supabase に本番URLを許可（重要）

公開ドメインでログイン・招待が動くように、Redirect URLs に本番URLを足します。

1. Supabase ダッシュボード → **Authentication → URL Configuration**
2. **Redirect URLs** に「Add URL」で次を追加（`tabi-log-xxxx` は実際のドメインに置き換え）：
   ```
   https://tabi-log-xxxx.vercel.app/**
   ```
3. **Site URL は変更しない**（推し活アプリと共有しているため）

> 招待リンクは開いた画面のドメインを自動で使うので、本番では本番URLのリンクが発行されます。追加設定は不要です。

---

## 手順4：スマホのホーム画面に追加（PWA）

公開URLをスマホのブラウザで開き、共有メニューから「ホーム画面に追加」。✈️アイコンのアプリとして起動できます。

---

## 補足：7日放置の一時停止について

Supabase 無料プランは7日間アクセスがないとプロジェクトが一時停止します。あなたと友人が定期的に使えば起きませんが、心配なら1日1回どこかのページを開くだけでOKです。

## 補足：更新のしかた

コードを直したら、`git add . && git commit -m "説明" && git push` するだけで、Vercel が自動で再デプロイします。
