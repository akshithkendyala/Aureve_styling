'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTimeout = searchParams.get('timeout') === 'true';
  const urlError = searchParams.get('error');

  const [error, setError] = useState(urlError ? decodeURIComponent(urlError) : '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    async function checkExistingAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push(data.profile_completed ? '/dashboard' : '/onboarding');
          }
        }
      } catch {
        // Ignore check error
      }
    }
    checkExistingAuth();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        console.error('Google Sign In Error:', oauthError);
        setError(oauthError.message || 'Unable to sign in with Google. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Google OAuth exception:', err);
      setError('A connection error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-[#F4EFEA] rounded-b-[100px] blur-3xl -z-0 opacity-60 pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-wider text-[#18181B]">
              AUREVÉ
            </h1>
          </Link>
          <p className="text-xs sm:text-sm text-[#7E6047]">
            Your personal digital wardrobe & AI stylist.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] shadow-xl p-6 sm:p-8 space-y-6">
          {isTimeout && (
            <div className="p-3.5 bg-[#F4EFEA] border border-[#E8DFD5] rounded-2xl text-xs text-[#5E4633] flex items-start space-x-2.5 animate-in fade-in duration-200">
              <Clock className="w-4 h-4 text-[#7E6047] flex-shrink-0 mt-0.5" />
              <span>Your session expired after 2 hours of inactivity. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
                Welcome to AUREVÉ
              </h2>
              <p className="text-xs text-[#7E6047]">
                Sign in with your Google account to access your private wardrobe, outfit creations, and personalized styling intelligence.
              </p>
            </div>

            {/* Google OAuth Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full relative flex items-center justify-center space-x-3 py-3.5 px-4 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Google…</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EBE5DB] text-center">
            <p className="text-[11px] text-[#9A7B5F] leading-relaxed">
              New to AUREVÉ? Signing in with Google automatically provisions your private styling vault.
            </p>
          </div>
        </div>

        {/* Security / Privacy Assurance Note */}
        <div className="mt-6 text-center flex items-center justify-center space-x-1.5 text-[11px] text-[#9A7B5F]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strict User Isolation • Encrypted Database Row Level Security</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#FBF9F6]" />}>
      <LoginForm />
    </React.Suspense>
  );
}
