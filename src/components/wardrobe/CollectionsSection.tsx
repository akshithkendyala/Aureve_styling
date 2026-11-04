'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FolderHeart,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Briefcase,
  Sun,
  PartyPopper,
  Home,
  Plane,
  Shirt,
  ArrowLeft,
  Search,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { WardrobeCollection, WardrobeItem } from '@/lib/types';

interface CollectionsSectionProps {
  wardrobeItems: WardrobeItem[];
  onOpenItemDetail: (item: WardrobeItem) => void;
  onRefreshWardrobe: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Sun: Sun,
  Briefcase: Briefcase,
  Sparkles: Sparkles,
  PartyPopper: PartyPopper,
  Home: Home,
  Plane: Plane,
  FolderHeart: FolderHeart,
};

export function CollectionsSection({
  wardrobeItems,
  onOpenItemDetail,
  onRefreshWardrobe,
}: CollectionsSectionProps) {
  const [collections, setCollections] = useState<WardrobeCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState<WardrobeCollection | null>(null);
  const [collectionItems, setCollectionItems] = useState<WardrobeItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Create Collection Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColIcon, setNewColIcon] = useState('FolderHeart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit Collection Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editColName, setEditColName] = useState('');
  const [editColDesc, setEditColDesc] = useState('');

  // Delete Collection Confirm Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Add Items to Collection Modal
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [selectedItemIdsToAdd, setSelectedItemIdsToAdd] = useState<Set<string>>(new Set());
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isSavingItems, setIsSavingItems] = useState(false);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (err) {
      console.error('Fetch collections failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Fetch items inside active collection
  const loadCollectionItems = async (collectionId: string) => {
    setIsLoadingItems(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}`);
      if (res.ok) {
        const data = await res.json();
        setCollectionItems(data.items || []);
        if (data.collection) {
          setActiveCollection(data.collection);
        }
      }
    } catch (err) {
      console.error('Failed to load collection items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleSelectCollection = (col: WardrobeCollection) => {
    setActiveCollection(col);
    loadCollectionItems(col.id);
  };

  const handleBackToAllCollections = () => {
    setActiveCollection(null);
    setCollectionItems([]);
    fetchCollections();
  };

  // Create Custom Collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    setIsSubmitting(true);
    setCreateError('');
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newColName.trim(),
          description: newColDesc.trim() || undefined,
          icon: newColIcon,
        }),
      });
      const data = await res.json();
      if (res.ok && data.collection) {
        setIsCreateModalOpen(false);
        setNewColName('');
        setNewColDesc('');
        setNewColIcon('FolderHeart');
        await fetchCollections();
      } else {
        setCreateError(data.error || 'Failed to create collection.');
      }
    } catch (err) {
      setCreateError('Network error creating collection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Collection
  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollection || !editColName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/collections/${activeCollection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editColName.trim(),
          description: editColDesc.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCollection(data.collection);
        setIsEditModalOpen(false);
        await fetchCollections();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Collection
  const handleDeleteCollection = async () => {
    if (!activeCollection) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/collections/${activeCollection.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setActiveCollection(null);
        await fetchCollections();
        onRefreshWardrobe();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Item from Collection
  const handleRemoveItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeCollection) return;

    setCollectionItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/collections/${activeCollection.id}/items/${itemId}`, {
        method: 'DELETE',
      });
      fetchCollections();
      onRefreshWardrobe();
    } catch (err) {
      console.error(err);
    }
  };

  // Open Add Items Modal
  const handleOpenAddItemsModal = () => {
    if (!activeCollection) return;
    const currentIds = new Set(collectionItems.map((i) => i.id));
    setSelectedItemIdsToAdd(currentIds);
    setItemSearchQuery('');
    setIsAddItemsModalOpen(true);
  };

  // Toggle item selection in Add Items Modal
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIdsToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Save selected items to collection
  const handleSaveItemsToCollection = async () => {
    if (!activeCollection) return;
    setIsSavingItems(true);
    try {
      const itemIdsArray = Array.from(selectedItemIdsToAdd);
      const res = await fetch(`/api/collections/${activeCollection.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: itemIdsArray }),
      });
      if (res.ok) {
        await loadCollectionItems(activeCollection.id);
        setIsAddItemsModalOpen(false);
        fetchCollections();
        onRefreshWardrobe();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingItems(false);
    }
  };

  // Filter items in Add Items Modal
  const filteredWardrobeToAdd = wardrobeItems.filter((item) => {
    if (item.is_archived) return false;
    if (!itemSearchQuery.trim()) return true;
    const q = itemSearchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.primary_color.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.subcategory.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* If drilling down into a single collection */}
      {activeCollection ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Breadcrumb & Collection Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE5DB] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <button
                  onClick={handleBackToAllCollections}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#7E6047] hover:text-[#18181B] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to All Collections</span>
                </button>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] text-[#7E6047] flex items-center justify-center font-bold">
                    {(() => {
                      const IconComponent = ICON_MAP[activeCollection.icon] || FolderHeart;
                      return <IconComponent className="w-5 h-5 text-[#7E6047]" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                        {activeCollection.name}
                      </h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#7E6047] border border-[#E8DFD5]">
                        {collectionItems.length} {collectionItems.length === 1 ? 'piece' : 'pieces'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#7E6047] mt-1 max-w-xl">
                      {activeCollection.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 self-start sm:self-center">
                <button
                  onClick={handleOpenAddItemsModal}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2.5 rounded-2xl bg-[#18181B] text-[#FAF8F5] hover:bg-black transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Pieces</span>
                </button>

                {activeCollection.collection_type === 'custom' && (
                  <>
                    <button
                      onClick={() => {
                        setEditColName(activeCollection.name);
                        setEditColDesc(activeCollection.description);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2.5 rounded-2xl bg-white border border-[#E8DFD5] text-[#7E6047] hover:text-[#18181B] hover:bg-[#FAF8F5] transition-colors"
                      title="Edit Collection"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-2.5 rounded-2xl bg-white border border-[#E8DFD5] text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items in this collection */}
          {isLoadingItems ? (
            <div className="py-16 text-center text-xs text-[#7E6047] animate-pulse">
              Loading collection pieces…
            </div>
          ) : collectionItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-[#EBE5DB] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EBE5DB] text-[#7E6047] flex items-center justify-center mx-auto">
                <Shirt className="w-6 h-6 text-[#9A7B5F]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-semibold text-[#18181B]">
                  No pieces in {activeCollection.name} yet
                </h3>
                <p className="text-xs text-[#7E6047] max-w-md mx-auto">
                  Add pieces from your wardrobe to organize your outfits for this purpose. An item can belong to multiple collections simultaneously!
                </p>
              </div>
              <button
                onClick={handleOpenAddItemsModal}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-2xl bg-[#18181B] text-[#FAF8F5] hover:bg-black transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Wardrobe Pieces</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {collectionItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onOpenItemDetail(item)}
                  className="group relative bg-white rounded-2xl border border-[#EBE5DB] p-2.5 sm:p-3 hover:border-[#18181B] transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col"
                >
                  {/* Remove from collection button */}
                  <button
                    onClick={(e) => handleRemoveItem(item.id, e)}
                    className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-[#7E6047] hover:text-red-600 hover:bg-white flex items-center justify-center shadow-xs transition-colors"
                    title="Remove from this collection (keeps in main wardrobe)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEA] mb-2">
                    <Image
                      src={item.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                    {item.name}
                  </h4>
                  <span className="text-[11px] text-[#7E6047] capitalize">
                    {item.primary_color} • {item.subcategory}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Top Overview of All Collections */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#7E6047] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#18181B]" />
                <span>MY COLLECTIONS</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                Purpose-Driven Wardrobe Collections
              </h2>
              <p className="text-xs sm:text-sm text-[#7E6047] mt-0.5">
                Organize your clothes like Spotify playlists. An item can belong to multiple collections.
              </p>
            </div>

            <button
              onClick={() => {
                setNewColName('');
                setNewColDesc('');
                setNewColIcon('FolderHeart');
                setCreateError('');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2.5 rounded-2xl bg-[#18181B] text-[#FAF8F5] hover:bg-black transition-colors shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Collection</span>
            </button>
          </div>

          {/* Collections Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-44 rounded-3xl bg-white border border-[#EBE5DB] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((col) => {
                const IconComponent = ICON_MAP[col.icon] || FolderHeart;
                const count = col.item_count || 0;
                const previews = col.preview_image_urls || [];

                return (
                  <div
                    key={col.id}
                    onClick={() => handleSelectCollection(col)}
                    className="group bg-white rounded-3xl border border-[#EBE5DB] p-5 sm:p-6 hover:border-[#18181B] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Top bar with icon and count */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DB] group-hover:bg-[#18181B] group-hover:text-white transition-colors flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-[#7E6047] group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#7E6047] border border-[#E8DFD5]">
                          {count} {count === 1 ? 'piece' : 'pieces'}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-semibold text-[#18181B] group-hover:text-black">
                        {col.name}
                      </h3>
                      <p className="text-xs text-[#7E6047] mt-1 line-clamp-2 leading-relaxed">
                        {col.description}
                      </p>
                    </div>

                    {/* Visual Preview Thumbnails */}
                    <div className="mt-4 pt-4 border-t border-[#F4EFEA] flex items-center justify-between">
                      {previews.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {previews.slice(0, 4).map((url, idx) => (
                            <div
                              key={idx}
                              className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-[#FAF8F5] shadow-2xs"
                            >
                              <Image src={url} alt="Piece thumbnail" fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#9A7B5F] italic">Empty collection</span>
                      )}

                      <span className="text-xs font-semibold text-[#7E6047] group-hover:text-[#18181B] group-hover:translate-x-0.5 transition-all">
                        View &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE COLLECTION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl border border-[#EBE5DB] shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#18181B]">
                Create New Collection
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-[#7E6047] hover:text-[#18181B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7E6047] mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gym & Active, Rainy Days, Airport Looks"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] text-sm text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7E6047] mb-1">
                  Short Description
                </label>
                <textarea
                  placeholder="What is this collection meant for?"
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] text-sm text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-white border border-[#E8DFD5] text-xs font-semibold text-[#7E6047] hover:text-[#18181B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newColName.trim()}
                  className="px-5 py-2 rounded-2xl bg-[#18181B] text-[#FAF8F5] text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating…' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COLLECTION MODAL */}
      {isEditModalOpen && activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl border border-[#EBE5DB] shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#18181B]">
                Edit Collection
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-[#7E6047] hover:text-[#18181B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7E6047] mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={editColName}
                  onChange={(e) => setEditColName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] text-sm text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7E6047] mb-1">
                  Description
                </label>
                <textarea
                  value={editColDesc}
                  onChange={(e) => setEditColDesc(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] text-sm text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-white border border-[#E8DFD5] text-xs font-semibold text-[#7E6047]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editColName.trim()}
                  className="px-5 py-2 rounded-2xl bg-[#18181B] text-[#FAF8F5] text-xs font-semibold hover:bg-black"
                >
                  {isSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteModalOpen && activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl border border-[#EBE5DB] shadow-2xl p-6 sm:p-7 space-y-4">
            <h3 className="font-serif text-xl font-semibold text-[#18181B]">
              Delete &ldquo;{activeCollection.name}&rdquo;?
            </h3>
            <p className="text-xs text-[#7E6047] leading-relaxed">
              This will only remove the collection organization folder. <strong>None of your actual wardrobe pieces will be deleted</strong> — they will remain safely in your wardrobe.
            </p>
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-2xl bg-white border border-[#E8DFD5] text-xs font-semibold text-[#7E6047]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCollection}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-2xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                {isSubmitting ? 'Deleting…' : 'Delete Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEMS TO COLLECTION MODAL */}
      {isAddItemsModalOpen && activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] w-full max-w-2xl rounded-3xl border border-[#EBE5DB] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-white border-b border-[#EBE5DB] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#18181B]">
                  Manage Pieces in {activeCollection.name}
                </h3>
                <p className="text-xs text-[#7E6047] mt-0.5">
                  Check pieces you want in this collection. Items can belong to multiple collections.
                </p>
              </div>
              <button
                onClick={() => setIsAddItemsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#7E6047] hover:text-[#18181B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-4 bg-white border-b border-[#F4EFEA]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#9A7B5F]" />
                <input
                  type="text"
                  placeholder="Search your wardrobe items by name, category, or color…"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD5] text-xs text-[#18181B] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Wardrobe Items Checklist */}
            <div className="p-5 overflow-y-auto flex-1">
              {filteredWardrobeToAdd.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7E6047]">
                  No matching wardrobe pieces found.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredWardrobeToAdd.map((item) => {
                    const isSelected = selectedItemIdsToAdd.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSelectItem(item.id)}
                        className={`relative rounded-2xl p-2 border transition-all cursor-pointer flex flex-col ${
                          isSelected
                            ? 'bg-amber-50/50 border-[#18181B] shadow-xs'
                            : 'bg-white border-[#EBE5DB] hover:border-[#9A7B5F]'
                        }`}
                      >
                        {/* Checkbox badge */}
                        <div
                          className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#18181B] text-white shadow-xs'
                              : 'bg-white/80 text-transparent border border-[#E8DFD5]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>

                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#FAF8F5] mb-2">
                          <Image
                            src={item.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h4 className="text-xs font-semibold text-[#18181B] line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-[#7E6047] capitalize">
                          {item.primary_color} • {item.subcategory}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 bg-white border-t border-[#EBE5DB] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7E6047]">
                {selectedItemIdsToAdd.size} pieces selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-white border border-[#E8DFD5] text-xs font-semibold text-[#7E6047]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemsToCollection}
                  disabled={isSavingItems}
                  className="px-5 py-2 rounded-2xl bg-[#18181B] text-[#FAF8F5] text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSavingItems ? 'Updating…' : 'Save to Collection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
