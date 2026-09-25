'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Shirt, Plus, BookOpen, User, Compass } from 'lucide-react';

interface MobileNavProps {
  onOpenAddModal?: () => void;
}

export function MobileNav({ onOpenAddModal }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Sparkles },
    { label: 'Wardrobe', href: '/wardrobe', icon: Shirt },
    { label: 'Style Me', href: '/create-outfit', icon: Compass, isAction: true },
    { label: 'Looks', href: '/looks', icon: BookOpen },
    { label: 'Style Profile', href: '/style-profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F6]/95 backdrop-blur-lg border-t border-[#EBE5DB] px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-[#18181B] text-[#FAF8F5] flex items-center justify-center shadow-lg border-2 border-[#FBF9F6] active:scale-95 transition-transform">
                  <Icon className="w-5 h-5 text-[#FAF8F5]" />
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-1 text-[#18181B]">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-all ${
                isActive ? 'text-[#18181B]' : 'text-[#7E6047] hover:text-[#18181B]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#18181B] rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-semibold text-[#18181B]' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
