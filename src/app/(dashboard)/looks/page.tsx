'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Outfit } from '@/lib/types';
import { Sparkles, Calendar, Trash2, Heart, RefreshCw, ThumbsUp, ArrowRight, BookOpen } from 'lucide-react';
import { FeedbackModal } from '@/components/outfit/FeedbackModal';

export default function LooksHistoryPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFeedbackOutfitId, setActiveFeedbackOutfitId] = useState<string | null>(null);

  const fetchOutfits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/outfits');
      if (res.ok) {
        const data = await res.json();
        setOutfits(data.outfits || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutfits();
  }, []);

  const handleDeleteOutfit = async (id: string) => {
    if (!confirm('Remove this look from your style history?')) return;
    setOutfits(outfits.filter((o) => o.id !== id));
    try {
      await fetch(`/api/outfits/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
            Archive & Rotation
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B] tracking-tight">
            My Looks
          </h1>
          <p className="text-xs sm:text-sm text-[#7E6047] mt-1">
            Complete record of your styled outfits, occasions, and personal feedback.
          </p>
        </div>

        <Link
          href="/create-outfit"
          className="inline-flex items-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#EEDC82]" />
          <span>Style New Look</span>
        </Link>
      </div>

      {/* Outfits List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-[#EBE5DB] p-6 animate-pulse space-y-4">
              <div className="h-4 bg-[#E8DFD5] rounded w-1/4" />
              <div className="h-6 bg-[#E8DFD5] rounded w-1/2" />
              <div className="grid grid-cols-4 gap-3">
                <div className="aspect-[3/4] bg-[#F4EFEA] rounded-xl" />
                <div className="aspect-[3/4] bg-[#F4EFEA] rounded-xl" />
                <div className="aspect-[3/4] bg-[#F4EFEA] rounded-xl" />
                <div className="aspect-[3/4] bg-[#F4EFEA] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-12 text-center max-w-md mx-auto space-y-4 my-8">
          <div className="w-14 h-14 rounded-full bg-[#F4EFEA] text-[#7E6047] flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-[#18181B]">
            Nothing planned yet.
          </h3>
          <p className="text-xs sm:text-sm text-[#7E6047] leading-relaxed">
            Your styled looks will appear here with outfit memories, items worn, and ratings.
          </p>
          <Link
            href="/create-outfit"
            className="inline-flex items-center space-x-2 bg-[#18181B] text-white px-5 py-2.5 rounded-full text-xs font-semibold"
          >
            <span>Create your first look</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {outfits.map((outfit) => (
            <div
              key={outfit.id}
              className="bg-white rounded-3xl border border-[#EBE5DB] p-5 sm:p-7 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F4EFEA] pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7E6047]">
                    {outfit.is_self_styled && (
                      <span className="bg-[#18181B] text-[#D4AF37] px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center space-x-1">
                        <span>✦</span>
                        <span>Self-Styled</span>
                      </span>
                    )}
                    <span>{outfit.occasion}</span>
                    <span>•</span>
                    <span>{outfit.date}</span>
                    {outfit.location && (
                      <>
                        <span>•</span>
                        <span>{outfit.location}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B] mt-0.5">
                    {outfit.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  {outfit.self_styled_analysis?.overall_score ? (
                    <span className="text-xs font-bold px-3 py-1 bg-[#18181B] text-white rounded-full flex items-center space-x-1 shadow-2xs">
                      <span className="text-[#D4AF37]">★</span>
                      <span>{outfit.self_styled_analysis.overall_score} / 10</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-[#FAF8F5] text-[#18181B] border border-[#E8DFD5] rounded-full">
                      {outfit.style_match}% Match
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteOutfit(outfit.id)}
                    className="p-1.5 rounded-full text-[#9A7B5F] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Self Styled Score Breakdown if present */}
              {outfit.self_styled_analysis?.breakdown && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 pb-1">
                  <div className="bg-[#FAF8F5] border border-[#E8DFD5] rounded-xl px-2.5 py-1.5 text-center">
                    <span className="text-[9px] uppercase font-bold text-[#7E6047] block">Color Harmony</span>
                    <span className="font-serif text-xs font-semibold text-[#18181B]">{outfit.self_styled_analysis.breakdown.color_harmony}/10</span>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E8DFD5] rounded-xl px-2.5 py-1.5 text-center">
                    <span className="text-[9px] uppercase font-bold text-[#7E6047] block">Style Cohesion</span>
                    <span className="font-serif text-xs font-semibold text-[#18181B]">{outfit.self_styled_analysis.breakdown.style_cohesion}/10</span>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E8DFD5] rounded-xl px-2.5 py-1.5 text-center">
                    <span className="text-[9px] uppercase font-bold text-[#7E6047] block">Fit &amp; Proportion</span>
                    <span className="font-serif text-xs font-semibold text-[#18181B]">{outfit.self_styled_analysis.breakdown.fit_and_proportion}/10</span>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E8DFD5] rounded-xl px-2.5 py-1.5 text-center">
                    <span className="text-[9px] uppercase font-bold text-[#7E6047] block">Occasion Fit</span>
                    <span className="font-serif text-xs font-semibold text-[#18181B]">{outfit.self_styled_analysis.breakdown.occasion_fit}/10</span>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E8DFD5] rounded-xl px-2.5 py-1.5 text-center">
                    <span className="text-[9px] uppercase font-bold text-[#7E6047] block">Footwear</span>
                    <span className="font-serif text-xs font-semibold text-[#18181B]">{outfit.self_styled_analysis.breakdown.footwear_compatibility}/10</span>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E8DFD5] rounded-xl px-2.5 py-1.5 text-center">
                    <span className="text-[9px] uppercase font-bold text-[#7E6047] block">Accessories</span>
                    <span className="font-serif text-xs font-semibold text-[#18181B]">{outfit.self_styled_analysis.breakdown.accessory_balance}/10</span>
                  </div>
                </div>
              )}

              {/* Items thumbnails in Myntra-style boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {outfit.items.map((itRef, idx) => {
                  const item = itRef.item;
                  if (!item) return null;
                  return (
                    <div
                      key={idx}
                      className="bg-[#FAF8F5] rounded-2xl p-2 border border-[#EBE5DB] flex flex-col"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#7E6047] mb-1">
                        {itRef.role}
                      </span>
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white mb-1.5">
                        <Image
                          src={item.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#18181B] truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#7E6047] capitalize">
                        {item.primary_color}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* AI Reasoning summary / Analysis Feedback */}
              <div className="space-y-2">
                <p className="text-xs text-[#5E4633] italic bg-[#FAF8F5] p-3 rounded-xl border border-[#E8DFD5]">
                  “{outfit.ai_explanation}”
                </p>

                {outfit.self_styled_analysis?.how_to_improve && (
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8DFD5] text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#7E6047] tracking-wider block">
                      ✦ AUREVÉ Stylist Suggestion
                    </span>
                    <p className="text-[#18181B]">
                      {outfit.self_styled_analysis.how_to_improve}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFeedbackOutfitId(outfit.id)}
                  className="inline-flex items-center space-x-1.5 text-[#5E4633] hover:text-[#18181B] font-medium"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Provide feedback on this look</span>
                </button>

                <Link
                  href={
                    outfit.is_self_styled
                      ? '/style-yourself'
                      : `/create-outfit?occasion=${encodeURIComponent(outfit.occasion)}`
                  }
                  className="inline-flex items-center space-x-1 font-semibold text-[#18181B] hover:text-[#7E6047]"
                >
                  <span>{outfit.is_self_styled ? 'Style another look →' : 'Re-style similar occasion →'}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {activeFeedbackOutfitId && (
        <FeedbackModal
          outfitId={activeFeedbackOutfitId}
          isOpen={Boolean(activeFeedbackOutfitId)}
          onClose={() => setActiveFeedbackOutfitId(null)}
          onSubmitSuccess={() => fetchOutfits()}
        />
      )}
    </div>
  );
}
