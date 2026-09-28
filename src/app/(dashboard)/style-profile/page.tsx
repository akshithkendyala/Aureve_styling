'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { Sparkles, Check, User, Palette, Sliders, Phone, Mail } from 'lucide-react';
import { normalizeMobileNumber, isValidIndianMobile, formatMobileDisplay } from '@/lib/auth/mobile';

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

const STYLE_PREFERENCES = [
  'Minimal',
  'Casual',
  'Smart Casual',
  'Formal',
  'Streetwear',
  'Sporty',
  'Traditional',
  'Modern Indian',
];

const POPULAR_OCCASIONS = [
  'College',
  'Office',
  'Casual outings',
  'Dates',
  'Parties',
  'Weddings / functions',
  'Travel',
  'Sports / fitness',
  'Home',
];

export default function StyleProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [height, setHeight] = useState("5'10\"");
  const [weight, setWeight] = useState('72 kg');
  const [skinTone, setSkinTone] = useState('Warm Olive');
  const [preferredFit, setPreferredFit] = useState<'Slim' | 'Regular' | 'Relaxed' | 'Oversized'>('Regular');
  const [favoriteColors, setFavoriteColors] = useState<string[]>(['Navy Blue', 'White', 'Olive Green', 'Charcoal Grey']);
  const [avoidedColors, setAvoidedColors] = useState<string[]>(['Neon Green', 'Bright Orange']);
  const [stylePrefs, setStylePrefs] = useState<string[]>(['Smart Casual', 'Minimal', 'Modern Indian']);
  const [comfortPreference, setComfortPreference] = useState<'Maximum Comfort' | 'Balanced' | 'Structure & Sharpness'>('Balanced');
  const [typicalOccasions, setTypicalOccasions] = useState<string[]>(['Office', 'Casual outings', 'Dates']);
  const [city, setCity] = useState('Mumbai');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            setProfile(p);
            if (p.email) setEmail(p.email);
            if (p.mobile_number) {
              const rawDigits = p.mobile_number.replace(/\D/g, '');
              setMobileNumber(rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits);
            }
            if (p.height) setHeight(p.height);
            if (p.weight) setWeight(p.weight);
            if (p.skin_tone) setSkinTone(p.skin_tone);
            if (p.preferred_fit) setPreferredFit(p.preferred_fit);
            if (p.favorite_colors && Array.isArray(p.favorite_colors)) setFavoriteColors(p.favorite_colors);
            if (p.avoided_colors && Array.isArray(p.avoided_colors)) setAvoidedColors(p.avoided_colors);
            if (p.style_preferences && Array.isArray(p.style_preferences)) setStylePrefs(p.style_preferences);
            if (p.comfort_preference) setComfortPreference(p.comfort_preference);
            if (p.typical_occasions && Array.isArray(p.typical_occasions)) setTypicalOccasions(p.typical_occasions);
            if (p.city) setCity(p.city);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const toggleFavColor = (c: string) => {
    if (favoriteColors.includes(c)) {
      setFavoriteColors(favoriteColors.filter((item) => item !== c));
    } else {
      setFavoriteColors([...favoriteColors, c]);
      setAvoidedColors(avoidedColors.filter((item) => item !== c));
    }
  };

  const toggleAvoidColor = (c: string) => {
    if (avoidedColors.includes(c)) {
      setAvoidedColors(avoidedColors.filter((item) => item !== c));
    } else {
      setAvoidedColors([...avoidedColors, c]);
      setFavoriteColors(favoriteColors.filter((item) => item !== c));
    }
  };

  const toggleStylePref = (s: string) => {
    if (stylePrefs.includes(s)) {
      setStylePrefs(stylePrefs.filter((item) => item !== s));
    } else {
      setStylePrefs([...stylePrefs, s]);
    }
  };

  const toggleOccasion = (occ: string) => {
    if (typicalOccasions.includes(occ)) {
      setTypicalOccasions(typicalOccasions.filter((item) => item !== occ));
    } else {
      setTypicalOccasions([...typicalOccasions, occ]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setSaveError('');

    if (mobileNumber && !isValidIndianMobile(mobileNumber)) {
      setSaveError('Please enter a valid 10-digit Indian mobile number.');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: mobileNumber ? normalizeMobileNumber(mobileNumber) : undefined,
          height,
          weight,
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

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to save profile');
      }
    } catch (e) {
      console.error(e);
      setSaveError('A connection error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
          Personalization
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B] tracking-tight">
          My Style Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#7E6047] mt-1">
          AUREVÉ uses your proportions and preferences strictly for fit alignment and color harmony.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Style profile updated! Recommendations will align with your new preferences.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* 1. Account & Contact Verification */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <User className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Account & Mobile Contact
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {email && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                  Google Account (Verified)
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-[#9A7B5F]" />
                  <input
                    type="text"
                    readOnly
                    value={email}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#7E6047] cursor-default focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Registered Mobile Number <span className="text-rose-600">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-semibold text-[#7E6047] border-r border-[#D6C7B7] pr-2">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full pl-16 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Proportions & Silhouette */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Sliders className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Proportions & Silhouette
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Height
              </label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="5'10'' or 178 cm"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Build / Weight
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="72 kg, Athletic, Medium"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Skin Undertone
              </label>
              <select
                value={skinTone}
                onChange={(e) => setSkinTone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              >
                <option value="Warm Olive">Warm Olive</option>
                <option value="Deep Tan">Deep Tan</option>
                <option value="Medium Wheatish">Medium Wheatish</option>
                <option value="Dusky">Dusky</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
              Preferred Fit
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Slim', 'Regular', 'Relaxed', 'Oversized'].map((fit) => {
                const isSelected = preferredFit === fit;
                return (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => setPreferredFit(fit as any)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                        : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                    }`}
                  >
                    <span className="text-xs font-semibold">{fit}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
              Home City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
            >
              {POPULAR_INDIAN_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Color Preferences */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Palette className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Color Preferences
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
              Favorite Colors
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COLORS.map((col) => {
                const isSelected = favoriteColors.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleFavColor(col)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#18181B] text-white'
                        : 'bg-[#FAF8F5] text-[#5E4633] border border-[#EBE5DB] hover:border-[#18181B]'
                    }`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
              Colors to Avoid
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COLORS.map((col) => {
                const isAvoided = avoidedColors.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleAvoidColor(col)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isAvoided
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-[#FAF8F5] text-[#5E4633] border border-[#EBE5DB] hover:border-[#18181B]'
                    }`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Style & Occasions */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Sparkles className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Style & Occasions
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
              Style Personas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STYLE_PREFERENCES.map((style) => {
                const isSelected = stylePrefs.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStylePref(style)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                        : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                    }`}
                  >
                    <span className="text-xs font-semibold">{style}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
              Typical Occasions
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {POPULAR_OCCASIONS.map((occ) => {
                const isSelected = typicalOccasions.includes(occ);
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => toggleOccasion(occ)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                        : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                    }`}
                  >
                    <span className="text-xs font-semibold">{occ}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
              Comfort Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Maximum Comfort', 'Balanced', 'Structure & Sharpness'].map((c) => {
                const isSelected = comfortPreference === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setComfortPreference(c as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white shadow-sm'
                        : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                    }`}
                  >
                    <span className="text-xs font-semibold block">{c}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-full bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] text-xs font-semibold tracking-wide uppercase transition-all shadow-md"
          >
            {isSaving ? 'Saving Changes…' : 'Save Style Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
