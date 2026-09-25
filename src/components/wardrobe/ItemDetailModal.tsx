'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Heart, Trash2, Archive, Edit3, Check, Calendar, RotateCcw, Clock } from 'lucide-react';
import { WardrobeItem } from '@/lib/types';

interface ItemDetailModalProps {
  item: WardrobeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItem: WardrobeItem) => void;
  onArchive: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onUpdate,
  onArchive,
  onDelete,
}: ItemDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [fit, setFit] = useState('');
  const [formality, setFormality] = useState<any>('Smart Casual');
  const [material, setMaterial] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setPrimaryColor(item.primary_color);
      setFit(item.fit || 'Regular');
      setFormality(item.formality || 'Smart Casual');
      setMaterial(item.material || 'Cotton');
      setIsEditing(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/wardrobe/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          primary_color: primaryColor,
          fit,
          formality,
          material,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        onUpdate(data.item);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = new Date(item.created_at).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FBF9F6] w-full max-w-xl rounded-3xl border border-[#EBE5DB] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-white border-b border-[#EBE5DB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7E6047]">
              {item.category} / {item.subcategory}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4EFEA] text-[#7E6047] hover:text-[#18181B] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[78vh] overflow-y-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Large Image Box */}
            <div className="relative w-full sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden bg-[#F4EFEA] border border-[#EBE5DB] flex-shrink-0 shadow-sm">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {item.times_worn}x worn
                </span>
              </div>
            </div>

            {/* Item Info / Edit Form */}
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#7E6047] uppercase">
                      Piece Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#EBE5DB] rounded-lg text-xs sm:text-sm font-semibold text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#7E6047] uppercase">
                      Primary Color
                    </label>
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#EBE5DB] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#7E6047] uppercase">
                        Fit
                      </label>
                      <select
                        value={fit}
                        onChange={(e) => setFit(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#EBE5DB] rounded-lg text-xs text-[#18181B]"
                      >
                        <option value="Regular">Regular</option>
                        <option value="Slim">Slim</option>
                        <option value="Relaxed">Relaxed</option>
                        <option value="Tailored">Tailored</option>
                        <option value="Oversized">Oversized</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#7E6047] uppercase">
                        Formality
                      </label>
                      <select
                        value={formality}
                        onChange={(e) => setFormality(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#EBE5DB] rounded-lg text-xs text-[#18181B]"
                      >
                        <option value="Casual">Casual</option>
                        <option value="Smart Casual">Smart Casual</option>
                        <option value="Semi-Formal">Semi-Formal</option>
                        <option value="Formal">Formal</option>
                        <option value="Festive">Festive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="bg-[#18181B] text-white px-4 py-1.5 rounded-full text-xs font-medium"
                    >
                      {isSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-[#7E6047] hover:text-[#18181B] px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#18181B] mb-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-[#7E6047]">
                      <span className="inline-flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-[#18181B]" />
                        <span>{item.primary_color}</span>
                      </span>
                      <span>•</span>
                      <span>{item.material || 'Cotton'}</span>
                      <span>•</span>
                      <span>{item.fit || 'Regular fit'}</span>
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <div className="p-2.5 rounded-xl bg-white border border-[#EBE5DB]">
                      <span className="block text-[10px] uppercase text-[#7E6047] font-semibold">
                        Formality
                      </span>
                      <span className="text-xs font-semibold text-[#18181B]">
                        {item.formality || 'Smart Casual'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-[#EBE5DB]">
                      <span className="block text-[10px] uppercase text-[#7E6047] font-semibold">
                        Pattern
                      </span>
                      <span className="text-xs font-semibold text-[#18181B]">
                        {item.pattern || 'Solid'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-[#EBE5DB]">
                      <span className="block text-[10px] uppercase text-[#7E6047] font-semibold">
                        Added On
                      </span>
                      <span className="text-xs font-semibold text-[#18181B]">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-[#EBE5DB]">
                      <span className="block text-[10px] uppercase text-[#7E6047] font-semibold">
                        Times Styled
                      </span>
                      <span className="text-xs font-semibold text-[#18181B]">
                        {item.times_worn || 0} times
                      </span>
                    </div>
                  </div>

                  {/* Season Badges */}
                  {item.season && item.season.length > 0 && (
                    <div>
                      <span className="block text-[10px] uppercase text-[#7E6047] font-semibold mb-1.5">
                        Seasons
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.season.map((s) => (
                          <span
                            key={s}
                            className="bg-[#F4EFEA] text-[#5E4633] text-[10px] font-medium px-2 py-0.5 rounded-md border border-[#E8DFD5]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Footer */}
          {!isEditing && (
            <div className="pt-4 border-t border-[#EBE5DB] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#EBE5DB] hover:border-[#18181B] text-xs font-medium text-[#18181B] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Piece</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onArchive(item)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#F4EFEA] hover:bg-[#E8DFD5] text-xs font-medium text-[#5E4633] transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{item.is_archived ? 'Restore to Wardrobe' : 'Archive'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to permanently remove this piece from your wardrobe?')) {
                      onDelete(item);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-xs font-medium text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
