'use client';

import React, { useState } from 'react';
import { X, Plane, CheckSquare, Square, Luggage, Sparkles, Calendar, MapPin } from 'lucide-react';
import { WardrobeItem } from '@/lib/types';

interface TravelPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: WardrobeItem[];
}

export function TravelPlannerModal({ isOpen, onClose, wardrobe }: TravelPlannerModalProps) {
  const [destination, setDestination] = useState('Goa');
  const [days, setDays] = useState(3);
  const [tripType, setTripType] = useState('Leisure / Beach');
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const activeItems = wardrobe.filter((i) => !i.is_archived);
      const tops = activeItems.filter((i) => i.category === 'tops');
      const bottoms = activeItems.filter((i) => i.category === 'bottoms');
      const footwear = activeItems.filter((i) => i.category === 'footwear');
      const layers = activeItems.filter((i) => i.category === 'layers');
      const accessories = activeItems.filter((i) => i.category === 'accessories');

      // Build daily plan
      const dailyOutfits = [];
      for (let day = 1; day <= days; day++) {
        const top = tops[(day - 1) % tops.length] || tops[0];
        const bottom = bottoms[(day - 1) % bottoms.length] || bottoms[0];
        const shoe = footwear[(day - 1) % footwear.length] || footwear[0];
        dailyOutfits.push({
          day: `Day ${day}`,
          theme: day === 1 ? 'Travel & Arrival' : day === days ? 'Farewell & Departure' : 'Exploration & Evening Dinner',
          top,
          bottom,
          shoe,
        });
      }

      // Checklist of items needed
      const neededTops = tops.slice(0, Math.min(days + 1, tops.length));
      const neededBottoms = bottoms.slice(0, Math.min(Math.ceil(days / 1.5), bottoms.length));
      const neededFootwear = footwear.slice(0, 2);
      const neededAccessories = accessories.slice(0, 2);

      const checklist = [
        ...neededTops.map((t) => ({ id: `top_${t.id}`, label: t.name, category: 'Tops' })),
        ...neededBottoms.map((b) => ({ id: `bottom_${b.id}`, label: b.name, category: 'Bottoms' })),
        ...neededFootwear.map((f) => ({ id: `foot_${f.id}`, label: f.name, category: 'Footwear' })),
        ...neededAccessories.map((a) => ({ id: `acc_${a.id}`, label: a.name, category: 'Accessories' })),
        { id: 'undergarments', label: `${days + 2} Pairs Undergarments & Socks`, category: 'Essentials' },
        { id: 'toiletries', label: 'Travel Grooming Kit & Perfume', category: 'Essentials' },
      ];

      setGeneratedPlan({
        dailyOutfits,
        checklist,
        summary: `Packed capsule wardrobe: ${neededTops.length} tops, ${neededBottoms.length} bottoms, and ${neededFootwear.length} pairs of versatile shoes.`,
      });
      setIsGenerating(false);
    }, 600);
  };

  const toggleCheck = (id: string) => {
    if (checkedItems.includes(id)) {
      setCheckedItems(checkedItems.filter((i) => i !== id));
    } else {
      setCheckedItems([...checkedItems, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FBF9F6] w-full max-w-2xl rounded-3xl border border-[#EBE5DB] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-white border-b border-[#EBE5DB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Luggage className="w-5 h-5 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
              Travel Mode & Packing Planner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4EFEA] text-[#7E6047] hover:text-[#18181B] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-7 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Destination Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Goa, Jaipur, London..."
                className="w-full px-3.5 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                Trip Duration (Days)
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              >
                {[2, 3, 4, 5, 7, 10, 14].map((d) => (
                  <option key={d} value={d}>
                    {d} Days
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                Trip Vibe
              </label>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              >
                <option value="Leisure / Beach">Leisure / Holiday</option>
                <option value="Business / Work">Business Conference</option>
                <option value="Wedding / Celebration">Wedding / Festive</option>
                <option value="City Exploration">City Exploration</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md flex items-center space-x-2"
            >
              <Plane className="w-4 h-4" />
              <span>{isGenerating ? 'Curating Trip Plan…' : 'Generate Itinerary & Packing List'}</span>
            </button>
          </div>

          {/* Generated Plan */}
          {generatedPlan && (
            <div className="space-y-6 pt-4 border-t border-[#EBE5DB] animate-in fade-in duration-300">
              <div className="p-4 bg-[#FAF8F5] border border-[#E8DFD5] rounded-2xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E6047]">
                  Capsule Strategy
                </span>
                <p className="text-xs sm:text-sm text-[#18181B] mt-1 font-medium">
                  {generatedPlan.summary}
                </p>
              </div>

              {/* Packing Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-3 flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-[#9A7B5F]" />
                  <span>Interactive Packing Checklist ({checkedItems.length}/{generatedPlan.checklist.length} Packed)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedPlan.checklist.map((item: any) => {
                    const isChecked = checkedItems.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 line-through opacity-80'
                            : 'bg-white border-[#EBE5DB] text-[#18181B] hover:border-[#18181B]'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#9A7B5F] flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Outfits Plan */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-3 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#9A7B5F]" />
                  <span>Daily Outfit Breakdown</span>
                </h4>
                <div className="space-y-3">
                  {generatedPlan.dailyOutfits.map((d: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white border border-[#EBE5DB] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-bold text-sm text-[#18181B]">
                            {d.day}
                          </span>
                          <span className="text-[10px] bg-[#F4EFEA] text-[#7E6047] px-2 py-0.5 rounded-md font-semibold">
                            {d.theme}
                          </span>
                        </div>
                        <p className="text-xs text-[#5E4633] mt-1">
                          {d.top?.name} + {d.bottom?.name} + {d.shoe?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
