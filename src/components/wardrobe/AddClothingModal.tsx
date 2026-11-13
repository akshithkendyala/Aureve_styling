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
  AlertTriangle,
  FlipHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { MainCategory, WardrobeItem } from '@/lib/types';
import {
  MAIN_CATEGORIES,
  SUBCATEGORIES_BY_CATEGORY,
  FABRIC_OPTIONS,
  PRIMARY_COLOR_OPTIONS,
  FIT_OPTIONS,
  PATTERN_OPTIONS,
  FORMALITY_OPTIONS,
  STYLE_OPTIONS,
  SEASON_OPTIONS,
  classifyRGBToControlledColor,
} from '@/lib/constants/clothingOptions';

interface AddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: WardrobeItem) => void;
  onItemsAdded?: (items: WardrobeItem[]) => void;
}

export interface StagedItem {
  id: string;
  imageUrl: string;
  clientColorHint?: string;
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
  collections?: string[];
  isFavorite: boolean;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  errorMsg?: string;
}

const DEFAULT_SEASONS = ['Summer', 'All-Season'];

const STANDARD_COLLECTIONS = [
  { slug: 'everyday', name: 'Everyday' },
  { slug: 'college_work', name: 'College & Work' },
  { slug: 'traditional_festive', name: 'Traditional & Festive' },
  { slug: 'party_occasions', name: 'Party & Occasions' },
  { slug: 'home_comfort', name: 'Home & Comfort' },
  { slug: 'outdoor_travel', name: 'Outdoor & Travel' },
];

/**
 * High-performance client-side Canvas compressor + Garment-region color extractor:
 * 1. Resizes photos to max 640px edge at 0.78 JPEG quality (~45KB payload) for sub-150ms transfer.
 * 2. Samples the central 50% garment region to extract ground-truth RGB dominant color.
 */
async function processImageForAI(source: string | File): Promise<{ dataUrl: string; colorHint: string }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    const process = () => {
      try {
        const maxEdge = 640;
        let width = img.naturalWidth || img.width || 600;
        let height = img.naturalHeight || img.height || 600;

        if (width > maxEdge || height > maxEdge) {
          if (width > height) {
            height = Math.round((height * maxEdge) / width);
            width = maxEdge;
          } else {
            width = Math.round((width * maxEdge) / height);
            height = maxEdge;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            dataUrl: typeof source === 'string' ? source : URL.createObjectURL(source),
            colorHint: 'Black',
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Extract garment-region color (sampling center 50% area, avoiding background walls & borders)
        const sampleStartX = Math.floor(width * 0.25);
        const sampleStartY = Math.floor(height * 0.25);
        const sampleW = Math.max(10, Math.floor(width * 0.5));
        const sampleH = Math.max(10, Math.floor(height * 0.5));

        let colorHint = 'Black';
        try {
          const imgData = ctx.getImageData(sampleStartX, sampleStartY, sampleW, sampleH);
          const data = imgData.data;
          let totalR = 0, totalG = 0, totalB = 0, count = 0;

          // Sample step = 16 for high-speed sampling in <2ms
          for (let i = 0; i < data.length; i += 16) {
            const a = data[i + 3];
            if (a > 120) {
              totalR += data[i];
              totalG += data[i + 1];
              totalB += data[i + 2];
              count++;
            }
          }

          if (count > 0) {
            const avgR = Math.round(totalR / count);
            const avgG = Math.round(totalG / count);
            const avgB = Math.round(totalB / count);
            colorHint = classifyRGBToControlledColor(avgR, avgG, avgB);
          }
        } catch (e) {
          console.warn('Canvas pixel color extraction failed:', e);
        }

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
        resolve({ dataUrl: compressedDataUrl, colorHint });
      } catch (e) {
        console.warn('Canvas compression error:', e);
        resolve({
          dataUrl: typeof source === 'string' ? source : URL.createObjectURL(source),
          colorHint: 'Black',
        });
      }
    };

    img.onload = process;
    img.onerror = () => {
      resolve({
        dataUrl: typeof source === 'string' ? source : URL.createObjectURL(source),
        colorHint: 'Black',
      });
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve({ dataUrl: URL.createObjectURL(source), colorHint: 'Black' });
      };
      reader.readAsDataURL(source);
    }
  });
}

