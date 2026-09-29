'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { Sparkles, Check, User, Palette, Sliders, Phone, Mail, MapPin, Layers } from 'lucide-react';
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [preferredFit, setPreferredFit] = useState('');
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [avoidedColors, setAvoidedColors] = useState<string[]>([]);
  const [stylePrefs, setStylePrefs] = useState<string[]>([]);
  const [comfortPreference, setComfortPreference] = useState('');
  const [typicalOccasions, setTypicalOccasions] = useState<string[]>([]);
  const [city, setCity] = useState('');

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
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Layers className="w-4 h-4 text-[#9A7B5F]" />
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
                <option value="">Select skin undertone</option>
                <option value="Fair">Fair</option>
                <option value="Warm Olive">Warm Olive</option>
                <option value="Medium Wheatish">Medium Wheatish</option>
                <option value="Dusky">Dusky</option>
                <option value="Deep Tan">Deep Tan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
    </div>
  );
}
