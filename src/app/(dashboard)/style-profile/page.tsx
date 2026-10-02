'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { Sparkles, Check, User, Palette, Sliders, Phone, Mail, MapPin, Layers, Camera, RotateCcw } from 'lucide-react';
import { normalizeMobileNumber, isValidIndianMobile, formatMobileDisplay } from '@/lib/auth/mobile';
import SkinScanModal from '@/components/profile/SkinScanModal';
import BodyScanModal from '@/components/profile/BodyScanModal';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyBuild, setBodyBuild] = useState('');
  const [bodyScanConfidence, setBodyScanConfidence] = useState<number | undefined>(undefined);
  const [skinTone, setSkinTone] = useState('');
  const [skinScanConfidence, setSkinScanConfidence] = useState<number | undefined>(undefined);
  const [preferredFit, setPreferredFit] = useState('');
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [avoidedColors, setAvoidedColors] = useState<string[]>([]);
  const [stylePrefs, setStylePrefs] = useState<string[]>([]);
  const [comfortPreference, setComfortPreference] = useState('');
  const [typicalOccasions, setTypicalOccasions] = useState<string[]>([]);
  const [city, setCity] = useState('');

  // Scanner Modal States
  const [isSkinScanModalOpen, setIsSkinScanModalOpen] = useState(false);
  const [isBodyScanModalOpen, setIsBodyScanModalOpen] = useState(false);

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
            if (p.name) setName(p.name);
            if (p.email) setEmail(p.email);
            if (p.age) setAge(String(p.age));
            if (p.mobile_number) {
              const rawDigits = p.mobile_number.replace(/\D/g, '');
              setMobileNumber(rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits);
            }
            if (p.height) setHeight(p.height);
            if (p.weight) setWeight(p.weight);
            if (p.body_build) setBodyBuild(p.body_build);
            if (p.body_scan_confidence !== undefined) setBodyScanConfidence(p.body_scan_confidence);
            if (p.skin_tone) setSkinTone(p.skin_tone);
            if (p.skin_scan_confidence !== undefined) setSkinScanConfidence(p.skin_scan_confidence);
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

    if (!name.trim()) {
      setSaveError('Please enter your preferred name.');
      setIsSaving(false);
      return;
    }

    if (mobileNumber && !isValidIndianMobile(mobileNumber)) {
      setSaveError('Please enter a valid 10-digit Indian mobile number.');
      setIsSaving(false);
      return;
    }

    const parsedAge = age ? Number(age) : undefined;
    if (parsedAge !== undefined && (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120)) {
      setSaveError('Please enter a valid age between 13 and 120.');
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
          mobile_number: mobileNumber ? normalizeMobileNumber(mobileNumber) : undefined,
          age: parsedAge,
          height,
          weight,
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
          AUREVÉ uses your proportions and preferences strictly for personalized fit alignment and occasion recommendations.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Style profile updated! Your preferred name and recommendations are synchronized.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* 1. Account & Identity */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <User className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Personal Information & Identity
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-1.5">
                Preferred Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Akshith"
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
              <p className="text-[10px] text-[#9A7B5F] mt-1">
                Used in greetings across your dashboard and wardrobe.
              </p>
            </div>

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
                <p className="text-[10px] text-[#9A7B5F] mt-1">
                  Primary authentication identity.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-1.5">
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-1.5">
                Age
              </label>
              <input
                type="number"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
            </div>
          </div>
        </div>

        {/* 2. Proportions & Silhouette */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Layers className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Proportions & Silhouette
            </h3>
          </div>

          {/* A. Skin Undertone Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                  Skin Undertone (Color Harmony)
                </label>
                <p className="text-[11px] text-[#7E6047]">
                  Calibrates contrast & palette recommendations for shirts, layering & accessories.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {skinScanConfidence !== undefined && skinScanConfidence > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    AI Calibrated ({Math.round(skinScanConfidence * 100)}%)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsSkinScanModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#18181B] text-[#FAF8F5] hover:bg-[#3D2E22] transition-colors shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  {skinTone ? 'Scan Again' : 'Scan Face'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { name: 'Warm Olive', desc: 'Golden / yellow undertones', preview: 'bg-[#D2A679]' },
                { name: 'Medium Wheatish', desc: 'Neutral warm undertones', preview: 'bg-[#C89D7C]' },
                { name: 'Dusky', desc: 'Rich brown undertones', preview: 'bg-[#A77654]' },
                { name: 'Deep Tan', desc: 'Deep warm undertones', preview: 'bg-[#7C4F35]' },
                { name: 'Fair', desc: 'Cool / neutral fair undertones', preview: 'bg-[#F2D7C5]' },
              ].map((tone) => {
                const isSelected = skinTone === tone.name;
                return (
                  <button
                    key={tone.name}
                    type="button"
                    onClick={() => {
                      setSkinTone(tone.name);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white shadow-xs'
                        : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0 ${tone.preview}`} />
                      <span className="text-xs font-semibold leading-tight line-clamp-1">{tone.name}</span>
                    </div>
                    <span className={`text-[10px] leading-tight block ${isSelected ? 'text-[#FAF8F5]/80' : 'text-[#7E6047]'}`}>
                      {tone.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. Body Build / Silhouette Section */}
          <div className="space-y-3 pt-3 border-t border-[#F4EFEA]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                  Body Build / Silhouette
                </label>
                <p className="text-[11px] text-[#7E6047]">
                  Ensures balanced outfit proportions, neckline cuts, and trouser drape.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {bodyScanConfidence !== undefined && bodyScanConfidence > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    AI Calibrated ({Math.round(bodyScanConfidence * 100)}%)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsBodyScanModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#18181B] text-[#FAF8F5] hover:bg-[#3D2E22] transition-colors shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  {bodyBuild ? 'Scan Again' : 'Scan Body'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: 'Slim', desc: 'Linear, streamlined frame' },
                { name: 'Athletic', desc: 'V-taper, defined shoulders' },
                { name: 'Medium', desc: 'Even, proportional frame' },
                { name: 'Broad', desc: 'Wide shoulders & sturdy chest' },
              ].map((build) => {
                const isSelected = bodyBuild === build.name;
                return (
                  <button
                    key={build.name}
                    type="button"
                    onClick={() => {
                      setBodyBuild(build.name);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white shadow-xs'
                        : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#18181B] hover:border-[#18181B]'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-0.5">{build.name}</div>
                    <span className={`text-[10px] leading-tight block ${isSelected ? 'text-[#FAF8F5]/80' : 'text-[#7E6047]'}`}>
                      {build.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C, D, E. Height, Weight, Fit, City */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-[#F4EFEA]">
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
                Weight
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70 kg or 155 lbs"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Preferred Fit
              </label>
              <select
                value={preferredFit}
                onChange={(e) => setPreferredFit(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              >
                <option value="">Select preferred fit</option>
                <option value="Slim">Slim</option>
                <option value="Regular">Regular</option>
                <option value="Relaxed">Relaxed</option>
                <option value="Oversized">Oversized</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Home City (Climate)
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              >
                <option value="">Select home city</option>
                {POPULAR_INDIAN_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Color Palette Preferences */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Palette className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Color Harmonies & Palette
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-3">
              Favorite Colors (Click to toggle)
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COLORS.map((c) => {
                const isSelected = favoriteColors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleFavColor(c)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#18181B] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#5E4633] border border-[#EBE5DB] hover:border-[#18181B]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-3">
              Colors to Avoid
            </label>
            <div className="flex flex-wrap gap-2">
              {['Neon Green', 'Bright Orange', 'Hot Pink', 'Mustard Yellow', 'Purple'].map((c) => {
                const isSelected = avoidedColors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleAvoidColor(c)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                      isSelected
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
        </div>

        {/* 4. Style Aesthetic & Lifestyle */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Sliders className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Style Aesthetic & Occasions
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-3">
              Style Personas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STYLE_PREFERENCES.map((s) => {
                const isSelected = stylePrefs.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStylePref(s)}
                    className={`p-3 rounded-2xl border text-center text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white'
                        : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#5E4633] hover:border-[#18181B]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-3">
              Typical Occasions
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_OCCASIONS.map((occ) => {
                const isSelected = typicalOccasions.includes(occ);
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => toggleOccasion(occ)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#18181B] text-white'
                        : 'bg-[#FAF8F5] text-[#5E4633] border border-[#EBE5DB] hover:border-[#18181B]'
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-3">
              Comfort Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: 'Maximum Comfort', desc: 'Breathable, relaxed fabrics' },
                { title: 'Balanced', desc: 'Equal parts ease and polish' },
                { title: 'Structure & Sharpness', desc: 'Tailored silhouettes' },
              ].map((item) => {
                const isSelected = comfortPreference === item.title;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setComfortPreference(item.title as any)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white'
                        : 'border-[#EBE5DB] bg-[#FAF8F5] text-[#5E4633] hover:border-[#18181B]'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-0.5">{item.title}</div>
                    <div className={`text-[11px] ${isSelected ? 'text-[#FAF8F5]/80' : 'text-[#7E6047]'}`}>
                      {item.desc}
                    </div>
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
            className="px-8 py-3.5 rounded-full bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] text-xs font-semibold tracking-wide uppercase transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving Preferences…</span>
            ) : (
              <>
                <span>Save Style Profile</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Modals */}
      <SkinScanModal
        isOpen={isSkinScanModalOpen}
        onClose={() => setIsSkinScanModalOpen(false)}
        currentUndertone={skinTone}
        onApplyResult={(detectedTone, confidence) => {
          setSkinTone(detectedTone);
          setSkinScanConfidence(confidence);
        }}
      />

      <BodyScanModal
        isOpen={isBodyScanModalOpen}
        onClose={() => setIsBodyScanModalOpen(false)}
        currentBuild={bodyBuild}
        onApplyResult={(detectedBuild, confidence) => {
          setBodyBuild(detectedBuild);
          setBodyScanConfidence(confidence);
        }}
      />
    </div>
  );
}
