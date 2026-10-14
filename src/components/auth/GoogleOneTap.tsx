'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
            prompt_parent_id?: string;
          }) => void;
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean;
              getNotDisplayedReason: () => string;
              isSkippedMoment: () => boolean;
              getSkippedReason: () => string;
              isDismissedMoment: () => boolean;
              getDismissedReason: () => string;
              getMomentType: () => string;
            }) => void
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapProps {
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

export function GoogleOneTap({ onSuccess, onError }: GoogleOneTapProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const isInitializedRef = useRef(false);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '573479877652-rscpbk208vp988s4s5asud0aalm1j3i3.apps.googleusercontent.com';

  useEffect(() => {
    // If user is already authenticated, strictly prevent Google One Tap from prompting
    let isCancelled = false;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && !isCancelled) {
            setAuthStatus('authenticated');
            isInitializedRef.current = true;
            if (typeof window !== 'undefined' && window.google?.accounts?.id) {
              try {
                window.google.accounts.id.cancel();
              } catch {}
            }
            return;
          }
        }
      } catch {
        // Ignore check error
      }
      if (!isCancelled) {
        setAuthStatus('unauthenticated');
      }
    }
    checkAuth();

    return () => {
      isCancelled = true;
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {
          // Ignore cancel error
        }
      }
    };
  }, []);

  const handleCredentialResponse = async (response: { credential: string }) => {
    if (!response?.credential) return;

    setIsAuthenticating(true);

    try {
      // 1. Also notify Supabase client session if possible
      try {
        const supabase = createClient();
        await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });
      } catch (clientAuthErr) {
        console.warn('Client Supabase signInWithIdToken note:', clientAuthErr);
      }

      // 2. Exchange & verify with our server boundary
      const res = await fetch('/api/auth/google-one-tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Google One Tap sign-in could not be completed.');
      }

      if (onSuccess) {
        onSuccess();
      }

      // 3. Navigate cleanly based on single source of truth for onboarding
      const destination = data.profile_completed ? '/dashboard' : '/onboarding';
      window.location.href = destination;
    } catch (err: any) {
      console.error('Google One Tap error:', err);
      setIsAuthenticating(false);
      if (onError) {
        onError(err.message || 'Authentication failed. Please use manual Google sign in.');
      }
    }
  };

  const initOneTap = useCallback(() => {
    if (!googleClientId || isInitializedRef.current) return;
    if (typeof window === 'undefined' || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log(
            'Google One Tap not displayed:',
            notification.getNotDisplayedReason()
          );
        } else if (notification.isSkippedMoment()) {
          console.log('Google One Tap skipped:', notification.getSkippedReason());
        } else if (notification.isDismissedMoment()) {
          console.log('Google One Tap dismissed:', notification.getDismissedReason());
        }
      });

      isInitializedRef.current = true;
    } catch (e) {
      console.warn('Google One Tap init exception:', e);
    }
  }, [googleClientId]);

  useEffect(() => {
    if (scriptLoaded && authStatus === 'unauthenticated') {
      initOneTap();
    }
  }, [scriptLoaded, authStatus, initOneTap]);

  // If already authenticated, do not mount Google client script or prompt UI
  if (authStatus === 'authenticated') {
    return null;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Subtle, elegant authentication indicator when One Tap is completing */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#FBF9F6] border border-[#EBE5DB] rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-3 max-w-xs text-center">
            <div className="w-8 h-8 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin" />
            <div>
              <h4 className="font-serif text-lg font-semibold text-[#18181B]">
                Welcome to AUREVÉ
              </h4>
              <p className="text-xs text-[#7E6047] mt-0.5">
                Connecting your private styling profile…
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
