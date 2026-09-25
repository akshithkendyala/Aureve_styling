import { randomUUID } from 'crypto';
import {
  User,
  UserProfile,
  WardrobeItem,
  Outfit,
  OutfitFeedback,
  WardrobeStats,
  MainCategory,
} from '@/lib/types';
import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import { SAMPLE_INDIAN_WARDROBE } from '@/lib/ai/sampleWardrobe';

// In-Memory / Local Cache Store for development & fallback when Supabase is not connected
// Keyed strictly by userId to guarantee isolation
interface InMemoryStore {
  users: Map<string, User>; // id -> user
  usersByMobile: Map<string, string>; // mobile -> id
  profiles: Map<string, UserProfile>; // userId -> profile
  wardrobe: Map<string, WardrobeItem[]>; // userId -> items
  outfits: Map<string, Outfit[]>; // userId -> outfits
  feedback: Map<string, OutfitFeedback[]>; // userId -> feedback
}

// Global store instance preserved across dev hot-reloads
declare global {
  var __aureve_db__: InMemoryStore | undefined;
}

const dbStore: InMemoryStore = global.__aureve_db__ || {
  users: new Map(),
  usersByMobile: new Map(),
  profiles: new Map(),
  wardrobe: new Map(),
  outfits: new Map(),
  feedback: new Map(),
};

if (process.env.NODE_ENV !== 'production') {
  global.__aureve_db__ = dbStore;
}

