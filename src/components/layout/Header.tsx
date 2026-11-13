'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Shirt, FolderHeart, Compass, BookOpen, LogOut, Plus } from 'lucide-react';

interface HeaderProps {
  user?: {
    id: string;
    email?: string;
    name: string;
    mobile_number?: string;
    avatar_url?: string;
  } | null;
  onOpenAddModal?: () => void;
}

function HeaderContent({ user, onOpenAddModal }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const currentTab = searchParams?.get('tab');
  const isCollectionsActive = pathname === '/collections' || (pathname === '/wardrobe' && currentTab === 'collections');
  const isWardrobeActive = (pathname === '/wardrobe' && currentTab !== 'collections') || (pathname?.startsWith('/wardrobe/') && !pathname.includes('collections'));

  const navItems = [
    { label: 'Dashboard', shortLabel: 'Dashboard', href: '/dashboard', icon: Sparkles },
    { label: 'My Wardrobe', shortLabel: 'Wardrobe', href: '/wardrobe', icon: Shirt, isWardrobe: true },
    { label: 'My Collections', shortLabel: 'Collections', href: '/wardrobe?tab=collections', icon: FolderHeart, isCollections: true },
    { label: 'Create Outfit', shortLabel: 'Create Look', href: '/create-outfit', icon: Compass },
    { label: 'My Looks', shortLabel: 'Looks', href: '/looks', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF9F6]/95 backdrop-blur-md border-b border-[#EBE5DB]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand Logo & Responsive Navigation */}
        <div className="flex items-center space-x-3 lg:space-x-5 min-w-0">
          <Link href="/dashboard" className="group flex items-center space-x-2 flex-shrink-0" title="Go to Dashboard">
            <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-[#18181B] group-hover:text-[#7E6047] transition-colors">
              AUREVÉ
            </span>
            <span className="hidden xl:inline-block text-[10px] tracking-[0.25em] uppercase font-sans text-[#7E6047] border-l border-[#D6C7B7] pl-3 py-0.5 whitespace-nowrap">
              Personal Stylist
            </span>
          </Link>

          {/* Tablet & Desktop Navigation — Perfectly calibrated single line without overflow */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 xl:space-x-2 flex-shrink-0">
            {navItems.map((item) => {
              let isActive = false;
              if (item.isCollections) {
                isActive = isCollectionsActive;
              } else if (item.isWardrobe) {
                isActive = isWardrobeActive;
              } else {
                isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              }

              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-2.5 lg:px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-full text-xs font-medium tracking-wide transition-all flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-[#18181B] text-[#FAF8F5] shadow-xs'
                      : 'text-[#5E4633] hover:text-[#18181B] hover:bg-[#F4EFEA]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden xl:inline whitespace-nowrap">{item.label}</span>
                  <span className="xl:hidden whitespace-nowrap">{item.shortLabel}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Quick Add, Profile & Logout */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
          {/* Quick Add Button */}
          {onOpenAddModal ? (
            <button
              onClick={onOpenAddModal}
              title="Add Clothing Piece"
              className="inline-flex items-center justify-center space-x-1.5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] p-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-medium tracking-wide transition-all shadow-xs active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">Add Clothing</span>
            </button>
          ) : (
            <Link
              href="/wardrobe/add"
              title="Add Clothing Piece"
              className="inline-flex items-center justify-center space-x-1.5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] p-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-medium tracking-wide transition-all shadow-xs active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">Add Clothing</span>
            </Link>
          )}

          {/* User Profile Area (Links to /style-profile) */}
          <Link
            href="/style-profile"
            title="View & Edit Style Profile"
            className="flex items-center space-x-2 p-1 sm:p-1.5 xl:px-3 xl:py-1.5 rounded-full hover:bg-[#F4EFEA] text-[#18181B] transition-colors border border-transparent hover:border-[#E8DFD5] whitespace-nowrap group flex-shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E8DFD5] text-[#5E4633] flex items-center justify-center font-serif text-sm font-semibold border border-[#D6C7B7] flex-shrink-0 group-hover:border-[#9A7B5F] transition-colors overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name[0].toUpperCase() : 'A'
              )}
            </div>
            <span className="hidden xl:inline-block text-xs font-medium text-[#18181B] whitespace-nowrap group-hover:text-[#7E6047] transition-colors max-w-[130px] truncate">
              {user?.name || 'My Profile'}
            </span>
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-full text-[#7E6047] hover:text-[#18181B] hover:bg-[#F4EFEA] transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Header(props: HeaderProps) {
  return (
    <React.Suspense fallback={
      <header className="sticky top-0 z-40 w-full bg-[#FBF9F6]/95 backdrop-blur-md border-b border-[#EBE5DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-[#18181B]">AUREVÉ</span>
          </div>
        </div>
      </header>
    }>
      <HeaderContent {...props} />
    </React.Suspense>
  );
}
