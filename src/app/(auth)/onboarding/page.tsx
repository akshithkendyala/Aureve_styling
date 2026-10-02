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
  Ruler,
  Weight,
  Camera,
  RotateCcw,
} from 'lucide-react';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { isValidIndianMobile, normalizeMobileNumber } from '@/lib/auth/mobile';
import { SkinUndertoneCategory, BodyBuildCategory } from '@/lib/types';
import SkinScanModal from '@/components/profile/SkinScanModal';
import BodyScanModal from '@/components/profile/BodyScanModal';

const SKIN_TONES = [
  { label: 'Warm Olive', color: '#BCA07D', desc: 'Golden / yellow undertones' },
  { label: 'Medium Wheatish', color: '#D2B18A', desc: 'Neutral warm undertones' },
  { label: 'Dusky', color: '#8C6747', desc: 'Rich brown undertones' },
  { label: 'Deep Tan', color: '#A57850', desc: 'Deep warm undertones' },
  { label: 'Fair', color: '#F0D5BE', desc: 'Cool / neutral fair undertones' },
];

const FIT_OPTIONS: { label: 'Slim' | 'Regular' | 'Relaxed' | 'Oversized'; desc: string }[] = [
  { label: 'Slim', desc: 'Tailored closer to the body silhouette' },
  { label: 'Regular', desc: 'Classic, balanced and versatile fit' },
  { label: 'Relaxed', desc: 'Comfortable, breathable drape' },
  { label: 'Oversized', desc: 'Roomy, modern streetwear aesthetic' },
];

