-- =============================================================
--  たびろぐ  訪問記録の写真対応  ステップ5
-- =============================================================
--  schema.sql / schema_plan.sql のあとに、このファイルを SQL Editor で実行する。
--   1) logs に写真パス列を追加
--   2) 非公開の写真バケットを作成
--   3) 写真バケットに「その旅行のメンバーだけ読み書きできる」ポリシーを設定
-- =============================================================

-- ---- 1) 記録に写真パス列を追加 -----------------------------
alter table travel.logs
  add column if not exists photo_path text;   -- Storage 上のパス（例 logs/<trip_id>/<log_id>.webp）

-- ---- 2) 非公開バケットを作成 -------------------------------
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', false)
on conflict (id) do nothing;

-- ---- 3) Storage のアクセス制御 -----------------------------
--  パス規約： logs/<trip_id>/<ファイル名>
--  → (storage.foldername(name))[1] = 'logs'
--     (storage.foldername(name))[2] = <trip_id>
--  travel.is_member / can_edit / is_owner で判定する。

-- 閲覧：その旅行のメンバー
drop policy if exists trip_photos_select on storage.objects;
create policy trip_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'trip-photos'
    and travel.is_member(((storage.foldername(name))[2])::uuid)
  );

-- アップロード：編集権限のあるメンバー
drop policy if exists trip_photos_insert on storage.objects;
create policy trip_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trip-photos'
    and travel.can_edit(((storage.foldername(name))[2])::uuid)
  );

-- 差し替え（upsert 時の update）：編集権限のあるメンバー
drop policy if exists trip_photos_update on storage.objects;
create policy trip_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'trip-photos'
    and travel.can_edit(((storage.foldername(name))[2])::uuid)
  );

-- 削除：アップロード者本人、または旅行のオーナー
drop policy if exists trip_photos_delete on storage.objects;
create policy trip_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'trip-photos'
    and (
      owner = auth.uid()
      or travel.is_owner(((storage.foldername(name))[2])::uuid)
    )
  );

-- 以上。schema.sql・schema_plan.sql の後に実行すること。
