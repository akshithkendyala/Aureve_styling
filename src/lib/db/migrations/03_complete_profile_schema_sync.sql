-- ==============================================================================
-- AUREVÉ DATABASE MIGRATION: Complete Profile Schema Synchronization
-- ==============================================================================
-- Run this script in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard -> Select your project (xseckonybbzpqlntjqzb)
-- 2. Click "SQL Editor" on the left navigation bar
-- 3. Click "New Query"
-- 4. Paste this entire SQL script
-- 5. Click "Run" (or Ctrl + Enter)
-- ==============================================================================

-- 1. Ensure columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS body_build text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skin_scan_confidence numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS body_scan_confidence numeric;

-- 2. Ensure columns exist on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age integer;

-- 3. Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';

-- Verification Query (Run this to verify all columns are present):
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
