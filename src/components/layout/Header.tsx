'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Shirt, Compass, BookOpen, User, LogOut, Plus, CloudSun } from 'lucide-react';
import { User as UserType } from '@/lib/types';

interface HeaderProps {
  user?: {
    id: string;
    name: string;
    mobile_number: string;
  } | null;
  weatherTemp?: number;
  weatherCity?: string;
  onOpenAddModal?: () => void;
}

export function Header({ user, weatherTemp, weatherCity = 'Mumbai', onOpenAddModal }: HeaderProps) {
  const pathname = usePathname();
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

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Sparkles },
    { label: 'My Wardrobe', href: '/wardrobe', icon: Shirt },
    { label: 'Create Outfit', href: '/create-outfit', icon: Compass },
    { label: 'My Looks', href: '/looks', icon: BookOpen },
    { label: 'My Style', href: '/style-profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF9F6]/90 backdrop-blur-md border-b border-[#EBE5DB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="group flex items-center space-x-2.5">
            <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-[#18181B] group-hover:text-[#7E6047] transition-colors">
              AUREVÉ
            </span>
            <span className="hidden sm:inline-block text-[10px] tracking-[0.25em] uppercase font-sans text-[#7E6047] border-l border-[#D6C7B7] pl-3 py-0.5">
              Personal Stylist
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 pl-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium tracking-wide transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-[#18181B] text-[#FAF8F5] shadow-sm'
                      : 'text-[#5E4633] hover:text-[#18181B] hover:bg-[#F4EFEA]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Weather & Profile */}
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          {/* Weather Widget Pill */}
          {weatherTemp !== undefined && (
            <div className="hidden lg:flex items-center space-x-2 bg-[#F4EFEA] border border-[#E8DFD5] px-3 py-1.5 rounded-full text-xs text-[#5E4633]">
              <CloudSun className="w-3.5 h-3.5 text-[#9A7B5F]" />
              <span>
                {weatherCity} <strong className="font-semibold text-[#18181B]">{weatherTemp}°C</strong>
              </span>
            </div>
          )}

          {/* Quick Add Button (Desktop) */}
          {onOpenAddModal ? (
            <button
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Clothing</span>
            </button>
          ) : (
            <Link
              href="/wardrobe/add"
              className="hidden sm:inline-flex items-center space-x-1.5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Clothing</span>
            </Link>
          )}

          {/* User Profile / Logout */}
          <div className="flex items-center space-x-2">
            <Link
              href="/style-profile"
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full hover:bg-[#F4EFEA] text-[#18181B] transition-colors border border-transparent hover:border-[#E8DFD5]"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E8DFD5] text-[#5E4633] flex items-center justify-center font-serif text-sm font-semibold border border-[#D6C7B7]">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <span className="hidden xl:inline-block text-xs font-medium text-[#18181B]">
                {user?.name || 'Account'}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-full text-[#7E6047] hover:text-[#18181B] hover:bg-[#F4EFEA] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
