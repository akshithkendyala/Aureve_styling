'use client';

import React from 'react';
import Image from 'next/image';
import { Outfit, OutfitItemReference, WardrobeItem } from '@/lib/types';
import {
  Sparkles,
  Check,
  Heart,
  Share2,
  Compass,
  ThumbsUp,
  CloudSun,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';

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

  const isPartial =
    outfit.wardrobe_completeness === 'partial' ||
    outfit.wardrobe_completeness === 'single_item' ||
    Boolean(outfit.recommended_missing_items && outfit.recommended_missing_items.length > 0);

  const ownedItems = outfit.items.filter((i) => i.item).map((i) => ({ role: i.role, item: i.item! }));

  return (
    <div className="bg-white rounded-3xl border border-[#EBE5DB] shadow-xl overflow-hidden">
      {/* Top Editorial Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-[#FAF8F5] to-white border-b border-[#EBE5DB]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#7E6047] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#18181B]" />
              {outfit.collection && (
                <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8DFD5] text-[#18181B] font-bold">
                  {outfit.collection}
                </span>
              )}
              <span>{outfit.interpreted_occasion || outfit.occasion}</span>
              {isPartial && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
                  Curated Styling Advice
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#18181B] tracking-tight">
              {outfit.title}
            </h2>
            {outfit.custom_occasion_text && (
              <p className="text-xs text-[#7E6047] italic mt-1 font-medium">
                &ldquo;{outfit.custom_occasion_text}&rdquo;
              </p>
            )}
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

        {/* Conflict Note if Occasion Mismatches Collection */}
        {outfit.conflict_note && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{outfit.conflict_note}</p>
          </div>
        )}

        {/* Weather Context if available */}
        {outfit.weather_data && (
          <div className="mt-4 inline-flex flex-wrap items-center gap-2 text-xs text-[#5E4633] bg-[#F4EFEA] border border-[#E8DFD5] px-3.5 py-1.5 rounded-full">
            <div className="flex items-center space-x-1.5 font-medium">
              <CloudSun className="w-3.5 h-3.5 text-[#9A7B5F]" />
              <span className="font-semibold text-[#18181B]">{outfit.weather_data.city}</span>
              <span>•</span>
              <span>{outfit.weather_data.temperature}°C</span>
              <span className="text-[#7E6047]">({outfit.weather_data.condition})</span>
            </div>
            {outfit.weather_data.feels_like !== undefined && (
              <span className="text-[11px] text-[#7E6047]">
                • Feels {outfit.weather_data.feels_like}°C
              </span>
            )}
            {outfit.weather_data.rain_probability !== undefined && outfit.weather_data.rain_probability > 0 && (
              <span className="text-[11px] text-sky-700 font-medium">
                • {outfit.weather_data.rain_probability}% Rain
              </span>
            )}
            {outfit.weather_data.is_forecast && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Forecast {outfit.weather_data.forecast_time ? `(${outfit.weather_data.forecast_time})` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* ========================================================================= */}
        {/* PARTIAL WARDROBE EXPERIENCE (CLEAR DISTINCTION: OWNED VS RECOMMENDED)    */}
        {/* ========================================================================= */}
        {isPartial ? (
          <div className="space-y-7">
            {/* 1. IN YOUR WARDROBE (Owned Clothes with actual uploaded images) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                    IN YOUR WARDROBE
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {ownedItems.length} {ownedItems.length === 1 ? 'Piece Available' : 'Pieces Available'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {ownedItems.map(({ role, item }) => (
                  <div
                    key={item.id}
                    className="garment-card bg-[#FBF9F6] rounded-2xl p-3 border-2 border-emerald-600/30 shadow-xs flex flex-col relative"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047]">
                        {role.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        OWNED
                      </span>
                    </div>

                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white mb-2 shadow-xs">
                      <Image
                        src={item.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                      {item.name}
                    </h4>
                    <span className="text-[11px] text-[#7E6047] capitalize">
                      {item.primary_color} • {item.material || 'Cotton'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. RECOMMENDED TO COMPLETE YOUR LOOK (Clean Text-Based Recommendations) */}
            {outfit.recommended_missing_items && outfit.recommended_missing_items.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-[#7E6047]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                      RECOMMENDED TO COMPLETE YOUR LOOK
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#7E6047]">
                    Text Stylist Suggestions
                  </span>
                </div>

                <p className="text-xs text-[#7E6047] leading-relaxed">
                  Only your owned items above currently exist in your wardrobe. The pieces below are personalized stylist recommendations tailored for this occasion:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {outfit.recommended_missing_items.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD5] hover:border-[#18181B] transition-colors flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047] bg-white border border-[#E8DFD5] px-2 py-0.5 rounded-full">
                            {rec.category.toUpperCase()}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              rec.priority === 'essential'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-[#F4EFEA] text-[#7E6047]'
                            }`}
                          >
                            {rec.priority === 'essential' ? 'Essential Base' : 'Stylist Pick'}
                          </span>
                        </div>

                        <h4 className="font-serif text-base font-semibold text-[#18181B]">
                          {rec.name}
                        </h4>
                        <p className="text-xs text-[#5E4633] leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>

                      {/* Why it works / Suggested fabric / color */}
                      <div className="pt-2 border-t border-[#EBE5DB] flex flex-wrap items-center gap-2 text-[11px] text-[#7E6047]">
                        {rec.color_suggestion && (
                          <span className="bg-white border border-[#E8DFD5] px-2 py-0.5 rounded-md font-medium text-[#18181B]">
                            Color: {rec.color_suggestion}
                          </span>
                        )}
                        {rec.fabric_suggestion && (
                          <span className="bg-white border border-[#E8DFD5] px-2 py-0.5 rounded-md font-medium text-[#18181B]">
                            Fabric: {rec.fabric_suggestion}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. YOUR BEST COMBINATIONS (Ready-to-wear styling recipes) */}
            {outfit.suggested_combinations && outfit.suggested_combinations.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#7E6047]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                    YOUR BEST COMBINATIONS
                  </h3>
                </div>

                <div className="space-y-3">
                  {outfit.suggested_combinations.map((comb, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm sm:text-base font-semibold text-[#18181B]">
                          {comb.name}
                        </h4>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#7E6047] border border-[#E8DFD5]">
                          Look {cIdx + 1}
                        </span>
                      </div>

                      {/* Combination Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {comb.combination.map((part, pIdx) => {
                          const isOwned = part.toLowerCase().includes('(in your wardrobe)');
                          return (
                            <React.Fragment key={pIdx}>
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  isOwned
                                    ? 'bg-[#18181B] text-white shadow-2xs font-semibold'
                                    : 'bg-[#F4EFEA] text-[#18181B] border border-[#E8DFD5]'
                                }`}
                              >
                                {part}
                              </span>
                              {pIdx < comb.combination.length - 1 && (
                                <span className="text-xs font-bold text-[#9A7B5F]">+</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {comb.styling_tip && (
                        <p className="text-xs text-[#5E4633] italic pt-1 border-t border-[#F4EFEA]">
                          <strong>Stylist Tip: </strong>
                          {comb.styling_tip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* COMPLETE OUTFIT EXPERIENCE (ALL OWNED PIECES PRESENT)                      */
          /* ========================================================================= */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Top Piece */}
            {topItem && (
              <div className="garment-card bg-[#FBF9F6] rounded-2xl p-3 border border-[#EBE5DB] flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047] mb-1.5">
                  {!bottomItem || ['dress', 'saree', 'jumpsuit', 'romper', 'anarkali'].some((k) => (topItem.subcategory || '').toLowerCase().includes(k)) ? 'MAIN PIECE' : 'TOP'}
                </span>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white mb-2 shadow-xs">
                  <Image
                    src={topItem.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
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
                    src={bottomItem.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
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
                    src={footwearItem.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
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
                    src={layerItem.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
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
                    src={accessoryItems[0].image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
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
        )}

        {/* WHY THIS WORKS (AI Fashion Reasoning) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
              YOUR STYLING DIRECTION &amp; WHY THIS WORKS
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
        <div className="pt-5 border-t border-[#EBE5DB] flex flex-wrap items-center justify-between gap-3">
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
