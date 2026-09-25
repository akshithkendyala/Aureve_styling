'use client';

import React from 'react';
import Image from 'next/image';
import { Outfit, OutfitItemReference, WardrobeItem } from '@/lib/types';
import { Sparkles, Check, Heart, Share2, Compass, ThumbsUp, CloudSun } from 'lucide-react';

interface OutfitResultCardProps {
  outfit: Outfit;
  onWearOutfit?: () => void;
  onOpenFeedback?: () => void;
  onSaveOutfit?: () => void;
  isSaved?: boolean;
}

export function OutfitResultCard({
  outfit,
  onWearOutfit,
  onOpenFeedback,
  onSaveOutfit,
  isSaved,
}: OutfitResultCardProps) {
  const topItem = outfit.items.find((i) => i.role === 'top')?.item;
  const bottomItem = outfit.items.find((i) => i.role === 'bottom')?.item;
  const footwearItem = outfit.items.find((i) => i.role === 'footwear')?.item;
  const layerItem = outfit.items.find((i) => i.role === 'layer')?.item;
  const accessoryItems = outfit.items.filter((i) => i.role === 'accessory').map((i) => i.item).filter(Boolean) as WardrobeItem[];

  return (
    <div className="bg-white rounded-3xl border border-[#EBE5DB] shadow-xl overflow-hidden">
      {/* Top Editorial Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-[#FAF8F5] to-white border-b border-[#EBE5DB]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#7E6047] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#18181B]" />
              <span>YOUR LOOK • {outfit.occasion}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#18181B] tracking-tight">
              {outfit.title}
            </h2>
          </div>

          {/* Style Match Compatibility Badge */}
          <div className="flex items-center space-x-3 bg-white border border-[#E8DFD5] px-4 py-2 rounded-2xl shadow-sm self-start sm:self-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#7E6047] tracking-wider">
                Style Match
              </span>
              <span className="font-serif text-xl font-bold text-[#18181B]">
                {outfit.style_match}%
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#18181B] text-[#FAF8F5] flex items-center justify-center font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-[#EEDC82]" />
            </div>
          </div>
        </div>

        {/* Weather Context if available */}
        {outfit.weather_data && (
          <div className="mt-4 inline-flex items-center space-x-2 text-xs text-[#5E4633] bg-[#F4EFEA] border border-[#E8DFD5] px-3 py-1.5 rounded-full">
            <CloudSun className="w-3.5 h-3.5 text-[#9A7B5F]" />
            <span>
              {outfit.weather_data.city} • {outfit.weather_data.temperature}°C ({outfit.weather_data.condition})
            </span>
          </div>
        )}
      </div>

      {/* Garment Visual Showcase (Myntra-style Boxes in Outfit Grid) */}
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Top Piece */}
          {topItem && (
            <div className="garment-card bg-[#FBF9F6] rounded-2xl p-3 border border-[#EBE5DB] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047] mb-1.5">
                TOP
              </span>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white mb-2 shadow-xs">
                <Image
                  src={topItem.image_url}
                  alt={topItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                {topItem.name}
              </h4>
              <span className="text-[11px] text-[#7E6047] capitalize">
                {topItem.primary_color} • {topItem.material || 'Cotton'}
              </span>
            </div>
          )}

          {/* Bottom Piece */}
          {bottomItem && (
            <div className="garment-card bg-[#FBF9F6] rounded-2xl p-3 border border-[#EBE5DB] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047] mb-1.5">
                BOTTOM
              </span>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white mb-2 shadow-xs">
                <Image
                  src={bottomItem.image_url}
                  alt={bottomItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                {bottomItem.name}
              </h4>
              <span className="text-[11px] text-[#7E6047] capitalize">
                {bottomItem.primary_color} • {bottomItem.fit || 'Tailored'}
              </span>
            </div>
          )}

          {/* Footwear */}
          {footwearItem && (
            <div className="garment-card bg-[#FBF9F6] rounded-2xl p-3 border border-[#EBE5DB] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047] mb-1.5">
                FOOTWEAR
              </span>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white mb-2 shadow-xs">
                <Image
                  src={footwearItem.image_url}
                  alt={footwearItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                {footwearItem.name}
              </h4>
              <span className="text-[11px] text-[#7E6047] capitalize">
                {footwearItem.primary_color} • {footwearItem.formality}
              </span>
            </div>
          )}

          {/* Layer or Accessory */}
          {layerItem ? (
            <div className="garment-card bg-[#FBF9F6] rounded-2xl p-3 border border-[#EBE5DB] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047] mb-1.5">
                LAYER
              </span>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white mb-2 shadow-xs">
                <Image
                  src={layerItem.image_url}
                  alt={layerItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                {layerItem.name}
              </h4>
              <span className="text-[11px] text-[#7E6047] capitalize">
                {layerItem.primary_color}
              </span>
            </div>
          ) : accessoryItems.length > 0 ? (
            <div className="garment-card bg-[#FBF9F6] rounded-2xl p-3 border border-[#EBE5DB] flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047] mb-1.5">
                ACCESSORY
              </span>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white mb-2 shadow-xs">
                <Image
                  src={accessoryItems[0].image_url}
                  alt={accessoryItems[0].name}
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                {accessoryItems[0].name}
              </h4>
              <span className="text-[11px] text-[#7E6047] capitalize">
                {accessoryItems[0].primary_color}
              </span>
            </div>
          ) : null}
        </div>

        {/* WHY THIS WORKS (AI Fashion Reasoning) */}
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
              WHY THIS WORKS
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#3D2E22] leading-relaxed">
            {outfit.ai_explanation}
          </p>

          {/* Style Direction Tags */}
          <div className="pt-2 flex items-center space-x-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E6047]">
              STYLE DIRECTION:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(outfit.style_direction || ['Simple', 'Classy', 'Modern']).map((tag) => (
                <span
                  key={tag}
                  className="bg-white border border-[#E8DFD5] text-[#18181B] text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-5 border-t border-[#EBE5DB] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {onSaveOutfit && (
              <button
                type="button"
                onClick={onSaveOutfit}
                className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                  isSaved
                    ? 'bg-[#18181B] text-white border-[#18181B]'
                    : 'bg-white text-[#18181B] border-[#EBE5DB] hover:border-[#18181B]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
                <span>{isSaved ? 'Saved to Looks' : 'Save Look'}</span>
              </button>
            )}

            {onOpenFeedback && (
              <button
                type="button"
                onClick={onOpenFeedback}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#F4EFEA] hover:bg-[#E8DFD5] text-[#5E4633] border border-[#E8DFD5] transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Rate this look</span>
              </button>
            )}
          </div>

          {onWearOutfit && (
            <button
              type="button"
              onClick={onWearOutfit}
              className="inline-flex items-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>I WORE THIS TODAY</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