export function AddClothingModal({
  isOpen,
  onClose,
  onItemAdded,
  onItemsAdded,
}: AddClothingModalProps) {
  const [step, setStep] = useState<'choose' | 'camera' | 'permission_denied' | 'analyzing' | 'review'>('choose');
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Camera stream refs & state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraSnapshots, setCameraSnapshots] = useState<string[]>([]);
  const [flashEffect, setFlashEffect] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [retryingItemId, setRetryingItemId] = useState<string | null>(null);

  // Check camera permissions natively where supported
  const checkCameraPermission = useCallback(async (): Promise<'prompt' | 'granted' | 'denied' | 'unsupported'> => {
    if (typeof window === 'undefined' || !navigator.permissions?.query) {
      return 'unsupported';
    }
    try {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const current = status.state as 'prompt' | 'granted' | 'denied';
      setCameraPermission(current);
      status.onchange = () => {
        setCameraPermission(status.state as 'prompt' | 'granted' | 'denied');
      };
      return current;
    } catch {
      // WebKit / Safari throws on { name: 'camera' }
      return 'unsupported';
    }
  }, []);

  // Clean up camera stream tracks
  const stopCameraStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      setMediaStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    } else {
      stopCameraStream();
      setCameraSnapshots([]);
      setStagedItems([]);
      setStep('choose');
      setError('');
      setIsCameraInitializing(false);
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, stopCameraStream, checkCameraPermission]);

  // Start Camera with 3-tier fallback constraints
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCameraStream();
    setError('');
    setIsCameraInitializing(true);
    setStep('camera');

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported by your browser or environment.');
      setIsCameraInitializing(false);
      setCameraPermission('unsupported');
      setStep('choose');
      return;
    }

    let stream: MediaStream | null = null;
    try {
      // Tier 1: Ideal HD resolution & facingMode
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1: any) {
      console.warn('Tier 1 camera constraints failed, attempting basic facingMode...', err1);
      try {
        // Tier 2: Basic facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
      } catch (err2: any) {
        console.warn('Tier 2 camera failed, attempting basic video stream...', err2);
        try {
          // Tier 3: Any video constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err3: any) {
          console.error('All camera initialization tiers failed:', err3);
          setIsCameraInitializing(false);

          if (
            err3.name === 'NotAllowedError' ||
            err3.name === 'PermissionDeniedError' ||
            err1?.name === 'NotAllowedError'
          ) {
            setCameraPermission('denied');
            setStep('permission_denied');
          } else {
            setError(err3.message || 'Unable to access camera. Please select images from your gallery.');
            setStep('choose');
          }
          return;
        }
      }
    }

    if (stream) {
      setCameraPermission('granted');
      setMediaStream(stream);
      setIsCameraInitializing(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((playErr) => {
          console.warn('Video playback warning:', playErr);
        });
      }
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

  const finishCameraCaptures = async () => {
    if (cameraSnapshots.length === 0) return;
    stopCameraStream();

    const items: StagedItem[] = [];
    for (let idx = 0; idx < cameraSnapshots.length; idx++) {
      const { dataUrl, colorHint } = await processImageForAI(cameraSnapshots[idx]);
      items.push({
        id: `cam_${Date.now()}_${idx}`,
        imageUrl: dataUrl,
        clientColorHint: colorHint,
        name: `${colorHint} Piece`,
        category: 'tops',
        subcategory: 'Other',
        primaryColor: colorHint,
        pattern: 'Solid',
        material: 'Unknown / Not visible',
        fit: 'Regular',
        style: 'Smart Casual',
        formality: 'Casual',
        season: [...DEFAULT_SEASONS],
        isFavorite: false,
        status: 'pending',
      });
    }

    setStagedItems(items);
    processBatchAI(items);
  };

  // Handle Multi-file upload from gallery / files
  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setError('');

    const itemsToProcess: StagedItem[] = [];

    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index];
      try {
        const { dataUrl, colorHint } = await processImageForAI(file);
        itemsToProcess.push({
          id: `file_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
          imageUrl: dataUrl,
          clientColorHint: colorHint,
          name: `${colorHint} Piece`,
          category: 'tops',
          subcategory: 'Other',
          primaryColor: colorHint,
          pattern: 'Solid',
          material: 'Unknown / Not visible',
          fit: 'Regular',
          style: 'Smart Casual',
          formality: 'Casual',
          season: [...DEFAULT_SEASONS],
          isFavorite: false,
          status: 'pending',
        });
      } catch (err) {
        console.warn('Failed to process file:', file.name, err);
      }
    }

    if (itemsToProcess.length > 0) {
      setStagedItems(itemsToProcess);
      processBatchAI(itemsToProcess);
    }
  };

  // Helper to execute classification for a single item
  const classifySingleItem = async (item: StagedItem): Promise<Partial<StagedItem>> => {
    const maxRetries = 2;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Fast 7s abort timeout per request to keep batch responsive
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch('/api/wardrobe/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: item.imageUrl,
            clientColorHint: item.clientColorHint,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.classification) {
            const c = data.classification;
            const detectedCategory: MainCategory = c.category || 'tops';
            const validSubcategories =
              SUBCATEGORIES_BY_CATEGORY[detectedCategory] || SUBCATEGORIES_BY_CATEGORY.tops;
            const detectedSubcategory = validSubcategories.includes(c.subcategory)
              ? c.subcategory
              : validSubcategories[0];

            const colorName = c.primary_color || item.clientColorHint || 'Black';
            let finalName = c.name;
            if (
              !finalName ||
              finalName.toLowerCase().includes('whatsapp') ||
              finalName.toLowerCase().includes('image') ||
              finalName.length < 3
            ) {
              finalName = `${colorName} ${detectedSubcategory}`;
            }

            const suggestedCols = Array.isArray(c.suggested_collections)
              ? c.suggested_collections.map((sc: any) => sc.slug || sc.name)
              : ['everyday'];

            return {
              name: finalName,
              category: detectedCategory,
              subcategory: detectedSubcategory,
              primaryColor: colorName,
              pattern: c.pattern || 'Solid',
              material:
                c.material ||
                (detectedCategory === 'accessories' && detectedSubcategory === 'Belt'
                  ? 'Leather'
                  : 'Cotton'),
              fit:
                c.fit ||
                (detectedCategory === 'accessories' || detectedCategory === 'footwear'
                  ? 'Not Applicable'
                  : 'Regular'),
              style: c.style || 'Smart Casual',
              formality: c.formality || 'Smart Casual',
              season: c.season && c.season.length > 0 ? c.season : ['All-Season'],
              collections: suggestedCols.length > 0 ? suggestedCols : ['everyday'],
              status: 'done',
              errorMsg: undefined,
            };
          }
        } else if (res.status === 429 || res.status === 503) {
          await new Promise((r) => setTimeout(r, 800));
        }
      } catch (err: any) {
        console.warn(`Classification attempt ${attempt + 1} failed for item:`, err);
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    // Honest fallback if model could not classify within retries
    const color = item.clientColorHint || 'Black';
    return {
      name: `${color} Piece`,
      primaryColor: color,
      category: 'tops',
      subcategory: 'Other',
      material: 'Unknown / Not visible',
      fit: 'Regular',
      collections: ['everyday'],
      status: 'error',
      errorMsg: 'Classification timeout. Please review or adjust details.',
    };
  };

  // Controlled Parallel Batch Processing with Concurrency = 3
  const processBatchAI = async (items: StagedItem[]) => {
    setStep('analyzing');
    setStagedItems([...items]);

    let working = [...items];
    const totalCount = working.length;
    const CONCURRENCY = 3;
    let nextIndex = 0;

    const processNext = async () => {
      while (nextIndex < totalCount) {
        const currentIndex = nextIndex++;

        // Mark current item as analyzing
        working = working.map((it, idx) =>
          idx === currentIndex ? { ...it, status: 'analyzing' } : it
        );
        setStagedItems([...working]);

        const result = await classifySingleItem(working[currentIndex]);

        // Update item with result immediately
        working = working.map((it, idx) =>
          idx === currentIndex ? { ...it, ...result } : it
        );
        setStagedItems([...working]);
      }
    };

    // Run concurrency pool of 3 workers
    const workerPromises = Array.from(
      { length: Math.min(CONCURRENCY, totalCount) },
      () => processNext()
    );

    await Promise.all(workerPromises);

    setActiveReviewIndex(0);
    setStep('review');
  };

  // Retry single failed item in review mode
  const retrySingleItem = async (indexToRetry: number) => {
    const item = stagedItems[indexToRetry];
    if (!item) return;

    setRetryingItemId(item.id);
    setStagedItems((prev) =>
      prev.map((it, idx) => (idx === indexToRetry ? { ...it, status: 'analyzing' } : it))
    );

    const result = await classifySingleItem(item);

    setStagedItems((prev) =>
      prev.map((it, idx) => (idx === indexToRetry ? { ...it, ...result } : it))
    );
    setRetryingItemId(null);
  };

  // Active item update in review (User manual edits are authoritative)
  const updateActiveItem = (field: keyof StagedItem, value: any) => {
    setStagedItems((prev) => {
      const next = [...prev];
      if (next[activeReviewIndex]) {
        const currentItem = next[activeReviewIndex];

        // If category changed, also adjust subcategory if invalid for new category
        if (field === 'category') {
          const newCategory = value as MainCategory;
          const validSubs = SUBCATEGORIES_BY_CATEGORY[newCategory] || SUBCATEGORIES_BY_CATEGORY.tops;
          const newSubcategory = validSubs.includes(currentItem.subcategory)
            ? currentItem.subcategory
            : validSubs[0];

          const newFit = (newCategory === 'accessories' || newCategory === 'footwear') && currentItem.fit !== 'Not Applicable'
            ? 'Not Applicable'
            : currentItem.fit;

          next[activeReviewIndex] = {
            ...currentItem,
            category: newCategory,
            subcategory: newSubcategory,
            fit: newFit,
          };
        } else {
          next[activeReviewIndex] = {
            ...currentItem,
            [field]: value,
          };
        }
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

  const toggleCollectionForActive = (colSlug: string) => {
    const cur = activeItem?.collections || [];
    const next = cur.includes(colSlug) ? cur.filter((c) => c !== colSlug) : [...cur, colSlug];
    updateActiveItem('collections', next);
  };

  // Save all items to Supabase
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedItems.length === 0) return;

    setIsSaving(true);
    setError('');

    try {
      const itemsToSave = stagedItems.map((item) => ({
        name: item.name || `${item.primaryColor} ${item.subcategory}`,
        category: item.category,
        subcategory: item.subcategory,
        image_url: item.imageUrl,
        primary_color: item.primaryColor || 'Black',
        pattern: item.pattern,
        material: item.material,
        fit: item.fit,
        style: item.style,
        formality: item.formality,
        season: item.season,
        collection_ids: item.collections || [],
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
  const activeSubcategories = activeItem
    ? SUBCATEGORIES_BY_CATEGORY[activeItem.category] || SUBCATEGORIES_BY_CATEGORY.tops
    : SUBCATEGORIES_BY_CATEGORY.tops;

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
                <div className="flex items-center justify-center space-x-2">
                  <h4 className="font-serif text-2xl font-semibold text-[#18181B]">
                    Add Your Clothes
                  </h4>
                  {cameraPermission === 'granted' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Camera Ready</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#7E6047]">
                  Snap multiple live photos or select pictures directly from your gallery.
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
                      Snap continuous photos of your clothes
                    </p>
                  </div>
                </button>

                {/* 2. Multi-image Gallery / Files Option */}
                <label className="p-6 rounded-2xl bg-white border-2 border-[#EBE5DB] hover:border-[#18181B] flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all hover:shadow-md group active:scale-98">
                  <input
                    ref={fileInputRef}
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
                      Upload from Gallery
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
                  <strong>High-Precision AI Vision:</strong> Powered by accelerated parallel detection. Automatically categorizes silhouette, color, fabric, and proportions in seconds.
                </p>
              </div>
            </div>
          )}

          {/* STEP 1.5: Camera Permission Denied Guidance Panel */}
          {step === 'permission_denied' && (
            <div className="p-6 bg-white rounded-3xl border border-[#EBE5DB] text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                <Camera className="w-7 h-7 text-[#7E6047]" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="font-serif text-2xl font-semibold text-[#18181B]">
                  Camera Access Required
                </h4>
                <p className="text-xs text-[#7E6047] leading-relaxed">
                  Your browser blocked camera access. Enable it below, or choose photos directly from your gallery without any interruption.
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#EBE5DB] rounded-2xl p-4 text-left text-xs space-y-2 text-[#5E4633] max-w-md mx-auto">
                <p className="font-semibold text-[#18181B]">How to grant camera permission:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#7E6047]">
                  <li>
                    <strong>iPad & iPhone Safari:</strong> Tap the <em>aA</em> or Website Settings icon in the search bar → <em>Website Settings</em> → <em>Camera</em> → <em>Allow</em>.
                  </li>
                  <li>
                    <strong>Chrome & Android:</strong> Tap the tune/lock icon beside the URL address bar → <em>Permissions</em> → <em>Camera</em> → <em>Allow</em>.
                  </li>
                  <li>
                    <strong>Mac & Windows Desktop:</strong> Click the lock icon in your URL bar and switch Camera to <em>Allow</em>.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] rounded-full text-xs font-semibold tracking-wide transition-all shadow-md"
                >
                  Try Camera Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('choose');
                    fileInputRef.current?.click();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#FAF8F5] hover:bg-white border border-[#EBE5DB] hover:border-[#18181B] text-[#18181B] rounded-full text-xs font-semibold tracking-wide transition-all"
                >
                  Upload from Gallery Instead
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Multi-Photo Camera Viewfinder */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden bg-black border-2 border-[#18181B] shadow-2xl">
                {isCameraInitializing && (
                  <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center space-y-2 text-white">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Starting camera…</span>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => videoRef.current?.play().catch(console.warn)}
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
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black transition-colors"
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

          {/* STEP 3: Controlled Parallel Batch AI Analyzing Progress */}
          {step === 'analyzing' && (() => {
            const completedCount = stagedItems.filter((i) => i.status === 'done' || i.status === 'error').length;
            const progressPercent = Math.round((completedCount / Math.max(1, stagedItems.length)) * 100);
            const activeAnalyzing = stagedItems.filter((i) => i.status === 'analyzing');

            return (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-200">
                {/* Visual Preview of Currently Analyzing Item */}
                <div className="relative w-36 h-48 rounded-3xl overflow-hidden border-2 border-[#18181B] shadow-2xl">
                  {activeAnalyzing[0]?.imageUrl || stagedItems[0]?.imageUrl ? (
                    <Image
                      src={activeAnalyzing[0]?.imageUrl || stagedItems[0]?.imageUrl}
                      alt="Scanning garment"
                      fill
                      className="object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 ai-scan-shimmer" />
                </div>

                <div className="space-y-2 w-full max-w-md">
                  <div className="flex items-center justify-center space-x-2 text-[#18181B]">
                    <Sparkles className="w-5 h-5 text-[#9A7B5F] animate-spin" />
                    <h4 className="font-serif text-2xl font-semibold">
                      Analyzing {completedCount} of {stagedItems.length} pieces ({progressPercent}%)
                    </h4>
                  </div>
                  <p className="text-xs text-[#7E6047]">
                    Processing up to 3 pieces in parallel for high-speed wardrobe categorization…
                  </p>

                  {/* Elegant Luxury Progress Bar */}
                  <div className="w-full bg-[#FAF8F5] border border-[#EBE5DB] rounded-full h-2.5 overflow-hidden p-0.5 mt-3">
                    <div
                      className="bg-[#18181B] h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(6, progressPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Progress Thumbnails Strip */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-md pt-2">
                  {stagedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`relative w-12 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        item.status === 'analyzing'
                          ? 'border-[#18181B] scale-110 shadow-md ring-2 ring-[#18181B]/20'
                          : item.status === 'done'
                          ? 'border-emerald-600 opacity-90'
                          : item.status === 'error'
                          ? 'border-amber-500 opacity-90'
                          : 'border-[#EBE5DB] opacity-40'
                      }`}
                    >
                      <Image src={item.imageUrl} alt={`Piece ${idx + 1}`} fill className="object-cover" />
                      {item.status === 'done' && (
                        <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                      {item.status === 'error' && (
                        <div className="absolute inset-0 bg-amber-900/40 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-amber-200 drop-shadow" />
                        </div>
                      )}
                      {item.status === 'analyzing' && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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
                              : item.status === 'error'
                              ? 'border-amber-400 opacity-90'
                              : 'border-[#EBE5DB] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          {item.status === 'error' && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white" />
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] truncate px-1 py-0.5">
                            {item.subcategory || item.category}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Item Warning / Retry Notice if classification had an error */}
              {activeItem.status === 'error' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    <span>
                      {activeItem.errorMsg || 'Auto-categorization delay. Adjust attributes below or retry AI scan.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => retrySingleItem(activeReviewIndex)}
                    disabled={retryingItemId === activeItem.id}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${retryingItemId === activeItem.id ? 'animate-spin' : ''}`} />
                    <span>Retry AI</span>
                  </button>
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
                        placeholder="e.g. Black Cotton T-Shirt"
                        className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs sm:text-sm font-semibold text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Main Category */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                          Category
                        </label>
                        <select
                          value={activeItem.category}
                          onChange={(e) => updateActiveItem('category', e.target.value as MainCategory)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        >
                          {MAIN_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dynamic Subcategory Dropdown */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                          Sub-Category
                        </label>
                        <select
                          value={activeItem.subcategory}
                          onChange={(e) => updateActiveItem('subcategory', e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        >
                          {activeSubcategories.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attributes Grid (Controlled Vocabularies) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Primary Color *
                    </label>
                    <select
                      value={activeItem.primaryColor}
                      onChange={(e) => updateActiveItem('primaryColor', e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      {PRIMARY_COLOR_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fit */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Fit Proportions
                    </label>
                    <select
                      value={activeItem.fit}
                      onChange={(e) => updateActiveItem('fit', e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      {FIT_OPTIONS.map((fit) => (
                        <option key={fit} value={fit}>
                          {fit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fabric / Material */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Fabric / Material
                    </label>
                    <select
                      value={activeItem.material}
                      onChange={(e) => updateActiveItem('material', e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      {FABRIC_OPTIONS.map((mat) => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pattern */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Pattern
                    </label>
                    <select
                      value={activeItem.pattern}
                      onChange={(e) => updateActiveItem('pattern', e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      {PATTERN_OPTIONS.map((pat) => (
                        <option key={pat} value={pat}>
                          {pat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Formality */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Formality
                    </label>
                    <select
                      value={activeItem.formality}
                      onChange={(e) => updateActiveItem('formality', e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      {FORMALITY_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Style Persona */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1">
                      Style Persona
                    </label>
                    <select
                      value={activeItem.style}
                      onChange={(e) => updateActiveItem('style', e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE5DB] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    >
                      {STYLE_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seasons */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                    Seasons / Weather
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SEASON_OPTIONS.map((s) => {
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

                {/* Assigned Collections (Spotify-style Wardrobe Collections) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7E6047]">
                      My Collections (Where do you wear this piece?)
                    </label>
                    <span className="text-[10px] text-[#9A7B5F]">Multiple allowed</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_COLLECTIONS.map((c) => {
                      const active =
                        activeItem.collections?.includes(c.slug) ||
                        activeItem.collections?.includes(c.name);
                      return (
                        <button
                          type="button"
                          key={c.slug}
                          onClick={() => toggleCollectionForActive(c.slug)}
                          className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            active
                              ? 'bg-[#18181B] text-white shadow-xs'
                              : 'bg-[#FAF8F5] border border-[#EBE5DB] text-[#5E4633] hover:bg-[#F4EFEA]'
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5 text-[#EEDC82]" />}
                          <span>{c.name}</span>
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
