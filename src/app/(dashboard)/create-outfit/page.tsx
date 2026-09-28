'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Mic,
  MicOff,
  X,
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

function CreateOutfitContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [occasion, setOccasion] = useState<OccasionType>(
    (searchParams.get('occasion') as OccasionType) || 'Date'
  );
  const [customOccasionText, setCustomOccasionText] = useState(
    searchParams.get('custom') || ''
  );
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<any>(null);

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
    'Assessing climate, environment & Indian context…',
    'Synthesizing proportions, color harmony & fabric breathability…',
    'Curating your complete look…',
  ];

  // Speech-to-Text Voice Handler
  const startListening = () => {
    setSpeechError('');
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice recognition is not supported in this browser. Please type your description.');
      return;
    }

    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setCustomOccasionText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please enable microphone access in your browser.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please tap the mic and try speaking again.');
        } else {
          setSpeechError('Voice recognition error. Please type your description.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not access microphone. Please type your description.');
      setIsListening(false);
    }
  };

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
    if (searchParams.get('occasion') || searchParams.get('custom')) {
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
          customOccasionText: customOccasionText.trim() || undefined,
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
          custom_occasion_text: outfitToSave.custom_occasion_text,
          interpreted_occasion: outfitToSave.interpreted_occasion,
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

      {/* Mode Switcher Banner: Style It Yourself */}
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#EBE5DB] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-9 h-9 rounded-full bg-[#18181B] text-[#D4AF37] flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 shadow-xs">
            ✦
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-[#18181B]">
              Prefer to curate your own pieces?
            </h4>
            <p className="text-[11px] text-[#7E6047] mt-0.5">
              Switch to <strong>Style It Yourself</strong> mode to assemble your own look and let AUREVÉ evaluate &amp; rate it.
            </p>
          </div>
        </div>
        <Link
          href="/style-yourself"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs self-start sm:self-auto group"
        >
          <span>✦ Style It Yourself Mode</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
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

        {/* Divider / OR indicator */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#EBE5DB]"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-[#9A7B5F]">
            OR
          </span>
          <div className="flex-grow border-t border-[#EBE5DB]"></div>
        </div>

        {/* Custom Occasion Description & Voice Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7E6047]">
              Describe Your Occasion
            </label>
            {isListening && (
              <span className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-[#7E6047] animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Listening… speak now</span>
              </span>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={2}
              maxLength={300}
              value={customOccasionText}
              onChange={(e) => setCustomOccasionText(e.target.value)}
              placeholder="e.g. Farewell party at college outdoors, dinner with manager at a nice restaurant, or rooftop party..."
              className="w-full px-4 py-3 pr-20 bg-[#FAF8F5] border border-[#EBE5DB] rounded-2xl text-xs sm:text-sm font-medium text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B] transition-colors resize-none"
            />
            <div className="absolute right-3 top-3 flex items-center space-x-1.5">
              {customOccasionText && (
                <button
                  type="button"
                  onClick={() => setCustomOccasionText('')}
                  title="Clear description"
                  className="p-1.5 rounded-full text-[#9A7B5F] hover:text-[#18181B] hover:bg-[#EBE5DB]/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={startListening}
                title={isListening ? 'Stop recording' : 'Speak your occasion'}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${
                  isListening
                    ? 'bg-red-500 text-white shadow-md animate-pulse'
                    : 'bg-white border border-[#EBE5DB] text-[#5E4633] hover:text-[#18181B] hover:border-[#18181B] shadow-xs'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-[#7E6047]" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9A7B5F]">
            <p>
              Describe where you&apos;re going, what you&apos;re doing, the vibe, or how you want to dress.
            </p>
            <span>{customOccasionText.length}/300</span>
          </div>

          {speechError && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{speechError}</span>
            </p>
          )}
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

export default function CreateOutfitPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-[#7E6047]">Loading AI Styling Studio…</div>}>
      <CreateOutfitContent />
    </React.Suspense>
  );
}
