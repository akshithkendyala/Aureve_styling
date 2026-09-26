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
  const [user, setUser] = useState<{ id: string; name: string; mobile_number: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          if (isMounted) router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.authenticated && data.user) {
          // If profile is incomplete, redirect to onboarding
          if (data.profile && data.profile.profile_completed === false) {
            if (isMounted) router.push('/onboarding');
            return;
          }

          if (isMounted) {
            setUser(data.user);
          }
        } else {
          if (isMounted) router.push('/login');
        }
      } catch (err) {
        console.error(err);
        if (isMounted) router.push('/login');
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

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
      />
    </div>
  );
}
