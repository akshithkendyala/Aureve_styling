'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Palette,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Heart,
  Ban,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';

const SKIN_TONES = [
  { label: 'Warm Olive', color: '#BCA07D' },
  { label: 'Medium Wheatish', color: '#D2B18A' },
  { label: 'Dusky', color: '#8C6747' },
  { label: 'Deep Tan', color: '#A57850' },
  { label: 'Fair', color: '#F0D5BE' },
];

const FIT_OPTIONS: { label: 'Slim' | 'Regular' | 'Relaxed' | 'Oversized'; desc: string }[] = [
  { label: 'Slim', desc: 'Tailored closer to the body silhouette' },
  { label: 'Regular', desc: 'Classic, balanced and versatile fit' },
  { label: 'Relaxed', desc: 'Comfortable, breathable drape' },
  { label: 'Oversized', desc: 'Roomy, modern streetwear aesthetic' },
];

const POPULAR_COLORS = [
  'Navy Blue',
  'White',
  'Olive Green',
  'Charcoal Grey',
  'Beige',
  'Black',
  'Sky Blue',
  'Sand',
  'Burgundy',
  'Sage Green',
  'Off-White',
  'Brown',
  'Terracotta',
];

const AVOID_COLORS = [
  'Neon Green',
  'Bright Orange',
  'Hot Pink',
  'Mustard Yellow',
  'Bright Red',
  'Electric Blue',
  'Purple',
];

const STYLE_PERSONAS = [
  'Minimal',
  'Casual',
  'Smart Casual',
  'Formal',
  'Streetwear',
  'Sporty',
  'Traditional',
  'Modern Indian',
];

