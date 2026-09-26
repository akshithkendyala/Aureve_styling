'use client';

import React from 'react';
import { WardrobeItem } from '@/lib/types';
import { WardrobeItemCard } from './WardrobeItemCard';
import { Plus, Search, Sparkles, CheckSquare, Square, Trash2, X, CheckCheck } from 'lucide-react';

interface WardrobeGridProps {
  items: WardrobeItem[];
  isLoading?: boolean;
  onSelectItem: (item: WardrobeItem) => void;
  onToggleFavorite: (item: WardrobeItem) => void;
  onArchive: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
  onOpenAddModal: () => void;
  onSeedDemoWardrobe?: () => void;
  // Multi-selection props
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (active: boolean) => void;
  onSelectAll: (ids: string[]) => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onDeleteAll?: () => void;
}

export function WardrobeGrid({
  items,
  isLoading,
  onSelectItem,
  onToggleFavorite,
  onArchive,
  onDelete,
  onOpenAddModal,
  onSeedDemoWardrobe,
  selectedIds,
  onToggleSelect,
  isSelectionMode,
  setIsSelectionMode,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onDeleteAll,
}: WardrobeGridProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [formalityFilter, setFormalityFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'newest' | 'worn' | 'name'>('newest');

  // Filter and sort items locally for ultra-snappy UX
  const filteredItems = React.useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          searchQuery === '' ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.primary_color.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.material && item.material.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFormality =
          formalityFilter === 'all' || item.formality?.toLowerCase() === formalityFilter.toLowerCase();

        return matchesSearch && matchesFormality;
      })
      .sort((a, b) => {
        if (sortBy === 'worn') {
          return (b.times_worn || 0) - (a.times_worn || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [items, searchQuery, formalityFilter, sortBy]);

  const filteredIds = React.useMemo(() => filteredItems.map((i) => i.id), [filteredItems]);
  const isAllFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      onDeselectAll();
    } else {
      onSelectAll(filteredIds);
    }
  };

  const handleCardToggleSelect = (itemId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    onToggleSelect(itemId);
  };

  return (
    <div className="space-y-4 relative">
      {/* Search, Formality, Sort & Selection Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by piece, color, fabric..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#EBE5DB] rounded-full text-xs sm:text-sm text-[#18181B] placeholder-[#9A7B5F]/70 focus:outline-none focus:border-[#18181B] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E6047] hover:text-[#18181B]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills, Sorting & Selection Toggle */}
        <div className="flex items-center space-x-2">
          <select
            value={formalityFilter}
            onChange={(e) => setFormalityFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EBE5DB] rounded-full text-xs font-medium text-[#5E4633] focus:outline-none focus:border-[#18181B]"
          >
            <option value="all">All Styles</option>
            <option value="Casual">Casual</option>
            <option value="Smart Casual">Smart Casual</option>
            <option value="Semi-Formal">Semi-Formal</option>
            <option value="Formal">Formal</option>
            <option value="Festive">Festive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-[#EBE5DB] rounded-full text-xs font-medium text-[#5E4633] focus:outline-none focus:border-[#18181B]"
          >
            <option value="newest">Newest Added</option>
            <option value="worn">Most Worn</option>
            <option value="name">Alphabetical</option>
          </select>

          {/* Selection Mode Toggle Button */}
          {filteredItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (isSelectionMode) {
                  setIsSelectionMode(false);
                  onDeselectAll();
                } else {
                  setIsSelectionMode(true);
                }
              }}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                isSelectionMode
                  ? 'bg-[#18181B] text-[#FAF8F5] shadow-xs'
                  : 'bg-white border border-[#EBE5DB] text-[#5E4633] hover:border-[#18181B] hover:text-[#18181B]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Batch Selection Bar (Active when selection mode is enabled) */}
      {isSelectionMode && filteredItems.length > 0 && (
        <div className="bg-[#FAF8F5] border border-[#EBE5DB] rounded-2xl p-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-3">
            {/* Select All Button */}
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-[#18181B] bg-white border border-[#E8DFD5] hover:border-[#18181B] px-3.5 py-1.5 rounded-full transition-all active:scale-95 shadow-2xs"
            >
              {isAllFilteredSelected ? (
                <>
                  <CheckCheck className="w-4 h-4 text-[#18181B]" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-[#7E6047]" />
                  <span>Select All ({filteredItems.length})</span>
                </>
              )}
            </button>

            {/* Selected Count Indicator */}
            <span className="text-xs font-medium text-[#7E6047]">
              <strong className="text-[#18181B] font-semibold">{selectedIds.size}</strong> of{' '}
              {filteredItems.length} selected
            </span>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            {/* Bulk Delete Selected Button */}
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={selectedIds.size === 0}
              className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedIds.size > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:scale-95 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>

            {/* Delete All Items Option */}
            {onDeleteAll && (
              <button
                type="button"
                onClick={onDeleteAll}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All ({items.length})</span>
              </button>
            )}

            {/* Exit Selection Button */}
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(false);
                onDeselectAll();
              }}
              className="p-1.5 rounded-full text-[#7E6047] hover:text-[#18181B] hover:bg-[#EBE5DB]/50 transition-colors"
              title="Close selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Myntra-style boxes (2 col mobile, 3 col tablet, 4-5 col desktop) */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[#EBE5DB] overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-[#F4EFEA]" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-[#E8DFD5] rounded w-1/2" />
                <div className="h-4 bg-[#E8DFD5] rounded w-3/4" />
                <div className="h-3 bg-[#E8DFD5] rounded w-1/3 pt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-8 sm:p-12 text-center max-w-lg mx-auto my-8 space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FAF8F5] text-[#18181B] flex items-center justify-center mx-auto border border-[#E8DFD5] shadow-xs">
            <Sparkles className="w-8 h-8 text-[#9A7B5F]" />
          </div>
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mb-2">
              Your wardrobe is empty.
            </h3>
            <p className="text-xs sm:text-sm text-[#7E6047] leading-relaxed max-w-md mx-auto">
              {searchQuery || formalityFilter !== 'all'
                ? 'No pieces match your active filter. Try clearing your search.'
                : 'Come on, start adding pictures of your clothes! Take photos using your camera or pick from your phone gallery/laptop files.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenAddModal}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-3 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Take Photo or Upload Clothes</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {filteredItems.map((item) => (
            <WardrobeItemCard
              key={item.id}
              item={item}
              onSelect={onSelectItem}
              onToggleFavorite={onToggleFavorite}
              onArchive={onArchive}
              onDelete={onDelete}
              isSelected={selectedIds.has(item.id)}
              isSelectionMode={isSelectionMode}
              onToggleSelect={handleCardToggleSelect}
            />
          ))}
        </div>
      )}

      {/* Floating Bottom Batch Action Bar (Shown when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#18181B]/95 text-[#FAF8F5] px-4 sm:px-6 py-3 rounded-full shadow-2xl border border-white/15 flex items-center space-x-3 sm:space-x-4 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
          {/* Select All Toggle */}
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="text-xs font-medium text-white/80 hover:text-white underline underline-offset-2 transition-colors"
          >
            {isAllFilteredSelected ? 'Deselect All' : `Select All (${filteredItems.length})`}
          </button>

          <div className="h-4 w-px bg-white/20" />

          {/* Selected Count */}
          <span className="text-xs font-semibold tracking-wide">
            {selectedIds.size} {selectedIds.size === 1 ? 'piece' : 'pieces'} selected
          </span>

          <div className="h-4 w-px bg-white/20" />

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDeleteSelected}
            className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete ({selectedIds.size})</span>
          </button>

          {/* Close / Deselect */}
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode(false);
              onDeselectAll();
            }}
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

