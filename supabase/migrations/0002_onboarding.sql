-- Track whether a user has finished the first-run onboarding.
alter table public.profiles
  add column if not exists onboarded boolean not null default false;
