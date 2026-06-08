-- Groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_at timestamptz default now()
);

-- Participants (one record per user per group)
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  group_id uuid references groups(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(username, group_id)
);

-- Matches
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  match_date timestamptz not null,
  home_score integer,
  away_score integer,
  is_finished boolean default false,
  stage text default 'Group Stage',
  group_label text,
  created_at timestamptz default now()
);

-- Predictions
create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade not null,
  match_id uuid references matches(id) on delete cascade not null,
  home_score integer not null,
  away_score integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(participant_id, match_id)
);

-- Disable RLS for simplicity (enable and configure if you want row-level security)
alter table groups disable row level security;
alter table participants disable row level security;
alter table matches disable row level security;
alter table predictions disable row level security;
