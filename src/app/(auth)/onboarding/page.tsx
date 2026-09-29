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
  Phone,
  Layers,
} from 'lucide-react';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { isValidIndianMobile, normalizeMobileNumber } from '@/lib/auth/mobile';

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
  const [userEmail, setUserEmail] = useState('');

  // Step 1: Personal Information (Name, Mobile, Age, City)
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('Mumbai');

  // Step 2: Proportions & Fit
  const [height, setHeight] = useState("5'10\"");
  const [weight, setWeight] = useState('72 kg');
  const [skinTone, setSkinTone] = useState('Warm Olive');
  const [preferredFit, setPreferredFit] = useState<'Slim' | 'Regular' | 'Relaxed' | 'Oversized'>('Regular');

  // Step 3: Style & Colors
  const [favoriteColors, setFavoriteColors] = useState<string[]>([
    'Navy Blue',
    'White',
    'Olive Green',
    'Charcoal Grey',
  ]);
  const [avoidedColors, setAvoidedColors] = useState<string[]>(['Neon Green', 'Bright Orange']);
  const [stylePrefs, setStylePrefs] = useState<string[]>(['Smart Casual', 'Minimal', 'Modern Indian']);

  // Step 4: Comfort & Lifestyle
  const [comfortPreference, setComfortPreference] = useState<
    'Maximum Comfort' | 'Balanced' | 'Structure & Sharpness'
  >('Balanced');
  const [typicalOccasions, setTypicalOccasions] = useState<string[]>([
    'Office',
    'Casual outings',
    'Dates',
  ]);

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
          setUserEmail(data.user.email || '');

          // If user already completed onboarding, redirect straight to dashboard
          if (data.profile?.profile_completed === true) {
            router.push('/dashboard');
            return;
          }

          // Pre-fill Name from Google / profile
          if (data.user.name) {
            setName(data.user.name);
          } else if (data.profile?.name) {
            setName(data.profile.name);
          }

          if (data.user.age) {
            setAge(String(data.user.age));
          } else if (data.profile?.age) {
            setAge(String(data.profile.age));
          }

          if (data.user.mobile_number) {
            const rawDigits = data.user.mobile_number.replace(/\D/g, '');
            setMobileNumber(rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits);
          }

          // Populate existing fields if any
          if (data.profile) {
            const p = data.profile;
            if (p.name && !name) setName(p.name);
            if (p.age && !age) setAge(String(p.age));
            if (p.mobile_number) {
              const rawDigits = p.mobile_number.replace(/\D/g, '');
              setMobileNumber(rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits);
            }
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
              if (draft.name) setName(draft.name);
              if (draft.mobileNumber) setMobileNumber(draft.mobileNumber);
              if (draft.age) setAge(String(draft.age));
              if (draft.city) setCity(draft.city);
              if (draft.height) setHeight(draft.height);
              if (draft.weight) setWeight(draft.weight);
              if (draft.skinTone) setSkinTone(draft.skinTone);
              if (draft.preferredFit) setPreferredFit(draft.preferredFit);
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

  // Save draft on step change
  const saveDraft = (stepNumber: number) => {
    try {
      localStorage.setItem(
        'aureve_onboarding_draft',
        JSON.stringify({
          step: stepNumber,
          name,
          mobileNumber,
          age,
          city,
          height,
          weight,
          skinTone,
          preferredFit,
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
      if (!name.trim()) {
        setStepError('Please enter your name to personalize your AUREVÉ profile.');
        return;
      }
      if (!mobileNumber || !isValidIndianMobile(mobileNumber)) {
        setStepError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      const parsedAge = Number(age);
      if (!age || isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
        setStepError('Please enter a valid age between 13 and 120.');
        return;
      }
    }

    if (currentStep === 2) {
      if (!height.trim()) {
        setStepError('Please provide your approximate height.');
        return;
      }
      if (!weight.trim()) {
        setStepError('Please provide your approximate weight or build.');
        return;
      }
    }

    if (currentStep === 3) {
      if (favoriteColors.length === 0) {
        setStepError('Please select at least 1 favorite color.');
        return;
      }
      if (stylePrefs.length === 0) {
        setStepError('Please select at least 1 style aesthetic.');
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

    if (!name.trim()) {
      setStepError('Please enter your name.');
      setCurrentStep(1);
      setIsSaving(false);
      return;
    }

    if (!mobileNumber || !isValidIndianMobile(mobileNumber)) {
      setStepError('Mobile number is required. Please provide a valid 10-digit Indian mobile number.');
      setCurrentStep(1);
      setIsSaving(false);
      return;
    }

    const parsedAge = Number(age);
    if (!age || isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
      setStepError('Please provide a valid age (13-120).');
      setCurrentStep(1);
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          full_name: name.trim(),
          mobile_number: normalizeMobileNumber(mobileNumber),
          age: parsedAge,
          city,
          height: height.trim(),
          weight: weight.trim(),
          skin_tone: skinTone,
          preferred_fit: preferredFit,
          favorite_colors: favoriteColors,
          avoided_colors: avoidedColors,
          style_preferences: stylePrefs,
          comfort_preference: comfortPreference,
          typical_occasions: typicalOccasions,
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
    { num: 1, title: 'Personal Info', desc: 'Name, Mobile & Age' },
    { num: 2, title: 'Proportions', desc: 'Fit & Silhouette' },
    { num: 3, title: 'Your Palette', desc: 'Colors & Aesthetics' },
    { num: 4, title: 'Lifestyle & Finish', desc: 'Occasions & Review' },
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
            Complete Your First-Time Profile
          </p>
          <p className="text-xs text-[#5E4633] pt-0.5">
            Signed in with <strong className="font-semibold text-[#18181B]">{userEmail}</strong>. Let&apos;s calibrate your personalized styling preferences.
          </p>
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

        {/* STEP 1: PERSONAL INFORMATION (Name, Mobile Number, Age, City) */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <User className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 1 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Personal Information
              </h2>
              <p className="text-xs text-[#7E6047]">
                Tell us how you would like AUREVÉ to address you, your contact number, and your location.
              </p>
            </div>

            {/* Preferred Name — REQUIRED */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                  Your Name <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className="text-[10px] font-medium text-[#7E6047]">
                  Used across your AUREVÉ dashboard
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Akshith"
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B] transition-colors"
                />
              </div>
              <p className="text-[10px] text-[#9A7B5F] mt-1">
                Pre-filled from your Google account. You can edit this to your preferred first name or nickname.
              </p>
            </div>

            {/* Mobile Number & Age Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mobile Number — REQUIRED */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                    Mobile Number <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-[#7E6047]">
                    10 digits
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-semibold text-[#7E6047] border-r border-[#D6C7B7] pr-2">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="98765 43210"
                    className="w-full pl-16 pr-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#9A7B5F] mt-1">
                  Required for your private AUREVÉ profile.
                </p>
              </div>

              {/* Age — REQUIRED */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                    Age <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-[#7E6047]">
                    Years (13-120)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={13}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    placeholder="e.g. 25"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#9A7B5F] mt-1">
                  Helps tailor age-appropriate and occasion-accurate styling suggestions.
                </p>
              </div>
            </div>

            {/* Location / City */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Home City (Climate & Regional Weather Context)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
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

        {/* STEP 2: PROPORTIONS & FIT */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <Layers className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 2 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Proportions & Silhouette
              </h2>
              <p className="text-xs text-[#7E6047]">
                Helps AUREVÉ calibrate layer balances, pant breaks, and garment drape.
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
          </div>
        )}

        {/* STEP 3: PALETTE & STYLE PERSONAS */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <Palette className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 3 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Your Color Palette & Aesthetics
              </h2>
              <p className="text-xs text-[#7E6047]">
                Select the colors you love wearing and the style aesthetics you resonate with.
              </p>
            </div>

            {/* Favorite Colors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#7E6047] flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Favorite Colors (Select at least 1)</span>
                </label>
                <span className="text-[11px] text-[#9A7B5F]">
                  {favoriteColors.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COLORS.map((c) => {
                  const isFav = favoriteColors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleFavoriteColor(c)}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all flex items-center space-x-1.5 ${
                        isFav
                          ? 'bg-[#18181B] text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#5E4633] border border-[#EBE5DB] hover:border-[#18181B]'
                      }`}
                    >
                      {isFav && <Check className="w-3 h-3" />}
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Avoided Colors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#7E6047] flex items-center space-x-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-500" />
                  <span>Colors You Avoid</span>
                </label>
                <span className="text-[11px] text-[#9A7B5F]">
                  {avoidedColors.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVOID_COLORS.map((c) => {
                  const isAvoid = avoidedColors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleAvoidColor(c)}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                        isAvoid
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-[#FAF8F5] text-[#5E4633] border border-[#EBE5DB] hover:border-[#18181B]'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style Personas */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Style Aesthetics You Love
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {STYLE_PERSONAS.map((sp) => {
                  const isSelected = stylePrefs.includes(sp);
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => toggleStylePref(sp)}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <span className="text-xs font-semibold">{sp}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: LIFESTYLE, OCCASIONS & REVIEW */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <Sliders className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 4 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Lifestyle & Final Review
              </h2>
              <p className="text-xs text-[#7E6047]">
                AUREVÉ balances ease and elevation based on where you spend your days.
              </p>
            </div>

            {/* Typical Occasions */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Typical Occasions (Select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {OCCASIONS.map((occ) => {
                  const isSelected = typicalOccasions.includes(occ.label);
                  return (
                    <button
                      key={occ.label}
                      type="button"
                      onClick={() => toggleOccasion(occ.label)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <span className="text-lg">{occ.emoji}</span>
                      <span className="text-xs font-semibold">{occ.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comfort vs Structure Preference */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                Comfort vs Structure Balance
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    title: 'Maximum Comfort',
                    desc: 'Breathable, relaxed fabrics with minimal stiffness',
                  },
                  {
                    title: 'Balanced',
                    desc: 'Smart equilibrium of easy movement and polished tailoring',
                  },
                  {
                    title: 'Structure & Sharpness',
                    desc: 'Crisp collars, tailored cuts, and sharp silhouettes',
                  },
                ].map((item) => {
                  const isSelected = comfortPreference === item.title;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setComfortPreference(item.title as any)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <h4 className="font-serif text-sm font-semibold mb-1">{item.title}</h4>
                      <p
                        className={`text-[11px] ${
                          isSelected ? 'text-[#FAF8F5]/80' : 'text-[#7E6047]'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Summary Card */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] space-y-3 text-xs text-[#5E4633]">
              <h3 className="font-serif text-sm font-semibold text-[#18181B] flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#7E6047]" />
                <span>Profile Confirmation Summary</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Display Name:</span>
                  <span className="text-[#7E6047] font-medium">{name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Google Email:</span>
                  <span className="font-mono text-[#7E6047] truncate max-w-[150px]">{userEmail}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Mobile Number:</span>
                  <span className="font-mono text-[#7E6047]">+91 {mobileNumber}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Age:</span>
                  <span className="text-[#7E6047] font-medium">{age} years</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Proportions:</span>
                  <span>{height} • {weight}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Fit & Undertone:</span>
                  <span>{preferredFit} • {skinTone}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Home City:</span>
                  <span>{city}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Style Direction:</span>
                  <span className="truncate max-w-[150px]">{stylePrefs.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Actions */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-full border border-[#EBE5DB] bg-white text-[#5E4633] text-xs font-semibold hover:border-[#18181B] transition-colors flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 rounded-full bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] text-xs font-semibold tracking-wide uppercase transition-all shadow-md flex items-center space-x-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={isSaving}
              className="px-8 py-3.5 rounded-full bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] text-xs font-semibold tracking-wide uppercase transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving Profile…</span>
              ) : (
                <>
                  <span>Complete Profile & Enter Dashboard</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Security / Privacy Assurance */}
        <div className="text-center flex items-center justify-center space-x-1.5 text-[11px] text-[#9A7B5F]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Your styling preferences are securely encrypted and private to your account.</span>
        </div>
      </div>
    </div>
  );
}
