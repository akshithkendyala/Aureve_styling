-- ==============================================================================
-- AUREVÉ DATABASE SCHEMA
-- PostgreSQL / Supabase Schema with Row Level Security (RLS) & Strict Isolation
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    mobile_number text unique not null,
    pin_hash text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast user lookup during login
create index if not exists idx_users_mobile on users(mobile_number);

-- 2. USER PROFILES TABLE
create table if not exists profiles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade unique not null,
    height text,
    weight text,
    skin_tone text,
    preferred_fit text,
    favorite_colors jsonb default '[]'::jsonb,
    avoided_colors jsonb default '[]'::jsonb,
    style_preferences jsonb default '[]'::jsonb,
    comfort_preference text,
    city text default 'Mumbai',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_user_id on profiles(user_id);

-- 3. WARDROBE ITEMS TABLE
create table if not exists wardrobe_items (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
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

create index if not exists idx_wardrobe_items_user_id on wardrobe_items(user_id);
create index if not exists idx_wardrobe_items_category on wardrobe_items(user_id, category);
create index if not exists idx_wardrobe_items_archived on wardrobe_items(user_id, is_archived);

-- 4. OUTFITS TABLE
create table if not exists outfits (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
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

create index if not exists idx_outfits_user_id on outfits(user_id);
create index if not exists idx_outfits_date on outfits(user_id, date);

-- 5. OUTFIT ITEMS (JUNCTION TABLE)
create table if not exists outfit_items (
    id uuid primary key default uuid_generate_v4(),
    outfit_id uuid references outfits(id) on delete cascade not null,
    wardrobe_item_id uuid references wardrobe_items(id) on delete cascade not null,
    role text not null -- top, bottom, footwear, accessory, layer
);

create index if not exists idx_outfit_items_outfit_id on outfit_items(outfit_id);
create index if not exists idx_outfit_items_wardrobe_item_id on outfit_items(wardrobe_item_id);

-- 6. OUTFIT FEEDBACK TABLE
create table if not exists outfit_feedback (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    outfit_id uuid references outfits(id) on delete cascade not null,
    rating text not null, -- Loved it, Good, Average, Didn't like it
    feedback_tags jsonb default '[]'::jsonb,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_outfit_feedback_user_id on outfit_feedback(user_id);
create index if not exists idx_outfit_feedback_outfit_id on outfit_feedback(outfit_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table users enable row level security;
alter table profiles enable row level security;
alter table wardrobe_items enable row level security;
alter table outfits enable row level security;
alter table outfit_items enable row level security;
alter table outfit_feedback enable row level security;

-- Storage Bucket for User Wardrobe Photos:
-- Path convention: /users/{user_id}/wardrobe/{item_id}/image
-- Configure in Supabase Storage with private access and user-authenticated policies.
