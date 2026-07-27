-- =============================================================
--  たびろぐ（tabi-log） データベース定義  ステップ2
-- =============================================================
--  Supabase の SQL Editor にこのファイル全体を貼り付けて実行する。
--  推し活アプリと同じプロジェクトに、travel スキーマとして相乗りする。
--
--  【実行後に手動で必要な設定】
--   Supabase ダッシュボード > Settings > API > Exposed schemas に
--   「travel」を追加すること（これをしないとフロントから travel が見えない）。
--
--  何度流しても壊れないよう、なるべく冪等（idempotent）に書いてある。
-- =============================================================

-- 拡張機能（トークン生成・ハッシュに使用）。Supabase では extensions スキーマに入る。
create extension if not exists pgcrypto with schema extensions;

-- スキーマ本体
create schema if not exists travel;

-- PostgREST から使えるように権限を付与（行レベルの可否は RLS が制御する）
grant usage on schema travel to authenticated;
-- anon（未ログイン）にはスキーマ利用を許可しない。招待受諾も要ログインとする。


-- =============================================================
--  1. テーブル
-- =============================================================

-- ---- プロフィール -------------------------------------------
create table if not exists travel.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'たびびと',
  emoji        text not null default '🧳',
  created_at   timestamptz not null default now()
);

-- ---- 旅行 ---------------------------------------------------
create table if not exists travel.trips (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  destination    text,
  start_date     date not null,
  end_date       date not null,
  cover_path     text,
  budget         integer check (budget is null or budget >= 0),
  default_country char(2) not null default 'JP',
  local_currency char(3),                    -- NULL なら国内旅行（円のみ）
  exchange_rate  numeric(14,6) check (exchange_rate is null or exchange_rate > 0),
  memo           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint trips_date_order check (end_date >= start_date),
  -- 現地通貨を設定するならレートも必須（両方セットか両方 NULL）
  constraint trips_currency_rate_together check (
    (local_currency is null and exchange_rate is null)
    or (local_currency is not null and exchange_rate is not null)
  )
);

