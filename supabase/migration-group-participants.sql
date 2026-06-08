-- Create the new group_participants many-to-many table
-- Uses same UUIDs as old participants rows so predictions still work

create table if not exists group_participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(group_id, account_id)
);

alter table group_participants disable row level security;

-- For any participant still missing an account, create a placeholder account
-- (password 'RESET_REQUIRED' will never match a real SHA-256 hash)
insert into accounts (username, password_hash)
select distinct p.username, 'RESET_REQUIRED'
from participants p
where p.account_id is null
on conflict (username) do nothing;

-- Link those participants to their new (or existing) account
update participants p
set account_id = a.id
from accounts a
where p.username = a.username
  and p.account_id is null;

-- Migrate all participants into group_participants (keeping same UUID so predictions still work)
insert into group_participants (id, group_id, account_id, joined_at)
select p.id, p.group_id, p.account_id, p.created_at
from participants p
where p.account_id is not null
on conflict (group_id, account_id) do nothing;
