-- ─────────────────────────────────────────────────────────────────────────────
-- Security hardening migration
-- Creates missing tables, enables RLS on ALL tables, adds strict policies,
-- adds webhook_events table for Stripe idempotency,
-- and adds increment_credits RPC for atomic credit updates.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  plan        text not null default 'free' check (plan in ('free', 'solo', 'growth')),
  credits     integer not null default 0 check (credits >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users read own profile"     on profiles;
drop policy if exists "Users update own profile"   on profiles;
drop policy if exists "Users insert own profile"   on profiles;
drop policy if exists "Service role full access"   on profiles;

create policy "Users read own profile"
  on profiles for select to authenticated
  using (id = auth.uid());

create policy "Users update own profile"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users insert own profile"
  on profiles for insert to authenticated
  with check (id = auth.uid());

-- Service role (Netlify functions) can do everything
create policy "Service role full access on profiles"
  on profiles for all to service_role
  using (true) with check (true);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── analyses ─────────────────────────────────────────────────────────────────
create table if not exists analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  brand_name  text not null,
  result      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table analyses enable row level security;

drop policy if exists "Users manage own analyses" on analyses;
drop policy if exists "Service role full access on analyses" on analyses;

create policy "Users manage own analyses"
  on analyses for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Service role full access on analyses"
  on analyses for all to service_role
  using (true) with check (true);

-- ── brand_knowledge ───────────────────────────────────────────────────────────
create extension if not exists vector;

create table if not exists brand_knowledge (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  brand_name text not null,
  content    text not null,
  embedding  vector(1024),
  created_at timestamptz not null default now()
);

alter table brand_knowledge enable row level security;

drop policy if exists "Users manage own brand knowledge" on brand_knowledge;
drop policy if exists "Service role full access on brand_knowledge" on brand_knowledge;

create policy "Users manage own brand knowledge"
  on brand_knowledge for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Service role full access on brand_knowledge"
  on brand_knowledge for all to service_role
  using (true) with check (true);

-- Vector similarity search function (called by service role from analyze.js)
create or replace function match_brand_knowledge(
  query_embedding vector(1024),
  p_user_id       uuid,
  match_count     int default 5,
  filter_brand    text default null
)
returns table (id uuid, content text, similarity float)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select
    bk.id,
    bk.content,
    1 - (bk.embedding <=> query_embedding) as similarity
  from brand_knowledge bk
  where bk.user_id = p_user_id
    and (filter_brand is null or bk.brand_name ilike filter_brand)
  order by bk.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ── recovery_codes ────────────────────────────────────────────────────────────
create table if not exists recovery_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code_hash   text not null,
  created_at  timestamptz not null default now(),
  unique (user_id)
);

alter table recovery_codes enable row level security;

drop policy if exists "Users manage own recovery codes" on recovery_codes;

create policy "Users manage own recovery codes"
  on recovery_codes for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── newsletter_subscribers ────────────────────────────────────────────────────
-- Table already created in 20240103; ensure RLS is on and service role can write
alter table if exists newsletter_subscribers enable row level security;

drop policy if exists "Service role manages newsletter" on newsletter_subscribers;

create policy "Service role manages newsletter"
  on newsletter_subscribers for all to service_role
  using (true) with check (true);

-- ── webhook_events (Stripe idempotency) ──────────────────────────────────────
create table if not exists webhook_events (
  id              uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  processed_at    timestamptz not null default now()
);

alter table webhook_events enable row level security;

-- Only service role (Netlify webhook function) may read/write
create policy "Service role manages webhook events"
  on webhook_events for all to service_role
  using (true) with check (true);

-- Auto-purge events older than 30 days (keeps table lean)
-- Run this periodically via pg_cron or a scheduled function if available.

-- ── Atomic credit increment (avoids race conditions) ─────────────────────────
create or replace function increment_credits(p_user_id uuid, p_amount integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles
  set credits = credits + p_amount,
      updated_at = now()
  where id = p_user_id;
end;
$$;

-- ── Row-level indexes for performance ────────────────────────────────────────
create index if not exists idx_analyses_user_id        on analyses(user_id);
create index if not exists idx_brand_knowledge_user_id on brand_knowledge(user_id);
create index if not exists idx_brand_knowledge_brand   on brand_knowledge(user_id, brand_name);
create index if not exists idx_webhook_events_stripe   on webhook_events(stripe_event_id);
