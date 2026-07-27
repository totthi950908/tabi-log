-- =============================================================
--  たびろぐ  アカウント削除
-- =============================================================
--  ログイン中の本人が、自分のアカウントを削除できるようにする RPC。
--  管理キー（service_role）をフロントに置かずに済むよう、
--  SECURITY DEFINER 関数の中で auth.users から自分を削除する。
--
--  auth.users への各テーブルの外部キーは ON DELETE CASCADE なので、
--  この削除で以下も連鎖的に消える：
--   - profiles / trip_members
--   - 本人が author/payer/created_by の logs・expenses・bookings・plan_items
--   - 本人が owner の trips（および配下データ）
-- =============================================================

create or replace function travel.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function travel.delete_own_account() to authenticated;

-- 以上。SQL Editor で実行すること。
