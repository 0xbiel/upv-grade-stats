-- grade_shares.sql
-- Purpose: Create encrypted share storage with TTL in Supabase
-- Usage: Paste into Supabase SQL Editor and run. Adjust policies to your needs.

begin;

-- Required for gen_random_uuid()
create extension if not exists pgcrypto with schema public;

-- Main table
create table if not exists public.grade_shares (
  id uuid primary key default gen_random_uuid(),
  payload text not null,                            -- encrypted data: base64url(iv):base64url(ciphertext)
  expires_at timestamptz not null default (now() + interval '7 days'), -- default TTL fallback
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists grade_shares_expires_at_idx on public.grade_shares (expires_at);
create index if not exists grade_shares_created_at_idx on public.grade_shares (created_at);

-- Enable RLS (Row Level Security)
alter table public.grade_shares enable row level security;

-- Policies: allow public insert and read of non-expired rows.
-- Adjust roles as needed (e.g., restrict to 'authenticated').

-- Insert policy
drop policy if exists "Allow insert from anon or authenticated" on public.grade_shares;
create policy "Allow insert from anon or authenticated"
  on public.grade_shares
  for insert
  to anon, authenticated
  with check (true);

-- Select policy (only non-expired rows)
drop policy if exists "Allow select non-expired to anon or authenticated" on public.grade_shares;
create policy "Allow select non-expired to anon or authenticated"
  on public.grade_shares
  for select
  to anon, authenticated
  using (expires_at > now());

commit;

-- Optional: Scheduled cleanup of expired rows (requires pg_cron extension)
-- Note: Not all Supabase projects have pg_cron enabled. If available:
-- create extension if not exists pg_cron;
-- -- Hourly purge of expired shares
-- select cron.schedule(
--   'purge_grade_shares_hourly',
--   '0 * * * *',
--   $$ delete from public.grade_shares where expires_at < now(); $$
-- );

-- Manual purge command you can run anytime:
-- delete from public.grade_shares where expires_at < now();
