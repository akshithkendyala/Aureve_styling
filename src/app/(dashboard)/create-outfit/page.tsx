'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Compass,
  Calendar,
  Clock,
  MapPin,
  CloudSun,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Shirt,
  Check,
} from 'lucide-react';
import {
  OccasionType,
  Outfit,
  WeatherData,
  AlternativeLook,
} from '@/lib/types';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { OutfitResultCard } from '@/components/outfit/OutfitResultCard';
import { AlternativeLooks } from '@/components/outfit/AlternativeLooks';
import { FeedbackModal } from '@/components/outfit/FeedbackModal';

export default function CreateOutfitPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [occasion, setOccasion] = useState<OccasionType>(
    (searchParams.get('occasion') as OccasionType) || 'Date'
  );
  const [date, setDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState(searchParams.get('time') || '19:30');
  const [city, setCity] = useState(searchParams.get('city') || 'Mumbai');
  const [specialMode, setSpecialMode] = useState(searchParams.get('mode') || 'standard');

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [generatedOutfit, setGeneratedOutfit] = useState<Outfit | null>(null);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savedOutfitId, setSavedOutfitId] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const occasions: { label: OccasionType; emoji: string }[] = [
    { label: 'Date', emoji: '🍷' },
    { label: 'Office', emoji: '💼' },
    { label: 'Casual Outing', emoji: '☕' },
    { label: 'Dinner', emoji: '🍽️' },
    { label: 'Party', emoji: '✨' },
    { label: 'Wedding', emoji: '🎉' },
    { label: 'Festival', emoji: '🪔' },
    { label: 'Family Function', emoji: '👨‍👩‍👧' },
    { label: 'Interview', emoji: '👔' },
    { label: 'College', emoji: '📚' },
    { label: 'Travel', emoji: '✈️' },
    { label: 'Gym', emoji: '🏃' },
    { label: 'Home', emoji: '🛋️' },
  ];

  const loadingMessages = [
    'Analyzing your active wardrobe…',
    'Assessing Mumbai climate and Indian context…',
    'Synthesizing proportions, color harmony & fabric breathability…',
    'Curating your complete look…',
  ];

  // Fetch weather when city changes
  useEffect(() => {
    async function loadWeather() {
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        if (res.ok) {
          const data = await res.json();
          setWeather(data.weather);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadWeather();
  }, [city]);

  // If occasion passed via query param, auto-generate outfit
  useEffect(() => {
    if (searchParams.get('occasion')) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedOutfit(null);
    setIsSaved(false);

    // Progressive loading text sequence
    setLoadingStage(0);
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await fetch('/api/outfits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion,
          date,
          time,
          location: city,
          specialMode,
        }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not generate outfit.');
        setIsGenerating(false);
        return;
      }

      if (data.success && data.outfit) {
        const fullOutfit: Outfit = {
          id: `tmp_${Date.now()}`,
          user_id: '',
          created_at: new Date().toISOString(),
          ...data.outfit,
        };
        setGeneratedOutfit(fullOutfit);
        // Automatically save to looks history
        await handleSaveOutfit(fullOutfit);
      }
    } catch (err) {
      clearInterval(interval);
      setError('A connection error occurred while consulting the AI stylist.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOutfit = async (outfitToSave: Outfit) => {
    try {
      const res = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: outfitToSave.occasion,
          date: outfitToSave.date,
          time: outfitToSave.time,
          location: outfitToSave.location,
          weather_data: outfitToSave.weather_data,
          title: outfitToSave.title,
          ai_explanation: outfitToSave.ai_explanation,
          style_match: outfitToSave.style_match,
          style_direction: outfitToSave.style_direction,
          items: outfitToSave.items,
        }),
      });

      const data = await res.json();
      if (data.success && data.outfit) {
        setIsSaved(true);
        setSavedOutfitId(data.outfit.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWearOutfit = async () => {
    if (!generatedOutfit) return;
    try {
      await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generatedOutfit,
          markAsWorn: true,
        }),
      });
      alert('Logged! Item wear counts have been updated in your wardrobe.');
      setIsFeedbackOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAlternative = (alt: AlternativeLook) => {
    if (!generatedOutfit) return;
    setGeneratedOutfit({
      ...generatedOutfit,
      title: alt.title,
      ai_explanation: alt.description,
      items: alt.items,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
            AI Styling Studio
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B] tracking-tight">
            Style My Look
          </h1>
          <p className="text-xs sm:text-sm text-[#7E6047] mt-1">
            Indian climate-aware, occasion-tailored combinations using only your clothes.
          </p>
        </div>

        {weather && (
          <div className="flex items-center space-x-2.5 bg-white border border-[#EBE5DB] px-4 py-2 rounded-2xl shadow-xs self-start sm:self-auto">
            <CloudSun className="w-5 h-5 text-[#9A7B5F]" />
            <div>
              <span className="text-xs font-semibold text-[#18181B]">
                {weather.city}: {weather.temperature}°C
              </span>
              <p className="text-[10px] text-[#7E6047]">{weather.condition}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Parameters Box */}
      <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 shadow-sm space-y-6">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {error.includes('empty') && (
                <div className="mt-2">
                  <button
                    onClick={() => router.push('/wardrobe')}
                    className="inline-flex items-center space-x-1 underline font-semibold"
                  >
                    <span>Go to My Wardrobe to add clothes →</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Occasion Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#7E6047] mb-2.5">
            Occasion
          </label>
          <div className="flex flex-wrap gap-2">
            {occasions.map((occ) => {
              const isSelected = occasion === occ.label;
              return (
                <button
                  key={occ.label}
                  type="button"
                  onClick={() => setOccasion(occ.label)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-[#18181B] text-white shadow-md scale-105'
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

        {/* Date, Time & City */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E6047] mb-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E6047] mb-1">
              Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E6047] mb-1">
              City / Weather
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              >
                {POPULAR_INDIAN_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all shadow-lg flex items-center justify-center space-x-2 group active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-[#EEDC82] group-hover:rotate-12 transition-transform" />
            <span>{isGenerating ? 'Styling Your Look…' : 'CREATE OUTFIT'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* AI Progressive Loading State */}
      {isGenerating && (
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-12 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="w-16 h-16 border-3 border-[#18181B] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-semibold text-[#18181B]">
              AUREVÉ is Styling Your Look
            </h3>
            <p className="text-xs sm:text-sm text-[#7E6047] font-medium transition-all duration-300">
              {loadingMessages[loadingStage]}
            </p>
          </div>
        </div>
      )}

      {/* Generated Outfit Result */}
      {generatedOutfit && !isGenerating && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Main Editorial Card */}
          <OutfitResultCard
            outfit={generatedOutfit}
            onWearOutfit={handleWearOutfit}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
            onSaveOutfit={() => handleSaveOutfit(generatedOutfit)}
            isSaved={isSaved}
          />

          {/* Alternative Looks Section */}
          {generatedOutfit.alternative_looks && generatedOutfit.alternative_looks.length > 0 && (
            <AlternativeLooks
              alternatives={generatedOutfit.alternative_looks}
              onSelectAlternative={handleSelectAlternative}
            />
          )}
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        outfitId={savedOutfitId || generatedOutfit?.id || 'temp'}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}
