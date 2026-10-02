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
  VideoOff,
  Loader2,
} from 'lucide-react';
import { BodyBuildCategory, BodyScanResult } from '@/lib/types';

interface BodyScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (build: BodyBuildCategory, confidence?: number) => void;
  currentBuild?: string;
}

type CameraState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'INITIALIZING_CAMERA'
  | 'CAMERA_READY'
  | 'CAPTURING'
  | 'ANALYZING'
  | 'RESULT'
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'ERROR';

export default function BodyScanModal({
  isOpen,
  onClose,
  onApplyResult,
  currentBuild,
}: BodyScanModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('IDLE');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<BodyScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cleanly stop all active media stream tracks
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Check available video devices
  const checkDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch {
      // Ignore device check errors
    }
  }, []);

  // Request permission & launch live camera stream with fallback constraints
  const initCamera = useCallback(async (mode: 'user' | 'environment') => {
    stopTracks();
    setErrorMessage(null);
    setCameraState('REQUESTING_PERMISSION');

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraState('CAMERA_UNAVAILABLE');
      setErrorMessage('Camera access is not supported by your browser or environment.');
      return;
    }

    // Try starting with ideal constraints, then fallback to basic
    let stream: MediaStream | null = null;
    try {
      setCameraState('INITIALIZING_CAMERA');
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1: any) {
      console.warn('Initial full-body camera constraints failed, attempting fallback...', err1);
      try {
        // Fallback 1: basic facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
      } catch (err2: any) {
        console.warn('FacingMode camera failed, attempting basic video...', err2);
        try {
          // Fallback 2: any video
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err3: any) {
          console.error('All camera initialization failed:', err3);
          if (
            err3.name === 'NotAllowedError' ||
            err3.name === 'PermissionDeniedError' ||
            err1?.name === 'NotAllowedError'
          ) {
            setCameraState('PERMISSION_DENIED');
            setErrorMessage(
              'Camera permission was blocked. Please enable camera access in your browser settings (look for the camera/lock icon in the URL bar), or upload a photo.'
            );
          } else if (
            err3.name === 'NotFoundError' ||
            err3.name === 'DevicesNotFoundError'
          ) {
            setCameraState('CAMERA_UNAVAILABLE');
            setErrorMessage('No camera found on this device. You can upload a full-body photo instead.');
          } else if (
            err3.name === 'NotReadableError' ||
            err3.name === 'TrackStartError'
          ) {
            setCameraState('CAMERA_UNAVAILABLE');
            setErrorMessage('The camera is currently in use by another application.');
          } else {
            setCameraState('ERROR');
            setErrorMessage(err3.message || 'Unable to access camera.');
          }
          return;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setCameraState('CAMERA_READY');
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
      checkDevices();
    }
  }, [stopTracks, checkDevices]);

  // Handle modal lifecycle
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setScanResult(null);
      setErrorMessage(null);
      initCamera(facingMode);
    } else {
      stopTracks();
      setCameraState('IDLE');
    }

    return () => {
      stopTracks();
    };
  }, [isOpen]);

  // Flip camera between front and rear
  const handleFlipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    await initCamera(nextMode);
  };

  // Capture frame from active video element
  const captureCurrentFrame = (): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Perform AI Full-Body Silhouette analysis
  const analyzeImage = async (base64Image: string) => {
    setCameraState('ANALYZING');
    setErrorMessage(null);
    setCapturedImage(base64Image);
    stopTracks(); // Turn off camera stream once captured

    try {
      const response = await fetch('/api/profile/scan-body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const result: BodyScanResult = await response.json();
      setScanResult(result);
      setCameraState('RESULT');

      if (!result.success && result.rejection_reason) {
        setErrorMessage(result.rejection_reason);
      }
    } catch (err) {
      console.error('Body scan API error:', err);
      setErrorMessage('A network error occurred. Please try scanning again.');
      setScanResult({
        success: false,
        rejection_reason: 'Scan interrupted. Please check your connection and try again.',
      });
      setCameraState('RESULT');
    }
  };

  // Handle Capture button click
  const handleCapture = () => {
    if (cameraState !== 'CAMERA_READY') return;
    const frame = captureCurrentFrame();
    if (!frame) {
      setErrorMessage('Could not capture frame. Please ensure full body is clearly in frame.');
      return;
    }
    analyzeImage(frame);
  };

  // Handle manual file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        analyzeImage(base64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset to retake scan
  const handleRetake = () => {
    setCapturedImage(null);
    setScanResult(null);
    setErrorMessage(null);
    initCamera(facingMode);
  };

  // Apply result and close modal
  const handleApplyResult = () => {
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] bg-[#18181B]/95">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-[#9A7B5F]/20 flex items-center justify-center text-[#9A7B5F]">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-medium text-white tracking-tight">
                Body Build & Silhouette Scan
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#A1A1AA]">
                AUREVÉ Proportion & Cut Calibration
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
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[340px] sm:min-h-[420px] overflow-hidden">
          {/* 1. Live Video Preview */}
          {!capturedImage && (
            <div className="relative w-full h-full min-h-[340px] sm:min-h-[420px] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.warn);
                    setCameraState('CAMERA_READY');
                  }
                }}
                onPlay={() => {
                  setCameraState('CAMERA_READY');
                }}
                className={`w-full h-full object-cover min-h-[340px] sm:min-h-[420px] ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Full-Body Framing Guide Box (Visible when camera is active) */}
              {cameraState === 'CAMERA_READY' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="relative w-[210px] h-[300px] sm:w-[240px] sm:h-[350px] border-2 border-dashed border-[#9A7B5F]/75 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex flex-col justify-between p-3">
                    {/* Head Guide Line */}
                    <div className="w-full flex items-center justify-between opacity-70">
                      <span className="text-[9px] uppercase tracking-wider text-[#9A7B5F] font-semibold">Head</span>
                      <div className="h-0.5 flex-1 mx-2 bg-[#9A7B5F]/40" />
                    </div>

                    {/* Shoulder / Chest Guide Line */}
                    <div className="w-full flex items-center justify-between opacity-70">
                      <span className="text-[9px] uppercase tracking-wider text-[#9A7B5F] font-semibold">Shoulders</span>
                      <div className="h-0.5 flex-1 mx-2 bg-[#9A7B5F]/40" />
                    </div>

                    {/* Feet Guide Line */}
                    <div className="w-full flex items-center justify-between opacity-70">
                      <span className="text-[9px] uppercase tracking-wider text-[#9A7B5F] font-semibold">Feet</span>
                      <div className="h-0.5 flex-1 mx-2 bg-[#9A7B5F]/40" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 flex items-center space-x-1.5 text-xs text-[#FAF8F5]">
                    <Maximize2 className="w-3.5 h-3.5 text-[#9A7B5F]" />
                    <span>Step back 6-8 ft so your full body is visible</span>
                  </div>
                </div>
              )}

              {/* Initializing / Requesting Permission Loading Overlay */}
              {(cameraState === 'REQUESTING_PERMISSION' || cameraState === 'INITIALIZING_CAMERA') && (
                <div className="absolute inset-0 bg-[#18181B] flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#9A7B5F] animate-spin" />
                  <div className="space-y-1">
                    <p className="font-serif text-sm font-medium text-white">
                      {cameraState === 'REQUESTING_PERMISSION'
                        ? 'Requesting Camera Access...'
                        : 'Starting Camera Stream...'}
                    </p>
                    <p className="text-xs text-[#A1A1AA] max-w-xs">
                      Please allow browser camera permissions when prompted.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Static Captured / Uploaded Image Preview */}
          {capturedImage && (
            <div className="relative w-full h-full min-h-[340px] sm:min-h-[420px] flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Captured Full Body Frame"
                className="w-full h-full object-contain max-h-[420px]"
              />

              {/* Analyzing State Overlay */}
              {cameraState === 'ANALYZING' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3.5 p-6 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-[#9A7B5F] border-t-transparent animate-spin flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#9A7B5F]" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-serif text-base font-medium text-white">
                      Analyzing Body Silhouette...
                    </p>
                    <p className="text-xs text-[#A1A1AA] max-w-xs leading-relaxed">
                      Evaluating shoulder-to-torso ratios, silhouette drape, and styling proportions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Camera Permission Denied / Error / Unavailable Screen */}
          {!capturedImage &&
            (cameraState === 'PERMISSION_DENIED' ||
              cameraState === 'CAMERA_UNAVAILABLE' ||
              cameraState === 'ERROR') && (
              <div className="absolute inset-0 bg-[#18181B] flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  {cameraState === 'PERMISSION_DENIED' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <VideoOff className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="font-serif text-base font-medium text-white">
                    {cameraState === 'PERMISSION_DENIED'
                      ? 'Camera Access Unavailable'
                      : 'Camera Unavailable'}
                  </h4>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {errorMessage ||
                      'Allow camera permission in your browser or upload a full-body photo from your gallery.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => initCamera(facingMode)}
                    className="px-4 py-2.5 bg-[#FAF8F5] text-[#18181B] rounded-xl text-xs font-semibold hover:bg-white transition-all flex items-center space-x-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-[#27272A] text-white rounded-xl text-xs font-semibold hover:bg-[#3F3F46] transition-all flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Full-Body Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2.5 text-[#A1A1AA] hover:text-white text-xs font-medium"
                  >
                    Select Manually
                  </button>
                </div>
              </div>
            )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Scan Result Card (When Analysis Completes) */}
        {scanResult && cameraState === 'RESULT' && (
          <div className="p-5 border-t border-[#27272A] bg-[#1F1F23] space-y-4 animate-in fade-in duration-200">
            {scanResult.success && scanResult.body_build ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#9A7B5F]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A7B5F]">
                      Silhouette Calibrated
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
                    <span className="text-white font-medium">Proportion Tip: </span>
                    {scanResult.proportion_advice}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyResult}
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
                        'Please step back and ensure your full body from head to feet is visible.'}
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
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-[#27272A] text-[#D4D4D8] rounded-xl text-xs font-semibold hover:bg-[#3F3F46] hover:text-white transition-all flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2.5 text-[#A1A1AA] hover:text-white text-xs font-medium"
                  >
                    Select Manually
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Camera Controls Toolbar (Visible when camera stream is ready) */}
        {!capturedImage && (
          <div className="px-5 py-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between">
            {/* Upload fallback */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#3F3F46] transition-all flex items-center space-x-1.5 text-xs font-medium"
              title="Upload full-body photo"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Primary Capture Button */}
            <button
              type="button"
              onClick={handleCapture}
              disabled={cameraState !== 'CAMERA_READY'}
              className="px-6 py-3 bg-[#FAF8F5] hover:bg-white text-[#18181B] rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4 text-[#9A7B5F]" />
              <span>
                {cameraState === 'CAMERA_READY'
                  ? 'Capture & Analyze'
                  : cameraState === 'INITIALIZING_CAMERA'
                  ? 'Starting Camera...'
                  : 'Preparing Camera...'}
              </span>
            </button>

            {/* Flip camera on mobile or multi-camera desktop */}
            <button
              type="button"
              onClick={handleFlipCamera}
              disabled={cameraState !== 'CAMERA_READY'}
              className="p-2.5 rounded-xl bg-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#3F3F46] transition-all flex items-center space-x-1.5 text-xs font-medium disabled:opacity-40"
              title="Switch camera"
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
            <span>Privacy-First: Full-body frames are processed ephemerally and never saved.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white underline underline-offset-2"
          >
            Manual selection
          </button>
        </div>
      </div>
    </div>
  );
}
