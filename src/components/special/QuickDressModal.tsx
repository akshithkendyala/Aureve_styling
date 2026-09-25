'use client';

import React, { useState } from 'react';
import { X, Zap, Sparkles, Clock, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickDressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickDress: (occasion: string) => void;
}

export function QuickDressModal({ isOpen, onClose, onQuickDress }: QuickDressModalProps) {
  const [selectedQuickOccasion, setSelectedQuickOccasion] = useState('Casual Outing');

  if (!isOpen) return null;

  const quickOptions = [
    { title: 'Casual Outing / Coffee', occasion: 'Casual Outing', desc: 'Effortless, clean & easy' },
    { title: 'Quick Office / Work', occasion: 'Office', desc: 'Sharp, tailored & respectable' },
    { title: 'Date / Evening Meet', occasion: 'Date', desc: 'Refined modern smart-casual' },
    { title: 'Home / Relaxed Chill', occasion: 'Home', desc: 'Maximum comfort & breathable' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FBF9F6] w-full max-w-md rounded-3xl border border-[#EBE5DB] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-white border-b border-[#EBE5DB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-600 fill-amber-500" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Quick Dress (5 Minutes)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4EFEA] text-[#7E6047] hover:text-[#18181B] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-[#7E6047] leading-relaxed">
            In a rush? Pick your destination and AUREVÉ will immediately assemble an infallible, high-confidence combination from your closet.
          </p>

          <div className="space-y-2.5">
            {quickOptions.map((opt) => {
              const isSelected = selectedQuickOccasion === opt.occasion;
              return (
                <button
                  key={opt.occasion}
                  type="button"
                  onClick={() => setSelectedQuickOccasion(opt.occasion)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-white border-[#18181B] ring-2 ring-[#18181B]/10 shadow-xs'
                      : 'bg-white/60 border-[#EBE5DB] hover:border-[#D6C7B7]'
                  }`}
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-[#18181B]">
                      {opt.title}
                    </h4>
                    <p className="text-[11px] text-[#7E6047]">{opt.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#18181B] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#EBE5DB] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#7E6047]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onQuickDress(selectedQuickOccasion);
                onClose();
              }}
              className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md flex items-center space-x-1.5"
            >
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>DRESS ME NOW</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
