-- MuslimProMax core schema
-- Profiles, prayer log, streaks/period-pause, and Prayer Circles (social).
-- Everything is protected by Row Level Security so a user can only ever read
-- their own data plus the circles they belong to.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  display_name    text,
  avatar_emoji    text default '🕌',
  city            text,
  timezone        text default 'UTC',
  noor_score      int  not null default 50,     -- 0..100 daily focus number
  current_streak  int  not null default 0,
  longest_streak  int  not null default 0,
  period_pause    boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Prayer log
-- ---------------------------------------------------------------------------
create type prayer_name   as enum ('fajr','dhuhr','asr','maghrib','isha');
create type prayer_status as enum ('on_time','late','qada','missed');
create type verify_method as enum ('honor','proof_ai','manual');

create table public.prayers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          prayer_name not null,
  prayed_at     timestamptz,
  scheduled_at  timestamptz not null,
  status        prayer_status not null default 'on_time',
  verified      boolean not null default false,
  method        verify_method not null default 'honor',
  local_date    date not null,                 -- for per-day uniqueness/streaks
  created_at    timestamptz not null default now(),
  unique (user_id, name, local_date)
);
create index on public.prayers (user_id, local_date);

-- ---------------------------------------------------------------------------
-- Period Pause (holds streak + silences reminders; no broken streaks, no guilt)
-- ---------------------------------------------------------------------------
create table public.streak_pauses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date   date,                             -- null = ongoing
  reason     text not null default 'menses',
  created_at timestamptz not null default now()
);
create index on public.streak_pauses (user_id);

-- ---------------------------------------------------------------------------
-- Prayer Circles (social accountability)
-- ---------------------------------------------------------------------------
create table public.circles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null default upper(substr(encode(gen_random_bytes(6),'hex'),1,6)),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member',    -- 'owner' | 'member'
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index on public.circle_members (user_id);

-- Append-only activity feed shared within a circle.
create table public.circle_feed (
  id         uuid primary key default gen_random_uuid(),
  circle_id  uuid not null references public.circles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,                    -- 'prayed_on_time' | 'streak_milestone' | 'nudge' | 'join'
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.circle_feed (circle_id, created_at desc);

-- AI verification metadata ONLY (never the image, never pixels).
create table public.verifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  prayer_id  uuid references public.prayers(id) on delete set null,
  method     verify_method not null,
  confidence real,                             -- 0..1 from the model
  model      text,                             -- e.g. 'claude-haiku-5-5'
  passed     boolean not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper: is the current user a member of a given circle?
-- ---------------------------------------------------------------------------
create or replace function public.is_circle_member(c uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = c and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.prayers        enable row level security;
alter table public.streak_pauses  enable row level security;
alter table public.circles        enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_feed    enable row level security;
alter table public.verifications  enable row level security;

-- Profiles: anyone authenticated can read basic profiles (for circle display);
-- only the owner can write their row.
create policy "profiles read"   on public.profiles for select to authenticated using (true);
create policy "profiles insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update" on public.profiles for update to authenticated using (id = auth.uid());

-- Prayers / pauses / verifications: strictly owner-only.
create policy "own prayers"       on public.prayers       for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own pauses"        on public.streak_pauses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own verifications" on public.verifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Circles: members can read; anyone can create (becomes owner).
create policy "circles read"   on public.circles for select to authenticated using (public.is_circle_member(id) or owner_id = auth.uid());
create policy "circles insert" on public.circles for insert to authenticated with check (owner_id = auth.uid());
create policy "circles update" on public.circles for update to authenticated using (owner_id = auth.uid());

-- Membership: you can read members of circles you're in; you can add/remove yourself.
create policy "members read"   on public.circle_members for select to authenticated using (public.is_circle_member(circle_id));
create policy "members join"   on public.circle_members for insert to authenticated with check (user_id = auth.uid());
create policy "members leave"  on public.circle_members for delete to authenticated using (user_id = auth.uid());

-- Feed: members read; members post as themselves.
create policy "feed read"  on public.circle_feed for select to authenticated using (public.is_circle_member(circle_id));
create policy "feed write" on public.circle_feed for insert to authenticated with check (user_id = auth.uid() and public.is_circle_member(circle_id));

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'muslim_' || substr(new.id::text,1,8)),
    new.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
