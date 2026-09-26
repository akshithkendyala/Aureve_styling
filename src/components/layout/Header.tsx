'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Shirt, Compass, BookOpen, User, LogOut, Plus } from 'lucide-react';

interface HeaderProps {
  user?: {
    id: string;
    name: string;
    mobile_number: string;
  } | null;
  onOpenAddModal?: () => void;
}

export function Header({ user, onOpenAddModal }: HeaderProps) {
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
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF9F6]/90 backdrop-blur-md border-b border-[#EBE5DB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 lg:gap-6">
        {/* Brand Logo & Desktop Single-Line Navigation */}
        <div className="flex items-center space-x-4 lg:space-x-6 min-w-0">
          <Link href="/dashboard" className="group flex items-center space-x-2.5 flex-shrink-0" title="Go to Dashboard">
            <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-[#18181B] group-hover:text-[#7E6047] transition-colors">
              AUREVÉ
            </span>
            <span className="hidden sm:inline-block text-[10px] tracking-[0.25em] uppercase font-sans text-[#7E6047] border-l border-[#D6C7B7] pl-3 py-0.5 whitespace-nowrap">
              Personal Stylist
            </span>
          </Link>

          {/* Desktop Navigation — Single Line without Wrapping */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium tracking-wide transition-all flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-[#18181B] text-[#FAF8F5] shadow-sm'
                      : 'text-[#5E4633] hover:text-[#18181B] hover:bg-[#F4EFEA]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Quick Add, Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Quick Add Button (Desktop) */}
          {onOpenAddModal ? (
            <button
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Add Clothing</span>
            </button>
          ) : (
            <Link
              href="/wardrobe/add"
              className="hidden sm:inline-flex items-center space-x-1.5 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Add Clothing</span>
            </Link>
          )}

          {/* User Profile Area (Links to /style-profile) & Logout */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Link
              href="/style-profile"
              title="View & Edit Style Profile"
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full hover:bg-[#F4EFEA] text-[#18181B] transition-colors border border-transparent hover:border-[#E8DFD5] whitespace-nowrap group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E8DFD5] text-[#5E4633] flex items-center justify-center font-serif text-sm font-semibold border border-[#D6C7B7] flex-shrink-0 group-hover:border-[#9A7B5F] transition-colors">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <span className="hidden sm:inline-block text-xs font-medium text-[#18181B] whitespace-nowrap group-hover:text-[#7E6047] transition-colors">
                {user?.name || 'My Profile'}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-full text-[#7E6047] hover:text-[#18181B] hover:bg-[#F4EFEA] transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
