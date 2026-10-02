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
  User,
  Shield,
  Layers,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { BodyBuildCategory, BodyScanResult } from '@/lib/types';

interface BodyScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (build: BodyBuildCategory, confidence?: number) => void;
  currentBuild?: string;
}

export default function BodyScanModal({
  isOpen,
  onClose,
  onApplyResult,
  currentBuild,
}: BodyScanModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<BodyScanResult | null>(null);
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
        setErrorMessage('Unable to access camera. You can upload a full-body photo or select your build manually.');
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

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  // Execute AI Full-Body Silhouette analysis
  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setCapturedImage(base64Image);

    try {
      const response = await fetch('/api/profile/scan-body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const result: BodyScanResult = await response.json();
      setScanResult(result);

      if (!result.success && result.rejection_reason) {
        setErrorMessage(result.rejection_reason);
      }
    } catch (err) {
      console.error('Body scan API error:', err);
      setErrorMessage('Network connection error. Please try scanning again.');
      setScanResult({
        success: false,
        rejection_reason: 'Analysis interrupted. Please try again with full-body framing.',
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
    if (scanResult?.body_build) {
      onApplyResult(scanResult.body_build, scanResult.confidence);
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
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-medium text-white tracking-tight">
                Body Build & Silhouette Scan
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#A1A1AA]">
                AUREVÉ Proportion & Drape Alignment
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

        {/* Scanner Viewport / Full-Body Frame */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] sm:min-h-[400px] overflow-hidden">
          {/* Live Video Preview */}
          {!capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Full-Body Silhouette Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Full-Height Framing Box */}
                <div className="relative w-[180px] sm:w-[220px] h-[82%] rounded-3xl border-2 border-[#9A7B5F]/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex flex-col justify-between p-3">
                  {/* Head Marker */}
                  <div className="w-full flex items-center justify-between border-b border-dashed border-[#9A7B5F]/40 pb-1 text-[9px] text-[#FAF8F5]/70 font-semibold tracking-wider uppercase">
                    <span>Head</span>
                    <span className="w-2 h-0.5 bg-[#9A7B5F]" />
                  </div>

                  {/* Shoulder / Chest Marker */}
                  <div className="w-full flex items-center justify-between border-b border-dashed border-[#9A7B5F]/30 pb-1 text-[9px] text-[#FAF8F5]/50 tracking-wider uppercase">
                    <span>Shoulders</span>
                    <span className="w-2 h-0.5 bg-[#9A7B5F]" />
                  </div>

                  {/* Feet Marker */}
                  <div className="w-full flex items-center justify-between border-t border-dashed border-[#9A7B5F]/40 pt-1 text-[9px] text-[#FAF8F5]/70 font-semibold tracking-wider uppercase">
                    <span>Feet</span>
                    <span className="w-2 h-0.5 bg-[#9A7B5F]" />
                  </div>
                </div>

                {/* Distance Badge */}
                <div className="absolute bottom-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 flex items-center space-x-1.5 text-xs text-[#FAF8F5]">
                  <Maximize2 className="w-3.5 h-3.5 text-[#9A7B5F]" />
                  <span>Step back ~2–3m so full silhouette is visible</span>
                </div>
              </div>
            </>
          )}

          {/* Static Captured Image (while analyzing or viewing results) */}
          {capturedImage && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured Silhouette"
                className="w-full h-full object-cover max-h-[400px]"
              />

              {/* Loading State Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 p-4 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-[#9A7B5F] border-t-transparent animate-spin flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#9A7B5F]" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-serif text-sm font-medium text-white">
                      Analyzing Silhouette Proportions...
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] max-w-xs">
                      Evaluating shoulder-to-hip ratio, silhouette balance, and drape cut alignment.
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
                  Allow camera permissions to analyze your silhouette, or upload a full-body photo from your gallery.
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
                  <span>Upload Full-Body Photo</span>
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
            {scanResult.success && scanResult.body_build ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#9A7B5F]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A7B5F]">
                      Silhouette Analysis Complete
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
                    {scanResult.body_build} Build
                  </h4>
                  {scanResult.silhouette_characteristics && (
                    <p className="text-xs text-[#D4D4D8] mt-0.5">
                      {scanResult.silhouette_characteristics}
                    </p>
                  )}
                </div>

                {scanResult.proportion_advice && (
                  <div className="p-3 rounded-xl bg-[#27272A]/70 border border-white/5 text-[11px] text-[#A1A1AA] leading-relaxed">
                    <span className="text-white font-medium">Fit Balance Tip: </span>
                    {scanResult.proportion_advice}
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
                    <p className="font-medium text-white">Full Silhouette Inconclusive</p>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      {scanResult.rejection_reason ||
                        'Please step back so your full body from head to feet is visible.'}
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
            <span>Privacy-First: Non-medical silhouette classification. Frames are never stored.</span>
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
