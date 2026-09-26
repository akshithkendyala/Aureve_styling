'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; name: string; mobile_number: string } | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [weather, setWeather] = useState<{ temp?: number; city?: string }>({});
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
          if (isMounted) {
            setUser(data.user);
            setProfile(data.profile);
          }

          // Load weather for user's city
          const city = data.profile?.city || 'Mumbai';
          const weatherRes = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
          if (weatherRes.ok && isMounted) {
            const wData = await weatherRes.json();
            if (wData.weather) {
              setWeather({
                temp: wData.weather.temperature,
                city: wData.weather.city,
              });
            }
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
        weatherTemp={weather.temp}
        weatherCity={weather.city}
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
