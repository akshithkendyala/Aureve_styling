'use client';

import React from 'react';
import Image from 'next/image';
import { Heart, MoreVertical, Eye, Trash2, Archive, Sparkles, CheckCircle } from 'lucide-react';
import { WardrobeItem } from '@/lib/types';

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onSelect?: (item: WardrobeItem) => void;
  onToggleFavorite?: (item: WardrobeItem) => void;
  onArchive?: (item: WardrobeItem) => void;
  onDelete?: (item: WardrobeItem) => void;
  isSelected?: boolean;
}

export function WardrobeItemCard({
  item,
  onSelect,
  onToggleFavorite,
  onArchive,
  onDelete,
  isSelected,
}: WardrobeItemCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const getFormalityColor = (formality?: string) => {
    switch (formality) {
      case 'Formal':
      case 'Semi-Formal':
        return 'bg-[#221A13] text-[#FAF8F5]';
      case 'Smart Casual':
        return 'bg-[#F4EFEA] text-[#5E4633] border border-[#E8DFD5]';
      case 'Festive':
        return 'bg-[#AA820A]/10 text-[#7E6047] border border-[#AA820A]/20';
      default:
        return 'bg-[#F3EFE6] text-[#7E6047]';
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(item)}
      className={`group garment-card cursor-pointer flex flex-col bg-white border ${
        isSelected ? 'border-[#18181B] ring-2 ring-[#18181B]/20' : 'border-[#EBE5DB]'
      } rounded-2xl overflow-hidden transition-all duration-300 relative`}
    >
      {/* Image Container with Luxury Box Ratio */}
      <div className="relative aspect-[3/4] w-full bg-[#F4EFEA] overflow-hidden">
        <Image
          src={item.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          {/* Times Worn Badge */}
          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
            {item.times_worn > 0 ? `${item.times_worn}x worn` : 'New'}
          </span>

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite && onToggleFavorite(item);
            }}
            className="pointer-events-auto w-7 h-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-[#18181B] shadow-sm hover:scale-110 active:scale-90 transition-all"
            title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                item.is_favorite ? 'fill-[#E11D48] text-[#E11D48]' : 'text-[#7E6047]'
              }`}
            />
          </button>
        </div>

        {/* Formality Pill (Bottom Left of Image) */}
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <span
            className={`text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md shadow-xs ${getFormalityColor(
              item.formality
            )}`}
          >
            {item.formality || item.category}
          </span>
        </div>

        {/* Selection checkmark if in multi-select */}
        {isSelected && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* Box Info Container (Myntra-style clean typography & color dot) */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-grow bg-white">
        <div>
          {/* Subcategory & Material */}
          <div className="flex items-center justify-between text-[11px] text-[#7E6047] uppercase tracking-wider mb-1">
            <span className="font-medium truncate">{item.subcategory || item.category}</span>
            {item.material && <span className="text-[#9A7B5F] text-[10px] truncate max-w-[80px]">{item.material}</span>}
          </div>

          {/* Garment Title */}
          <h4 className="text-xs sm:text-sm font-semibold text-[#18181B] line-clamp-1 group-hover:text-[#5E4633] transition-colors">
            {item.name}
          </h4>
        </div>

        {/* Bottom Details: Color & Actions */}
        <div className="mt-2.5 pt-2 border-t border-[#F4EFEA] flex items-center justify-between text-[11px] text-[#5E4633]">
          <div className="flex items-center space-x-1.5 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
              style={{
                backgroundColor:
                  item.primary_color.toLowerCase().includes('white')
                    ? '#FFFFFF'
                    : item.primary_color.toLowerCase().includes('black')
                    ? '#18181B'
                    : item.primary_color.toLowerCase().includes('blue')
                    ? '#3B82F6'
                    : item.primary_color.toLowerCase().includes('olive')
                    ? '#556B2F'
                    : item.primary_color.toLowerCase().includes('beige') || item.primary_color.toLowerCase().includes('sand')
                    ? '#D8CBB6'
                    : item.primary_color.toLowerCase().includes('grey') || item.primary_color.toLowerCase().includes('charcoal')
                    ? '#4B5563'
                    : '#9A7B5F',
              }}
            />
            <span className="truncate">{item.primary_color}</span>
          </div>

          {/* Action dots menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-md text-[#9A7B5F] hover:text-[#18181B] hover:bg-[#F4EFEA] transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 bottom-6 z-30 w-36 bg-white rounded-xl shadow-xl border border-[#EBE5DB] py-1 text-xs text-[#18181B] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onSelect && onSelect(item);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#F4EFEA] flex items-center space-x-2"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#5E4633]" />
                    <span>View Piece</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onArchive && onArchive(item);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#F4EFEA] flex items-center space-x-2"
                  >
                    <Archive className="w-3.5 h-3.5 text-[#5E4633]" />
                    <span>{item.is_archived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete && onDelete(item);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center space-x-2 border-t border-[#F4EFEA]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