const OCCASIONS = [
  { label: 'Office', emoji: '💼' },
  { label: 'College', emoji: '📚' },
  { label: 'Casual outings', emoji: '☕' },
  { label: 'Dates', emoji: '🍷' },
  { label: 'Parties', emoji: '✨' },
  { label: 'Weddings / functions', emoji: '🎉' },
  { label: 'Travel', emoji: '✈️' },
  { label: 'Sports / fitness', emoji: '🏃' },
  { label: 'Home', emoji: '🛋️' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState('');

  // Step 1: Physical Profile & Location
  const [height, setHeight] = useState("5'10\"");
  const [weight, setWeight] = useState('72 kg');
  const [skinTone, setSkinTone] = useState('Warm Olive');
  const [preferredFit, setPreferredFit] = useState<'Slim' | 'Regular' | 'Relaxed' | 'Oversized'>('Regular');
  const [city, setCity] = useState('Mumbai');

  // Step 2: Style & Colors
  const [favoriteColors, setFavoriteColors] = useState<string[]>(['Navy Blue', 'White', 'Olive Green', 'Charcoal Grey']);
  const [avoidedColors, setAvoidedColors] = useState<string[]>(['Neon Green', 'Bright Orange']);
  const [stylePrefs, setStylePrefs] = useState<string[]>(['Smart Casual', 'Minimal', 'Modern Indian']);

  // Step 3: Comfort & Lifestyle
  const [comfortPreference, setComfortPreference] = useState<'Maximum Comfort' | 'Balanced' | 'Structure & Sharpness'>('Balanced');
  const [typicalOccasions, setTypicalOccasions] = useState<string[]>(['Office', 'Casual outings', 'Dates']);

  // Errors
  const [stepError, setStepError] = useState('');

  useEffect(() => {
    async function loadAuthAndDraft() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (data.authenticated && data.user) {
          setUserName(data.user.name || 'Gentleman');

          // If user already completed onboarding, redirect straight to dashboard
          if (data.profile?.profile_completed === true) {
            router.push('/dashboard');
            return;
          }

          // Populate existing fields if any
          if (data.profile) {
            const p = data.profile;
            if (p.height) setHeight(p.height);
            if (p.weight) setWeight(p.weight);
            if (p.skin_tone) setSkinTone(p.skin_tone);
            if (p.preferred_fit) setPreferredFit(p.preferred_fit);
            if (p.city) setCity(p.city);
            if (p.favorite_colors && p.favorite_colors.length > 0) setFavoriteColors(p.favorite_colors);
            if (p.avoided_colors && p.avoided_colors.length > 0) setAvoidedColors(p.avoided_colors);
            if (p.style_preferences && p.style_preferences.length > 0) setStylePrefs(p.style_preferences);
            if (p.comfort_preference) setComfortPreference(p.comfort_preference);
            if (p.typical_occasions && p.typical_occasions.length > 0) setTypicalOccasions(p.typical_occasions);
          }

          // Check localStorage draft
          try {
            const savedDraft = localStorage.getItem('aureve_onboarding_draft');
            if (savedDraft) {
              const draft = JSON.parse(savedDraft);
              if (draft.step) setCurrentStep(draft.step);
              if (draft.height) setHeight(draft.height);
              if (draft.weight) setWeight(draft.weight);
              if (draft.skinTone) setSkinTone(draft.skinTone);
              if (draft.preferredFit) setPreferredFit(draft.preferredFit);
              if (draft.city) setCity(draft.city);
              if (draft.favoriteColors) setFavoriteColors(draft.favoriteColors);
              if (draft.avoidedColors) setAvoidedColors(draft.avoidedColors);
              if (draft.stylePrefs) setStylePrefs(draft.stylePrefs);
              if (draft.comfortPreference) setComfortPreference(draft.comfortPreference);
              if (draft.typicalOccasions) setTypicalOccasions(draft.typicalOccasions);
            }
          } catch {
            // Ignore localStorage parse error
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadAuthAndDraft();
  }, [router]);

  // Save draft on change
  const saveDraft = (stepNumber: number) => {
    try {
      localStorage.setItem(
        'aureve_onboarding_draft',
        JSON.stringify({
          step: stepNumber,
          height,
          weight,
          skinTone,
          preferredFit,
          city,
          favoriteColors,
          avoidedColors,
          stylePrefs,
          comfortPreference,
          typicalOccasions,
        })
      );
    } catch {
      // Ignore
    }
  };

  const handleNextStep = () => {
    setStepError('');

    if (currentStep === 1) {
      if (!height.trim()) {
        setStepError('Please provide your approximate height.');
        return;
      }
      if (!weight.trim()) {
        setStepError('Please provide your approximate weight or build.');
        return;
      }
    }

    if (currentStep === 2) {
      if (favoriteColors.length === 0) {
        setStepError('Please select at least 1 favorite color.');
        return;
      }
      if (stylePrefs.length === 0) {
        setStepError('Please select at least 1 style persona.');
        return;
      }
    }

    if (currentStep === 3) {
      if (typicalOccasions.length === 0) {
        setStepError('Please select at least 1 typical occasion for your lifestyle.');
        return;
      }
    }

    const next = currentStep + 1;
    setCurrentStep(next);
    saveDraft(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setStepError('');
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    saveDraft(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavoriteColor = (color: string) => {
    if (favoriteColors.includes(color)) {
      setFavoriteColors(favoriteColors.filter((c) => c !== color));
    } else {
      setFavoriteColors([...favoriteColors, color]);
      setAvoidedColors(avoidedColors.filter((c) => c !== color));
    }
  };

  const toggleAvoidColor = (color: string) => {
    if (avoidedColors.includes(color)) {
      setAvoidedColors(avoidedColors.filter((c) => c !== color));
    } else {
      setAvoidedColors([...avoidedColors, color]);
      setFavoriteColors(favoriteColors.filter((c) => c !== color));
    }
  };

  const toggleStylePref = (style: string) => {
    if (stylePrefs.includes(style)) {
      setStylePrefs(stylePrefs.filter((s) => s !== style));
    } else {
      setStylePrefs([...stylePrefs, style]);
    }
  };

  const toggleOccasion = (occ: string) => {
    if (typicalOccasions.includes(occ)) {
      setTypicalOccasions(typicalOccasions.filter((o) => o !== occ));
    } else {
      setTypicalOccasions([...typicalOccasions, occ]);
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsSaving(true);
    setStepError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: height.trim(),
          weight: weight.trim(),
          skin_tone: skinTone,
          preferred_fit: preferredFit,
          favorite_colors: favoriteColors,
          avoided_colors: avoidedColors,
          style_preferences: stylePrefs,
          comfort_preference: comfortPreference,
          typical_occasions: typicalOccasions,
          city,
          profile_completed: true,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setStepError(d.error || 'Failed to save style profile. Please try again.');
        setIsSaving(false);
        return;
      }

      // Clear draft buffer
      try {
        localStorage.removeItem('aureve_onboarding_draft');
      } catch {
        // Ignore
      }

      // Smoothly enter Dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setStepError('A connection error occurred. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin" />
        <span className="font-serif text-lg font-medium text-[#18181B] tracking-wider">
          AUREVÉ
        </span>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'About You', desc: 'Proportions & Fit' },
    { num: 2, title: 'Your Style', desc: 'Palette & Aesthetics' },
    { num: 3, title: 'Lifestyle', desc: 'Occasions & Comfort' },
    { num: 4, title: 'Finish', desc: 'Start Styling' },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-[#18181B] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between selection:bg-[#221A13] selection:text-[#FAF8F5]">
      {/* Background Subtle Accent */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-[#F4EFEA] rounded-b-[120px] blur-3xl -z-0 opacity-60 pointer-events-none" />

      <div className="relative z-10 max-w-3xl w-full mx-auto space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-[#18181B]">
              AUREVÉ
            </h1>
          </Link>
          <p className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
            Complete Your Style Profile
          </p>
          {userName && (
            <p className="text-xs text-[#5E4633] pt-0.5">
              Welcome, <strong className="font-semibold text-[#18181B]">{userName}</strong>. Let&apos;s calibrate your private styling preferences.
            </p>
          )}
        </div>

        {/* Progress Stepper Bar */}
        <div className="bg-white rounded-2xl border border-[#EBE5DB] p-4 shadow-xs">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center text-center space-y-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isDone
                        ? 'bg-[#18181B] text-white'
                        : isCurrent
                        ? 'bg-[#3D2E22] text-white ring-4 ring-[#E8DFD5]'
                        : 'bg-[#F4EFEA] text-[#9A7B5F]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <div className="hidden sm:block">
                    <span
                      className={`text-[11px] block font-semibold leading-tight ${
                        isCurrent ? 'text-[#18181B]' : 'text-[#7E6047]'
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className="text-[9px] text-[#9A7B5F] block">{s.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {stepError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 flex-shrink-0" />
            <span>{stepError}</span>
          </div>
        )}

        {/* STEP 1: ABOUT YOU (Proportions & Location) */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <User className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 1 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Your Silhouette & Proportions
              </h2>
              <p className="text-xs text-[#7E6047]">
                AUREVÉ calculates fabric drape, layer balance, and regional climate context for your body.
              </p>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                  Height
                </label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="5'10'' or 178 cm"
                  className="w-full px-3.5 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] transition-colors"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["5'7\"", "5'9\"", "5'11\"", "6'1\""].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHeight(h)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F4EFEA] text-[#7E6047] hover:bg-[#E8DFD5]"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                  Build / Weight
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="72 kg, Athletic, Slim, Medium"
                  className="w-full px-3.5 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] transition-colors"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Slim', 'Athletic', 'Medium', 'Broad'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setWeight((prev) => (prev.includes('kg') ? `${prev.split(',')[0]}, ${b}` : b))}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F4EFEA] text-[#7E6047] hover:bg-[#E8DFD5]"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skin Undertone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Skin Undertone (For Color Contrast Recommendations)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {SKIN_TONES.map((st) => {
                  const isSelected = skinTone === st.label;
                  return (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => setSkinTone(st.label)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: st.color }}
                      />
                      <span className="text-xs font-semibold leading-tight">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Clothing Fit */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Preferred Clothing Fit
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FIT_OPTIONS.map((f) => {
                  const isSelected = preferredFit === f.label;
                  return (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => setPreferredFit(f.label)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif text-base font-semibold">{f.label} Fit</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className={`text-xs ${isSelected ? 'text-[#FAF8F5]/80' : 'text-[#7E6047]'}`}>
                        {f.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location / City */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Home City (Default Climate & Weather Context)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] transition-colors"
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
        )}

        {/* STEP 2: YOUR STYLE & COLOR HARMONY */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <Palette className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 2 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Colors & Aesthetic Persona
              </h2>
              <p className="text-xs text-[#7E6047]">
                Select the tones and styles you gravitate towards when dressing.
              </p>
            </div>

            {/* Favorite Colors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047]">
                  Favorite Colors (Prioritized in Outfit Assembly)
                </label>
                <span className="text-[10px] text-[#9A7B5F] font-medium">
                  {favoriteColors.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COLORS.map((col) => {
                  const active = favoriteColors.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => toggleFavoriteColor(col)}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all flex items-center space-x-1.5 ${
                        active
                          ? 'bg-[#18181B] text-white shadow-xs'
                          : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:border-[#18181B]'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${active ? 'fill-white text-white' : 'text-[#9A7B5F]'}`} />
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors to Avoid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Colors You Usually Avoid
              </label>
              <div className="flex flex-wrap gap-2">
                {AVOID_COLORS.map((col) => {
                  const active = avoidedColors.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => toggleAvoidColor(col)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1 ${
                        active
                          ? 'bg-rose-900 text-white shadow-xs'
                          : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:border-[#18181B]'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Styles */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Preferred Style Personas (Select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {STYLE_PERSONAS.map((style) => {
                  const active = stylePrefs.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStylePref(style)}
                      className={`p-3 rounded-2xl border text-xs font-semibold text-center transition-all ${
                        active
                          ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs'
                          : 'bg-[#FAF8F5] border-[#EBE5DB] text-[#5E4633] hover:border-[#18181B]'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LIFESTYLE & OCCASIONS */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <Sliders className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 3 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Comfort & Typical Occasions
              </h2>
              <p className="text-xs text-[#7E6047]">
                How you prefer garments to feel and where you spend your time.
              </p>
            </div>

            {/* Comfort Preference */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Comfort vs. Structure Balance
              </label>
              <div className="space-y-2.5">
                {[
                  {
                    val: 'Maximum Comfort',
                    title: 'Maximum Comfort',
                    desc: 'Breathable, soft, unrestrictive fabrics (linen, lightweight cotton, relaxed chinos).',
                  },
                  {
                    val: 'Balanced',
                    title: 'Balanced (Smart & Easy)',
                    desc: 'Smart-casual elevation with ease of movement throughout the day.',
                  },
                  {
                    val: 'Structure & Sharpness',
                    title: 'Structure & Sharpness',
                    desc: 'Crisp collars, tailored blazers, and clean architectural lines.',
                  },
                ].map((item) => {
                  const isSelected = comfortPreference === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setComfortPreference(item.val as any)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-xs'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-serif text-base font-semibold">{item.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className={`text-xs ${isSelected ? 'text-[#FAF8F5]/80' : 'text-[#7E6047]'}`}>
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typical Occasions */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Typical Occasions in Your Week (Select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {OCCASIONS.map((occ) => {
                  const active = typicalOccasions.includes(occ.label);
                  return (
                    <button
                      key={occ.label}
                      type="button"
                      onClick={() => toggleOccasion(occ.label)}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition-all flex items-center space-x-2 ${
                        active
                          ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs'
                          : 'bg-[#FAF8F5] border-[#EBE5DB] text-[#5E4633] hover:border-[#18181B]'
                      }`}
                    >
                      <span>{occ.emoji}</span>
                      <span className="truncate">{occ.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & FINISH */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <Sparkles className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 4 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Review Your Style Profile
              </h2>
              <p className="text-xs text-[#7E6047]">
                Your personal fashion identity is set. AUREVÉ is ready to style your wardrobe.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE5DB] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047] block">
                  Silhouette & Proportions
                </span>
                <p className="font-medium text-[#18181B]">
                  {height} • {weight} • {skinTone}
                </p>
                <p className="text-[#5E4633]">
                  Fit Preference: <strong>{preferredFit} Fit</strong>
                </p>
                <p className="text-[#5E4633]">
                  Location: <strong>{city}</strong>
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE5DB] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047] block">
                  Style Personas
                </span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {stylePrefs.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-white border border-[#E8DFD5] rounded-full text-[10px] font-medium text-[#18181B]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE5DB] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047] block">
                  Color Harmony
                </span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {favoriteColors.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-white border border-[#E8DFD5] rounded-full text-[10px] font-medium text-[#18181B]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE5DB] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047] block">
                  Lifestyle & Occasions
                </span>
                <p className="text-[#5E4633] mb-1">
                  Comfort: <strong>{comfortPreference}</strong>
                </p>
                <div className="flex flex-wrap gap-1">
                  {typicalOccasions.map((o) => (
                    <span key={o} className="px-2 py-0.5 bg-white border border-[#E8DFD5] rounded-full text-[10px] font-medium text-[#18181B]">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy Assurance Note */}
            <div className="p-3.5 bg-[#F4EFEA] rounded-2xl border border-[#E8DFD5] flex items-center space-x-2 text-xs text-[#5E4633]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>You can adjust your style profile anytime in Settings $\rightarrow$ My Style.</span>
            </div>
          </div>
        )}

        {/* Step Navigation Actions */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-5 py-3 rounded-full bg-white border border-[#EBE5DB] text-xs font-semibold text-[#5E4633] hover:text-[#18181B] hover:border-[#18181B] transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-8 py-3.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-md active:scale-95"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={isSaving}
              className="inline-flex items-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-8 py-3.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-lg active:scale-95"
            >
              {isSaving ? (
                <span>Saving Profile…</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#EEDC82]" />
                  <span>Complete Profile & Enter Wardrobe</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="relative z-10 pt-8 text-center text-[11px] text-[#9A7B5F]">
        AUREVÉ • Your Wardrobe. Intelligently Styled.
      </footer>
    </div>
  );
}
