'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { Sparkles, Check, User, Palette, Sliders, ShieldCheck } from 'lucide-react';

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
  'Smart Casual',
  'Minimal',
  'Modern Indian',
  'Casual',
  'Formal',
  'Streetwear',
  'Sporty',
  'Festive / Traditional',
];

export default function StyleProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [height, setHeight] = useState("5'10\"");
  const [weight, setWeight] = useState('72 kg');
  const [skinTone, setSkinTone] = useState('Warm Olive');
  const [preferredFit, setPreferredFit] = useState<'Slim' | 'Regular' | 'Relaxed' | 'Oversized'>('Regular');
  const [favoriteColors, setFavoriteColors] = useState<string[]>(['Navy Blue', 'White', 'Olive Green', 'Charcoal Grey']);
  const [avoidedColors, setAvoidedColors] = useState<string[]>(['Neon Green', 'Bright Orange']);
  const [stylePrefs, setStylePrefs] = useState<string[]>(['Smart Casual', 'Minimal', 'Modern Indian']);
  const [comfortPreference, setComfortPreference] = useState<'Maximum Comfort' | 'Balanced' | 'Structure & Sharpness'>('Balanced');
  const [city, setCity] = useState('Mumbai');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            setProfile(p);
            if (p.height) setHeight(p.height);
            if (p.weight) setWeight(p.weight);
            if (p.skin_tone) setSkinTone(p.skin_tone);
            if (p.preferred_fit) setPreferredFit(p.preferred_fit);
            if (p.favorite_colors) setFavoriteColors(p.favorite_colors);
            if (p.avoided_colors) setAvoidedColors(p.avoided_colors);
            if (p.style_preferences) setStylePrefs(p.style_preferences);
            if (p.comfort_preference) setComfortPreference(p.comfort_preference);
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height,
          weight,
          skin_tone: skinTone,
          preferred_fit: preferredFit,
          favorite_colors: favoriteColors,
          avoided_colors: avoidedColors,
          style_preferences: stylePrefs,
          comfort_preference: comfortPreference,
          city,
          profile_completed: true,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
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

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* 1. Proportions & Silhouette */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <User className="w-4 h-4 text-[#9A7B5F]" />
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
                    className={`p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#18181B] text-white border-[#18181B]'
                        : 'bg-[#FAF8F5] border-[#EBE5DB] text-[#5E4633] hover:bg-white'
                    }`}
                  >
                    {fit} Fit
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Color Palette Preferences */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Palette className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Color Palette Harmony
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
              Favorite Colors (Prioritized by AI Stylist)
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COLORS.map((col) => {
                const active = favoriteColors.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleFavColor(col)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#18181B] text-white shadow-xs'
                        : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:bg-white'
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
                const active = avoidedColors.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleAvoidColor(col)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active
                        ? 'bg-rose-900 text-white'
                        : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:bg-white'
                    }`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Style Persona & Comfort Preference */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#F4EFEA]">
            <Sliders className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Fashion Direction & Comfort
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
              Preferred Style Personas
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PREFERENCES.map((style) => {
                const active = stylePrefs.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStylePref(style)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#18181B] text-white shadow-xs'
                        : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:bg-white'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Comfort vs. Structure Balance
              </label>
              <select
                value={comfortPreference}
                onChange={(e) => setComfortPreference(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              >
                <option value="Maximum Comfort">Maximum Comfort (Breathable, soft fabrics)</option>
                <option value="Balanced">Balanced (Smart, polished and comfortable)</option>
                <option value="Structure & Sharpness">Structure & Sharpness (Crisp tailoring)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Home City (Default Weather)
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
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-md active:scale-95"
          >
            {isSaving ? 'Updating Profile…' : 'SAVE STYLE PROFILE'}
          </button>
        </div>
      </form>
    </div>
  );
}
