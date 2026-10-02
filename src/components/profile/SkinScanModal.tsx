'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  Upload,
  Sun,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { SkinUndertoneCategory, SkinScanResult } from '@/lib/types';

interface SkinScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (undertone: SkinUndertoneCategory, confidence?: number) => void;
  currentUndertone?: string;
}

const SKIN_SWATCHES: Record<string, string> = {
  'Warm Olive': '#BCA07D',
  'Medium Wheatish': '#D2B18A',
  Dusky: '#8C6747',
  'Deep Tan': '#A57850',
  Fair: '#F0D5BE',
};

export default function SkinScanModal({
  isOpen,
  onClose,
  onApplyResult,
  currentUndertone,
}: SkinScanModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<SkinScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stop camera stream cleanly
  const stopCameraStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'user' | 'environment' = 'user') => {
    stopCameraStream();
    setIsInitializingCamera(true);
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setErrorMessage('Camera permission was not granted. Please allow camera access in your browser or upload a photo.');
      } else {
        setErrorMessage('Unable to access camera. You can upload a photo or select your undertone manually.');
      }
    } finally {
      setIsInitializingCamera(false);
    }
  }, [stopCameraStream]);

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setScanResult(null);
      setErrorMessage(null);
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, startCamera, facingMode, stopCameraStream]);

  // Flip camera (front/back on mobile)
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture current video frame to base64
  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // If front camera, mirror horizontally for natural preview
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  // Execute AI Skin undertone analysis
  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setCapturedImage(base64Image);

    try {
      const response = await fetch('/api/profile/scan-skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const result: SkinScanResult = await response.json();
      setScanResult(result);

      if (!result.success && result.rejection_reason) {
        setErrorMessage(result.rejection_reason);
      }
    } catch (err) {
      console.error('Skin scan API error:', err);
      setErrorMessage('Network connection error. Please try scanning again.');
      setScanResult({
        success: false,
        rejection_reason: 'Analysis interrupted. Please try again with good lighting.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // User snaps the frame
  const handleSnap = () => {
    const image = captureFrame();
    if (!image) {
      setErrorMessage('Could not capture frame from camera.');
      return;
    }
    analyzeImage(image);
  };

  // User uploads photo file fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        analyzeImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Retake / Scan again
  const handleRetake = () => {
    setCapturedImage(null);
    setScanResult(null);
    setErrorMessage(null);
    if (!stream) {
      startCamera(facingMode);
    }
  };

  // Apply result and close
  const handleUseResult = () => {
    if (scanResult?.skin_undertone) {
      onApplyResult(scanResult.skin_undertone, scanResult.confidence);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#18181B]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#18181B] border border-[#27272A] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] bg-[#18181B]/90">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#9A7B5F]/20 flex items-center justify-center text-[#9A7B5F]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-medium text-white tracking-tight">
                Skin Undertone Calibration
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#A1A1AA]">
                AUREVÉ Color-Contrast Analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanner Viewport / Frame */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[360px] overflow-hidden">
          {/* Live Video Preview (when not viewing a captured image) */}
          {!capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Oval Face Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Oval outline */}
                <div className="relative w-[210px] h-[270px] sm:w-[240px] h-[300px] rounded-[50%] border-2 border-[#9A7B5F]/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Subtle top/bottom crosshairs */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#9A7B5F]" />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#9A7B5F]" />
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[#9A7B5F]" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[#9A7B5F]" />
                </div>

                {/* Framing Tip Badge */}
                <div className="absolute bottom-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 flex items-center space-x-1.5 text-xs text-[#FAF8F5]">
                  <Sun className="w-3.5 h-3.5 text-[#9A7B5F]" />
                  <span>Align face inside the oval in natural light</span>
                </div>
              </div>
            </>
          )}

          {/* Static Captured Image (while analyzing or viewing results) */}
          {capturedImage && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured Face"
                className="w-full h-full object-cover max-h-[360px]"
              />

              {/* Loading State Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 p-4 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-[#9A7B5F] border-t-transparent animate-spin flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#9A7B5F]" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-serif text-sm font-medium text-white">
                      Analyzing Skin Undertone...
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] max-w-xs">
                      Evaluating color contrast, undertone warmth, and lighting calibration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera Permission Denied View */}
          {!capturedImage && cameraPermission === 'denied' && (
            <div className="absolute inset-0 bg-[#18181B] flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="font-serif text-base font-medium text-white">
                  Camera Access Needed
                </h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Allow camera permissions to let AUREVÉ calibrate your undertone, or upload a clear photo from your gallery.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 bg-[#FAF8F5] text-[#18181B] rounded-xl text-xs font-semibold hover:bg-white transition-all flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#27272A] text-white rounded-xl text-xs font-semibold hover:bg-[#3F3F46] transition-all flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden Canvas & File Input */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Scan Result Card (When Analysis Completes) */}
        {scanResult && !isAnalyzing && (
          <div className="p-5 border-t border-[#27272A] bg-[#1F1F23] space-y-4">
            {scanResult.success && scanResult.skin_undertone ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                      style={{
                        backgroundColor:
                          SKIN_SWATCHES[scanResult.skin_undertone] || '#D2B18A',
                      }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A7B5F]">
                      Analysis Complete
                    </span>
                  </div>
                  {scanResult.confidence && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#9A7B5F]/20 text-[#FAF8F5] border border-[#9A7B5F]/30">
                      {Math.round(scanResult.confidence * 100)}% Match
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-serif text-xl font-semibold text-white">
                    {scanResult.skin_undertone}
                  </h4>
                  {scanResult.undertone_nuance && (
                    <p className="text-xs text-[#D4D4D8] mt-0.5">
                      {scanResult.undertone_nuance}
                    </p>
                  )}
                </div>

                {scanResult.styling_advice && (
                  <div className="p-3 rounded-xl bg-[#27272A]/70 border border-white/5 text-[11px] text-[#A1A1AA] leading-relaxed">
                    <span className="text-white font-medium">Palette Tip: </span>
                    {scanResult.styling_advice}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleUseResult}
                    className="flex-1 py-2.5 bg-[#FAF8F5] text-[#18181B] rounded-xl text-xs font-semibold hover:bg-white transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Use This Result</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-4 py-2.5 bg-[#27272A] text-[#D4D4D8] rounded-xl text-xs font-semibold hover:bg-[#3F3F46] hover:text-white transition-all flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Scan Again</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <p className="font-medium text-white">Scan Inconclusive</p>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      {scanResult.rejection_reason ||
                        'Move to natural light and keep your face clearly centered.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 py-2.5 bg-[#FAF8F5] text-[#18181B] rounded-xl text-xs font-semibold hover:bg-white transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-[#27272A] text-[#D4D4D8] rounded-xl text-xs font-semibold hover:bg-[#3F3F46] hover:text-white transition-all"
                  >
                    Select Manually
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Controls (When Camera is Active & No Snap Yet) */}
        {!capturedImage && cameraPermission === 'granted' && (
          <div className="px-5 py-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between">
            {/* Upload fallback */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#3F3F46] transition-all flex items-center space-x-1.5 text-xs font-medium"
              title="Upload photo"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Primary Capture Button */}
            <button
              type="button"
              onClick={handleSnap}
              disabled={isInitializingCamera}
              className="px-6 py-3 bg-[#FAF8F5] hover:bg-white text-[#18181B] rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-4 h-4 text-[#9A7B5F]" />
              <span>Capture & Analyze</span>
            </button>

            {/* Flip camera on mobile */}
            <button
              type="button"
              onClick={handleFlipCamera}
              className="p-2.5 rounded-xl bg-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#3F3F46] transition-all flex items-center space-x-1.5 text-xs font-medium"
              title="Flip camera"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Flip</span>
            </button>
          </div>
        )}

        {/* Privacy Note Footer */}
        <div className="px-5 py-2.5 bg-black/50 border-t border-white/5 flex items-center justify-between text-[10px] text-[#71717A]">
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-[#9A7B5F]" />
            <span>Privacy-First: Frames are analyzed ephemerally and never saved.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white underline underline-offset-2"
          >
            Manual input
          </button>
        </div>
      </div>
    </div>
  );
}
