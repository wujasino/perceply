-- Recovery codes table: one row per user, stores hashed backup code
create table if not exists recovery_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code_hash   text not null,          -- bcrypt/sha256 hash so plain text never persists
  created_at  timestamptz default now(),
  used_at     timestamptz,
  unique (user_id)
);

-- Only the owning user can read/write their own row
alter table recovery_codes enable row level security;

create policy "User owns recovery code" on recovery_codes
  for all
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
