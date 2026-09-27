'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ShieldAlert, Sparkles, LogOut } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 Hours (7,200,000 ms)
const WARNING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes remaining (600,000 ms)
const CHECK_INTERVAL_MS = 10 * 1000; // Check every 10 seconds
const THROTTLE_UPDATE_MS = 15 * 1000; // Throttle activity timestamp writes to 15 seconds
const STORAGE_KEY = 'aureve_last_active_timestamp';
const LOGOUT_EVENT_KEY = 'aureve_session_logged_out';

export function SessionTimeoutManager() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(10);
  const lastRecordedTimeRef = useRef<number>(Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize or update timestamp in localStorage
  const recordActivity = useCallback((isImmediate = false) => {
    const now = Date.now();
    if (isImmediate || now - lastRecordedTimeRef.current >= THROTTLE_UPDATE_MS) {
      lastRecordedTimeRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, now.toString());
      } catch {
        // LocalStorage fallback
      }
      setShowWarning(false);
    }
  }, []);

  // Perform secure logout
  const handleLogout = useCallback(async (isTimeout = true) => {
    try {
      localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'LOGOUT' });
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setShowWarning(false);
      const url = isTimeout ? '/login?timeout=true' : '/login';
      router.push(url);
    }
  }, [router]);

  // Handle "Stay Signed In" action
  const handleStaySignedIn = () => {
    recordActivity(true);
    setShowWarning(false);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'ACTIVITY', timestamp: Date.now() });
    }
  };

  useEffect(() => {
    // 1. Initial timestamp bootstrap
    let savedTimestamp = Date.now();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          savedTimestamp = parsed;
        }
      } else {
        localStorage.setItem(STORAGE_KEY, savedTimestamp.toString());
      }
    } catch {
      // LocalStorage access error handling
    }
    lastRecordedTimeRef.current = savedTimestamp;

    // 2. BroadcastChannel for cross-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('aureve_session_channel');
        channelRef.current = bc;
        bc.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            router.push('/login?timeout=true');
          } else if (event.data?.type === 'ACTIVITY') {
            lastRecordedTimeRef.current = event.data.timestamp || Date.now();
            setShowWarning(false);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 3. Storage event listener for multi-tab sync across older browsers
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed)) {
          lastRecordedTimeRef.current = parsed;
          setShowWarning(false);
        }
      } else if (e.key === LOGOUT_EVENT_KEY) {
        router.push('/login?timeout=true');
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Activity event listeners (debounced/throttled)
    const handleUserActivity = () => {
      recordActivity(false);
    };

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];

    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    // 5. Inactivity ticker loop
    const checkInactivity = () => {
      let currentLastActive = lastRecordedTimeRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) currentLastActive = parsed;
        }
      } catch {}

      const elapsed = Date.now() - currentLastActive;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        // 2 Hours reached -> Perform automatic signout
        handleLogout(true);
      } else if (elapsed >= INACTIVITY_TIMEOUT_MS - WARNING_THRESHOLD_MS) {
        // 10 minutes remaining -> Show warning modal
        const remainingMs = INACTIVITY_TIMEOUT_MS - elapsed;
        const mins = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
        setMinutesRemaining(mins);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    const timerInterval = setInterval(checkInactivity, CHECK_INTERVAL_MS);
    // Run initial check immediately
    checkInactivity();

    return () => {
      clearInterval(timerInterval);
      window.removeEventListener('storage', handleStorage);
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [handleLogout, recordActivity, router]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FBF9F6] border border-[#EBE5DB] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#F4EFEA] text-[#7E6047] flex items-center justify-center border border-[#E8DFD5]">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6047]">
              Security & Session
            </span>
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Session Inactivity Warning
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#5E4633] leading-relaxed">
          Your session has been inactive for a while. For your security, you will be automatically signed out in{' '}
          <strong className="text-[#18181B] font-semibold">{minutesRemaining} minute{minutesRemaining > 1 ? 's' : ''}</strong>.
        </p>

        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => handleLogout(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-semibold text-[#7E6047] hover:text-[#18181B] hover:bg-[#F4EFEA] transition-colors inline-flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Now</span>
          </button>

          <button
            type="button"
            onClick={handleStaySignedIn}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] text-xs font-semibold tracking-wide shadow-md transition-all active:scale-95 inline-flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EEDC82]" />
            <span>Stay Signed In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
