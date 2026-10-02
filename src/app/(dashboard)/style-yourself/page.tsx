'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Shirt,
  Compass,
  Check,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Heart,
  ThumbsUp,
  CloudSun,
  X,
  Layers,
  Sparkle,
  Sliders,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  WardrobeItem,
  Outfit,
  WeatherData,
  SelfStyledAnalysis,
  OccasionType,
  ItemRole,
  OutfitItemReference,
} from '@/lib/types';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { FeedbackModal } from '@/components/outfit/FeedbackModal';

const OCCASIONS: { label: OccasionType; emoji: string }[] = [
  { label: 'Casual Outing', emoji: '☕' },
  { label: 'Date', emoji: '🍷' },
  { label: 'Office', emoji: '💼' },
  { label: 'Dinner', emoji: '🍽️' },
  { label: 'Party', emoji: '✨' },
  { label: 'College', emoji: '📚' },
  { label: 'Wedding', emoji: '🎉' },
  { label: 'Festival', emoji: '🪔' },
  { label: 'Family Function', emoji: '👨‍👩‍👧' },
  { label: 'Interview', emoji: '👔' },
  { label: 'Travel', emoji: '✈️' },
  { label: 'Gym', emoji: '🏃' },
  { label: 'Home', emoji: '🛋️' },
];

