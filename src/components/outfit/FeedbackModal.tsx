'use client';

import React, { useState } from 'react';
import { X, Heart, ThumbsUp, Meh, ThumbsDown, Check, Sparkles } from 'lucide-react';

interface FeedbackModalProps {
  outfitId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const FEEDBACK_TAGS = [
  'Loved the colors',
  'Very comfortable',
  'Felt sharp & confident',
  'Perfect for weather',
  'Too formal',
  'Too casual',
  'Too warm / heavy',
  'Too cold',
  'Didn’t like the combination',
];

export function FeedbackModal({ outfitId, isOpen, onClose, onSubmitSuccess }: FeedbackModalProps) {
  const [rating, setRating] = useState<'Loved it' | 'Good' | 'Average' | "Didn't like it">('Loved it');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/outfits/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit_id: outfitId,
          rating,
          feedback_tags: selectedTags,
          comment,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          if (onSubmitSuccess) onSubmitSuccess();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FBF9F6] w-full max-w-lg rounded-3xl border border-[#EBE5DB] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#EBE5DB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              How was this look?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4EFEA] text-[#7E6047] hover:text-[#18181B] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-[#18181B]">
                Thank you!
              </h4>
              <p className="text-xs text-[#7E6047]">
                AUREVÉ has updated your personal style preferences for future outfits.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-3 text-center">
                  Your Experience
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Loved it', icon: Heart, activeColor: 'bg-rose-50 text-rose-700 border-rose-300' },
                    { label: 'Good', icon: ThumbsUp, activeColor: 'bg-amber-50 text-amber-800 border-amber-300' },
                    { label: 'Average', icon: Meh, activeColor: 'bg-gray-100 text-gray-800 border-gray-400' },
                    { label: "Didn't like it", icon: ThumbsDown, activeColor: 'bg-stone-100 text-stone-700 border-stone-300' },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = rating === r.label;
                    return (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => setRating(r.label as any)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                          isSelected
                            ? `${r.activeColor} ring-2 ring-black/10 font-bold`
                            : 'bg-white border-[#EBE5DB] text-[#7E6047] hover:bg-[#F4EFEA]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[11px] text-center leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Tags */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2.5">
                  What stood out? (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          active
                            ? 'bg-[#18181B] text-white shadow-xs'
                            : 'bg-white border border-[#EBE5DB] text-[#5E4633] hover:bg-[#F4EFEA]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                  Personal Styling Notes (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Received great compliments from colleagues; felt very comfortable throughout the day."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE5DB] rounded-xl text-xs sm:text-sm text-[#18181B] focus:outline-none focus:border-[#18181B]"
                />
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#7E6047] hover:text-[#18181B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
                >
                  {isSubmitting ? 'Saving…' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
