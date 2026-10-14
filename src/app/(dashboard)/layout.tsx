'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { AddClothingModal } from '@/components/wardrobe/AddClothingModal';
import { WardrobeItem } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string; name: string; mobile_number?: string; avatar_url?: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadSession = React.useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        window.location.replace('/login');
        return;
      }
      if (!res.ok) {
        // Genuine server or database error: Rule D (Do not assume user is new / do not redirect to onboarding)
        setAuthError('Unable to connect to your private styling vault. Your session is safe.');
        setIsLoadingAuth(false);
        return;
      }

      const data = await res.json();
      if (data.authenticated && data.user) {
        // Only redirect to onboarding if profile is explicitly incomplete
        if (data.profile_completed === false) {
          window.location.replace('/onboarding');
          return;
        }

        setUser(data.user);
        setIsLoadingAuth(false);
      } else {
        window.location.replace('/login');
      }
    } catch (err) {
      console.error('Session verify network error:', err);
      setAuthError('Connection issue communicating with AUREVÉ servers.');
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleItemAdded = (item: WardrobeItem) => {
    // Dispatch custom event so active pages (wardrobe, dashboard) can refresh
    window.dispatchEvent(new CustomEvent('aureve:item-added', { detail: item }));
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin" />
        <span className="font-serif text-lg font-medium text-[#18181B] tracking-wider">
          AUREVÉ
        </span>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white rounded-3xl border border-[#EBE5DB] shadow-xl p-8 max-w-md w-full space-y-5">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto text-xl">
            ✦
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#18181B]">Connection Paused</h2>
            <p className="text-xs text-[#7E6047] leading-relaxed">{authError}</p>
          </div>
          <button
            onClick={() => loadSession()}
            className="w-full bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col selection:bg-[#221A13] selection:text-[#FAF8F5]">
      {/* Top Header */}
      <Header
        user={user}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 safe-bottom-padding">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Global Add Clothing Modal */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={handleItemAdded}
        onItemsAdded={(items) => {
          items.forEach((item) => {
            window.dispatchEvent(new CustomEvent('aureve:item-added', { detail: item }));
          });
        }}
      />
    </div>
  );
}