function StyleYourselfContent() {
  const router = useRouter();

  // Wardrobe & Selection State
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(true);

  const [selectedTop, setSelectedTop] = useState<WardrobeItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<WardrobeItem | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<WardrobeItem | null>(null);
  const [selectedFootwear, setSelectedFootwear] = useState<WardrobeItem | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<WardrobeItem[]>([]);

  // Context State
  const [occasion, setOccasion] = useState<OccasionType>('Casual Outing');
  const [customOccasionText, setCustomOccasionText] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Active Category Tab in Wardrobe Selector
  const [activeTab, setActiveTab] = useState<'tops' | 'bottoms' | 'layers' | 'footwear' | 'accessories'>('tops');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SelfStyledAnalysis | null>(null);
  const [error, setError] = useState('');
  const [savedOutfitId, setSavedOutfitId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Fetch Wardrobe & Weather on Mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingWardrobe(true);
      try {
        const [wRes, weatherRes] = await Promise.all([
          fetch('/api/wardrobe'),
          fetch(`/api/weather?city=${encodeURIComponent(city)}`),
        ]);

        if (wRes.ok) {
          const data = await wRes.json();
          setWardrobe(data.items || []);
        }

        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          setWeather(wData.weather);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingWardrobe(false);
      }
    }
    loadData();
  }, [city]);

  // Wardrobe Items Filtered by Active Tab
  const tabItems = wardrobe.filter((item) => {
    if (item.is_archived) return false;
    const cat = item.category.toLowerCase();
    if (activeTab === 'tops') return cat === 'tops' || cat.startsWith('top');
    if (activeTab === 'bottoms') return cat === 'bottoms' || cat.startsWith('bottom');
    if (activeTab === 'layers') return cat === 'layers' || cat.startsWith('layer');
    if (activeTab === 'footwear') return cat === 'footwear';
    if (activeTab === 'accessories') return cat === 'accessories' || cat.startsWith('access');
    return false;
  });

  // Handle Item Click in Garment Selector
  const handleItemSelect = (item: WardrobeItem) => {
    const cat = item.category.toLowerCase();

    if (cat === 'tops' || cat.startsWith('top')) {
      setSelectedTop((prev) => (prev?.id === item.id ? null : item));
    } else if (cat === 'bottoms' || cat.startsWith('bottom')) {
      setSelectedBottom((prev) => (prev?.id === item.id ? null : item));
    } else if (cat === 'layers' || cat.startsWith('layer')) {
      setSelectedLayer((prev) => (prev?.id === item.id ? null : item));
    } else if (cat === 'footwear') {
      setSelectedFootwear((prev) => (prev?.id === item.id ? null : item));
    } else if (cat === 'accessories' || cat.startsWith('access')) {
      if (selectedAccessories.some((a) => a.id === item.id)) {
        setSelectedAccessories((prev) => prev.filter((a) => a.id !== item.id));
      } else {
        if (selectedAccessories.length >= 3) {
          alert('You can select up to 3 accessories for a balanced look.');
          return;
        }
        setSelectedAccessories((prev) => [...prev, item]);
      }
    }
  };

  const isItemSelected = (id: string) => {
    if (selectedTop?.id === id) return true;
    if (selectedBottom?.id === id) return true;
    if (selectedLayer?.id === id) return true;
    if (selectedFootwear?.id === id) return true;
    return selectedAccessories.some((a) => a.id === id);
  };

  const clearSelection = () => {
    setSelectedTop(null);
    setSelectedBottom(null);
    setSelectedLayer(null);
    setSelectedFootwear(null);
    setSelectedAccessories([]);
    setAnalysisResult(null);
    setError('');
    setIsSaved(false);
  };

  // Analyze the Self-Styled Look
  const handleAnalyzeLook = async () => {
    if (!selectedTop && !selectedBottom) {
      setError('Please select at least a top and a bottom from your wardrobe.');
      return;
    }
    if (!selectedTop) {
      setError('Please select a top piece.');
      return;
    }
    if (!selectedBottom) {
      setError('Please select a bottom piece.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult(null);
    setIsSaved(false);

    const itemIds = [
      selectedTop?.id,
      selectedBottom?.id,
      selectedLayer?.id,
      selectedFootwear?.id,
      ...selectedAccessories.map((a) => a.id),
    ].filter(Boolean) as string[];

    try {
      const res = await fetch('/api/outfits/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_ids: itemIds,
          occasion,
          customOccasionText: customOccasionText.trim() || undefined,
          location: city,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not analyze your look.');
        setIsAnalyzing(false);
        return;
      }

      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        // Automatically save to My Looks history
        await handleSaveLook(data.analysis);
      }
    } catch (err) {
      setError('A connection error occurred while consulting the AI stylist.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveLook = async (analysis: SelfStyledAnalysis) => {
    const items: OutfitItemReference[] = [];
    if (selectedTop) items.push({ wardrobe_item_id: selectedTop.id, role: 'top', item: selectedTop });
    if (selectedBottom) items.push({ wardrobe_item_id: selectedBottom.id, role: 'bottom', item: selectedBottom });
    if (selectedFootwear) items.push({ wardrobe_item_id: selectedFootwear.id, role: 'footwear', item: selectedFootwear });
    if (selectedLayer) items.push({ wardrobe_item_id: selectedLayer.id, role: 'layer', item: selectedLayer });
    selectedAccessories.forEach((acc) => {
      items.push({ wardrobe_item_id: acc.id, role: 'accessory', item: acc });
    });

    try {
      const res = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion,
          custom_occasion_text: customOccasionText.trim() || null,
          interpreted_occasion: `${occasion} (Self-Styled)`,
          date: new Date().toISOString().split('T')[0],
          time: '19:00',
          location: city,
          weather_data: weather,
          title: `Self-Styled Look • ${analysis.verdict}`,
          ai_explanation: analysis.what_works,
          style_match: Math.round(analysis.overall_score * 10),
          style_direction: ['Self-Styled', 'Personal Curation', analysis.verdict],
          items,
          is_self_styled: true,
          self_styled_analysis: analysis,
        }),
      });

      const data = await res.json();
      if (data.success && data.outfit) {
        setIsSaved(true);
        setSavedOutfitId(data.outfit.id);
      }
    } catch (err) {
      console.error('Failed to auto-save self-styled look:', err);
    }
  };

  const handleWearLook = async () => {
    if (!savedOutfitId) return;
    try {
      const items = [selectedTop, selectedBottom, selectedLayer, selectedFootwear, ...selectedAccessories].filter(Boolean);
      for (const it of items) {
        if (it?.id) {
          await fetch(`/api/wardrobe/${it.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ times_worn: (it.times_worn || 0) + 1 }),
          });
        }
      }
      alert('Logged! Item wear counts have been updated in your wardrobe.');
      setIsFeedbackOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const isReadyToAnalyze = Boolean(selectedTop && selectedBottom);

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Page Heading & Secondary Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
              Interactive Fashion Studio
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#18181B] text-[#FAF8F5]">
              Self-Curation
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B] tracking-tight mt-1">
            Style It Yourself
          </h1>
          <p className="text-xs sm:text-sm text-[#7E6047] mt-1">
            Build a look from your active wardrobe and let AUREVÉ rate, evaluate, and elevate it.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <Link
            href="/create-outfit"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white border border-[#EBE5DB] hover:border-[#18181B] text-xs font-semibold text-[#5E4633] hover:text-[#18181B] transition-all shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9A7B5F]" />
            <span>Switch to AI Stylist Mode →</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left = Wardrobe Picker, Right = Live Look Preview & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Garment Selector & Category Tabs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE5DB] pb-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
                  Select Your Pieces
                </h3>
                <p className="text-xs text-[#7E6047]">
                  Tap pieces from your wardrobe to assemble your outfit.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#7E6047]">
                {wardrobe.length} items in closet
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'tops', label: '1. Tops', count: wardrobe.filter((w) => w.category === 'tops').length },
                { id: 'bottoms', label: '2. Bottoms', count: wardrobe.filter((w) => w.category === 'bottoms').length },
                { id: 'layers', label: '3. Layer (Opt)', count: wardrobe.filter((w) => w.category === 'layers').length },
                { id: 'footwear', label: '4. Footwear', count: wardrobe.filter((w) => w.category === 'footwear').length },
                { id: 'accessories', label: '5. Accessories', count: wardrobe.filter((w) => w.category === 'accessories').length },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-[#18181B] text-white shadow-sm'
                        : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:border-[#18181B]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#EBE5DB] text-[#5E4633]'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Garments Grid */}
            {isLoadingWardrobe ? (
              <div className="p-12 text-center text-xs text-[#7E6047]">
                Loading your active wardrobe…
              </div>
            ) : tabItems.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F5] border border-dashed border-[#EBE5DB] rounded-2xl space-y-2">
                <p className="text-xs font-medium text-[#5E4633]">
                  No items found in this category.
                </p>
                <Link
                  href="/wardrobe/add"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-[#18181B] underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add clothing to wardrobe →</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-h-[480px] overflow-y-auto pr-1">
                {tabItems.map((item) => {
                  const selected = isItemSelected(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemSelect(item)}
                      className={`text-left p-2.5 rounded-2xl border transition-all flex flex-col relative group ${
                        selected
                          ? 'border-[#18181B] bg-[#FAF8F5] ring-2 ring-[#18181B]/10 shadow-md scale-[1.02]'
                          : 'border-[#EBE5DB] bg-white hover:border-[#9A7B5F]'
                      }`}
                    >
                      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#FAF8F5] mb-2 shadow-2xs">
                        <Image
                          src={item.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        {selected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#7E6047] capitalize line-clamp-1">
                        {item.primary_color} • {item.subcategory || item.category}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Target Occasion Picker (Optional Context) */}
            <div className="pt-4 border-t border-[#EBE5DB] space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7E6047]">
                Target Occasion (Optional Context)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((occ) => {
                  const isSelected = occasion === occ.label;
                  return (
                    <button
                      key={occ.label}
                      type="button"
                      onClick={() => setOccasion(occ.label)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1 ${
                        isSelected
                          ? 'bg-[#18181B] text-white shadow-xs'
                          : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:border-[#18181B]'
                      }`}
                    >
                      <span>{occ.emoji}</span>
                      <span>{occ.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Look Summary & Analysis Results (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Live Look Summary Card */}
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#EBE5DB] pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#18181B]" />
                <h3 className="font-serif text-xl font-semibold text-[#18181B]">
                  Your Look
                </h3>
              </div>
              {(selectedTop || selectedBottom || selectedFootwear || selectedLayer || selectedAccessories.length > 0) && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-[#7E6047] hover:text-[#18181B] underline font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Assembled Garment Boxes */}
            <div className="grid grid-cols-2 gap-3">
              {/* Top Piece */}
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047]">
                    TOP PIECE
                  </span>
                  {selectedTop && (
                    <button onClick={() => setSelectedTop(null)} className="text-[#9A7B5F] hover:text-rose-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {selectedTop ? (
                  <div className="flex items-center space-x-2.5 mt-2">
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0 shadow-2xs">
                      <Image src={selectedTop.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'} alt={selectedTop.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#18181B] line-clamp-1">{selectedTop.name}</p>
                      <p className="text-[10px] text-[#7E6047]">{selectedTop.primary_color}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('tops')}
                    className="my-auto py-3 text-center text-xs font-medium text-[#9A7B5F] hover:text-[#18181B] border border-dashed border-[#D6C7B7] rounded-xl"
                  >
                    + Pick Top
                  </button>
                )}
              </div>

              {/* Bottom Piece */}
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047]">
                    BOTTOM PIECE
                  </span>
                  {selectedBottom && (
                    <button onClick={() => setSelectedBottom(null)} className="text-[#9A7B5F] hover:text-rose-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {selectedBottom ? (
                  <div className="flex items-center space-x-2.5 mt-2">
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0 shadow-2xs">
                      <Image src={selectedBottom.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'} alt={selectedBottom.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#18181B] line-clamp-1">{selectedBottom.name}</p>
                      <p className="text-[10px] text-[#7E6047]">{selectedBottom.primary_color}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('bottoms')}
                    className="my-auto py-3 text-center text-xs font-medium text-[#9A7B5F] hover:text-[#18181B] border border-dashed border-[#D6C7B7] rounded-xl"
                  >
                    + Pick Bottom
                  </button>
                )}
              </div>

              {/* Footwear */}
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047]">
                    FOOTWEAR
                  </span>
                  {selectedFootwear && (
                    <button onClick={() => setSelectedFootwear(null)} className="text-[#9A7B5F] hover:text-rose-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {selectedFootwear ? (
                  <div className="flex items-center space-x-2.5 mt-1">
                    <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0 shadow-2xs">
                      <Image src={selectedFootwear.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'} alt={selectedFootwear.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#18181B] line-clamp-1">{selectedFootwear.name}</p>
                      <p className="text-[10px] text-[#7E6047]">{selectedFootwear.primary_color}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('footwear')}
                    className="my-auto py-2 text-center text-xs font-medium text-[#9A7B5F] hover:text-[#18181B] border border-dashed border-[#D6C7B7] rounded-xl"
                  >
                    + Add Shoes
                  </button>
                )}
              </div>

              {/* Layer or Accessories */}
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047]">
                    LAYER / ACCENTS
                  </span>
                  {selectedLayer && (
                    <button onClick={() => setSelectedLayer(null)} className="text-[#9A7B5F] hover:text-rose-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {selectedLayer ? (
                  <div className="flex items-center space-x-2.5 mt-1">
                    <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0 shadow-2xs">
                      <Image src={selectedLayer.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'} alt={selectedLayer.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#18181B] line-clamp-1">{selectedLayer.name}</p>
                      <p className="text-[10px] text-[#7E6047]">Layer</p>
                    </div>
                  </div>
                ) : selectedAccessories.length > 0 ? (
                  <div className="flex items-center space-x-1.5 mt-1">
                    {selectedAccessories.map((acc) => (
                      <div key={acc.id} className="relative w-8 h-10 rounded-md overflow-hidden bg-white shadow-2xs">
                        <Image src={acc.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'} alt={acc.name} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('layers')}
                    className="my-auto py-2 text-center text-xs font-medium text-[#9A7B5F] hover:text-[#18181B] border border-dashed border-[#D6C7B7] rounded-xl"
                  >
                    + Add Layer
                  </button>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleAnalyzeLook}
              disabled={!isReadyToAnalyze || isAnalyzing}
              className={`w-full py-4 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all shadow-lg flex items-center justify-center space-x-2 ${
                isReadyToAnalyze && !isAnalyzing
                  ? 'bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] active:scale-98'
                  : 'bg-[#EBE5DB] text-[#9A7B5F] cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#EEDC82]" />
              <span>{isAnalyzing ? 'AUREVÉ is Analyzing Your Look…' : 'ANALYZE MY LOOK'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* AI Analysis Results Card */}
          {analysisResult && !isAnalyzing && (
            <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
              {/* Score Header */}
              <div className="flex items-center justify-between border-b border-[#EBE5DB] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047]">
                    OUTFIT CRITIQUE
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#18181B]">
                    {analysisResult.verdict}
                  </h3>
                </div>

                {/* Score Pill Badge */}
                <div className="flex items-center space-x-2 bg-[#FAF8F5] border border-[#E8DFD5] px-4 py-2 rounded-2xl shadow-xs">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] uppercase font-bold text-[#7E6047] tracking-wider">
                      Overall
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#18181B]">
                      {analysisResult.overall_score}
                      <span className="text-xs text-[#7E6047] font-sans">/10</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Categorical Breakdown Bars */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047]">
                  SCORE BREAKDOWN
                </span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DB] flex justify-between items-center">
                    <span className="text-[#5E4633] font-medium">Color Harmony</span>
                    <span className="font-bold text-[#18181B]">{analysisResult.breakdown.color_harmony}/10</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DB] flex justify-between items-center">
                    <span className="text-[#5E4633] font-medium">Style Cohesion</span>
                    <span className="font-bold text-[#18181B]">{analysisResult.breakdown.style_cohesion}/10</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DB] flex justify-between items-center">
                    <span className="text-[#5E4633] font-medium">Fit & Proportion</span>
                    <span className="font-bold text-[#18181B]">{analysisResult.breakdown.fit_and_proportion}/10</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DB] flex justify-between items-center">
                    <span className="text-[#5E4633] font-medium">Occasion Fit</span>
                    <span className="font-bold text-[#18181B]">{analysisResult.breakdown.occasion_fit}/10</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DB] flex justify-between items-center">
                    <span className="text-[#5E4633] font-medium">Footwear</span>
                    <span className="font-bold text-[#18181B]">{analysisResult.breakdown.footwear_compatibility}/10</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DB] flex justify-between items-center">
                    <span className="text-[#5E4633] font-medium">Accessories</span>
                    <span className="font-bold text-[#18181B]">{analysisResult.breakdown.accessory_balance}/10</span>
                  </div>
                </div>
              </div>

              {/* What Works */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#18181B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#9A7B5F]" />
                  <span>WHAT WORKS</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3D2E22] leading-relaxed">
                  {analysisResult.what_works}
                </p>
              </div>

              {/* Actionable Improvement */}
              <div className="p-4 rounded-2xl bg-[#F4EFEA] border border-[#E8DFD5] space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#7E6047]">
                  <Compass className="w-3.5 h-3.5 text-[#7E6047]" />
                  <span>HOW TO ELEVATE THIS LOOK</span>
                </div>
                <p className="text-xs sm:text-sm text-[#5E4633] leading-relaxed">
                  {analysisResult.how_to_improve}
                </p>
              </div>

              {/* Wardrobe Alternatives Suggestions */}
              {analysisResult.wardrobe_alternatives && analysisResult.wardrobe_alternatives.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047]">
                    STYLIST RECOMMENDATIONS FROM YOUR CLOSET
                  </span>
                  <div className="space-y-2">
                    {analysisResult.wardrobe_alternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white border border-[#EBE5DB] shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-[#18181B]">{alt.title}</p>
                          <p className="text-[11px] text-[#7E6047] leading-snug">{alt.description}</p>
                        </div>
                        {alt.swapped_item && (
                          <button
                            type="button"
                            onClick={() => {
                              if (alt.target_role === 'bottom') setSelectedBottom(alt.swapped_item!);
                              if (alt.target_role === 'footwear') setSelectedFootwear(alt.swapped_item!);
                              if (alt.target_role === 'layer') setSelectedLayer(alt.swapped_item!);
                              if (alt.target_role === 'accessory') {
                                setSelectedAccessories((prev) => [...prev, alt.swapped_item!]);
                              }
                            }}
                            className="px-3 py-1.5 rounded-full bg-[#18181B] text-white text-[11px] font-semibold flex-shrink-0"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#EBE5DB]">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#F4EFEA] hover:bg-[#E8DFD5] text-[#5E4633] border border-[#E8DFD5] transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Rate This Look</span>
                  </button>

                  <span className="text-xs text-[#7E6047]">
                    {isSaved ? '✓ Saved to Looks' : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleWearLook}
                  className="inline-flex items-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide shadow-md transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>I Wore This Today</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal for Learning Loop */}
      <FeedbackModal
        outfitId={savedOutfitId || 'temp_self_styled'}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}

export default function StyleYourselfPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-[#7E6047]">Loading Fashion Studio…</div>}>
      <StyleYourselfContent />
    </React.Suspense>
  );
}
