'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Shirt,
  Compass,
  Lock,
  CloudSun,
  Layers,
  ArrowRight,
  CheckCircle2,
  Heart,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6] text-[#18181B] selection:bg-[#221A13] selection:text-[#FAF8F5]">
      {/* Top Floating Luxury Header */}
      <header className="sticky top-0 z-50 w-full bg-[#FBF9F6]/85 backdrop-blur-md border-b border-[#EBE5DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-[#18181B]">
              AUREVÉ
            </span>
            <span className="hidden sm:inline-block text-[10px] tracking-[0.25em] uppercase font-sans text-[#7E6047] border-l border-[#D6C7B7] pl-3 py-0.5">
              Personal Styling
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/login"
              className="text-xs font-semibold tracking-wide text-[#5E4633] hover:text-[#18181B] px-3.5 py-2 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/login"
              className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-5 sm:px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-sm hover:shadow-md"
            >
              Enter AUREVÉ
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#F4EFEA] border border-[#E8DFD5] px-4 py-1.5 rounded-full text-xs font-medium text-[#7E6047]">
              <Sparkles className="w-3.5 h-3.5 text-[#9A7B5F]" />
              <span>Private AI-Powered Digital Wardrobe</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light text-[#18181B] tracking-tight leading-[1.1]">
              Your wardrobe.{' '}
              <span className="italic font-normal text-[#5E4633]">
                Intelligently styled.
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-[#5E4633] font-normal max-w-2xl mx-auto leading-relaxed">
              Upload what you own. Tell us where you&apos;re going. Let AUREVÉ create the right look for the moment using{' '}
              <strong className="font-semibold text-[#18181B]">only items you actually own</strong>.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-8 py-4 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-lg hover:shadow-xl group"
              >
                <span>Enter AUREVÉ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-[#F4EFEA] text-[#18181B] border border-[#EBE5DB] px-7 py-4 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all"
              >
                <span>Explore the experience</span>
              </a>
            </div>

            {/* Micro Pillars */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#7E6047]">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simple + Classy + Modern</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Indian Climate Aware</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Private to You</span>
              </span>
            </div>
          </div>

          {/* Visual Editorial Preview Showcase */}
          <div className="mt-14 sm:mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-3xl bg-white border border-[#EBE5DB] shadow-2xl overflow-hidden p-4 sm:p-8">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#F4EFEA] rounded-full blur-3xl -z-0 opacity-70" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Visual Garment Boxes */}
                <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
                  <div className="garment-card bg-[#FBF9F6] p-2.5 rounded-2xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#7E6047]">TOP</span>
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mt-1 mb-2">
                      <Image
                        src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80"
                        alt="Sky Blue Shirt"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs font-semibold text-[#18181B] truncate">Sky Blue Oxford Shirt</p>
                    <p className="text-[10px] text-[#7E6047]">100% Cotton • Regular Fit</p>
                  </div>

                  <div className="garment-card bg-[#FBF9F6] p-2.5 rounded-2xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#7E6047]">BOTTOM</span>
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mt-1 mb-2">
                      <Image
                        src="https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=80"
                        alt="Charcoal Trousers"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs font-semibold text-[#18181B] truncate">Charcoal Tailored Trousers</p>
                    <p className="text-[10px] text-[#7E6047]">Semi-Formal • Charcoal</p>
                  </div>

                  <div className="garment-card bg-[#FBF9F6] p-2.5 rounded-2xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#7E6047]">FOOTWEAR</span>
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mt-1 mb-2">
                      <Image
                        src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80"
                        alt="White Sneakers"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs font-semibold text-[#18181B] truncate">Minimal Leather Sneakers</p>
                    <p className="text-[10px] text-[#7E6047]">Full Grain • Crisp White</p>
                  </div>

                  <div className="garment-card bg-[#FBF9F6] p-2.5 rounded-2xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#7E6047]">ACCESSORY</span>
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mt-1 mb-2">
                      <Image
                        src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80"
                        alt="Minimal Watch"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs font-semibold text-[#18181B] truncate">Obsidian Analog Watch</p>
                    <p className="text-[10px] text-[#7E6047]">Matte Dial • Black</p>
                  </div>
                </div>

                {/* AI Reasoning Side */}
                <div className="w-full md:w-1/2 space-y-4 text-left">
                  <div className="inline-flex items-center space-x-2 bg-[#F4EFEA] px-3 py-1 rounded-full text-xs font-medium text-[#7E6047]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Smart Casual Evening • Mumbai (28°C)</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                    Smart Casual Evening
                  </h3>

                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE5DB] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E6047]">
                      WHY THIS WORKS
                    </span>
                    <p className="text-xs text-[#3D2E22] leading-relaxed">
                      “The sky blue oxford shirt creates a crisp, breathable foundation against the tailored charcoal trousers, while the white leather sneakers keep the look modern without feeling overdressed.”
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-semibold text-[#7E6047] uppercase">MATCH:</span>
                      <span className="font-serif text-lg font-bold text-[#18181B]">94% Compatibility</span>
                    </div>
                    <span className="text-xs font-semibold text-[#7E6047]">Simple · Classy · Modern</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY QUOTE SECTION */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5] border-y border-[#EBE5DB]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-[#7E6047]">
            Product Philosophy
          </span>
          <blockquote className="font-serif text-2xl sm:text-4xl text-[#18181B] font-light leading-snug">
            “Great style doesn&apos;t require more clothes. It requires better combinations.”
          </blockquote>
          <p className="text-xs sm:text-sm text-[#7E6047] max-w-md mx-auto">
            AUREVÉ is designed to elicit one specific reaction: <br />
            <strong className="text-[#18181B]">“He dresses really well.”</strong> — not “He is trying too hard.”
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
            The Journey
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B]">
            How AUREVÉ Works
          </h2>
          <p className="text-xs sm:text-sm text-[#7E6047]">
            Four effortless steps from your real closet to a polished, confident outfit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Upload your wardrobe',
              desc: 'Snap or upload photos of your shirts, trousers, jackets, footwear and watches.',
              icon: Shirt,
            },
            {
              step: '02',
              title: 'AUREVÉ understands your clothes',
              desc: 'AI automatically identifies category, silhouette, fabric, color palette and formality.',
              icon: Sparkles,
            },
            {
              step: '03',
              title: 'Choose your occasion',
              desc: 'Select where you’re going — office, date, dinner, wedding or casual coffee — with live weather.',
              icon: Compass,
            },
            {
              step: '04',
              title: 'Get your complete look',
              desc: 'Receive a high-confidence, realistic combination with precise styling reasoning.',
              icon: CheckCircle2,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-3xl border border-[#EBE5DB] p-6 sm:p-8 flex flex-col justify-between hover:border-[#18181B] transition-all hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-3xl font-light text-[#D6C7B7]">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-[#F4EFEA] text-[#7E6047] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-[#18181B] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#7E6047] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-20 bg-white border-t border-[#EBE5DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#7E6047]">
              Intelligent Architecture
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B]">
              Engineered for Real-World Elegance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Private Digital Wardrobe',
                desc: 'Strict user isolation and Row Level Security ensure your clothes and looks remain 100% confidential.',
                icon: Lock,
              },
              {
                title: 'AI Clothing Recognition',
                desc: 'Computer vision identifies fabric, color, formality, and fit directly from your photos.',
                icon: Sparkles,
              },
              {
                title: 'Indian Context Styling',
                desc: 'Tailored for Indian climates, festivals, office etiquette, humidity, and practical footwear.',
                icon: Compass,
              },
              {
                title: 'Weather-Aware Outfits',
                desc: 'Integrated live forecast adjusts fabrics and layers so you are always comfortable.',
                icon: CloudSun,
              },
              {
                title: 'Personal Style Profile',
                desc: 'Adapts to your skin tone, preferred fit, favorite colors, and comfort tolerance.',
                icon: Shirt,
              },
              {
                title: 'Smart Wardrobe Rotation',
                desc: 'Subtly surfaces unworn items and prevents repetitive outfit combinations.',
                icon: Layers,
              },
              {
                title: 'Special Modes',
                desc: '5-minute Quick Dress, Comfort Mode, Surprise Me, and Multi-Day Travel Packing.',
                icon: Sparkles,
              },
              {
                title: 'Continuous AI Learning',
                desc: 'Rate your outfits to help AUREVÉ refine future recommendations to your taste.',
                icon: Heart,
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] space-y-3"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E8DFD5] text-[#18181B] flex items-center justify-center shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-lg font-semibold text-[#18181B]">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-[#7E6047] leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 sm:py-28 bg-[#18181B] text-[#FAF8F5] text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#B89F88]">
            Begin Your Styling Journey
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-light leading-tight">
            You already have enough clothes.{' '}
            <span className="italic text-[#EEDC82]">
              You just need AUREVÉ to know how to wear them.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#D6C7B7] max-w-xl mx-auto">
            Experience private, bespoke personal styling engineered for modern Indian life.
          </p>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 bg-[#FAF8F5] hover:bg-white text-[#18181B] px-8 py-4 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-xl hover:scale-105"
            >
              <span>Enter AUREVÉ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 bg-[#FAF8F5] border-t border-[#EBE5DB] text-center text-xs text-[#7E6047]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg font-semibold text-[#18181B]">AUREVÉ</span>
          <p>© {new Date().getFullYear()} AUREVÉ. Your wardrobe. Intelligently styled.</p>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hover:text-[#18181B]">Login</Link>
            <a href="#how-it-works" className="hover:text-[#18181B]">How it works</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
