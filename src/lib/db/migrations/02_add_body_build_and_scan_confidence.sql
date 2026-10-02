-- ==============================================================================
-- AUREVÉ DATABASE MIGRATION: Add body_build and AI scan confidence fields to profiles
-- ==============================================================================
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Add body_build column to public.profiles if not present
alter table public.profiles add column if not exists body_build text;

-- 2. Add skin_scan_confidence column to public.profiles
alter table public.profiles add column if not exists skin_scan_confidence numeric;

-- 3. Add body_scan_confidence column to public.profiles
alter table public.profiles add column if not exists body_scan_confidence numeric;
