-- brand_monitors: per-user monitoring automation configured via the AI chat assistant.
-- One row per user (the PoC keeps a single active monitor); the chat tools upsert this row.
create table if not exists brand_monitors (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  brand           text,
  competitors     text[]      not null default '{}',
  frequency       text        not null default 'weekly'
                    check (frequency in ('daily', 'weekly', 'monthly')),
  models          text[]      not null default '{gpt-4o,claude,gemini}',
  alert_metric    text        check (alert_metric in ('sentiment', 'visibility', 'mentions')),
  alert_threshold int         check (alert_threshold between 0 and 100),
  enabled         boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

-- Only the owning user can read/write their own monitor (defense in depth;
-- the chat serverless function uses the service role and scopes by verified user id).
alter table brand_monitors enable row level security;

create policy "User owns brand monitor" on brand_monitors
  for all
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep updated_at fresh on every change.
create or replace function set_brand_monitors_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_brand_monitors_updated_at on brand_monitors;
create trigger trg_brand_monitors_updated_at
  before update on brand_monitors
  for each row execute function set_brand_monitors_updated_at();
