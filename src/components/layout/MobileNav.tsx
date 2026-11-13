'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Sparkles, Shirt, FolderHeart, BookOpen, User, Compass } from 'lucide-react';

interface MobileNavProps {
  onOpenAddModal?: () => void;
}

function MobileNavContent({ onOpenAddModal }: MobileNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams?.get('tab');
  const isCollectionsActive = pathname === '/collections' || (pathname === '/wardrobe' && currentTab === 'collections');
  const isWardrobeActive = (pathname === '/wardrobe' && currentTab !== 'collections') || (pathname?.startsWith('/wardrobe/') && !pathname.includes('collections'));

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Sparkles },
    { label: 'Wardrobe', href: '/wardrobe', icon: Shirt, isWardrobe: true },
    { label: 'Collections', href: '/wardrobe?tab=collections', icon: FolderHeart, isCollections: true },
    { label: 'Style Me', href: '/create-outfit', icon: Compass, isAction: true },
    { label: 'Looks', href: '/looks', icon: BookOpen },
    { label: 'Profile', href: '/style-profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F6]/95 backdrop-blur-lg border-t border-[#EBE5DB] px-1.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          let isActive = false;
          if (item.isCollections) {
            isActive = isCollectionsActive;
          } else if (item.isWardrobe) {
            isActive = isWardrobeActive;
          } else {
            isActive = pathname === item.href;
          }

          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center -mt-5 px-1 focus:outline-none"
              >
                <div className="w-12 h-12 rounded-full bg-[#18181B] text-[#FAF8F5] flex items-center justify-center shadow-lg border-2 border-[#FBF9F6] active:scale-95 transition-transform">
                  <Icon className="w-5 h-5 text-[#FAF8F5]" />
                </div>
                <span className="text-[9px] font-semibold tracking-tight mt-1 text-[#18181B]">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all focus:outline-none ${
                isActive ? 'text-[#18181B]' : 'text-[#7E6047] hover:text-[#18181B]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#18181B] rounded-full" />
                )}
              </div>
              <span className={`text-[9px] sm:text-[10px] mt-1 tracking-tight truncate max-w-[55px] ${isActive ? 'font-bold text-[#18181B]' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MobileNav(props: MobileNavProps) {
  return (
    <React.Suspense fallback={null}>
      <MobileNavContent {...props} />
    </React.Suspense>
  );
}
