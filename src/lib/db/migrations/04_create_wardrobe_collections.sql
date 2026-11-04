-- ==============================================================================
-- AUREVÉ DATABASE MIGRATION 04: SMART WARDROBE COLLECTIONS
-- Adds support for user collections (Everyday, College & Work, Traditional, etc.)
-- and multi-collection junction relationships with wardrobe items.
-- ==============================================================================

-- 1. COLLECTIONS TABLE
create table if not exists public.wardrobe_collections (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    name text not null,
    slug text not null,
    description text,
    collection_type text not null default 'custom', -- 'system' | 'custom'
    icon text not null default 'FolderHeart',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_user_collection_name unique (user_id, name)
);

create index if not exists idx_wardrobe_collections_user_id on public.wardrobe_collections(user_id);
create index if not exists idx_wardrobe_collections_slug on public.wardrobe_collections(user_id, slug);

-- 2. COLLECTION ITEMS JUNCTION TABLE
-- An item may belong to multiple collections without duplicate wardrobe records.
create table if not exists public.wardrobe_collection_items (
    id uuid primary key default uuid_generate_v4(),
    collection_id uuid references public.wardrobe_collections(id) on delete cascade not null,
    wardrobe_item_id uuid references public.wardrobe_items(id) on delete cascade not null,
    user_id uuid not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_collection_item unique (collection_id, wardrobe_item_id)
);

create index if not exists idx_wardrobe_collection_items_col_id on public.wardrobe_collection_items(collection_id);
create index if not exists idx_wardrobe_collection_items_item_id on public.wardrobe_collection_items(wardrobe_item_id);
create index if not exists idx_wardrobe_collection_items_user_id on public.wardrobe_collection_items(user_id);

-- 3. ENABLE ROW LEVEL SECURITY
alter table public.wardrobe_collections enable row level security;
alter table public.wardrobe_collection_items enable row level security;

-- 4. RLS POLICIES
drop policy if exists "Allow operations on wardrobe_collections" on public.wardrobe_collections;
drop policy if exists "Allow operations on wardrobe_collection_items" on public.wardrobe_collection_items;

create policy "Allow operations on wardrobe_collections" on public.wardrobe_collections for all using (true) with check (true);
create policy "Allow operations on wardrobe_collection_items" on public.wardrobe_collection_items for all using (true) with check (true);

