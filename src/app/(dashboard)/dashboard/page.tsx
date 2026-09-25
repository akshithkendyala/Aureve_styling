'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Shirt,
  Compass,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Plus,
  Zap,
  Luggage,
  Heart,
  TrendingUp,
  Smile,
  CheckCircle,
  CloudSun,
} from 'lucide-react';
import {
  WardrobeItem,
  Outfit,
  WardrobeStats,
  OccasionType,
  UserProfile,
} from '@/lib/types';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';
import { WardrobeItemCard } from '@/components/wardrobe/WardrobeItemCard';
import { ItemDetailModal } from '@/components/wardrobe/ItemDetailModal';
import { QuickDressModal } from '@/components/special/QuickDressModal';
import { TravelPlannerModal } from '@/components/special/TravelPlannerModal';

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('Gentleman');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [stats, setStats] = useState<WardrobeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Outfit Creator State
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>('Office');
  const [customOccasion, setCustomOccasion] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals
  const [activeDetailItem, setActiveDetailItem] = useState<WardrobeItem | null>(null);
  const [isQuickDressOpen, setIsQuickDressOpen] = useState(false);
  const [isTravelPlannerOpen, setIsTravelPlannerOpen] = useState(false);

  const occasions: { label: OccasionType; emoji: string }[] = [
    { label: 'Office', emoji: '💼' },
    { label: 'Date', emoji: '🍷' },
    { label: 'Casual Outing', emoji: '☕' },
    { label: 'College', emoji: '📚' },
    { label: 'Dinner', emoji: '🍽️' },
    { label: 'Party', emoji: '✨' },
    { label: 'Wedding', emoji: '🎉' },
    { label: 'Festival', emoji: '🪔' },
    { label: 'Family Function', emoji: '👨‍👩‍👧' },
    { label: 'Interview', emoji: '👔' },
    { label: 'Travel', emoji: '✈️' },
    { label: 'Gym', emoji: '🏃' },
    { label: 'Home', emoji: '🛋️' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [meRes, wardrobeRes, outfitsRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/wardrobe'),
        fetch('/api/outfits'),
        fetch('/api/wardrobe/stats'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user?.name) {
          setUserName(meData.user.name);
        }
        if (meData.profile?.city) {
          setSelectedCity(meData.profile.city);
        }
      }

      if (wardrobeRes.ok) {
        const wData = await wardrobeRes.json();
        setWardrobe(wData.items || []);
      }

      if (outfitsRes.ok) {
        const oData = await outfitsRes.json();
        setOutfits(oData.outfits || []);
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen to custom item-added event
    const handleNewItem = () => loadDashboardData();
    window.addEventListener('aureve:item-added', handleNewItem);
    return () => window.removeEventListener('aureve:item-added', handleNewItem);
  }, []);

  const handleCreateOutfit = async (overrideOccasion?: string, mode: string = 'standard') => {
    const occ = overrideOccasion || (selectedOccasion === 'Custom' ? customOccasion : selectedOccasion);
    setIsGenerating(true);

    try {
      const queryParams = new URLSearchParams({
        occasion: occ,
        date: selectedDate,
        time: selectedTime,
        city: selectedCity,
        mode,
      });

      router.push(`/create-outfit?${queryParams.toString()}`);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const todayOutfit = outfits[0];

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* 1. GREETING & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
            {getGreeting()}, {userName}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-light text-[#18181B] tracking-tight mt-1">
            What are we wearing today?
          </h1>
        </div>

        {/* Quick Mode Triggers */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsQuickDressOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-white border border-[#EBE5DB] hover:border-[#18181B] text-xs font-semibold text-[#18181B] transition-all shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>5-Min Quick Dress</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTravelPlannerOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-white border border-[#EBE5DB] hover:border-[#18181B] text-xs font-semibold text-[#18181B] transition-all shadow-2xs"
          >
            <Luggage className="w-3.5 h-3.5 text-[#9A7B5F]" />
            <span>Travel Mode</span>
          </button>
        </div>
      </div>

      {/* 2. THE CORE HERO COMPONENT: "CREATE YOUR LOOK" */}
      <section className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F4EFEA] rounded-full blur-3xl -z-0 opacity-50 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#18181B]" />
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Create Your Look
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#7E6047] uppercase tracking-wider">
              AI Outfit Reasoning Engine
            </span>
          </div>

          {/* Occasion Grid / Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7E6047] mb-2.5">
              Select Occasion
            </label>
            <div className="flex flex-wrap gap-2">
              {occasions.map((occ) => {
                const isSelected = selectedOccasion === occ.label;
                return (
                  <button
                    key={occ.label}
                    type="button"
                    onClick={() => setSelectedOccasion(occ.label)}
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

          {/* Date, Time & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E6047] mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E6047] mb-1">
                Location / Weather City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
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

          {/* PRIMARY BUTTON: CREATE OUTFIT (Strongest visual CTA) */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => handleCreateOutfit()}
              disabled={isGenerating}
              className="w-full py-4 sm:py-5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 group active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4 text-[#EEDC82] group-hover:rotate-12 transition-transform" />
              <span>{isGenerating ? 'Analyzing Wardrobe & Weather…' : 'CREATE OUTFIT'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. WARDROBE OVERVIEW STATS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
            Wardrobe Overview
          </h3>
          <Link
            href="/wardrobe"
            className="text-xs font-semibold text-[#7E6047] hover:text-[#18181B] flex items-center space-x-1"
          >
            <span>View All ({stats?.total || wardrobe.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Tops', count: stats?.tops ?? wardrobe.filter((i) => i.category === 'tops').length, link: '/wardrobe?category=tops' },
            { label: 'Bottoms', count: stats?.bottoms ?? wardrobe.filter((i) => i.category === 'bottoms').length, link: '/wardrobe?category=bottoms' },
            { label: 'Layers', count: stats?.layers ?? wardrobe.filter((i) => i.category === 'layers').length, link: '/wardrobe?category=layers' },
            { label: 'Footwear', count: stats?.footwear ?? wardrobe.filter((i) => i.category === 'footwear').length, link: '/wardrobe?category=footwear' },
            { label: 'Accessories', count: stats?.accessories ?? wardrobe.filter((i) => i.category === 'accessories').length, link: '/wardrobe?category=accessories' },
          ].map((stat, idx) => (
            <Link
              key={idx}
              href={stat.link}
              className="bg-white rounded-2xl border border-[#EBE5DB] p-4 hover:border-[#18181B] transition-all flex flex-col justify-between group"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E6047]">
                {stat.label}
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                  {stat.count}
                </span>
                <span className="text-[11px] text-[#9A7B5F] group-hover:text-[#18181B] font-medium">
                  Browse →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. TODAY'S LOOK & SMART STYLE INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Look (2 Cols on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
              Today&apos;s Look
            </h3>
            <Link href="/looks" className="text-xs font-medium text-[#7E6047] hover:text-[#18181B]">
              History →
            </Link>
          </div>

          {todayOutfit ? (
            <div className="bg-white rounded-3xl border border-[#EBE5DB] p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7E6047] tracking-wider">
                    {todayOutfit.occasion} • {todayOutfit.date}
                  </span>
                  <h4 className="font-serif text-xl font-bold text-[#18181B]">
                    {todayOutfit.title}
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#18181B] border border-[#E8DFD5]">
                  {todayOutfit.style_match}% Match
                </span>
              </div>

              {/* Garments Preview Thumbnails */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {todayOutfit.items.map((itRef, idx) => {
                  const item = itRef.item;
                  if (!item) return null;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveDetailItem(item)}
                      className="cursor-pointer group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E8DFD5]"
                    >
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 uppercase font-medium">
                        {itRef.role}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-[#5E4633] italic">
                “{todayOutfit.ai_explanation}”
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#EBE5DB] p-8 text-center space-y-3">
              <p className="font-serif text-lg text-[#18181B]">
                Your day is waiting to be styled.
              </p>
              <p className="text-xs text-[#7E6047] max-w-sm mx-auto">
                No outfit planned for today yet. Tap create outfit to generate an effortless look tailored to your plans.
              </p>
              <button
                type="button"
                onClick={() => handleCreateOutfit('Casual Outing')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#18181B] text-[#FAF8F5] text-xs font-semibold"
              >
                <span>Style Today&apos;s Look</span>
              </button>
            </div>
          )}
        </div>

        {/* Smart Style Insights (1 Col on desktop) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
              Style Insights
            </h3>
            <Sparkles className="w-4 h-4 text-[#9A7B5F]" />
          </div>

          <div className="bg-[#FAF8F5] rounded-3xl border border-[#EBE5DB] p-5 space-y-3.5">
            {stats?.styleInsights && stats.styleInsights.length > 0 ? (
              stats.styleInsights.map((insight, idx) => (
                <div key={idx} className="p-3 bg-white rounded-2xl border border-[#E8DFD5] space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7B5F]">
                    Wardrobe Intelligence
                  </span>
                  <p className="text-xs text-[#18181B] leading-relaxed">
                    {insight}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#7E6047]">
                Add more items to your wardrobe to unlock personalized color palette and rotation insights.
              </p>
            )}

            {/* Dominant Palette Pills */}
            {stats?.dominantColors && stats.dominantColors.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047] block mb-2">
                  Dominant Tones in Closet
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {stats.dominantColors.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white border border-[#E8DFD5] rounded-full text-[10px] font-medium text-[#18181B]"
                    >
                      {c.color} ({c.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. RECENTLY ADDED CLOTHING (Myntra-Style Organized Boxes) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shirt className="w-4 h-4 text-[#9A7B5F]" />
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
              Recently Added Pieces
            </h3>
          </div>
          <Link
            href="/wardrobe"
            className="text-xs font-semibold text-[#7E6047] hover:text-[#18181B]"
          >
            Explore Wardrobe →
          </Link>
        </div>

        {wardrobe.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-[#EBE5DB] text-center">
            <p className="text-xs text-[#7E6047]">No clothes in your wardrobe yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {wardrobe.slice(0, 5).map((item) => (
              <WardrobeItemCard
                key={item.id}
                item={item}
                onSelect={(it) => setActiveDetailItem(it)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <ItemDetailModal
        item={activeDetailItem}
        isOpen={Boolean(activeDetailItem)}
        onClose={() => setActiveDetailItem(null)}
        onUpdate={(updated) => {
          setWardrobe(wardrobe.map((i) => (i.id === updated.id ? updated : i)));
          setActiveDetailItem(updated);
        }}
        onArchive={(archived) => {
          loadDashboardData();
          setActiveDetailItem(null);
        }}
        onDelete={(deleted) => {
          loadDashboardData();
          setActiveDetailItem(null);
        }}
      />

      <QuickDressModal
        isOpen={isQuickDressOpen}
        onClose={() => setIsQuickDressOpen(false)}
        onQuickDress={(occ) => handleCreateOutfit(occ, 'quick')}
      />

      <TravelPlannerModal
        isOpen={isTravelPlannerOpen}
        onClose={() => setIsTravelPlannerOpen(false)}
        wardrobe={wardrobe}
      />
    </div>
  );
}
