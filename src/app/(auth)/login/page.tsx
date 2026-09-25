'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Smartphone, User, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(mobileNumber.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setError('Security PIN must be exactly 6 numeric digits.');
      return;
    }

    if (isRegistering && (!name || name.trim().length < 2)) {
      setError('Please enter your name.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegistering
        ? { name: name.trim(), mobile_number: mobileNumber, pin }
        : { mobile_number: mobileNumber, pin };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Success -> Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // First try login with demo user
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: '9876543210',
          pin: '123456',
        }),
      });

      if (loginRes.ok) {
        window.location.href = '/dashboard';
        return;
      }

      // If demo user doesn't exist yet, register it
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Akshit',
          mobile_number: '9876543210',
          pin: '123456',
        }),
      });

      if (regRes.ok) {
        window.location.href = '/dashboard';
      } else {
        const d = await regRes.json();
        setError(d.error || 'Demo login could not be initiated.');
      }
    } catch (e) {
      console.error(e);
      setError('Demo access failed. Please try manual login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
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
            {isRegistering
              ? 'Create your private, secure digital wardrobe.'
              : 'Enter your 6-digit PIN to access your private wardrobe.'}
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl border border-[#EBE5DB] shadow-xl p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isRegistering}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#EBE5DB] rounded-2xl text-xs sm:text-sm text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-semibold text-[#7E6047] border-r border-[#D6C7B7] pr-2">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="98765 43210"
                  className="w-full pl-16 pr-4 py-3 bg-[#FBF9F6] border border-[#EBE5DB] rounded-2xl text-xs sm:text-sm font-medium text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E6047] mb-1.5">
                6-Digit Security PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F6] border border-[#EBE5DB] rounded-2xl text-base sm:text-lg tracking-widest text-[#18181B] placeholder-[#9A7B5F]/60 focus:outline-none focus:border-[#18181B] transition-colors font-mono"
                />
              </div>
              <p className="text-[10px] text-[#9A7B5F] mt-1">
                Your PIN is securely hashed and protects your private wardrobe data.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Verifying credentials…</span>
              ) : (
                <>
                  <span>{isRegistering ? 'Create Private Wardrobe' : 'Sign In to Wardrobe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Register and Login */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-xs text-[#5E4633] hover:text-[#18181B] font-medium transition-colors"
            >
              {isRegistering ? (
                <span>Already have a wardrobe? <strong className="underline text-[#18181B]">Sign In</strong></span>
              ) : (
                <span>New to AUREVÉ? <strong className="underline text-[#18181B]">Create Account</strong></span>
              )}
            </button>
          </div>

          {/* 1-Click Quick Demo Button */}
          <div className="pt-4 border-t border-[#EBE5DB] text-center space-y-2">
            <p className="text-[11px] text-[#9A7B5F]">
              Want to test AUREVÉ immediately?
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-full bg-[#F4EFEA] hover:bg-[#E8DFD5] text-[#5E4633] text-xs font-semibold border border-[#E8DFD5] transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9A7B5F]" />
              <span>1-Click Experience Demo Account</span>
            </button>
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
