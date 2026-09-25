'use client';

import React from 'react';
import { MainCategory } from '@/lib/types';
import { Shirt, Scissors, Layers, Footprints, Watch, LayoutGrid, Heart, Archive } from 'lucide-react';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  counts?: {
    all?: number;
    tops?: number;
    bottoms?: number;
    layers?: number;
    footwear?: number;
    accessories?: number;
    favorites?: number;
    archived?: number;
  };
}

export function CategoryNav({
  selectedCategory,
  onSelectCategory,
  counts,
}: CategoryNavProps) {
  const categories = [
    { id: 'all', label: 'All Pieces', icon: LayoutGrid, count: counts?.all },
    { id: 'tops', label: 'Tops', icon: Shirt, count: counts?.tops },
    { id: 'bottoms', label: 'Bottoms', icon: Scissors, count: counts?.bottoms },
    { id: 'layers', label: 'Layers', icon: Layers, count: counts?.layers },
    { id: 'footwear', label: 'Footwear', icon: Footprints, count: counts?.footwear },
    { id: 'accessories', label: 'Accessories', icon: Watch, count: counts?.accessories },
    { id: 'favorites', label: 'Favorites', icon: Heart, count: counts?.favorites },
    { id: 'archived', label: 'Archived', icon: Archive, count: counts?.archived },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center space-x-2 min-w-max px-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#18181B] text-[#FAF8F5] shadow-sm'
                  : 'bg-white text-[#5E4633] border border-[#EBE5DB] hover:border-[#D6C7B7] hover:bg-[#FBF9F6]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FAF8F5]' : 'text-[#9A7B5F]'}`} />
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F4EFEA] text-[#7E6047]'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