const BUILD_OPTIONS = [
  { label: 'Slim', desc: 'Lean frame with subtle tailoring' },
  { label: 'Athletic', desc: 'Tapered silhouette with defined shoulders' },
  { label: 'Medium', desc: 'Balanced, proportional natural build' },
  { label: 'Broad', desc: 'Sturdy, structured frame with wider chest' },
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

  // Step 1: Personal Details (Starts blank unless securely obtained from auth)
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');

  // Step 2: Proportions & Measurements (Starts completely unselected)
  const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('ft');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [weightVal, setWeightVal] = useState('');
  const [bodyBuild, setBodyBuild] = useState('');
  const [bodyScanConfidence, setBodyScanConfidence] = useState<number | undefined>(undefined);
  const [skinTone, setSkinTone] = useState('');
  const [skinScanConfidence, setSkinScanConfidence] = useState<number | undefined>(undefined);
  const [preferredFit, setPreferredFit] = useState('');

  // Scanner Modals State
  const [isSkinScanModalOpen, setIsSkinScanModalOpen] = useState(false);
  const [isBodyScanModalOpen, setIsBodyScanModalOpen] = useState(false);

  // Step 3: Color Palette & Aesthetics (Starts empty array)
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [avoidedColors, setAvoidedColors] = useState<string[]>([]);
  const [stylePrefs, setStylePrefs] = useState<string[]>([]);

  // Step 4: Lifestyle & Comfort (Starts empty)
  const [typicalOccasions, setTypicalOccasions] = useState<string[]>([]);
  const [comfortPreference, setComfortPreference] = useState('');

  // Error messaging
  const [stepError, setStepError] = useState('');

  // Height unit conversion on toggle
  const handleToggleHeightUnit = (targetUnit: 'ft' | 'cm') => {
    if (targetUnit === heightUnit) return;
    if (targetUnit === 'cm') {
      if (heightFeet) {
        const ft = parseInt(heightFeet, 10) || 0;
        const inc = parseInt(heightInches, 10) || 0;
        const totalInches = ft * 12 + inc;
        const calculatedCm = Math.round(totalInches * 2.54);
        setHeightCm(String(calculatedCm));
      }
    } else {
      if (heightCm) {
        const cm = parseInt(heightCm, 10) || 0;
        const totalInches = Math.round(cm / 2.54);
        const ft = Math.floor(totalInches / 12);
        const inc = totalInches % 12;
        setHeightFeet(String(ft));
        setHeightInches(String(inc));
      }
    }
    setHeightUnit(targetUnit);
  };

  // Weight unit conversion on toggle
  const handleToggleWeightUnit = (targetUnit: 'kg' | 'lb') => {
    if (targetUnit === weightUnit) return;
    if (weightVal && !isNaN(Number(weightVal))) {
      const num = Number(weightVal);
      if (targetUnit === 'lb') {
        setWeightVal(String(Math.round(num * 2.20462)));
      } else {
        setWeightVal(String(Math.round(num / 2.20462)));
      }
    }
    setWeightUnit(targetUnit);
  };

  // Parse existing saved height string (e.g. 5'10" or 178 cm)
  const parseSavedHeight = (raw: string) => {
    if (!raw) return;
    if (raw.includes('cm')) {
      const digits = raw.replace(/\D/g, '');
      if (digits) {
        setHeightCm(digits);
        setHeightUnit('cm');
      }
    } else if (raw.includes("'")) {
      const match = raw.match(/(\d+)'(\d+)"?/);
      if (match) {
        setHeightFeet(match[1]);
        setHeightInches(match[2]);
        setHeightUnit('ft');
      }
    }
  };

  // Parse existing saved weight string (e.g. 72 kg or 158 lb)
  const parseSavedWeight = (raw: string) => {
    if (!raw) return;
    if (raw.toLowerCase().includes('lb')) {
      const digits = raw.replace(/[^\d.]/g, '');
      if (digits) {
        setWeightVal(digits);
        setWeightUnit('lb');
      }
    } else {
      const digits = raw.replace(/[^\d.]/g, '');
      if (digits) {
        setWeightVal(digits);
        setWeightUnit('kg');
      }
    }
  };

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

          // Pre-fill Name from Google / profile only if present
          if (data.user.name) {
            setName(data.user.name);
          } else if (data.profile?.name) {
            setName(data.profile.name);
          }

          if (data.user.mobile_number) {
            const rawDigits = data.user.mobile_number.replace(/\D/g, '');
            if (rawDigits.length >= 10) setMobileNumber(rawDigits.slice(-10));
          }

          // Populate existing user saved fields if any
          if (data.profile) {
            const p = data.profile;
            if (p.name && !name) setName(p.name);
            if (p.age) setAge(String(p.age));
            if (p.mobile_number) {
              const rawDigits = p.mobile_number.replace(/\D/g, '');
              if (rawDigits.length >= 10) setMobileNumber(rawDigits.slice(-10));
            }
            if (p.city) setCity(p.city);
            if (p.height) parseSavedHeight(p.height);
            if (p.weight) parseSavedWeight(p.weight);
            if (p.body_build) setBodyBuild(p.body_build);
            if (p.body_scan_confidence !== undefined) setBodyScanConfidence(p.body_scan_confidence);
            if (p.skin_tone) setSkinTone(p.skin_tone);
            if (p.skin_scan_confidence !== undefined) setSkinScanConfidence(p.skin_scan_confidence);
            if (p.preferred_fit) setPreferredFit(p.preferred_fit);
            if (p.favorite_colors && p.favorite_colors.length > 0) setFavoriteColors(p.favorite_colors);
            if (p.avoided_colors && p.avoided_colors.length > 0) setAvoidedColors(p.avoided_colors);
            if (p.style_preferences && p.style_preferences.length > 0) setStylePrefs(p.style_preferences);
            if (p.comfort_preference) setComfortPreference(p.comfort_preference);
            if (p.typical_occasions && p.typical_occasions.length > 0) setTypicalOccasions(p.typical_occasions);
          }

          // Restore draft only if previously saved in localStorage
          try {
            const savedDraft = localStorage.getItem('aureve_onboarding_draft');
            if (savedDraft) {
              const draft = JSON.parse(savedDraft);
              if (draft.step) setCurrentStep(draft.step);
              if (draft.name) setName(draft.name);
              if (draft.mobileNumber) setMobileNumber(draft.mobileNumber);
              if (draft.age) setAge(String(draft.age));
              if (draft.city) setCity(draft.city);
              if (draft.heightUnit) setHeightUnit(draft.heightUnit);
              if (draft.heightFeet) setHeightFeet(draft.heightFeet);
              if (draft.heightInches) setHeightInches(draft.heightInches);
              if (draft.heightCm) setHeightCm(draft.heightCm);
              if (draft.weightUnit) setWeightUnit(draft.weightUnit);
              if (draft.weightVal) setWeightVal(draft.weightVal);
              if (draft.bodyBuild) setBodyBuild(draft.bodyBuild);
              if (draft.bodyScanConfidence !== undefined) setBodyScanConfidence(draft.bodyScanConfidence);
              if (draft.skinTone) setSkinTone(draft.skinTone);
              if (draft.skinScanConfidence !== undefined) setSkinScanConfidence(draft.skinScanConfidence);
              if (draft.preferredFit) setPreferredFit(draft.preferredFit);
              if (Array.isArray(draft.favoriteColors) && draft.favoriteColors.length > 0) {
                setFavoriteColors(draft.favoriteColors);
              }
              if (Array.isArray(draft.avoidedColors) && draft.avoidedColors.length > 0) {
                setAvoidedColors(draft.avoidedColors);
              }
              if (Array.isArray(draft.stylePrefs) && draft.stylePrefs.length > 0) {
                setStylePrefs(draft.stylePrefs);
              }
              if (draft.comfortPreference) setComfortPreference(draft.comfortPreference);
              if (Array.isArray(draft.typicalOccasions) && draft.typicalOccasions.length > 0) {
                setTypicalOccasions(draft.typicalOccasions);
              }
            }
          } catch {
            // Ignore parse error
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

  // Save current selections to draft
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
          heightUnit,
          heightFeet,
          heightInches,
          heightCm,
          weightUnit,
          weightVal,
          bodyBuild,
          bodyScanConfidence,
          skinTone,
          skinScanConfidence,
          preferredFit,
          favoriteColors,
          avoidedColors,
          stylePrefs,
          comfortPreference,
          typicalOccasions,
        })
      );
    } catch {
      // Ignore localStorage error
    }
  };

  // Helper to format final height string
  const getFormattedHeight = (): string => {
    if (heightUnit === 'cm') {
      return heightCm ? `${heightCm} cm` : '';
    }
    if (heightFeet) {
      const inc = heightInches !== '' ? heightInches : '0';
      return `${heightFeet}'${inc}"`;
    }
    return '';
  };

  // Helper to format final weight string
  const getFormattedWeight = (): string => {
    return weightVal ? `${weightVal} ${weightUnit}` : '';
  };

  const handleNextStep = () => {
    setStepError('');

    if (currentStep === 1) {
      if (!name.trim()) {
        setStepError('Please enter your name.');
        return;
      }
      if (!mobileNumber || !isValidIndianMobile(mobileNumber)) {
        setStepError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      const parsedAge = Number(age);
      if (!age || isNaN(parsedAge) || parsedAge < 13 || parsedAge > 100) {
        setStepError('Please select your age (13-100).');
        return;
      }
      if (!city) {
        setStepError('Please select your home city for climate calibration.');
        return;
      }
    }

    if (currentStep === 2) {
      if (heightUnit === 'ft') {
        if (!heightFeet || heightInches === '') {
          setStepError('Please select both feet and inches for your height.');
          return;
        }
      } else {
        if (!heightCm) {
          setStepError('Please select your height in centimeters.');
          return;
        }
      }

      const parsedWeight = Number(weightVal);
      if (!weightVal || isNaN(parsedWeight) || parsedWeight <= 0) {
        setStepError('Please enter a valid weight.');
        return;
      }

      if (!bodyBuild) {
        setStepError('Please select your body build.');
        return;
      }

      if (!skinTone) {
        setStepError('Please select your skin undertone.');
        return;
      }

      if (!preferredFit) {
        setStepError('Please select your preferred clothing fit.');
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
    }
  };

  const toggleAvoidColor = (color: string) => {
    if (avoidedColors.includes(color)) {
      setAvoidedColors(avoidedColors.filter((c) => c !== color));
    } else {
      setAvoidedColors([...avoidedColors, color]);
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

    if (typicalOccasions.length === 0) {
      setStepError('Please select at least 1 typical occasion for your lifestyle.');
      setIsSaving(false);
      return;
    }

    if (!comfortPreference) {
      setStepError('Please select your comfort vs structure preference.');
      setIsSaving(false);
      return;
    }

    const finalHeight = getFormattedHeight();
    const finalWeight = getFormattedWeight();

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          full_name: name.trim(),
          mobile_number: normalizeMobileNumber(mobileNumber),
          age: Number(age),
          city,
          height: finalHeight,
          weight: finalWeight,
          body_build: bodyBuild,
          body_scan_confidence: bodyScanConfidence,
          skin_tone: skinTone,
          skin_scan_confidence: skinScanConfidence,
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
    { num: 2, title: 'Proportions', desc: 'Height, Build & Fit' },
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
            First-Time Style Calibration
          </p>
          <p className="text-xs text-[#5E4633] pt-0.5">
            Signed in with <strong className="font-semibold text-[#18181B]">{userEmail}</strong>. Please provide your measurements and fashion preferences.
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

        {/* STEP 1: PERSONAL INFORMATION */}
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
                Tell us how AUREVÉ should address you and your primary contact details.
              </p>
            </div>

            {/* Preferred Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                  Your Name <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className="text-[10px] font-medium text-[#7E6047]">
                  Used across dashboard & greetings
                </span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B] transition-colors"
              />
            </div>

            {/* Mobile Number & Age Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mobile Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                    Mobile Number <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-[#7E6047]">
                    10-digit Indian mobile
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
              </div>

              {/* Age Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                    Age <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-[#7E6047]">
                    13 – 100 years
                  </span>
                </div>
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] transition-colors"
                >
                  <option value="">Select age</option>
                  {Array.from({ length: 88 }, (_, i) => i + 13).map((a) => (
                    <option key={a} value={a}>
                      {a} years old
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location / City */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-1.5">
                Home City <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                >
                  <option value="">Select home city</option>
                  {POPULAR_INDIAN_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.state})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-[#9A7B5F] mt-1">
                Used strictly for weather-aware fabric and layering suggestions.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: PROPORTIONS, BUILD & FIT */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-7 shadow-md animate-in fade-in duration-300">
            <div className="border-b border-[#F4EFEA] pb-4 space-y-1">
              <div className="flex items-center space-x-2 text-[#7E6047]">
                <Layers className="w-4 h-4 text-[#9A7B5F]" />
                <span className="text-xs uppercase font-bold tracking-wider">Step 2 of 4</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Proportions & Silhouette
              </h2>
              <p className="text-xs text-[#7E6047]">
                AUREVÉ analyzes your facial undertone and body silhouette to personalize color contrast, garment drape, and outfit proportions.
              </p>
            </div>

            {/* A. SKIN UNDERTONE — AI FACE SCAN & SELECTION */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#18181B] flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#9A7B5F]" />
                  <span>Skin Undertone (For Color Contrast Recommendations) <span className="text-rose-600 font-bold">*</span></span>
                </label>
                {skinScanConfidence && skinTone && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#9A7B5F] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#EBE5DB]">
                    <Sparkles className="w-3 h-3 text-[#9A7B5F]" />
                    <span>AI Calibrated ({Math.round(skinScanConfidence * 100)}% Match)</span>
                  </span>
                )}
              </div>

              {/* AI Skin Undertone Scanner Action Banner */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-[#9A7B5F]/50">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-[#9A7B5F]" />
                    <span className="text-xs font-serif font-semibold text-[#18181B]">
                      {skinScanConfidence ? 'Calibrated with AUREVÉ AI Face Scan' : 'Scan Your Skin Undertone'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7E6047]">
                    {skinScanConfidence
                      ? `Detected undertone: ${skinTone}. You can freely change or scan again.`
                      : 'Not sure about your undertone? Let AUREVÉ analyze it for you.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSkinScanModalOpen(true)}
                  className="px-4 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-sm self-start sm:self-auto flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9A7B5F]" />
                  <span>{skinScanConfidence ? 'Scan Again' : 'Scan Skin Undertone'}</span>
                </button>
              </div>

              {/* 5 Selectable Skin Cards */}
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
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm ring-1 ring-[#18181B]'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="w-5 h-5 rounded-full border border-black/10 flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: st.color }}
                        />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div>
                        <span className="text-xs font-semibold leading-tight block">{st.label}</span>
                        <span className={`text-[9px] block mt-0.5 ${isSelected ? 'text-white/70' : 'text-[#9A7B5F]'}`}>
                          {st.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. BODY BUILD / SILHOUETTE — AI FULL-BODY SCAN & SELECTION */}
            <div className="space-y-3 pt-2 border-t border-[#F4EFEA]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#18181B] flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-[#9A7B5F]" />
                  <span>Body Build / Silhouette (For Silhouette & Drape Balance) <span className="text-rose-600 font-bold">*</span></span>
                </label>
                {bodyScanConfidence && bodyBuild && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#9A7B5F] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#EBE5DB]">
                    <Sparkles className="w-3 h-3 text-[#9A7B5F]" />
                    <span>AI Calibrated ({Math.round(bodyScanConfidence * 100)}% Match)</span>
                  </span>
                )}
              </div>

              {/* AI Body Build Scanner Action Banner */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-[#9A7B5F]/50">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-[#9A7B5F]" />
                    <span className="text-xs font-serif font-semibold text-[#18181B]">
                      {bodyScanConfidence ? 'Calibrated with AUREVÉ Full-Body Scan' : 'Scan Your Body Build'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7E6047]">
                    {bodyScanConfidence
                      ? `Detected build: ${bodyBuild} Build. You can freely change or scan again.`
                      : 'Let AUREVÉ understand your silhouette to improve outfit proportions.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBodyScanModalOpen(true)}
                  className="px-4 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-sm self-start sm:self-auto flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9A7B5F]" />
                  <span>{bodyScanConfidence ? 'Scan Again' : 'Scan Body Build'}</span>
                </button>
              </div>

              {/* 4 Selectable Build Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUILD_OPTIONS.map((b) => {
                  const isSelected = bodyBuild === b.label;
                  return (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setBodyBuild(b.label)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm ring-1 ring-[#18181B]'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif text-sm font-semibold">{b.label} Build</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className={`text-[11px] ${isSelected ? 'text-[#FAF8F5]/80' : 'text-[#7E6047]'}`}>
                        {b.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* C. HEIGHT (Manual input) */}
            <div className="space-y-2 pt-2 border-t border-[#F4EFEA]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#18181B] flex items-center space-x-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#7E6047]" />
                  <span>Height <span className="text-rose-600 font-bold">*</span></span>
                </label>

                {/* Unit Toggle Tabs */}
                <div className="flex items-center bg-[#F4EFEA] p-0.5 rounded-lg border border-[#EBE5DB]">
                  <button
                    type="button"
                    onClick={() => handleToggleHeightUnit('ft')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      heightUnit === 'ft'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#7E6047] hover:text-[#18181B]'
                    }`}
                  >
                    Feet & Inches (ft/in)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleHeightUnit('cm')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      heightUnit === 'cm'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#7E6047] hover:text-[#18181B]'
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                </div>
              </div>

              {/* Height Selectors */}
              {heightUnit === 'ft' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#7E6047] mb-1">Feet</label>
                    <select
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      className="w-full px-3.5 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      <option value="">Select ft</option>
                      {[3, 4, 5, 6, 7].map((f) => (
                        <option key={f} value={f}>
                          {f} ft
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#7E6047] mb-1">Inches (0–11 in)</label>
                    <select
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className="w-full px-3.5 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      <option value="">Select in</option>
                      {Array.from({ length: 12 }, (_, i) => i).map((inc) => (
                        <option key={inc} value={inc}>
                          {inc} in
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <select
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  >
                    <option value="">Select height in cm</option>
                    {Array.from({ length: 106 }, (_, i) => i + 120).map((cmVal) => (
                      <option key={cmVal} value={cmVal}>
                        {cmVal} cm
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* D. WEIGHT (Manual input) */}
            <div className="space-y-2 pt-2 border-t border-[#F4EFEA]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#18181B] flex items-center space-x-1.5">
                  <Weight className="w-3.5 h-3.5 text-[#7E6047]" />
                  <span>Weight <span className="text-rose-600 font-bold">*</span></span>
                </label>

                {/* Weight Unit Toggle */}
                <div className="flex items-center bg-[#F4EFEA] p-0.5 rounded-lg border border-[#EBE5DB]">
                  <button
                    type="button"
                    onClick={() => handleToggleWeightUnit('kg')}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      weightUnit === 'kg'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#7E6047] hover:text-[#18181B]'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleWeightUnit('lb')}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      weightUnit === 'lb'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#7E6047] hover:text-[#18181B]'
                    }`}
                  >
                    lb
                  </button>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  type="number"
                  min={weightUnit === 'kg' ? 30 : 65}
                  max={weightUnit === 'kg' ? 250 : 550}
                  value={weightVal}
                  onChange={(e) => setWeightVal(e.target.value)}
                  placeholder={weightUnit === 'kg' ? 'Enter weight (e.g. 70)' : 'Enter weight (e.g. 154)'}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B]"
                />
                <span className="absolute right-4 text-xs font-bold text-[#7E6047] uppercase pointer-events-none">
                  {weightUnit}
                </span>
              </div>
            </div>

            {/* E. PREFERRED CLOTHING FIT (Manual selection) */}
            <div className="pt-2 border-t border-[#F4EFEA]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-2">
                Preferred Clothing Fit <span className="text-rose-600 font-bold">*</span>
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
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm ring-1 ring-[#18181B]'
                          : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif text-sm font-semibold">{f.label} Fit</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className={`text-[11px] ${isSelected ? 'text-[#FAF8F5]/80' : 'text-[#7E6047]'}`}>
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
                Select the colors you love wearing and the style aesthetics you resonate with. Nothing is assumed.
              </p>
            </div>

            {/* Favorite Colors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#18181B] flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Favorite Colors <span className="text-rose-600 font-bold">*</span> (Select at least 1)</span>
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
                  <span>Colors You Avoid (Optional)</span>
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                  Style Aesthetics You Love <span className="text-rose-600 font-bold">*</span> (Select at least 1)
                </label>
                <span className="text-[11px] text-[#9A7B5F]">
                  {stylePrefs.length} selected
                </span>
              </div>
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
                AUREVÉ balances ease and elevation based strictly on your lifestyle choices.
              </p>
            </div>

            {/* Typical Occasions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                  Typical Occasions <span className="text-rose-600 font-bold">*</span> (Select all that apply)
                </label>
                <span className="text-[11px] text-[#9A7B5F]">
                  {typicalOccasions.length} selected
                </span>
              </div>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-2">
                Comfort vs Structure Balance <span className="text-rose-600 font-bold">*</span>
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
                      onClick={() => setComfortPreference(item.title)}
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
                  <span className="text-[#7E6047] font-medium">{name || '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Google Email:</span>
                  <span className="font-mono text-[#7E6047] truncate max-w-[150px]">{userEmail}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Mobile Number:</span>
                  <span className="font-mono text-[#7E6047]">{mobileNumber ? `+91 ${mobileNumber}` : '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Age:</span>
                  <span className="text-[#7E6047] font-medium">{age ? `${age} years` : '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Height & Weight:</span>
                  <span>{getFormattedHeight() || '—'} • {getFormattedWeight() || '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Build & Fit:</span>
                  <span>{bodyBuild || '—'} • {preferredFit || '—'} Fit</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Skin Undertone:</span>
                  <span>{skinTone || '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Home City:</span>
                  <span>{city || '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Favorite Colors:</span>
                  <span className="truncate max-w-[150px]">{favoriteColors.length > 0 ? favoriteColors.join(', ') : '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EBE5DB] pb-1.5">
                  <span className="font-semibold text-[#18181B]">Style Direction:</span>
                  <span className="truncate max-w-[150px]">{stylePrefs.length > 0 ? stylePrefs.join(', ') : '—'}</span>
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

      {/* AI Calibration Modals */}
      <SkinScanModal
        isOpen={isSkinScanModalOpen}
        onClose={() => setIsSkinScanModalOpen(false)}
        currentUndertone={skinTone}
        onApplyResult={(detectedTone, confidence) => {
          setSkinTone(detectedTone);
          setSkinScanConfidence(confidence);
          setStepError('');
        }}
      />

      <BodyScanModal
        isOpen={isBodyScanModalOpen}
        onClose={() => setIsBodyScanModalOpen(false)}
        currentBuild={bodyBuild}
        onApplyResult={(detectedBuild, confidence) => {
          setBodyBuild(detectedBuild);
          setBodyScanConfidence(confidence);
          setStepError('');
        }}
      />
    </div>
  );
}
