'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Upload, Sparkles, Check, Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { MainCategory, WardrobeItem } from '@/lib/types';

interface AddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: WardrobeItem) => void;
}

const PRESET_CLOTHING_TEMPLATES = [
  {
    name: 'Crisp White Linen Shirt',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    hint: 'White Linen Shirt',
  },
  {
    name: 'Sky Blue Oxford Button-Down',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    hint: 'Light Blue Shirt',
  },
  {
    name: 'Beige Relaxed Pleated Chinos',
    url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    hint: 'Beige Chinos Pants',
  },
  {
    name: 'Raw Indigo Straight Jeans',
    url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
    hint: 'Dark Indigo Jeans',
  },
  {
    name: 'Minimalist White Leather Sneakers',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    hint: 'White Sneakers Shoes',
  },
  {
    name: 'Dark Brown Leather Loafers',
    url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=800&q=80',
    hint: 'Brown Penny Loafers',
  },
];

export function AddClothingModal({ isOpen, onClose, onItemAdded }: AddClothingModalProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Form Fields
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<MainCategory>('tops');
  const [subcategory, setSubcategory] = useState<string>('shirt');
  const [primaryColor, setPrimaryColor] = useState<string>('White');
  const [pattern, setPattern] = useState<string>('Solid');
  const [material, setMaterial] = useState<string>('100% Cotton');
  const [fit, setFit] = useState<string>('Regular');
  const [style, setStyle] = useState<string>('Smart Casual');
  const [formality, setFormality] = useState<'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive'>('Smart Casual');
  const [season, setSeason] = useState<string[]>(['Summer', 'All-Season']);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Image is too large. Please select a photo under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageUrl(base64);
      triggerAIClassification(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_CLOTHING_TEMPLATES[0]) => {
    setImageUrl(preset.url);
    triggerAIClassification(preset.url, preset.hint);
  };

  const triggerAIClassification = async (imgData: string, hint?: string) => {
    setStep('analyzing');
    setIsClassifying(true);
    setError('');

    try {
      const res = await fetch('/api/wardrobe/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgData, hint }),
      });

      const data = await res.json();
      if (data.success && data.classification) {
        const c = data.classification;
        setName(c.name || 'Wardrobe Piece');
        setCategory(c.category || 'tops');
        setSubcategory(c.subcategory || 'shirt');
        setPrimaryColor(c.primary_color || 'White');
        setPattern(c.pattern || 'Solid');
        setMaterial(c.material || 'Cotton');
        setFit(c.fit || 'Regular');
        setStyle(c.style || 'Smart Casual');
        setFormality(c.formality || 'Smart Casual');
        setSeason(c.season || ['All-Season']);
        setStep('review');
      } else {
        // Fallback default review
        setName('New Garment');
        setStep('review');
      }
    } catch (err) {
      console.error(err);
      setStep('review');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSaveToWardrobe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !primaryColor) {
      setError('Please provide a name and primary color.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const res = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          subcategory,
          image_url: imageUrl,
          primary_color: primaryColor,
          pattern,
          material,
          fit,
          style,
          formality,
          season,
          is_favorite: isFavorite,
        }),
      });

      const data = await res.json();
      if (data.success && data.item) {
        onItemAdded(data.item);
        handleClose();
      } else {
        setError(data.error || 'Failed to save wardrobe piece.');
      }
    } catch (err: any) {
      setError('Network error saving to wardrobe.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setImageUrl('');
    setError('');
    onClose();
  };

  const toggleSeason = (s: string) => {
    if (season.includes(s)) {
      setSeason(season.filter((item) => item !== s));
    } else {
      setSeason([...season, s]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FBF9F6] w-full max-w-2xl rounded-3xl border border-[#EBE5DB] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#EBE5DB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9A7B5F]" />
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
              Add to Private Wardrobe
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#F4EFEA] text-[#7E6047] hover:text-[#18181B] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload / Choose Photo */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-[#D6C7B7] hover:border-[#18181B] bg-white rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-[#F4EFEA] text-[#7E6047] group-hover:bg-[#18181B] group-hover:text-white flex items-center justify-center mb-3 transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-[#18181B] mb-1">
                  Upload garment photo
                </h4>
                <p className="text-xs text-[#7E6047] text-center max-w-xs">
                  Take a quick phone snap or upload a clean photo. AUREVÉ AI will instantly recognize the piece.
                </p>
              </label>

              {/* Or Choose Sample Garment */}
              <div>
                <p className="text-xs font-semibold text-[#7E6047] uppercase tracking-wider mb-3">
                  Or pick a curated classic piece to test:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_CLOTHING_TEMPLATES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-[#EBE5DB] hover:border-[#18181B] transition-all"
                    >
                      <Image
                        src={preset.url}
                        alt={preset.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI Analyzing Animation */}
          {step === 'analyzing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-32 h-40 rounded-2xl overflow-hidden border-2 border-[#18181B] shadow-xl">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt="Scanning garment"
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 ai-scan-shimmer" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center space-x-2 text-[#18181B]">
                  <Sparkles className="w-4 h-4 text-[#9A7B5F] animate-spin" />
                  <h4 className="font-serif text-xl font-semibold">
                    Understanding your piece…
                  </h4>
                </div>
                <p className="text-xs text-[#7E6047] max-w-sm">
                  Detecting color palette, silhouette, fabric texture, and Indian styling suitability…
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Edit AI Classification */}
          {step === 'review' && (
            <form onSubmit={handleSaveToWardrobe} className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Photo Preview */}
                <div className="relative w-28 h-36 rounded-2xl overflow-hidden border border-[#EBE5DB] bg-white flex-shrink-0 mx-auto sm:mx-0 shadow-sm">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt="Garment preview"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Main Name & Category */}
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Piece Title *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Sky Blue Oxford Shirt"
                      className="w-full px-3.5 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as MainCategory)}
                        className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      >
                        <option value="tops">Tops</option>
                        <option value="bottoms">Bottoms</option>
                        <option value="layers">Layers</option>
                        <option value="footwear">Footwear</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                        Subcategory
                      </label>
                      <input
                        type="text"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        placeholder="shirt, chinos, sneakers..."
                        className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                    Primary Color *
                  </label>
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    required
                    placeholder="White, Sky Blue, Charcoal..."
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                    Pattern
                  </label>
                  <select
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  >
                    <option value="Solid">Solid</option>
                    <option value="Striped">Striped</option>
                    <option value="Checked">Checked</option>
                    <option value="Textured">Textured</option>
                    <option value="Printed">Printed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                    Fabric / Material
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Linen, Cotton, Denim..."
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                    Fit
                  </label>
                  <select
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Slim">Slim</option>
                    <option value="Relaxed">Relaxed</option>
                    <option value="Tailored">Tailored</option>
                    <option value="Oversized">Oversized</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                    Formality
                  </label>
                  <select
                    value={formality}
                    onChange={(e) => setFormality(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  >
                    <option value="Casual">Casual</option>
                    <option value="Smart Casual">Smart Casual</option>
                    <option value="Semi-Formal">Semi-Formal</option>
                    <option value="Formal">Formal</option>
                    <option value="Festive">Festive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                    Style Persona
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  >
                    <option value="Smart Casual">Smart Casual</option>
                    <option value="Minimal">Minimal</option>
                    <option value="Modern Indian">Modern Indian</option>
                    <option value="Casual">Casual</option>
                    <option value="Streetwear">Streetwear</option>
                  </select>
                </div>
              </div>

              {/* Season Chips */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                  Suitable Weather / Seasons
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Summer', 'Monsoon', 'Winter', 'All-Season', 'Festive'].map((s) => {
                    const active = season.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSeason(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          active
                            ? 'bg-[#18181B] text-white'
                            : 'bg-white border border-[#EBE5DB] text-[#5E4633] hover:bg-[#F4EFEA]'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#EBE5DB] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="text-xs font-medium text-[#7E6047] hover:text-[#18181B] flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rescan Photo</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-medium text-[#7E6047] hover:text-[#18181B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center space-x-1.5"
                  >
                    {isSaving ? (
                      <span>Saving…</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>SAVE TO WARDROBE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
