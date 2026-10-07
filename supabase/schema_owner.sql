-- =============================================================
--  たびろぐ  オーナー権限の委譲（SHARE-08）
-- =============================================================
--  オーナーは旅行から退出できない（owner 行は RLS で誰も消せない）。
--  退出したいときは、先に別のメンバーへオーナー権限を委譲する。
--
--  オーナーは2か所に記録されている：
--   - travel.trip_members.role = 'owner'  … 権限判定（is_owner）はこちら
--   - travel.trips.owner_id               … 画面の出し分けと、アカウント削除時の CASCADE
--  この2つを同時に書き換えるため、委譲は RPC でしか行えないようにする。
--
--  schema.sql の後に SQL Editor で実行する。何度流しても壊れない。
-- =============================================================

-- ---- 委譲 RPC -----------------------------------------------
--  現オーナーだけが呼べる。相手は同じ旅行のメンバーであること。
--  委譲後、元オーナーは「編集可」になる（その後は通常どおり退出できる）。
create or replace function travel.transfer_ownership(
  p_trip_id   uuid,
  p_new_owner uuid
)
returns void
language plpgsql
security definer
set search_path = travel, public
as $$
begin
  if not travel.is_owner(p_trip_id) then
    raise exception 'オーナーだけが権限を委譲できます';
  end if;
  if p_new_owner = auth.uid() then
    raise exception 'すでにオーナーです';
  end if;

  -- 同時に2回呼ばれても二重オーナーにならないよう、旅行の行をロックする。
  perform 1 from travel.trips where id = p_trip_id for update;

  if not exists (
    select 1 from travel.trip_members
    where trip_id = p_trip_id and user_id = p_new_owner
  ) then
    raise exception 'この旅行のメンバーではありません';
  end if;

  update travel.trip_members
  set role = 'editor'
  where trip_id = p_trip_id and user_id = auth.uid();

  update travel.trip_members
  set role = 'owner'
  where trip_id = p_trip_id and user_id = p_new_owner;

  update travel.trips
  set owner_id = p_new_owner
  where id = p_trip_id;
end;
$$;

grant execute on function travel.transfer_ownership(uuid, uuid) to authenticated;

-- ---- owner_id の直接書き換えを禁止 ---------------------------
--  trips の UPDATE ポリシーは can_edit（編集可メンバー）なので、そのままだと
--  編集者が owner_id を自分に書き換えられてしまう。権限判定には使われないが、
--  その人がアカウントを削除すると CASCADE で旅行ごと消えるため塞いでおく。
--
--  PostgREST からの更新は current_user が authenticated になる。
--  上の RPC は SECURITY DEFINER なので関数の所有者として動き、ここを通過できる。
--  （このトリガー関数自体を SECURITY DEFINER にすると判定できなくなるので付けない）
create or replace function travel.guard_owner_id()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is distinct from old.owner_id
     and current_user in ('authenticated', 'anon') then
    raise exception 'オーナーの変更は「オーナー権限を渡す」から行ってください';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_owner_id on travel.trips;
create trigger trg_guard_owner_id
before update on travel.trips
for each row execute function travel.guard_owner_id();

-- 以上。