export const Repository = {
  // ============================================================================
  // USER AUTHENTICATION & PROFILES
  // ============================================================================

  async findUserByMobile(mobile: string): Promise<User | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('mobile_number', mobile)
          .maybeSingle();
        if (!error && data) return data as User;
      } catch (err) {
        console.error('Supabase findUserByMobile error, falling back to local store:', err);
      }
    }

    const userId = dbStore.usersByMobile.get(mobile);
    if (!userId) return null;
    return dbStore.users.get(userId) || null;
  },

  async findUserById(id: string): Promise<User | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data as User;
      } catch (err) {
        console.error('Supabase findUserById error, fallback:', err);
      }
    }

    return dbStore.users.get(id) || null;
  },

  async createUser(name: string, mobileNumber: string, pinHash: string): Promise<User> {
    const newUser: User = {
      id: isSupabaseConfigured ? undefined as any : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
      name,
      mobile_number: mobileNumber,
      pin_hash: pinHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .insert({
            name,
            mobile_number: mobileNumber,
            pin_hash: pinHash,
          })
          .select('*')
          .single();

        if (error) throw error;
        const created = data as User;

        // Create default profile in Supabase
        await supabaseAdmin.from('profiles').insert({
          user_id: created.id,
          city: 'Mumbai',
          preferred_fit: 'Regular',
          favorite_colors: ['Navy Blue', 'White', 'Olive Green', 'Charcoal'],
          avoided_colors: ['Neon Green', 'Bright Orange'],
          style_preferences: ['Smart Casual', 'Minimal', 'Modern Indian'],
          comfort_preference: 'Balanced',
        });

        return created;
      } catch (err) {
        console.error('Supabase createUser error, using local fallback:', err);
      }
    }

    if (!newUser.id) {
      newUser.id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    dbStore.users.set(newUser.id, newUser);
    dbStore.usersByMobile.set(mobileNumber, newUser.id);

    // Create default profile in local store
    const defaultProfile: UserProfile = {
      id: `prof_${Date.now()}`,
      user_id: newUser.id,
      city: 'Mumbai',
      height: "5'10\"",
      weight: '72 kg',
      skin_tone: 'Warm Olive',
      preferred_fit: 'Regular',
      favorite_colors: ['Navy Blue', 'White', 'Olive Green', 'Charcoal', 'Beige'],
      avoided_colors: ['Neon Green', 'Bright Orange'],
      style_preferences: ['Smart Casual', 'Minimal', 'Modern Indian'],
      comfort_preference: 'Balanced',
      created_at: new Date().toISOString(),
    };
    dbStore.profiles.set(newUser.id, defaultProfile);

    // Automatically seed default realistic wardrobe for user so they have a ready experience
    await this.seedDefaultWardrobe(newUser.id);

    return newUser;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && data) return data as UserProfile;
      } catch (err) {
        console.error('Supabase getUserProfile error:', err);
      }
    }

    return dbStore.profiles.get(userId) || null;
  },

  async upsertUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    const updated: UserProfile = {
      id: existing?.id || `prof_${Date.now()}`,
      user_id: userId,
      height: profileData.height ?? existing?.height,
      weight: profileData.weight ?? existing?.weight,
      skin_tone: profileData.skin_tone ?? existing?.skin_tone,
      preferred_fit: profileData.preferred_fit ?? existing?.preferred_fit ?? 'Regular',
      favorite_colors: profileData.favorite_colors ?? existing?.favorite_colors ?? ['Navy Blue', 'White', 'Charcoal'],
      avoided_colors: profileData.avoided_colors ?? existing?.avoided_colors ?? [],
      style_preferences: profileData.style_preferences ?? existing?.style_preferences ?? ['Smart Casual', 'Minimal'],
      comfort_preference: profileData.comfort_preference ?? existing?.comfort_preference ?? 'Balanced',
      city: profileData.city ?? existing?.city ?? 'Mumbai',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .upsert(
            {
              user_id: userId,
              ...profileData,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select('*')
          .single();
        if (!error && data) return data as UserProfile;
      } catch (err) {
        console.error('Supabase upsertUserProfile error:', err);
      }
    }

    dbStore.profiles.set(userId, updated);
    return updated;
  },

  // ============================================================================
  // WARDROBE ITEMS (STRICT USER ISOLATION)
  // ============================================================================

  async getWardrobeItems(
    userId: string,
    options?: {
      category?: MainCategory;
      includeArchived?: boolean;
      favoritesOnly?: boolean;
      searchQuery?: string;
    }
  ): Promise<WardrobeItem[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (options?.category) {
          query = query.eq('category', options.category);
        }
        if (!options?.includeArchived) {
          query = query.eq('is_archived', false);
        }
        if (options?.favoritesOnly) {
          query = query.eq('is_favorite', true);
        }

        const { data, error } = await query;
        if (!error && data) {
          let items = data as WardrobeItem[];
          if (options?.searchQuery) {
            const q = options.searchQuery.toLowerCase();
            items = items.filter(
              (it) =>
                it.name.toLowerCase().includes(q) ||
                it.primary_color.toLowerCase().includes(q) ||
                it.subcategory.toLowerCase().includes(q)
            );
          }
          return items;
        }
      } catch (err) {
        console.error('Supabase getWardrobeItems error:', err);
      }
    }

    let items = dbStore.wardrobe.get(userId) || [];

    if (!options?.includeArchived) {
      items = items.filter((it) => !it.is_archived);
    }
    if (options?.category) {
      items = items.filter((it) => it.category === options.category);
    }
    if (options?.favoritesOnly) {
      items = items.filter((it) => it.is_favorite);
    }
    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      items = items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.primary_color.toLowerCase().includes(q) ||
          it.subcategory.toLowerCase().includes(q) ||
          (it.material && it.material.toLowerCase().includes(q))
      );
    }

    return items;
  },

  async getWardrobeItemById(userId: string, itemId: string): Promise<WardrobeItem | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', userId)
          .eq('id', itemId)
          .maybeSingle();
        if (!error && data) return data as WardrobeItem;
      } catch (err) {
        console.error('Supabase getWardrobeItemById error:', err);
      }
    }

    const items = dbStore.wardrobe.get(userId) || [];
    return items.find((it) => it.id === itemId) || null;
  },

  async addWardrobeItem(userId: string, item: Omit<WardrobeItem, 'id' | 'user_id' | 'created_at' | 'times_worn'>): Promise<WardrobeItem> {
    const newItem: WardrobeItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      times_worn: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item,
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('wardrobe_items')
          .insert({
            user_id: userId,
            image_url: item.image_url,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            primary_color: item.primary_color,
            secondary_colors: item.secondary_colors || [],
            pattern: item.pattern,
            material: item.material,
            fit: item.fit,
            style: item.style,
            formality: item.formality,
            season: item.season || [],
            is_favorite: item.is_favorite || false,
            is_archived: item.is_archived || false,
            times_worn: 0,
          })
          .select('*')
          .single();
        if (!error && data) return data as WardrobeItem;
      } catch (err) {
        console.error('Supabase addWardrobeItem error:', err);
      }
    }

    const items = dbStore.wardrobe.get(userId) || [];
    items.unshift(newItem);
    dbStore.wardrobe.set(userId, items);
    return newItem;
  },

  async updateWardrobeItem(
    userId: string,
    itemId: string,
    updates: Partial<WardrobeItem>
  ): Promise<WardrobeItem | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('wardrobe_items')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('id', itemId)
          .select('*')
          .single();
        if (!error && data) return data as WardrobeItem;
      } catch (err) {
        console.error('Supabase updateWardrobeItem error:', err);
      }
    }

    const items = dbStore.wardrobe.get(userId) || [];
    const index = items.findIndex((it) => it.id === itemId);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    dbStore.wardrobe.set(userId, items);
    return items[index];
  },

  async deleteWardrobeItem(userId: string, itemId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('wardrobe_items')
          .delete()
          .eq('user_id', userId)
          .eq('id', itemId);
        if (!error) return true;
      } catch (err) {
        console.error('Supabase deleteWardrobeItem error:', err);
      }
    }

    const items = dbStore.wardrobe.get(userId) || [];
    const filtered = items.filter((it) => it.id !== itemId);
    dbStore.wardrobe.set(userId, filtered);
    return true;
  },

  async recordItemWorn(userId: string, itemId: string): Promise<void> {
    const item = await this.getWardrobeItemById(userId, itemId);
    if (item) {
      await this.updateWardrobeItem(userId, itemId, {
        times_worn: (item.times_worn || 0) + 1,
        last_worn_at: new Date().toISOString(),
      });
    }
  },

  async seedDefaultWardrobe(userId: string): Promise<WardrobeItem[]> {
    const existing = await this.getWardrobeItems(userId, { includeArchived: true });
    if (existing.length > 0) return existing;

    const seededItems: WardrobeItem[] = [];
    for (let i = 0; i < SAMPLE_INDIAN_WARDROBE.length; i++) {
      const seed = SAMPLE_INDIAN_WARDROBE[i];
      const created = await this.addWardrobeItem(userId, {
        name: seed.name,
        category: seed.category,
        subcategory: seed.subcategory,
        image_url: seed.image_url,
        primary_color: seed.primary_color,
        secondary_colors: seed.secondary_colors,
        pattern: seed.pattern,
        material: seed.material,
        fit: seed.fit,
        style: seed.style,
        formality: seed.formality,
        season: seed.season,
        is_favorite: seed.is_favorite ?? false,
        is_archived: false,
      });
      seededItems.push(created);
    }
    return seededItems;
  },

  async resetUserWardrobe(userId: string): Promise<void> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('wardrobe_items').delete().eq('user_id', userId);
        await supabaseAdmin.from('outfits').delete().eq('user_id', userId);
      } catch (err) {
        console.error('Supabase resetUserWardrobe error:', err);
      }
    }
    dbStore.wardrobe.set(userId, []);
    dbStore.outfits.set(userId, []);
    dbStore.feedback.set(userId, []);
  },

  // ============================================================================
  // OUTFITS & RECOMMENDATIONS
  // ============================================================================

  async saveOutfit(userId: string, outfitData: Omit<Outfit, 'id' | 'user_id' | 'created_at'>): Promise<Outfit> {
    const newOutfit: Outfit = {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      ...outfitData,
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: createdOutfit, error } = await supabaseAdmin
          .from('outfits')
          .insert({
            user_id: userId,
            occasion: outfitData.occasion,
            date: outfitData.date,
            time: outfitData.time,
            location: outfitData.location,
            weather_data: outfitData.weather_data,
            title: outfitData.title,
            ai_explanation: outfitData.ai_explanation,
            style_match: outfitData.style_match,
            style_direction: outfitData.style_direction,
          })
          .select('*')
          .single();

        if (!error && createdOutfit) {
          // Insert items
          for (const itemRef of outfitData.items) {
            await supabaseAdmin.from('outfit_items').insert({
              outfit_id: createdOutfit.id,
              wardrobe_item_id: itemRef.wardrobe_item_id,
              role: itemRef.role,
            });
          }
          return {
            ...createdOutfit,
            items: outfitData.items,
            alternative_looks: outfitData.alternative_looks,
          } as Outfit;
        }
      } catch (err) {
        console.error('Supabase saveOutfit error:', err);
      }
    }

    const outfits = dbStore.outfits.get(userId) || [];
    outfits.unshift(newOutfit);
    dbStore.outfits.set(userId, outfits);
    return newOutfit;
  },

  async getUserOutfits(userId: string): Promise<Outfit[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: outfitRows, error } = await supabaseAdmin
          .from('outfits')
          .select(`
            *,
            outfit_items (
              wardrobe_item_id,
              role,
              wardrobe_items (*)
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && outfitRows) {
          return outfitRows.map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            occasion: row.occasion,
            date: row.date,
            time: row.time,
            location: row.location,
            weather_data: row.weather_data,
            title: row.title,
            ai_explanation: row.ai_explanation,
            style_match: row.style_match,
            style_direction: row.style_direction,
            created_at: row.created_at,
            items: (row.outfit_items || []).map((oi: any) => ({
              wardrobe_item_id: oi.wardrobe_item_id,
              role: oi.role,
              item: oi.wardrobe_items,
            })),
          }));
        }
      } catch (err) {
        console.error('Supabase getUserOutfits error:', err);
      }
    }

    const outfits = dbStore.outfits.get(userId) || [];
    const wardrobe = dbStore.wardrobe.get(userId) || [];
    const wardrobeMap = new Map(wardrobe.map((i) => [i.id, i]));

    // Populate item references
    return outfits.map((o) => ({
      ...o,
      items: o.items.map((it) => ({
        ...it,
        item: it.item || wardrobeMap.get(it.wardrobe_item_id),
      })),
    }));
  },

  async deleteOutfit(userId: string, outfitId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('outfits').delete().eq('user_id', userId).eq('id', outfitId);
        return true;
      } catch (err) {
        console.error('Supabase deleteOutfit error:', err);
      }
    }

    const outfits = dbStore.outfits.get(userId) || [];
    dbStore.outfits.set(userId, outfits.filter((o) => o.id !== outfitId));
    return true;
  },

  // ============================================================================
  // OUTFIT FEEDBACK
  // ============================================================================

  async recordFeedback(userId: string, feedback: Omit<OutfitFeedback, 'id' | 'user_id' | 'created_at'>): Promise<OutfitFeedback> {
    const newFeedback: OutfitFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      ...feedback,
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('outfit_feedback')
          .insert({
            user_id: userId,
            outfit_id: feedback.outfit_id,
            rating: feedback.rating,
            feedback_tags: feedback.feedback_tags,
            comment: feedback.comment,
          })
          .select('*')
          .single();
        if (!error && data) return data as OutfitFeedback;
      } catch (err) {
        console.error('Supabase recordFeedback error:', err);
      }
    }

    const list = dbStore.feedback.get(userId) || [];
    list.unshift(newFeedback);
    dbStore.feedback.set(userId, list);
    return newFeedback;
  },

  // ============================================================================
  // WARDROBE ANALYTICS & INSIGHTS
  // ============================================================================

  async getWardrobeStats(userId: string): Promise<WardrobeStats> {
    const allItems = await this.getWardrobeItems(userId, { includeArchived: true });
    const activeItems = allItems.filter((i) => !i.is_archived);

    const tops = activeItems.filter((i) => i.category === 'tops').length;
    const bottoms = activeItems.filter((i) => i.category === 'bottoms').length;
    const layers = activeItems.filter((i) => i.category === 'layers').length;
    const footwear = activeItems.filter((i) => i.category === 'footwear').length;
    const accessories = activeItems.filter((i) => i.category === 'accessories').length;
    const favorites = activeItems.filter((i) => i.is_favorite).length;
    const archived = allItems.filter((i) => i.is_archived).length;

    // Color distribution
    const colorCount: { [color: string]: number } = {};
    activeItems.forEach((it) => {
      const col = it.primary_color;
      colorCount[col] = (colorCount[col] || 0) + 1;
    });

    const dominantColors = Object.entries(colorCount)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most and least worn
    const sortedByWear = [...activeItems].sort((a, b) => (b.times_worn || 0) - (a.times_worn || 0));
    const mostWornItem = sortedByWear.length > 0 && (sortedByWear[0].times_worn || 0) > 0 ? sortedByWear[0] : null;
    const leastWornItem = sortedByWear.length > 1 ? sortedByWear[sortedByWear.length - 1] : null;

    // Generate smart contextual style insights
    const styleInsights: string[] = [];

    if (dominantColors.length > 0) {
      styleInsights.push(`You have a strong affinity for ${dominantColors[0].color} tones in your core collection.`);
    }

    if (leastWornItem && (leastWornItem.times_worn || 0) === 0) {
      styleInsights.push(`You haven't styled your ${leastWornItem.name} yet — it pairs effortlessly with neutral trousers.`);
    }

    if (tops > 0 && bottoms > 0) {
      const ratio = (tops / bottoms).toFixed(1);
      if (Number(ratio) >= 2) {
        styleInsights.push(`Great versatile ratio of ${tops} tops to ${bottoms} bottoms gives you over ${tops * bottoms} distinct combinations.`);
      }
    }

    if (footwear >= 2) {
      styleInsights.push('Your footwear lineup seamlessly bridges casual comfort with smart-casual elevation.');
    } else if (footwear === 1) {
      styleInsights.push('Adding a pair of brown leather loafers or clean white sneakers will expand your outfit versatility.');
    }

    return {
      total: activeItems.length,
      tops,
      bottoms,
      layers,
      footwear,
      accessories,
      favorites,
      archived,
      mostWornItem,
      leastWornItem,
      dominantColors,
      styleInsights,
    };
  },
};
