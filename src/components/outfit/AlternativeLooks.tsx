'use client';

import React from 'react';
import Image from 'next/image';
import { AlternativeLook } from '@/lib/types';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AlternativeLooksProps {
  alternatives: AlternativeLook[];
  onSelectAlternative?: (alt: AlternativeLook) => void;
}

export function AlternativeLooks({ alternatives, onSelectAlternative }: AlternativeLooksProps) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-[#9A7B5F]" />
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
          Alternative Looks from Your Wardrobe
        </h3>
      </div>
      <p className="text-xs text-[#7E6047]">
        Want a slightly different vibe? Explore these curated variations using only pieces you own.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alternatives.map((alt, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-[#EBE5DB] p-4 sm:p-5 hover:border-[#18181B] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#18181B]">{alt.title}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#F4EFEA] text-[#7E6047] border border-[#E8DFD5]">
                  {alt.badge}
                </span>
              </div>
              <p className="text-xs text-[#5E4633] mb-4">{alt.description}</p>

              {/* Items Thumbnails */}
              <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-1">
                {alt.items.map((itRef, iIdx) => {
                  const item = itRef.item;
                  if (!item) return null;
                  return (
                    <div
                      key={iIdx}
                      className="relative w-14 h-18 rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E8DFD5] flex-shrink-0"
                    >
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.2 uppercase font-medium">
                        {itRef.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {onSelectAlternative && (
              <button
                type="button"
                onClick={() => onSelectAlternative(alt)}
                className="inline-flex items-center justify-center space-x-1.5 w-full py-2 bg-[#FAF8F5] hover:bg-[#18181B] text-[#18181B] hover:text-white rounded-xl text-xs font-semibold border border-[#E8DFD5] hover:border-[#18181B] transition-all"
              >
                <span>Switch to this combination</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
