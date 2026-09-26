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
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';
import { SAMPLE_INDIAN_WARDROBE } from '@/lib/ai/sampleWardrobe';
import {
  normalizeMobileNumber,
  mobileToSupabaseEmail,
  pinToSupabasePassword,
  hashPin,
  verifyPin,
} from '@/lib/auth/pin';

// Strict Isolated User Store for local state / caching
interface IsolatedStore {
  users: Map<string, User>; // id -> User
  usersByMobile: Map<string, string>; // clean mobile -> id
  profiles: Map<string, UserProfile>; // userId -> UserProfile
  wardrobe: Map<string, WardrobeItem[]>; // userId -> items[]
  outfits: Map<string, Outfit[]>; // userId -> outfits[]
  feedback: Map<string, OutfitFeedback[]>; // userId -> feedback[]
}

declare global {
  var __aureve_db__: IsolatedStore | undefined;
}

const dbStore: IsolatedStore = global.__aureve_db__ || {
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

function generateId(): string {
  try {
    return randomUUID();
  } catch {
    return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const Repository = {
  // ============================================================================
  // USER AUTHENTICATION & LOOKUP
  // ============================================================================

  /**
   * Look up an existing user by their 10-digit mobile number in Supabase Auth & public.users table
   */
  async findUserByMobile(mobile: string): Promise<User | null> {
    const cleanMobile = normalizeMobileNumber(mobile);
    if (!cleanMobile) return null;

    if (isSupabaseConfigured && supabaseAdmin) {
      // 1. Check users table in Supabase first
      try {
        const { data: dbUser, error: dbErr } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('mobile_number', cleanMobile)
          .maybeSingle();

        if (!dbErr && dbUser) {
          return {
            id: dbUser.id,
            name: dbUser.name,
            mobile_number: dbUser.mobile_number,
            pin_hash: dbUser.pin_hash,
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase findUserByMobile table error:', err);
      }

      // 2. Check Supabase Auth admin
      try {
        const email = mobileToSupabaseEmail(cleanMobile);
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (!error && data?.users) {
          const found = data.users.find(
            (u) =>
              u.email === email ||
              u.user_metadata?.mobile_number === cleanMobile
          );

          if (found) {
            const user: User = {
              id: found.id,
              name: found.user_metadata?.name || 'Gentleman',
              mobile_number: found.user_metadata?.mobile_number || cleanMobile,
              created_at: found.created_at,
              updated_at: found.updated_at,
            };

            // Auto-sync into public.users
            try {
              await supabaseAdmin.from('users').upsert(
                {
                  id: user.id,
                  name: user.name,
                  mobile_number: user.mobile_number,
                  pin_hash: '',
                },
                { onConflict: 'mobile_number' }
              );
            } catch (syncErr) {
              console.warn('Auto-sync public.users error:', syncErr);
            }

            return user;
          }
        }
      } catch (err) {
        console.warn('Supabase Auth findUserByMobile error:', err);
      }
    }

    return null;
  },

  /**
   * Look up an authenticated user by their unique UUID in Supabase Auth & public.users table
   */
  async findUserById(id: string): Promise<User | null> {
    if (!id) return null;

    if (isSupabaseConfigured && supabaseAdmin) {
      // 1. Check users table in Supabase
      try {
        const { data: dbUser, error: dbErr } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!dbErr && dbUser) {
          return {
            id: dbUser.id,
            name: dbUser.name,
            mobile_number: dbUser.mobile_number,
            pin_hash: dbUser.pin_hash,
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase findUserById table error:', err);
      }

      // 2. Check Supabase Auth admin
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
        if (!error && data?.user) {
          const u = data.user;
          return {
            id: u.id,
            name: u.user_metadata?.name || 'Gentleman',
            mobile_number: u.user_metadata?.mobile_number || '',
            created_at: u.created_at,
            updated_at: u.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase Auth findUserById error:', err);
      }
    }

    return null;
  },

  /**
   * Verify user credentials (mobile + PIN) against Supabase Auth
   */
  async verifyCredentials(mobile: string, pin: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanMobile = normalizeMobileNumber(mobile);
    if (!cleanMobile) {
      return { success: false, error: 'Invalid mobile number.' };
    }

    if (isSupabaseConfigured && supabase) {
      const email = mobileToSupabaseEmail(cleanMobile);
      const password = pinToSupabasePassword(pin);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data?.user) {
          const user: User = {
            id: data.user.id,
            name: data.user.user_metadata?.name || 'Gentleman',
            mobile_number: data.user.user_metadata?.mobile_number || cleanMobile,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at,
          };
          dbStore.users.set(user.id, user);
          dbStore.usersByMobile.set(cleanMobile, user.id);
          return { success: true, user };
        }
      } catch (err) {
        console.warn('Supabase signInWithPassword exception:', err);
      }
    }

    // Check database / fallback store if Supabase Auth check didn't succeed
    const user = await this.findUserByMobile(cleanMobile);
    if (!user) {
      return { success: false, error: 'No account found with this mobile number. Please register your account.' };
    }

    if (user.pin_hash) {
      const isValid = await verifyPin(pin, user.pin_hash);
      if (isValid) {
        return { success: true, user };
      }
    }

    return { success: false, error: 'Invalid mobile number or PIN.' };
  },

  /**
   * Register a new user in Supabase Auth, create default profile, and seed starter wardrobe
   */
  async createUser(name: string, mobileNumber: string, pin: string): Promise<User> {
    const cleanMobile = normalizeMobileNumber(mobileNumber);
    const pinHash = await hashPin(pin);

    if (isSupabaseConfigured && supabaseAdmin) {
      const email = mobileToSupabaseEmail(cleanMobile);
      const password = pinToSupabasePassword(pin);

      // Create in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name.trim(),
          mobile_number: cleanMobile,
        },
      });

      if (authError) {
        throw new Error(authError.message || 'Could not create account in Supabase Auth');
      }

      const createdUser: User = {
        id: authData.user.id,
        name: name.trim(),
        mobile_number: cleanMobile,
        pin_hash: pinHash,
        created_at: authData.user.created_at,
        updated_at: authData.user.updated_at,
      };

      dbStore.users.set(createdUser.id, createdUser);
      dbStore.usersByMobile.set(cleanMobile, createdUser.id);

      // 1. Sync with public.users table FIRST (primary user row)
      try {
        const { error: uErr } = await supabaseAdmin.from('users').upsert(
          {
            id: createdUser.id,
            name: createdUser.name,
            mobile_number: createdUser.mobile_number,
            pin_hash: pinHash,
          },
          { onConflict: 'mobile_number' }
        );
        if (uErr) console.error('Supabase public.users insertion error:', uErr);
      } catch (uErr) {
        console.warn('Supabase public.users note:', uErr);
      }

      // 2. Create default profile in public.profiles table SECOND (references users.id)
      try {
        const { error: pErr } = await supabaseAdmin.from('profiles').upsert(
          {
            user_id: createdUser.id,
            city: 'Mumbai',
            preferred_fit: 'Regular',
            favorite_colors: ['Navy Blue', 'White', 'Olive Green', 'Charcoal Grey'],
            avoided_colors: ['Neon Green', 'Bright Orange'],
            style_preferences: ['Smart Casual', 'Minimal', 'Modern Indian'],
            comfort_preference: 'Balanced',
            typical_occasions: ['Office', 'Casual outings', 'Dates'],
            profile_completed: false,
          },
          { onConflict: 'user_id' }
        );
        if (pErr) console.error('Supabase profile creation error:', pErr);
      } catch (pErr) {
        console.warn('Supabase profile creation note:', pErr);
      }

      return createdUser;
    }

    // Local fallback store
    const userId = generateId();
    const newUser: User = {
      id: userId,
      name: name.trim(),
      mobile_number: cleanMobile,
      pin_hash: pinHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.users.set(newUser.id, newUser);
    dbStore.usersByMobile.set(cleanMobile, newUser.id);

    // Default profile
    const defaultProfile: UserProfile = {
      id: generateId(),
      user_id: newUser.id,
      city: 'Mumbai',
      height: "5'10\"",
      weight: '72 kg',
      skin_tone: 'Warm Olive',
      preferred_fit: 'Regular',
      favorite_colors: ['Navy Blue', 'White', 'Olive Green', 'Charcoal Grey', 'Beige'],
      avoided_colors: ['Neon Green', 'Bright Orange'],
      style_preferences: ['Smart Casual', 'Minimal', 'Modern Indian'],
      comfort_preference: 'Balanced',
      typical_occasions: ['Office', 'Casual outings', 'Dates'],
      profile_completed: false,
      created_at: new Date().toISOString(),
    };
    dbStore.profiles.set(newUser.id, defaultProfile);

    return newUser;
  },

  // ============================================================================
  // USER PROFILES
  // ============================================================================

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          const prof: UserProfile = {
            ...(data as UserProfile),
            profile_completed: Boolean(data.profile_completed),
          };
          dbStore.profiles.set(userId, prof);
          return prof;
        }
      } catch (err) {
        console.warn('Supabase getUserProfile note:', err);
      }
    }

    const cached = dbStore.profiles.get(userId);
    if (cached) return cached;

    // Return sensible default profile
    const defaultProfile: UserProfile = {
      id: generateId(),
      user_id: userId,
      city: 'Mumbai',
      height: "5'10\"",
      weight: '72 kg',
      skin_tone: 'Warm Olive',
      preferred_fit: 'Regular',
      favorite_colors: ['Navy Blue', 'White', 'Olive Green', 'Charcoal Grey', 'Beige'],
      avoided_colors: ['Neon Green', 'Bright Orange'],
      style_preferences: ['Smart Casual', 'Minimal', 'Modern Indian'],
      comfort_preference: 'Balanced',
      typical_occasions: ['Office', 'Casual outings', 'Dates'],
      profile_completed: false,
      created_at: new Date().toISOString(),
    };
    dbStore.profiles.set(userId, defaultProfile);
    return defaultProfile;
  },

  async upsertUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    const updated: UserProfile = {
      id: existing?.id || generateId(),
      user_id: userId,
      height: profileData.height ?? existing?.height ?? "5'10\"",
      weight: profileData.weight ?? existing?.weight ?? '72 kg',
      skin_tone: profileData.skin_tone ?? existing?.skin_tone ?? 'Warm Olive',
      preferred_fit: profileData.preferred_fit ?? existing?.preferred_fit ?? 'Regular',
      favorite_colors: profileData.favorite_colors ?? existing?.favorite_colors ?? ['Navy Blue', 'White', 'Charcoal Grey'],
      avoided_colors: profileData.avoided_colors ?? existing?.avoided_colors ?? [],
      style_preferences: profileData.style_preferences ?? existing?.style_preferences ?? ['Smart Casual', 'Minimal'],
      comfort_preference: profileData.comfort_preference ?? existing?.comfort_preference ?? 'Balanced',
      typical_occasions: profileData.typical_occasions ?? existing?.typical_occasions ?? ['Office', 'Casual outings', 'Dates'],
      city: profileData.city ?? existing?.city ?? 'Mumbai',
      profile_completed: profileData.profile_completed !== undefined ? profileData.profile_completed : (existing?.profile_completed ?? false),
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
              height: updated.height,
              weight: updated.weight,
              skin_tone: updated.skin_tone,
              preferred_fit: updated.preferred_fit,
              favorite_colors: updated.favorite_colors,
              avoided_colors: updated.avoided_colors,
              style_preferences: updated.style_preferences,
              comfort_preference: updated.comfort_preference,
              typical_occasions: updated.typical_occasions,
              city: updated.city,
              profile_completed: updated.profile_completed,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select('*')
          .single();

        if (!error && data) {
          const saved: UserProfile = {
            ...(data as UserProfile),
            profile_completed: Boolean(data.profile_completed),
          };
          dbStore.profiles.set(userId, saved);
          return saved;
        }
      } catch (err) {
        console.warn('Supabase upsertUserProfile note:', err);
      }
    }

    dbStore.profiles.set(userId, updated);
    return updated;
  },

  // ============================================================================
  // WARDROBE ITEMS (STRICT USER ISOLATION BY USER_ID)
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
    if (!userId) return [];

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
          dbStore.wardrobe.set(userId, items);
          return items;
        }
      } catch (err) {
        console.warn('Supabase getWardrobeItems note:', err);
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
    if (!userId || !itemId) return null;

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
        console.warn('Supabase getWardrobeItemById note:', err);
      }
    }

    const items = dbStore.wardrobe.get(userId) || [];
    return items.find((it) => it.id === itemId) || null;
  },

  async addWardrobeItem(
    userId: string,
    item: Omit<WardrobeItem, 'id' | 'user_id' | 'created_at' | 'times_worn'>
  ): Promise<WardrobeItem> {
    const newItem: WardrobeItem = {
      id: generateId(),
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
            is_favorite: Boolean(item.is_favorite),
            is_archived: Boolean(item.is_archived),
            times_worn: 0,
          })
          .select('*')
          .single();

        if (!error && data) {
          const created = data as WardrobeItem;
          const items = dbStore.wardrobe.get(userId) || [];
          items.unshift(created);
          dbStore.wardrobe.set(userId, items);
          return created;
        }
      } catch (err) {
        console.warn('Supabase addWardrobeItem note:', err);
      }
    }

    const items = dbStore.wardrobe.get(userId) || [];
    items.unshift(newItem);
    dbStore.wardrobe.set(userId, items);
    return newItem;
  },

  async addWardrobeItemsBatch(
    userId: string,
    itemsList: Omit<WardrobeItem, 'id' | 'user_id' | 'created_at' | 'times_worn'>[]
  ): Promise<WardrobeItem[]> {
    if (!itemsList || itemsList.length === 0) return [];

    const now = new Date().toISOString();
    const rowsToInsert = itemsList.map((item) => ({
      user_id: userId,
      image_url: item.image_url,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      primary_color: item.primary_color,
      secondary_colors: item.secondary_colors || [],
      pattern: item.pattern || 'Solid',
      material: item.material || 'Cotton',
      fit: item.fit || 'Regular',
      style: item.style || 'Smart Casual',
      formality: item.formality || 'Smart Casual',
      season: item.season || ['All-Season'],
      is_favorite: Boolean(item.is_favorite),
      is_archived: Boolean(item.is_archived),
      times_worn: 0,
    }));

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('wardrobe_items')
          .insert(rowsToInsert)
          .select('*');

        if (!error && data) {
          const createdItems = data as WardrobeItem[];
          const current = dbStore.wardrobe.get(userId) || [];
          dbStore.wardrobe.set(userId, [...createdItems, ...current]);
          return createdItems;
        }
      } catch (err) {
        console.warn('Supabase addWardrobeItemsBatch error:', err);
      }
    }

    const createdFallback: WardrobeItem[] = rowsToInsert.map((row) => ({
      ...row,
      id: generateId(),
      created_at: now,
      updated_at: now,
    }));
    const current = dbStore.wardrobe.get(userId) || [];
    dbStore.wardrobe.set(userId, [...createdFallback, ...current]);
    return createdFallback;
  },

  async updateWardrobeItem(
    userId: string,
    itemId: string,
    updates: Partial<WardrobeItem>
  ): Promise<WardrobeItem | null> {
    if (!userId || !itemId) return null;

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

        if (!error && data) {
          const updated = data as WardrobeItem;
          const items = dbStore.wardrobe.get(userId) || [];
          const idx = items.findIndex((i) => i.id === itemId);
          if (idx !== -1) items[idx] = updated;
          return updated;
        }
      } catch (err) {
        console.warn('Supabase updateWardrobeItem note:', err);
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
    if (!userId || !itemId) return false;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('wardrobe_items')
          .delete()
          .eq('user_id', userId)
          .eq('id', itemId);

        if (!error) {
          const items = dbStore.wardrobe.get(userId) || [];
          dbStore.wardrobe.set(userId, items.filter((it) => it.id !== itemId));
          return true;
        }
      } catch (err) {
        console.warn('Supabase deleteWardrobeItem note:', err);
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
    if (!userId) return [];
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
    if (!userId) return;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('wardrobe_items').delete().eq('user_id', userId);
        await supabaseAdmin.from('outfits').delete().eq('user_id', userId);
        await supabaseAdmin.from('outfit_feedback').delete().eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase resetUserWardrobe note:', err);
      }
    }
    dbStore.wardrobe.set(userId, []);
    dbStore.outfits.set(userId, []);
    dbStore.feedback.set(userId, []);
  },

  // ============================================================================
  // OUTFITS & RECOMMENDATIONS (STRICT USER ISOLATION)
  // ============================================================================

  async saveOutfit(userId: string, outfitData: Omit<Outfit, 'id' | 'user_id' | 'created_at'>): Promise<Outfit> {
    const newOutfit: Outfit = {
      id: generateId(),
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
          // Insert junction items if table exists
          for (const itemRef of outfitData.items) {
            try {
              await supabaseAdmin.from('outfit_items').insert({
                outfit_id: createdOutfit.id,
                wardrobe_item_id: itemRef.wardrobe_item_id,
                role: itemRef.role,
              });
            } catch {
              // Ignore junction error if table not yet migrated
            }
          }
          const fullOutfit: Outfit = {
            ...createdOutfit,
            items: outfitData.items,
            alternative_looks: outfitData.alternative_looks,
          };
          const list = dbStore.outfits.get(userId) || [];
          list.unshift(fullOutfit);
          dbStore.outfits.set(userId, list);
          return fullOutfit;
        }
      } catch (err) {
        console.warn('Supabase saveOutfit note:', err);
      }
    }

    const outfits = dbStore.outfits.get(userId) || [];
    outfits.unshift(newOutfit);
    dbStore.outfits.set(userId, outfits);
    return newOutfit;
  },

  async getUserOutfits(userId: string): Promise<Outfit[]> {
    if (!userId) return [];

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

        if (!error && outfitRows && outfitRows.length > 0) {
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
        console.warn('Supabase getUserOutfits note:', err);
      }
    }

    const outfits = dbStore.outfits.get(userId) || [];
    const wardrobe = await this.getWardrobeItems(userId, { includeArchived: true });
    const wardrobeMap = new Map(wardrobe.map((i) => [i.id, i]));

    return outfits.map((o) => ({
      ...o,
      items: o.items.map((it) => ({
        ...it,
        item: it.item || wardrobeMap.get(it.wardrobe_item_id),
      })),
    }));
  },

  async deleteOutfit(userId: string, outfitId: string): Promise<boolean> {
    if (!userId || !outfitId) return false;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('outfits').delete().eq('user_id', userId).eq('id', outfitId);
      } catch (err) {
        console.warn('Supabase deleteOutfit note:', err);
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
      id: generateId(),
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
        console.warn('Supabase recordFeedback note:', err);
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

    // Dominant color distribution
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
