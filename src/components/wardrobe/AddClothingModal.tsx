'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Upload,
  Sparkles,
  Check,
  Camera,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  FlipHorizontal,
  Video,
} from 'lucide-react';
import { MainCategory, WardrobeItem } from '@/lib/types';

interface AddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: WardrobeItem) => void;
}

export function AddClothingModal({ isOpen, onClose, onItemAdded }: AddClothingModalProps) {
  const [step, setStep] = useState<'choose' | 'camera' | 'analyzing' | 'review'>('choose');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraReady, setIsCameraReady] = useState(false);

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

  // Camera stream stop handler
  const stopCameraStream = React.useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      setIsCameraReady(false);
    }
  }, [mediaStream]);

  // Clean up camera stream on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, stopCameraStream]);

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
        setIsCameraReady(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Unable to access device camera. Please upload an image from your files/gallery.');
      setStep('choose');
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

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

    stopCameraStream();
    setImageUrl(dataUrl);
    triggerAIClassification(dataUrl, 'Captured with Camera');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setError('Image file is too large. Please select a photo under 12MB.');
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
        setName('Wardrobe Garment');
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
    stopCameraStream();
    setStep('choose');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FBF9F6] w-full max-w-2xl rounded-3xl border border-[#EBE5DB] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#EBE5DB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18181B]" />
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
              Add Piece to Wardrobe
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
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Choose Camera or Gallery / Files */}
          {step === 'choose' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h4 className="font-serif text-2xl font-semibold text-[#18181B]">
                  How would you like to add your clothes?
                </h4>
                <p className="text-xs sm:text-sm text-[#7E6047]">
                  Snap a live photo with your camera or upload directly from your phone gallery / computer files.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Live Camera Option */}
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
                      Take Live Photo
                    </h5>
                    <p className="text-xs text-[#7E6047] mt-0.5">
                      Use your phone or laptop camera
                    </p>
                  </div>
                </button>

                {/* 2. File / Gallery Upload Option */}
                <label className="p-6 rounded-2xl bg-white border-2 border-[#EBE5DB] hover:border-[#18181B] flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all hover:shadow-md group active:scale-98">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-full bg-[#FAF8F5] group-hover:bg-[#18181B] text-[#18181B] group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-[#18181B]">
                      Choose from Gallery / Files
                    </h5>
                    <p className="text-xs text-[#7E6047] mt-0.5">
                      Select pictures saved on your device
                    </p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DB] rounded-2xl flex items-center space-x-3 text-xs text-[#5E4633]">
                <Sparkles className="w-5 h-5 text-[#9A7B5F] flex-shrink-0" />
                <p>
                  AUREVÉ AI automatically recognizes whether it is a t-shirt, shirt, polo, jeans, chinos, shoes, or watch, including its fit (Oversized, Relaxed, Slim), fabric texture, and exact color!
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Live Camera Viewfinder */}
          {step === 'camera' && (
            <div className="space-y-4 text-center">
              <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden bg-black border-2 border-[#18181B] shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Top Viewfinder Overlay */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    Position Garment in View
                  </span>
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="pointer-events-auto p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black"
                    title="Flip camera"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-center space-x-4 pt-2">
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

                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-4 border-white"
                  title="Capture Photo"
                >
                  <Camera className="w-7 h-7 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI Analyzing Progress */}
          {step === 'analyzing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-36 h-48 rounded-3xl overflow-hidden border-2 border-[#18181B] shadow-2xl">
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
                  <Sparkles className="w-5 h-5 text-[#9A7B5F] animate-spin" />
                  <h4 className="font-serif text-2xl font-semibold">
                    Recognizing Your Garment…
                  </h4>
                </div>
                <p className="text-xs text-[#7E6047] max-w-sm">
                  Detecting silhouette, t-shirt vs. shirt, relaxed/oversized fit, fabric, and exact Indian color tone…
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Confirm AI Detected Information */}
          {step === 'review' && (
            <form onSubmit={handleSaveToWardrobe} className="space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Photo Thumbnail */}
                <div className="relative w-32 h-40 rounded-2xl overflow-hidden border border-[#EBE5DB] bg-white flex-shrink-0 mx-auto sm:mx-0 shadow-sm">
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
                      AI Detected Piece Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Olive Green Relaxed Overshirt"
                      className="w-full px-3.5 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-semibold text-[#18181B] focus:outline-none focus:border-[#18181B]"
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
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        placeholder="t-shirt, shirt, jeans, loafers..."
                        className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Attributes Grid */}
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
                    placeholder="Navy Blue, Sky Blue, Olive..."
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                    Detected Fit
                  </label>
                  <select
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
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
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="100% Cotton, Pure Linen..."
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
                    <option value="Graphic">Graphic</option>
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
                    <option value="Formal">Formal</option>
                  </select>
                </div>
              </div>

              {/* Suitable Weather */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-2">
                  Suitable Weather & Seasons
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
                  onClick={() => setStep('choose')}
                  className="text-xs font-semibold text-[#7E6047] hover:text-[#18181B] flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake / Change Photo</span>
                </button>

                <div className="flex items-center space-x-3">
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
                    className="bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md flex items-center space-x-1.5"
                  >
                    {isSaving ? (
                      <span>Saving to Wardrobe…</span>
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
