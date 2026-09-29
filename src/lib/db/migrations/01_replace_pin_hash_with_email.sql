-- ==============================================================================
-- AUREVÉ DATABASE MIGRATION: Replace pin_hash with verified email
-- ==============================================================================
-- Run this migration in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Add email column to public.users (type text)
alter table public.users add column if not exists email text;

-- 2. Safely populate existing records from Supabase Auth (auth.users)
-- Matches records by user id and copies the exact verified Google/Auth email
update public.users u
set email = a.email
from auth.users a
where u.id = a.id
  and (u.email is null or u.email = '');

-- 3. Create index on email for high-performance lookup
create index if not exists idx_users_email on public.users(email);

-- 4. Create unique index on email so duplicate accounts cannot be created
create unique index if not exists idx_users_email_unique on public.users(email) where email is not null;

-- 5. Drop the obsolete pin_hash column
alter table public.users drop column if exists pin_hash;
