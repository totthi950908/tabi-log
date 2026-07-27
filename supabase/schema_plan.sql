-- =============================================================
--  たびろぐ  しおり（旅のしおり）追加分  ステップ4.5
-- =============================================================
--  schema.sql を流したあとに、このファイルを Supabase の SQL Editor で実行する。
--  「予約情報（bookings）」と「日程（plan_items）」の2テーブルを追加する。
--  RLS は既存の travel.is_member / can_edit / is_owner をそのまま使う。
-- =============================================================

-- ---- 予約情報（航空券・ホテルなど）-------------------------
create table if not exists travel.bookings (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references travel.trips(id) on delete cascade,
  type            text not null check (type in ('flight','hotel','transport','other')),
  title           text not null,          -- 便名/区間、ホテル名 など
  provider        text,                    -- 航空会社、予約サイト
  confirmation_no text,                    -- 予約番号
  start_at        timestamptz,             -- 出発 / チェックイン
  end_at          timestamptz,             -- 到着 / チェックアウト
  from_place      text,                    -- 出発地（flight）
  to_place        text,                    -- 到着地（flight）
  location        text,                    -- ホテル住所・場所
  url             text,
  memo            text,
  created_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now()
);

-- ---- 日程（スケジュール項目）-------------------------------
create table if not exists travel.plan_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references travel.trips(id) on delete cascade,
  day_date    date not null,               -- どの日か
  start_time  time,                         -- 時刻（任意）
  title       text not null,
  category    text check (category in
                ('移動','食事','観光','買い物','宿泊','その他')),
  place       text,
  memo        text,
  sort_order  integer not null default 0,   -- 同時刻・時刻なしの並び順
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists idx_bookings_trip     on travel.bookings (trip_id, start_at);
create index if not exists idx_plan_items_trip    on travel.plan_items (trip_id, day_date, start_time);

-- =============================================================
--  RLS
-- =============================================================
alter table travel.bookings   enable row level security;
alter table travel.plan_items enable row level security;

-- ---- bookings ----------------------------------------------
drop policy if exists bookings_select on travel.bookings;
create policy bookings_select on travel.bookings
  for select to authenticated using (travel.is_member(trip_id));

drop policy if exists bookings_insert on travel.bookings;
create policy bookings_insert on travel.bookings
  for insert to authenticated
  with check (travel.can_edit(trip_id) and created_by = auth.uid());

drop policy if exists bookings_update on travel.bookings;
create policy bookings_update on travel.bookings
  for update to authenticated
  using (travel.can_edit(trip_id));

drop policy if exists bookings_delete on travel.bookings;
create policy bookings_delete on travel.bookings
  for delete to authenticated
  using (created_by = auth.uid() or travel.is_owner(trip_id));

-- ---- plan_items --------------------------------------------
drop policy if exists plan_items_select on travel.plan_items;
create policy plan_items_select on travel.plan_items
  for select to authenticated using (travel.is_member(trip_id));

drop policy if exists plan_items_insert on travel.plan_items;
create policy plan_items_insert on travel.plan_items
  for insert to authenticated
  with check (travel.can_edit(trip_id) and created_by = auth.uid());

drop policy if exists plan_items_update on travel.plan_items;
create policy plan_items_update on travel.plan_items
  for update to authenticated
  using (travel.can_edit(trip_id));

drop policy if exists plan_items_delete on travel.plan_items;
create policy plan_items_delete on travel.plan_items
  for delete to authenticated
  using (created_by = auth.uid() or travel.is_owner(trip_id));

-- =============================================================
--  権限
-- =============================================================
grant select, insert, update, delete on travel.bookings   to authenticated;
grant select, insert, update, delete on travel.plan_items to authenticated;

-- 以上。schema.sql の後に実行すること。
