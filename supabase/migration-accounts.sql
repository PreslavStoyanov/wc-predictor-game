-- Global accounts table (one per username across all groups)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

alter table accounts disable row level security;

-- Link existing/new participants to an account
alter table participants add column if not exists account_id uuid references accounts(id);
