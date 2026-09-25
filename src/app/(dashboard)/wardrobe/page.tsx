'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WardrobeItem, MainCategory } from '@/lib/types';
import { CategoryNav } from '@/components/wardrobe/CategoryNav';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { AddClothingModal } from '@/components/wardrobe/AddClothingModal';
import { ItemDetailModal } from '@/components/wardrobe/ItemDetailModal';
import { Plus, Sparkles, RefreshCw } from 'lucide-react';

export default function WardrobePage() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('category') || 'all';

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDetailItem, setActiveDetailItem] = useState<WardrobeItem | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let url = '/api/wardrobe?includeArchived=true';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // Compute category counts
  const counts = {
    all: items.filter((i) => !i.is_archived).length,
    tops: items.filter((i) => i.category === 'tops' && !i.is_archived).length,
    bottoms: items.filter((i) => i.category === 'bottoms' && !i.is_archived).length,
    layers: items.filter((i) => i.category === 'layers' && !i.is_archived).length,
    footwear: items.filter((i) => i.category === 'footwear' && !i.is_archived).length,
    accessories: items.filter((i) => i.category === 'accessories' && !i.is_archived).length,
    favorites: items.filter((i) => i.is_favorite && !i.is_archived).length,
    archived: items.filter((i) => i.is_archived).length,
  };

  // Filter items by category tab
  const displayedItems = items.filter((item) => {
    if (selectedCategory === 'all') return !item.is_archived;
    if (selectedCategory === 'favorites') return item.is_favorite && !item.is_archived;
    if (selectedCategory === 'archived') return item.is_archived;
    return item.category === selectedCategory && !item.is_archived;
  });

  const handleToggleFavorite = async (item: WardrobeItem) => {
    const newFav = !item.is_favorite;
    setItems(items.map((i) => (i.id === item.id ? { ...i, is_favorite: newFav } : i)));

    try {
      await fetch(`/api/wardrobe/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: newFav }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchive = async (item: WardrobeItem) => {
    const newArchived = !item.is_archived;
    setItems(items.map((i) => (i.id === item.id ? { ...i, is_archived: newArchived } : i)));
    setActiveDetailItem(null);

    try {
      await fetch(`/api/wardrobe/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: newArchived }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (item: WardrobeItem) => {
    setItems(items.filter((i) => i.id !== item.id));
    setActiveDetailItem(null);

    try {
      await fetch(`/api/wardrobe/${item.id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedStarterWardrobe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/wardrobe/seed', { method: 'POST' });
      if (res.ok) {
        await fetchItems();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Wardrobe Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
            Private Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B] tracking-tight">
            My Wardrobe
          </h1>
          <p className="text-xs sm:text-sm text-[#7E6047] mt-1">
            Organized boxes of your real shirts, pants, shoes and accessories.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {items.length === 0 && (
            <button
              onClick={handleSeedStarterWardrobe}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#F4EFEA] hover:bg-[#E8DFD5] text-[#5E4633] text-xs font-semibold border border-[#E8DFD5] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Seed Classic Wardrobe</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD CLOTHING</span>
          </button>
        </div>
      </div>

      {/* Category Tabs / Chips */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        counts={counts}
      />

      {/* Garments Grid */}
      <WardrobeGrid
        items={displayedItems}
        isLoading={isLoading}
        onSelectItem={(it) => setActiveDetailItem(it)}
        onToggleFavorite={handleToggleFavorite}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onSeedDemoWardrobe={handleSeedStarterWardrobe}
      />

      {/* Add Modal */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={(newItem) => {
          setItems([newItem, ...items]);
        }}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={activeDetailItem}
        isOpen={Boolean(activeDetailItem)}
        onClose={() => setActiveDetailItem(null)}
        onUpdate={(updated) => {
          setItems(items.map((i) => (i.id === updated.id ? updated : i)));
          setActiveDetailItem(updated);
        }}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </div>
  );
}
