-- Migration: Add gender column to profiles table
-- Run this in your Supabase SQL Editor if you wish to query gender directly on public.profiles:
-- Dashboard -> SQL Editor -> New Query -> Run

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;

-- Add comment explaining allowed values
COMMENT ON COLUMN public.profiles.gender IS 'Optional gender preference: Male, Female, Non-binary / Other, Prefer not to say';