-- ---- メンバー -----------------------------------------------
create table if not exists travel.trip_members (
  trip_id  uuid not null references travel.trips(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  role     text not null check (role in ('owner','editor','viewer')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- ---- 招待リンク ---------------------------------------------
create table if not exists travel.invites (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references travel.trips(id) on delete cascade,
  token_hash text not null unique,           -- SHA-256（平文トークンは保存しない）
  role       text not null check (role in ('editor','viewer')),
  expires_at timestamptz not null,
  max_uses   integer not null default 10 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  revoked_at timestamptz,                     -- NULL なら有効
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---- 訪問記録 -----------------------------------------------
create table if not exists travel.logs (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references travel.trips(id) on delete cascade,
  author_id    uuid not null references auth.users(id) on delete cascade,
  place_name   text not null,
  visited_at   timestamptz not null,
  country_code char(2) not null default 'JP',
  prefecture   text,
  category     text check (category in
                 ('観光地','食事','宿泊','移動','買い物','温泉','その他')),
  rating       smallint check (rating between 1 and 5),
  note         text,
  created_at   timestamptz not null default now(),
  -- 都道府県は日本のときだけ
  constraint logs_prefecture_only_jp check (country_code = 'JP' or prefecture is null)
);

-- ---- 支出 ---------------------------------------------------
create table if not exists travel.expenses (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references travel.trips(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  payer_id   uuid not null references auth.users(id) on delete cascade,
  spent_on   date not null,
  category   text check (category in
               ('交通費','宿泊費','食費','観光費','お土産','その他')),
  amount     numeric(14,2) not null check (amount > 0),  -- 入力通貨での金額
  currency   char(3) not null default 'JPY',             -- 'JPY' または旅行の現地通貨
  memo       text,
  log_id     uuid references travel.logs(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---- インデックス -------------------------------------------
create index if not exists idx_trip_members_user   on travel.trip_members (user_id);
create index if not exists idx_logs_trip_visited    on travel.logs (trip_id, visited_at desc);
create index if not exists idx_expenses_trip_spent  on travel.expenses (trip_id, spent_on desc);
create index if not exists idx_invites_token_hash   on travel.invites (token_hash);
create index if not exists idx_trips_owner          on travel.trips (owner_id);


-- =============================================================
--  2. ヘルパー関数（RLS の再帰を避けるための要）
-- =============================================================
--  RLS ポリシーから trip_members を直接参照すると無限再帰になる。
--  SECURITY DEFINER 関数経由なら RLS を迂回して判定できる。

create or replace function travel.is_member(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = travel, public
stable
as $$
  select exists (
    select 1 from travel.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

create or replace function travel.can_edit(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = travel, public
stable
as $$
  select exists (
    select 1 from travel.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
      and role in ('owner','editor')
  );
$$;

create or replace function travel.is_owner(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = travel, public
stable
as $$
  select exists (
    select 1 from travel.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;


-- =============================================================
--  3. トリガー
-- =============================================================

-- (a) 旅行を作った本人を自動で owner メンバーに登録する。
--     これをしないと、作成直後は trip_members に行がなく、
--     RLS により作成者が自分の旅行を読めなくなる。
create or replace function travel.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = travel, public
as $$
begin
  insert into travel.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (trip_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_add_owner_as_member on travel.trips;
create trigger trg_add_owner_as_member
after insert on travel.trips
for each row execute function travel.add_owner_as_member();

-- (b) trips.updated_at を自動更新する。
create or replace function travel.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_trips on travel.trips;
create trigger trg_touch_trips
before update on travel.trips
for each row execute function travel.touch_updated_at();

-- (c) サインアップ時にプロフィールを自動作成する（Supabase 定番パターン）。
--     クライアント側の upsert でも代替できるが、あると確実。
create or replace function travel.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = travel, public
as $$
begin
  insert into travel.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'たびびと'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
after insert on auth.users
for each row execute function travel.handle_new_user();


-- =============================================================
--  4. 円換算ビュー（レートを1箇所直せば全支出に反映）
-- =============================================================
--  security_invoker = true が必須。付けないと呼び出し元の RLS が効かず、
--  他人の支出まで見えてしまう。
create or replace view travel.expenses_jpy
with (security_invoker = true) as
select
  e.*,
  case
    when e.currency = 'JPY' then round(e.amount)
    else round(e.amount * coalesce(t.exchange_rate, 1))
  end as amount_jpy
from travel.expenses e
join travel.trips t on t.id = e.trip_id;


-- =============================================================
--  5. RLS（行レベルセキュリティ）
-- =============================================================
--  全テーブルで有効化する。例外なし。

alter table travel.profiles     enable row level security;
alter table travel.trips        enable row level security;
alter table travel.trip_members enable row level security;
alter table travel.invites      enable row level security;
alter table travel.logs         enable row level security;
alter table travel.expenses     enable row level security;

-- ---- profiles ----------------------------------------------
-- 表示名と絵文字のみで機微情報はないため、ログインユーザーには閲覧を許可。
drop policy if exists profiles_select on travel.profiles;
create policy profiles_select on travel.profiles
  for select to authenticated using (true);

drop policy if exists profiles_upsert on travel.profiles;
create policy profiles_upsert on travel.profiles
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists profiles_update on travel.profiles;
create policy profiles_update on travel.profiles
  for update to authenticated using (user_id = auth.uid());

-- ---- trips -------------------------------------------------
drop policy if exists trips_select on travel.trips;
create policy trips_select on travel.trips
  for select to authenticated using (travel.is_member(id));

drop policy if exists trips_insert on travel.trips;
create policy trips_insert on travel.trips
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists trips_update on travel.trips;
create policy trips_update on travel.trips
  for update to authenticated using (travel.can_edit(id));

drop policy if exists trips_delete on travel.trips;
create policy trips_delete on travel.trips
  for delete to authenticated using (travel.is_owner(id));

-- ---- trip_members ------------------------------------------
-- 参照は同じ旅行のメンバーのみ。
drop policy if exists members_select on travel.trip_members;
create policy members_select on travel.trip_members
  for select to authenticated using (travel.is_member(trip_id));

-- 追加は招待受諾 RPC（SECURITY DEFINER）経由のみ。直接 INSERT は不可（ポリシーなし＝拒否）。

-- 権限変更はオーナーのみ。ただし owner 行の role は変更させない。
drop policy if exists members_update on travel.trip_members;
create policy members_update on travel.trip_members
  for update to authenticated
  using (travel.is_owner(trip_id) and role <> 'owner');

-- 削除：自分で退出（owner を除く）、またはオーナーが非オーナーを外す。
-- owner 行は誰も消せない（SHARE-08）。
drop policy if exists members_delete on travel.trip_members;
create policy members_delete on travel.trip_members
  for delete to authenticated
  using (
    (user_id = auth.uid() and role <> 'owner')
    or (travel.is_owner(trip_id) and role <> 'owner')
  );

-- ---- invites -----------------------------------------------
-- 発行・受諾は RPC 経由。オーナーは一覧と失効のため SELECT / UPDATE を許可。
-- token_hash はハッシュなので露出しても安全。
drop policy if exists invites_select on travel.invites;
create policy invites_select on travel.invites
  for select to authenticated using (travel.is_owner(trip_id));

drop policy if exists invites_update on travel.invites;
create policy invites_update on travel.invites
  for update to authenticated using (travel.is_owner(trip_id));
-- INSERT ポリシーは置かない（create_invite RPC が SECURITY DEFINER で行う）。

-- ---- logs --------------------------------------------------
drop policy if exists logs_select on travel.logs;
create policy logs_select on travel.logs
  for select to authenticated using (travel.is_member(trip_id));

drop policy if exists logs_insert on travel.logs;
create policy logs_insert on travel.logs
  for insert to authenticated
  with check (travel.can_edit(trip_id) and author_id = auth.uid());

drop policy if exists logs_update on travel.logs;
create policy logs_update on travel.logs
  for update to authenticated
  using (author_id = auth.uid() or travel.is_owner(trip_id));

drop policy if exists logs_delete on travel.logs;
create policy logs_delete on travel.logs
  for delete to authenticated
  using (author_id = auth.uid() or travel.is_owner(trip_id));

-- ---- expenses ----------------------------------------------
drop policy if exists expenses_select on travel.expenses;
create policy expenses_select on travel.expenses
  for select to authenticated using (travel.is_member(trip_id));

drop policy if exists expenses_insert on travel.expenses;
create policy expenses_insert on travel.expenses
  for insert to authenticated
  with check (travel.can_edit(trip_id) and author_id = auth.uid());

drop policy if exists expenses_update on travel.expenses;
create policy expenses_update on travel.expenses
  for update to authenticated
  using (author_id = auth.uid() or travel.is_owner(trip_id));

drop policy if exists expenses_delete on travel.expenses;
create policy expenses_delete on travel.expenses
  for delete to authenticated
  using (author_id = auth.uid() or travel.is_owner(trip_id));


-- =============================================================
--  6. 招待リンクの RPC（発行・受諾）
-- =============================================================

-- ---- 発行 ---------------------------------------------------
--  オーナーだけが呼べる。サーバー側で暗号乱数トークンを生成し、
--  ハッシュのみ保存。平文トークンは戻り値として「1度だけ」返す。
create or replace function travel.create_invite(
  p_trip_id uuid,
  p_role    text default 'editor',
  p_ttl_days integer default 7,
  p_max_uses integer default 10
)
returns text                     -- 平文トークン（この1回しか取得できない）
language plpgsql
security definer
set search_path = travel, extensions, public
as $$
declare
  v_token text;
  v_hash  text;
begin
  if not travel.is_owner(p_trip_id) then
    raise exception 'この旅行の招待を作成する権限がありません';
  end if;
  if p_role not in ('editor','viewer') then
    raise exception '権限は editor か viewer を指定してください';
  end if;

  -- 32バイトの暗号乱数を URL セーフな文字列に。
  v_token := rtrim(translate(encode(gen_random_bytes(32),'base64'),'+/','-_'),'=');
  v_hash  := encode(digest(v_token,'sha256'),'hex');

  insert into travel.invites (trip_id, token_hash, role, expires_at, max_uses, created_by)
  values (
    p_trip_id, v_hash, p_role,
    now() + make_interval(days => greatest(p_ttl_days, 1)),
    greatest(p_max_uses, 1),
    auth.uid()
  );

  return v_token;
end;
$$;

-- ---- 受諾 ---------------------------------------------------
--  ログイン済みユーザーが平文トークンを渡して参加する。
--  期限・回数・失効をチェックし、重複参加を防ぐ。
create or replace function travel.accept_invite(p_token text)
returns uuid                     -- 参加した旅行の id
language plpgsql
security definer
set search_path = travel, extensions, public
as $$
declare
  v_hash   text;
  v_invite travel.invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;

  v_hash := encode(digest(coalesce(p_token,''),'sha256'),'hex');

  -- 行ロックして競合を防ぐ。
  select * into v_invite
  from travel.invites
  where token_hash = v_hash
  for update;

  -- 「存在しない」「期限切れ」「失効」「上限到達」を区別せず一律エラーにする
  -- （リンクの存在有無を探られないようにするため）。
  if v_invite.id is null
     or v_invite.revoked_at is not null
     or v_invite.expires_at < now()
     or v_invite.used_count >= v_invite.max_uses then
    raise exception 'このリンクは使用できません';
  end if;

  -- すでにメンバーなら、使用回数を増やさずに旅行 id だけ返す。
  if exists (
    select 1 from travel.trip_members
    where trip_id = v_invite.trip_id and user_id = auth.uid()
  ) then
    return v_invite.trip_id;
  end if;

  insert into travel.trip_members (trip_id, user_id, role)
  values (v_invite.trip_id, auth.uid(), v_invite.role);

  update travel.invites
  set used_count = used_count + 1
  where id = v_invite.id;

  return v_invite.trip_id;
end;
$$;


-- =============================================================
--  7. テーブル・関数の実行権限
-- =============================================================
grant select, insert, update, delete on all tables in schema travel to authenticated;
grant execute on function travel.create_invite(uuid, text, integer, integer) to authenticated;
grant execute on function travel.accept_invite(text) to authenticated;
-- ヘルパー関数は RLS 内部からのみ使うが、実行権限は付けておく。
grant execute on function travel.is_member(uuid)  to authenticated;
grant execute on function travel.can_edit(uuid)   to authenticated;
grant execute on function travel.is_owner(uuid)   to authenticated;

-- 以上。Exposed schemas に travel を追加するのを忘れずに。
