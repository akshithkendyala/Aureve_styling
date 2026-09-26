-- ==============================================================================
-- AUREVÉ DATABASE SCHEMA FOR SUPABASE
-- Run this complete script in your Supabase SQL Editor:
-- Project Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE (Mirrors / extends Supabase Auth users)
create table if not exists public.users (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    mobile_number text unique not null,
    pin_hash text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_users_mobile on public.users(mobile_number);

-- 2. USER PROFILES TABLE (Strict user isolation by user_id)
create table if not exists public.profiles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null unique,
    height text,
    weight text,
    skin_tone text,
    preferred_fit text,
    favorite_colors jsonb default '[]'::jsonb,
    avoided_colors jsonb default '[]'::jsonb,
    style_preferences jsonb default '[]'::jsonb,
    comfort_preference text,
    typical_occasions jsonb default '[]'::jsonb,
    city text default 'Mumbai',
    profile_completed boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- 3. WARDROBE ITEMS TABLE (Strict user isolation by user_id)
create table if not exists public.wardrobe_items (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    image_url text not null,
    name text not null,
    category text not null, -- tops, bottoms, layers, footwear, accessories
    subcategory text not null, -- shirt, jeans, sneakers, watch, etc.
    primary_color text not null,
    secondary_colors jsonb default '[]'::jsonb,
    pattern text,
    material text,
    fit text,
    style text,
    formality text,
    season jsonb default '[]'::jsonb,
    is_favorite boolean default false,
    is_archived boolean default false,
    times_worn integer default 0,
    last_worn_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_wardrobe_items_user_id on public.wardrobe_items(user_id);
create index if not exists idx_wardrobe_items_category on public.wardrobe_items(user_id, category);
create index if not exists idx_wardrobe_items_archived on public.wardrobe_items(user_id, is_archived);

-- 4. OUTFITS TABLE (Strict user isolation by user_id)
create table if not exists public.outfits (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    occasion text not null,
    date text not null,
    time text,
    location text,
    weather_data jsonb,
    title text not null,
    ai_explanation text not null,
    style_match integer default 92,
    style_direction jsonb default '["Simple", "Classy", "Modern"]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_outfits_user_id on public.outfits(user_id);
create index if not exists idx_outfits_date on public.outfits(user_id, date);

-- 5. OUTFIT ITEMS (JUNCTION TABLE)
create table if not exists public.outfit_items (
    id uuid primary key default uuid_generate_v4(),
    outfit_id uuid references public.outfits(id) on delete cascade not null,
    wardrobe_item_id uuid references public.wardrobe_items(id) on delete cascade not null,
    role text not null -- top, bottom, footwear, accessory, layer
);

create index if not exists idx_outfit_items_outfit_id on public.outfit_items(outfit_id);
create index if not exists idx_outfit_items_wardrobe_item_id on public.outfit_items(wardrobe_item_id);

-- 6. OUTFIT FEEDBACK TABLE (Strict user isolation by user_id)
create table if not exists public.outfit_feedback (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    outfit_id uuid references public.outfits(id) on delete cascade not null,
    rating text not null, -- Loved it, Good, Average, Didn't like it
    feedback_tags jsonb default '[]'::jsonb,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_outfit_feedback_user_id on public.outfit_feedback(user_id);
create index if not exists idx_outfit_feedback_outfit_id on public.outfit_feedback(outfit_id);

-- ENABLE ROW LEVEL SECURITY
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.outfit_feedback enable row level security;

-- ROW LEVEL SECURITY POLICIES
-- Drop existing policies if any to avoid errors on rerun
drop policy if exists "Allow operations on users" on public.users;
drop policy if exists "Allow operations on profiles" on public.profiles;
drop policy if exists "Allow operations on wardrobe_items" on public.wardrobe_items;
drop policy if exists "Allow operations on outfits" on public.outfits;
drop policy if exists "Allow operations on outfit_items" on public.outfit_items;
drop policy if exists "Allow operations on outfit_feedback" on public.outfit_feedback;

create policy "Allow operations on users" on public.users for all using (true) with check (true);
create policy "Allow operations on profiles" on public.profiles for all using (true) with check (true);
create policy "Allow operations on wardrobe_items" on public.wardrobe_items for all using (true) with check (true);
create policy "Allow operations on outfits" on public.outfits for all using (true) with check (true);
create policy "Allow operations on outfit_items" on public.outfit_items for all using (true) with check (true);
create policy "Allow operations on outfit_feedback" on public.outfit_feedback for all using (true) with check (true);
