'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WardrobeItem } from '@/lib/types';
import { CategoryNav } from '@/components/wardrobe/CategoryNav';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { AddClothingModal } from '@/components/wardrobe/AddClothingModal';
import { ItemDetailModal } from '@/components/wardrobe/ItemDetailModal';
import { Plus, Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

export default function WardrobePage() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('category') || 'all';

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [isLoading, setIsLoading] = useState(true);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDetailItem, setActiveDetailItem] = useState<WardrobeItem | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'single' | 'selected' | 'all';
    targetItem: WardrobeItem | null;
    count: number;
    isDeleting: boolean;
  }>({
    isOpen: false,
    type: 'single',
    targetItem: null,
    count: 0,
    isDeleting: false,
  });

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

    const handleNewItem = () => fetchItems();
    window.addEventListener('aureve:item-added', handleNewItem);
    return () => window.removeEventListener('aureve:item-added', handleNewItem);
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

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Delete modal triggers
  const promptDeleteSingle = (item: WardrobeItem) => {
    setDeleteModalState({
      isOpen: true,
      type: 'single',
      targetItem: item,
      count: 1,
      isDeleting: false,
    });
  };

  const promptDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteModalState({
      isOpen: true,
      type: 'selected',
      targetItem: null,
      count: selectedIds.size,
      isDeleting: false,
    });
  };

  const promptDeleteAll = () => {
    setDeleteModalState({
      isOpen: true,
      type: 'all',
      targetItem: null,
      count: items.length,
      isDeleting: false,
    });
  };

  // Execute deletion
  const executeDelete = async () => {
    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      if (deleteModalState.type === 'single' && deleteModalState.targetItem) {
        const idToDelete = deleteModalState.targetItem.id;
        const res = await fetch(`/api/wardrobe/${idToDelete}`, { method: 'DELETE' });
        if (res.ok) {
          setItems((prev) => prev.filter((i) => i.id !== idToDelete));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(idToDelete);
            return next;
          });
          if (activeDetailItem?.id === idToDelete) {
            setActiveDetailItem(null);
          }
        }
      } else if (deleteModalState.type === 'selected') {
        const idsArray = Array.from(selectedIds);
        const res = await fetch('/api/wardrobe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: idsArray }),
        });

        if (res.ok) {
          const idSet = new Set(idsArray);
          setItems((prev) => prev.filter((i) => !idSet.has(i.id)));
          setSelectedIds(new Set());
          setIsSelectionMode(false);
          if (activeDetailItem && idSet.has(activeDetailItem.id)) {
            setActiveDetailItem(null);
          }
        }
      } else if (deleteModalState.type === 'all') {
        const res = await fetch('/api/wardrobe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true }),
        });

        if (res.ok) {
          setItems([]);
          setSelectedIds(new Set());
          setIsSelectionMode(false);
          setActiveDetailItem(null);
        }
      }
    } catch (e) {
      console.error('Delete execution error:', e);
    } finally {
      setDeleteModalState({
        isOpen: false,
        type: 'single',
        targetItem: null,
        count: 0,
        isDeleting: false,
      });
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
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
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
        onDelete={promptDeleteSingle}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onSeedDemoWardrobe={handleSeedStarterWardrobe}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        isSelectionMode={isSelectionMode}
        setIsSelectionMode={setIsSelectionMode}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={promptDeleteSelected}
        onDeleteAll={items.length > 0 ? promptDeleteAll : undefined}
      />

      {/* Add Modal */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={(newItem) => {
          setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
        }}
        onItemsAdded={(newItems) => {
          setItems((prev) => [...newItems, ...prev.filter((i) => !newItems.some((n) => n.id === i.id))]);
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
        onDelete={promptDeleteSingle}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl border border-[#EBE5DB] max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Icon */}
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            {/* Text details */}
            <div className="text-center space-y-1.5">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#18181B]">
                {deleteModalState.type === 'single'
                  ? `Delete "${deleteModalState.targetItem?.name || 'clothing piece'}"?`
                  : deleteModalState.type === 'selected'
                  ? `Delete ${deleteModalState.count} selected clothes?`
                  : `Delete all ${deleteModalState.count} clothes from wardrobe?`}
              </h3>
              <p className="text-xs sm:text-sm text-[#7E6047] leading-relaxed">
                {deleteModalState.type === 'single'
                  ? 'This piece will be permanently removed from your wardrobe collection and AI outfit suggestions.'
                  : deleteModalState.type === 'selected'
                  ? `Are you sure you want to permanently delete these ${deleteModalState.count} selected clothes from your wardrobe?`
                  : 'Are you sure you want to clear your entire wardrobe collection? This will remove all added clothing items permanently.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={deleteModalState.isDeleting}
                onClick={() =>
                  setDeleteModalState({
                    isOpen: false,
                    type: 'single',
                    targetItem: null,
                    count: 0,
                    isDeleting: false,
                  })
                }
                className="flex-1 px-4 py-2.5 rounded-full border border-[#E8DFD5] text-xs font-semibold text-[#5E4633] hover:bg-[#F4EFEA] hover:text-[#18181B] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModalState.isDeleting}
                onClick={executeDelete}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50 transition-all"
              >
                {deleteModalState.isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {deleteModalState.type === 'single'
                        ? 'Delete Piece'
                        : deleteModalState.type === 'selected'
                        ? `Delete (${deleteModalState.count})`
                        : 'Delete All'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

