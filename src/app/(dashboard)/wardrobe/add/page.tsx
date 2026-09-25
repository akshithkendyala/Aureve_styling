'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AddClothingModal } from '@/components/wardrobe/AddClothingModal';

export default function AddWardrobeItemPage() {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <AddClothingModal
        isOpen={true}
        onClose={() => router.push('/wardrobe')}
        onItemAdded={() => router.push('/wardrobe')}
      />
    </div>
  );
}
