'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  Camera,
  FolderOpen,
  Sparkles,
  Check,
  AlertCircle,
  FlipHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { MainCategory, WardrobeItem } from '@/lib/types';

interface AddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: WardrobeItem) => void;
  onItemsAdded?: (items: WardrobeItem[]) => void;
}

export interface StagedItem {
  id: string;
  imageUrl: string;
  fileName?: string;
  name: string;
  category: MainCategory;
  subcategory: string;
  primaryColor: string;
  pattern: string;
  material: string;
  fit: string;
  style: string;
  formality: 'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive';
  season: string[];
  isFavorite: boolean;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  errorMsg?: string;
}

const DEFAULT_SEASONS = ['Summer', 'All-Season'];

export function AddClothingModal({
  isOpen,
  onClose,
  onItemAdded,
  onItemsAdded,
}: AddClothingModalProps) {
  const [step, setStep] = useState<'choose' | 'camera' | 'analyzing' | 'review'>('choose');
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);
  const [analyzingIndex, setAnalyzingIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraSnapshots, setCameraSnapshots] = useState<string[]>([]);
  const [flashEffect, setFlashEffect] = useState(false);

  // Clean up camera stream
  const stopCameraStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setCameraSnapshots([]);
      setStagedItems([]);
      setStep('choose');
      setError('');
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, stopCameraStream]);

  // Start Camera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCameraStream();
    setError('');
    setStep('camera');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please select images from your gallery or files.');
      setStep('choose');
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture photo without closing camera (multi-photo access)
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Visual camera shutter flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 150);

    setCameraSnapshots((prev) => [...prev, dataUrl]);
  };

  const removeCameraSnapshot = (idxToRemove: number) => {
    setCameraSnapshots((prev) => prev.filter((_, i) => i !== idxToRemove));
  };

  const finishCameraCaptures = () => {
    if (cameraSnapshots.length === 0) return;
    stopCameraStream();

    const items: StagedItem[] = cameraSnapshots.map((dataUrl, idx) => ({
      id: `cam_${Date.now()}_${idx}`,
      imageUrl: dataUrl,
      fileName: `Camera Photo ${idx + 1}`,
      name: 'Wardrobe Piece',
      category: 'tops',
      subcategory: 'shirt',
      primaryColor: 'White',
      pattern: 'Solid',
      material: '100% Cotton',
      fit: 'Regular',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      season: [...DEFAULT_SEASONS],
      isFavorite: false,
      status: 'pending',
    }));

    setStagedItems(items);
    processBatchAI(items);
  };

  // Handle Multi-file upload from gallery / files
  const handleMultiFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setError('');

    // Check sizes
    const oversized = fileList.filter((f) => f.size > 15 * 1024 * 1024);
    if (oversized.length > 0) {
      setError('Some files are larger than 15MB. Please upload optimized images.');
    }

    const itemsToProcess: StagedItem[] = [];
    let loadedCount = 0;

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        itemsToProcess.push({
          id: `file_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
          imageUrl: base64,
          fileName: file.name,
          name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Wardrobe Piece',
          category: 'tops',
          subcategory: 'shirt',
          primaryColor: 'White',
          pattern: 'Solid',
          material: 'Cotton',
          fit: 'Regular',
          style: 'Smart Casual',
          formality: 'Smart Casual',
          season: [...DEFAULT_SEASONS],
          isFavorite: false,
          status: 'pending',
        });

        loadedCount++;
        if (loadedCount === fileList.length) {
          setStagedItems(itemsToProcess);
          processBatchAI(itemsToProcess);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Run AI Classification sequentially / batch with progress
  const processBatchAI = async (items: StagedItem[]) => {
    setStep('analyzing');
    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      setAnalyzingIndex(i);
      updated[i].status = 'analyzing';
      setStagedItems([...updated]);

      try {
        const res = await fetch('/api/wardrobe/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: updated[i].imageUrl,
            hint: updated[i].fileName,
          }),
        });

        const data = await res.json();
        if (data.success && data.classification) {
          const c = data.classification;
          updated[i] = {
            ...updated[i],
            name: c.name || updated[i].name,
            category: (c.category as MainCategory) || 'tops',
            subcategory: c.subcategory || 'shirt',
            primaryColor: c.primary_color || 'White',
            pattern: c.pattern || 'Solid',
            material: c.material || 'Cotton',
            fit: c.fit || 'Regular',
            style: c.style || 'Smart Casual',
            formality: c.formality || 'Smart Casual',
            season: c.season && c.season.length > 0 ? c.season : ['All-Season'],
            status: 'done',
          };
        } else {
          updated[i].status = 'done';
        }
      } catch (err: any) {
        console.warn('Item classification error:', err);
        updated[i].status = 'done'; // allow user to edit manually
      }

      setStagedItems([...updated]);
    }

    setActiveReviewIndex(0);
    setStep('review');
  };

  // Active item update in review
  const updateActiveItem = (field: keyof StagedItem, value: any) => {
    setStagedItems((prev) => {
      const next = [...prev];
      if (next[activeReviewIndex]) {
        next[activeReviewIndex] = {
          ...next[activeReviewIndex],
          [field]: value,
        };
      }
      return next;
    });
  };

  const removeStagedItem = (indexToRemove: number) => {
    setStagedItems((prev) => {
      const next = prev.filter((_, i) => i !== indexToRemove);
      if (next.length === 0) {
        setStep('choose');
      } else if (activeReviewIndex >= next.length) {
        setActiveReviewIndex(next.length - 1);
      }
      return next;
    });
  };

  const toggleSeasonForActive = (s: string) => {
    const current = stagedItems[activeReviewIndex]?.season || [];
    const next = current.includes(s)
      ? current.filter((item) => item !== s)
      : [...current, s];
    updateActiveItem('season', next);
  };

  // Save all items to Supabase
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedItems.length === 0) return;

    setIsSaving(true);
    setError('');

    try {
      const itemsToSave = stagedItems.map((item) => ({
        name: item.name || 'Wardrobe Piece',
        category: item.category,
        subcategory: item.subcategory,
        image_url: item.imageUrl,
        primary_color: item.primaryColor || 'White',
        pattern: item.pattern,
        material: item.material,
        fit: item.fit,
        style: item.style,
        formality: item.formality,
        season: item.season,
        is_favorite: item.isFavorite,
      }));

      const res = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave }),
      });

      const data = await res.json();
      if (data.success && data.items) {
        // Dispatch global event for live page refresh
        data.items.forEach((item: WardrobeItem) => {
          window.dispatchEvent(new CustomEvent('aureve:item-added', { detail: item }));
        });

        if (onItemsAdded) onItemsAdded(data.items);
        if (onItemAdded && data.items.length > 0) onItemAdded(data.items[0]);

        handleClose();
      } else {
        setError(data.error || 'Failed to save wardrobe pieces.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error saving to wardrobe.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopCameraStream();
    setStep('choose');
    setCameraSnapshots([]);
    setStagedItems([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const activeItem = stagedItems[activeReviewIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#FBF9F6] w-full max-w-3xl rounded-3xl border border-[#EBE5DB] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#EBE5DB] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18181B]" />
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
              Add to Wardrobe
            </h3>
            {stagedItems.length > 0 && step === 'review' && (
              <span className="bg-[#18181B] text-[#FAF8F5] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {stagedItems.length} {stagedItems.length === 1 ? 'Piece' : 'Pieces'}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#F4EFEA] text-[#7E6047] hover:text-[#18181B] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Choose Camera or Multi-Gallery Upload */}
          {step === 'choose' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h4 className="font-serif text-2xl font-semibold text-[#18181B]">
                  Add Your Clothes
                </h4>
                <p className="text-xs sm:text-sm text-[#7E6047]">
                  Snap multiple live photos or select multiple pictures directly from your gallery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Multi-photo Live Camera Option */}
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="p-6 rounded-2xl bg-white border-2 border-[#EBE5DB] hover:border-[#18181B] flex flex-col items-center justify-center text-center space-y-3 transition-all hover:shadow-md group active:scale-98"
                >
                  <div className="w-14 h-14 rounded-full bg-[#FAF8F5] group-hover:bg-[#18181B] text-[#18181B] group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-[#18181B]">
                      Multi-Photo Camera
                    </h5>
                    <p className="text-xs text-[#7E6047] mt-0.5">
                      Snap continuous photos of all your clothes
                    </p>
                  </div>
                </button>

                {/* 2. Multi-image Gallery / Files Option */}
                <label className="p-6 rounded-2xl bg-white border-2 border-[#EBE5DB] hover:border-[#18181B] flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all hover:shadow-md group active:scale-98">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultiFileUpload}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-full bg-[#FAF8F5] group-hover:bg-[#18181B] text-[#18181B] group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-[#18181B]">
                      Upload Multiple from Gallery
                    </h5>
                    <p className="text-xs text-[#7E6047] mt-0.5">
                      Select multiple photos at once from your device
                    </p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DB] rounded-2xl flex items-center space-x-3 text-xs text-[#5E4633]">
                <Sparkles className="w-5 h-5 text-[#9A7B5F] flex-shrink-0" />
                <p>
                  <strong>Batch AI Recognition:</strong> AUREVÉ automatically identifies categories (shirts, tees, kurtas, jeans, trousers, shoes, watches), fits (oversized, slim, regular), fabrics, and color harmonies across all selected items!
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Multi-Photo Camera Viewfinder */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden bg-black border-2 border-[#18181B] shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Flash effect */}
                {flashEffect && <div className="absolute inset-0 bg-white z-20 transition-opacity" />}

                {/* Viewfinder Overlays */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                    {cameraSnapshots.length} {cameraSnapshots.length === 1 ? 'photo snapped' : 'photos snapped'}
                  </span>
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black"
                    title="Flip camera"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Filmstrip of Snapped Photos */}
              {cameraSnapshots.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-2 max-w-sm mx-auto px-1">
                  {cameraSnapshots.map((snap, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-16 rounded-xl overflow-hidden border-2 border-[#18181B] flex-shrink-0 group"
                    >
                      <Image src={snap} alt={`Snap ${idx + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeCameraSnapshot(idx)}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 shadow-sm"
                        title="Delete photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Camera Shutter & Done Controls */}
              <div className="flex items-center justify-center space-x-6 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setStep('choose');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#7E6047] hover:text-[#18181B]"
                >
                  Cancel
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-4 border-white"
                  title="Take Photo"
                >
                  <Camera className="w-7 h-7 text-white" />
                </button>

                {/* Done Snapping Button */}
                {cameraSnapshots.length > 0 && (
                  <button
                    type="button"
                    onClick={finishCameraCaptures}
                    className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md flex items-center space-x-1.5"
                  >
                    <span>Analyze ({cameraSnapshots.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Batch AI Analyzing Animation */}
          {step === 'analyzing' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative w-36 h-48 rounded-3xl overflow-hidden border-2 border-[#18181B] shadow-2xl">
                {stagedItems[analyzingIndex]?.imageUrl && (
                  <Image
                    src={stagedItems[analyzingIndex].imageUrl}
                    alt="Scanning garment"
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 ai-scan-shimmer" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-[#18181B]">
                  <Sparkles className="w-5 h-5 text-[#9A7B5F] animate-spin" />
                  <h4 className="font-serif text-2xl font-semibold">
                    Recognizing Piece {analyzingIndex + 1} of {stagedItems.length}…
                  </h4>
                </div>
                <p className="text-xs text-[#7E6047] max-w-sm mx-auto">
                  Detecting garment silhouette, fabric texture, fit proportions, and color palette…
                </p>
              </div>

              {/* Progress Thumbnails */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-md pt-2">
                {stagedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`relative w-12 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === analyzingIndex
                        ? 'border-[#18181B] scale-110 shadow-md'
                        : item.status === 'done'
                        ? 'border-emerald-600 opacity-90'
                        : 'border-[#EBE5DB] opacity-40'
                    }`}
                  >
                    <Image src={item.imageUrl} alt={`Piece ${idx + 1}`} fill className="object-cover" />
                    {item.status === 'done' && (
                      <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Multi-Piece Review & Edit Form */}
          {step === 'review' && activeItem && (
            <form onSubmit={handleSaveAll} className="space-y-5">
              {/* Batch Carousel / Thumbnail Switcher */}
              {stagedItems.length > 1 && (
                <div className="bg-white p-3 rounded-2xl border border-[#EBE5DB] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#7E6047]">
                    <span className="font-semibold uppercase tracking-wider">
                      Reviewing Piece {activeReviewIndex + 1} of {stagedItems.length}
                    </span>
                    <span className="text-[11px]">Click piece to edit</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {stagedItems.map((item, idx) => {
                      const isActive = idx === activeReviewIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveReviewIndex(idx)}
                          className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                            isActive
                              ? 'border-[#18181B] ring-2 ring-[#18181B]/20 scale-105 shadow-md'
                              : 'border-[#EBE5DB] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] truncate px-1 py-0.5">
                            {item.category}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Item Form Details */}
              <div className="bg-white p-5 rounded-3xl border border-[#EBE5DB] space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Photo Thumbnail & Delete Button */}
                  <div className="relative w-32 h-40 rounded-2xl overflow-hidden border border-[#EBE5DB] bg-white flex-shrink-0 mx-auto sm:mx-0 shadow-sm group">
                    <Image
                      src={activeItem.imageUrl}
                      alt={activeItem.name}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeStagedItem(activeReviewIndex)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white shadow-sm transition-colors"
                      title="Remove this piece from upload"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Piece Name & Categories */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                        Piece Name *
                      </label>
                      <input
                        type="text"
                        value={activeItem.name}
                        onChange={(e) => updateActiveItem('name', e.target.value)}
                        required
                        placeholder="e.g. Navy Blue Textured Polo"
                        className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-semibold text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                          Category
                        </label>
                        <select
                          value={activeItem.category}
                          onChange={(e) => updateActiveItem('category', e.target.value as MainCategory)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        >
                          <option value="tops">Tops (Shirts / Tees / Kurtas)</option>
                          <option value="bottoms">Bottoms (Pants / Jeans / Chinos)</option>
                          <option value="layers">Layers (Jackets / Sweaters)</option>
                          <option value="footwear">Footwear (Shoes / Loafers)</option>
                          <option value="accessories">Accessories (Watches / Belts)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                          Subcategory
                        </label>
                        <input
                          type="text"
                          value={activeItem.subcategory}
                          onChange={(e) => updateActiveItem('subcategory', e.target.value)}
                          placeholder="t-shirt, shirt, jeans, loafers..."
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
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
                      value={activeItem.primaryColor}
                      onChange={(e) => updateActiveItem('primaryColor', e.target.value)}
                      required
                      placeholder="Navy Blue, Sky Blue..."
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Fit
                    </label>
                    <select
                      value={activeItem.fit}
                      onChange={(e) => updateActiveItem('fit', e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      <option value="Regular">Regular Fit</option>
                      <option value="Relaxed">Relaxed Fit</option>
                      <option value="Oversized">Oversized Fit</option>
                      <option value="Slim">Slim Fit</option>
                      <option value="Tailored">Tailored Fit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Fabric / Material
                    </label>
                    <input
                      type="text"
                      value={activeItem.material}
                      onChange={(e) => updateActiveItem('material', e.target.value)}
                      placeholder="100% Cotton, Linen..."
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Pattern
                    </label>
                    <select
                      value={activeItem.pattern}
                      onChange={(e) => updateActiveItem('pattern', e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      <option value="Solid">Solid</option>
                      <option value="Striped">Striped</option>
                      <option value="Checked">Checked</option>
                      <option value="Textured">Textured</option>
                      <option value="Printed">Printed</option>
                      <option value="Graphic">Graphic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Formality
                    </label>
                    <select
                      value={activeItem.formality}
                      onChange={(e) => updateActiveItem('formality', e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
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
                      value={activeItem.style}
                      onChange={(e) => updateActiveItem('style', e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      <option value="Smart Casual">Smart Casual</option>
                      <option value="Minimal">Minimal</option>
                      <option value="Modern Indian">Modern Indian</option>
                      <option value="Casual">Casual</option>
                      <option value="Streetwear">Streetwear</option>
                      <option value="Formal">Formal</option>
                    </select>
                  </div>
                </div>

                {/* Seasons */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                    Seasons / Weather
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Summer', 'Monsoon', 'Winter', 'All-Season', 'Festive'].map((s) => {
                      const active = activeItem.season?.includes(s);
                      return (
                        <button
                          type="button"
                          key={s}
                          onClick={() => toggleSeasonForActive(s)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            active
                              ? 'bg-[#18181B] text-white'
                              : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:bg-[#F4EFEA]'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('choose');
                      setStagedItems([]);
                    }}
                    className="text-xs font-semibold text-[#7E6047] hover:text-[#18181B]"
                  >
                    Start Over
                  </button>

                  {stagedItems.length > 1 && (
                    <div className="flex items-center space-x-1 pl-4 border-l border-[#EBE5DB]">
                      <button
                        type="button"
                        disabled={activeReviewIndex === 0}
                        onClick={() => setActiveReviewIndex((prev) => Math.max(0, prev - 1))}
                        className="p-1.5 rounded-lg border border-[#EBE5DB] text-[#5E4633] hover:bg-white disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-medium text-[#5E4633] px-1">
                        {activeReviewIndex + 1} / {stagedItems.length}
                      </span>
                      <button
                        type="button"
                        disabled={activeReviewIndex === stagedItems.length - 1}
                        onClick={() =>
                          setActiveReviewIndex((prev) => Math.min(stagedItems.length - 1, prev + 1))
                        }
                        className="p-1.5 rounded-lg border border-[#EBE5DB] text-[#5E4633] hover:bg-white disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-semibold text-[#7E6047] hover:text-[#18181B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md flex items-center space-x-1.5 active:scale-95"
                  >
                    {isSaving ? (
                      <span>Saving to Wardrobe…</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          {stagedItems.length > 1
                            ? `SAVE ALL (${stagedItems.length} PIECES)`
                            : 'SAVE TO WARDROBE'}
                        </span>
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
