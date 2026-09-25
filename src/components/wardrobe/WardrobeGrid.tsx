'use client';

import React from 'react';
import { WardrobeItem } from '@/lib/types';
import { WardrobeItemCard } from './WardrobeItemCard';
import { Plus, Search, Filter, Sparkles, SlidersHorizontal } from 'lucide-react';

interface WardrobeGridProps {
  items: WardrobeItem[];
  isLoading?: boolean;
  onSelectItem: (item: WardrobeItem) => void;
  onToggleFavorite: (item: WardrobeItem) => void;
  onArchive: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
  onOpenAddModal: () => void;
  onSeedDemoWardrobe?: () => void;
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
          item.subcategory.toLowerCase().includes(searchQuery.toLowerCase());

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

  return (
    <div className="space-y-4">
      {/* Search, Formality & Sort Bar */}
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

        {/* Filter Pills & Sorting */}
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
        </div>
      </div>

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
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-8 sm:p-12 text-center max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[#F4EFEA] text-[#7E6047] flex items-center justify-center mx-auto mb-4 border border-[#E8DFD5]">
            <Sparkles className="w-8 h-8 text-[#9A7B5F]" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-[#18181B] mb-2">
            Your wardrobe is waiting.
          </h3>
          <p className="text-xs sm:text-sm text-[#7E6047] mb-6 leading-relaxed">
            {searchQuery || formalityFilter !== 'all'
              ? 'No pieces match your active filter. Try clearing the search or filters.'
              : 'Add your shirts, trousers, and shoes so AUREVÉ can curate clean, effortless outfits for you.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add your first piece</span>
            </button>

            {onSeedDemoWardrobe && (
              <button
                onClick={onSeedDemoWardrobe}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#F4EFEA] hover:bg-[#E8DFD5] text-[#5E4633] px-4 py-2.5 rounded-full text-xs font-medium border border-[#E8DFD5] transition-all"
              >
                <span>Load Starter Wardrobe</span>
              </button>
            )}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
