import { randomUUID } from 'crypto';
import {
  User,
  UserProfile,
  WardrobeItem,
  Outfit,
  OutfitFeedback,
  WardrobeStats,
  MainCategory,
  LearnedStyleProfile,
} from '@/lib/types';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';
import { SAMPLE_INDIAN_WARDROBE } from '@/lib/ai/sampleWardrobe';
import { buildLearnedStyleProfile } from '@/lib/ai/personalStyleEngine';
import { normalizeMobileNumber } from '@/lib/auth/mobile';

// Strict Isolated User Store for local state / caching
interface IsolatedStore {
  users: Map<string, User>; // id -> User
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
  // USER AUTHENTICATION & SYNC (GOOGLE OAUTH / SUPABASE AUTH IDENTITY)
  // ============================================================================

  /**
   * Look up an authenticated user by their unique UUID in Supabase Auth & public.users table
   */
  async findUserById(id: string): Promise<User | null> {
    if (!id) return null;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: dbUser, error: dbErr } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        let authEmail = '';
        let authName = '';
        let authMobile = '';
        let authAge: number | undefined = undefined;
        let authAvatar = '';

        try {
          const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(id);
          if (!authErr && authData?.user) {
            authEmail = authData.user.email || '';
            authName =
              authData.user.user_metadata?.name ||
              authData.user.user_metadata?.full_name ||
              authEmail.split('@')[0] ||
              'Member';
            authMobile = authData.user.user_metadata?.mobile_number || '';
            if (authData.user.user_metadata?.age) {
              authAge = Number(authData.user.user_metadata.age);
            }
            authAvatar =
              authData.user.user_metadata?.avatar_url ||
              authData.user.user_metadata?.picture ||
              '';
          }
        } catch {
          // Ignore auth admin error
        }

        if (!dbErr && dbUser) {
          const finalEmail = dbUser.email || authEmail || '';
          const user: User = {
            id: dbUser.id,
            email: finalEmail,
            name: dbUser.name || authName || 'Member',
            mobile_number: dbUser.mobile_number || authMobile || '',
            age: authAge,
            avatar_url: authAvatar,
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at,
          };

          // If dbUser doesn't have email stored in public.users yet but authEmail is known, backfill it
          if (!dbUser.email && authEmail) {
            try {
              await supabaseAdmin.from('users').update({ email: authEmail }).eq('id', dbUser.id);
            } catch {
              // Ignore backfill error if column does not exist yet
            }
          }

          dbStore.users.set(user.id, user);
          return user;
        } else if (authEmail) {
          // If auth user exists but not in public.users, create it
          const user: User = {
            id,
            email: authEmail,
            name: authName || 'Member',
            mobile_number: authMobile || '',
            age: authAge,
            avatar_url: authAvatar,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          try {
            await supabaseAdmin.from('users').upsert(
              {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile_number: user.mobile_number || '',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          } catch (syncErr) {
            console.warn('Auto-sync public.users error:', syncErr);
          }
          dbStore.users.set(user.id, user);
          return user;
        }
      } catch (err) {
        console.warn('Supabase findUserById error:', err);
      }
    }

    const cached = dbStore.users.get(id);
    if (cached) return cached;

    return null;
  },

  /**
   * Sync Google OAuth authenticated user into public.users and ensure initial profile exists
   */
  async syncUserFromAuth(authUser: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      mobile_number?: string;
      age?: number;
      avatar_url?: string;
      picture?: string;
    };
    created_at?: string;
  }): Promise<User> {
    const userId = authUser.id;
    const name =
      authUser.user_metadata?.name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      'Member';
    const mobileNumber = authUser.user_metadata?.mobile_number || '';
    const age = authUser.user_metadata?.age ? Number(authUser.user_metadata.age) : undefined;
    const avatarUrl =
      authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '';

    const user: User = {
      id: userId,
      email: authUser.email,
      name,
      mobile_number: mobileNumber,
      age,
      avatar_url: avatarUrl,
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.users.set(userId, user);

    if (isSupabaseConfigured && supabaseAdmin) {
      // 1. Sync public.users
      try {
        await supabaseAdmin.from('users').upsert(
          {
            id: userId,
            name,
            email: authUser.email || '',
            mobile_number: mobileNumber || '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('syncUserFromAuth public.users error:', err);
      }

      // 2. Check if profile already exists in public.profiles
      try {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, profile_completed')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingProfile) {
          // Create initial clean empty profile (NEVER pre-fill user measurements or preferences)
          await supabaseAdmin.from('profiles').insert({
            user_id: userId,
            city: null,
            height: null,
            weight: null,
            skin_tone: null,
            preferred_fit: null,
            favorite_colors: [],
            avoided_colors: [],
            style_preferences: [],
            comfort_preference: null,
            typical_occasions: [],
            profile_completed: false,
          });
        }
      } catch (err) {
        console.warn('syncUserFromAuth profile creation error:', err);
      }
    }

    return user;
  },

  // ============================================================================
  // USER PROFILES
  // ============================================================================

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    let profileData: any = null;
    let userRecord: User | null = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const [profileRes, userRes] = await Promise.all([
          supabaseAdmin.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          this.findUserById(userId),
        ]);

        if (!profileRes.error && profileRes.data) {
          profileData = profileRes.data;
        }
        userRecord = userRes;
      } catch (err) {
        console.warn('Supabase getUserProfile note:', err);
      }
    }

    if (!userRecord) {
      userRecord = dbStore.users.get(userId) || null;
    }

    if (profileData) {
      const prof: UserProfile = {
        id: profileData.id,
        user_id: userId,
        email: userRecord?.email || '',
        name: userRecord?.name || '',
        full_name: userRecord?.name || '',
        mobile_number: userRecord?.mobile_number || '',
        age: userRecord?.age,
        height: profileData.height || undefined,
        weight: profileData.weight || undefined,
        body_build: profileData.body_build || undefined,
        body_scan_confidence: profileData.body_scan_confidence !== undefined && profileData.body_scan_confidence !== null ? Number(profileData.body_scan_confidence) : undefined,
        skin_tone: profileData.skin_tone || undefined,
        skin_scan_confidence: profileData.skin_scan_confidence !== undefined && profileData.skin_scan_confidence !== null ? Number(profileData.skin_scan_confidence) : undefined,
        preferred_fit: profileData.preferred_fit || undefined,
        favorite_colors: Array.isArray(profileData.favorite_colors) ? profileData.favorite_colors : [],
        avoided_colors: Array.isArray(profileData.avoided_colors) ? profileData.avoided_colors : [],
        style_preferences: Array.isArray(profileData.style_preferences) ? profileData.style_preferences : [],
        comfort_preference: profileData.comfort_preference || undefined,
        typical_occasions: Array.isArray(profileData.typical_occasions) ? profileData.typical_occasions : [],
        city: profileData.city || undefined,
        profile_completed: Boolean(profileData.profile_completed),
        created_at: profileData.created_at || new Date().toISOString(),
        updated_at: profileData.updated_at || new Date().toISOString(),
      };
      dbStore.profiles.set(userId, prof);
      return prof;
    }

    const cached = dbStore.profiles.get(userId);
    if (cached) {
      return {
        ...cached,
        email: userRecord?.email || cached.email || '',
        name: userRecord?.name || cached.name || '',
        full_name: userRecord?.name || cached.full_name || '',
        mobile_number: userRecord?.mobile_number || cached.mobile_number || '',
        age: userRecord?.age || cached.age,
      };
    }

    // Return clean empty profile if not found
    const defaultProfile: UserProfile = {
      id: generateId(),
      user_id: userId,
      email: userRecord?.email || '',
      name: userRecord?.name || '',
      full_name: userRecord?.name || '',
      mobile_number: userRecord?.mobile_number || '',
      age: userRecord?.age,
      city: undefined,
      height: undefined,
      weight: undefined,
      skin_tone: undefined,
      preferred_fit: undefined,
      favorite_colors: [],
      avoided_colors: [],
      style_preferences: [],
      comfort_preference: undefined,
      typical_occasions: [],
      profile_completed: false,
      created_at: new Date().toISOString(),
    };
    dbStore.profiles.set(userId, defaultProfile);
    return defaultProfile;
  },

  async upsertUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);

    const cleanMobile = profileData.mobile_number
      ? normalizeMobileNumber(profileData.mobile_number) || profileData.mobile_number
      : existing?.mobile_number || '';

    const preferredName = (profileData.name || profileData.full_name || existing?.name || existing?.full_name || '').trim();
    const userAge = profileData.age !== undefined ? Number(profileData.age) : existing?.age;

    const updated: UserProfile = {
      id: existing?.id || generateId(),
      user_id: userId,
      email: existing?.email || profileData.email || '',
      name: preferredName,
      full_name: preferredName,
      mobile_number: cleanMobile,
      age: userAge,
      height: profileData.height !== undefined ? profileData.height : existing?.height,
      weight: profileData.weight !== undefined ? profileData.weight : existing?.weight,
      body_build: profileData.body_build !== undefined ? profileData.body_build : existing?.body_build,
      body_scan_confidence: profileData.body_scan_confidence !== undefined ? profileData.body_scan_confidence : existing?.body_scan_confidence,
      skin_tone: profileData.skin_tone !== undefined ? profileData.skin_tone : existing?.skin_tone,
      skin_scan_confidence: profileData.skin_scan_confidence !== undefined ? profileData.skin_scan_confidence : existing?.skin_scan_confidence,
      preferred_fit: profileData.preferred_fit !== undefined ? profileData.preferred_fit : existing?.preferred_fit,
      favorite_colors:
        profileData.favorite_colors !== undefined
          ? profileData.favorite_colors
          : (existing?.favorite_colors || []),
      avoided_colors:
        profileData.avoided_colors !== undefined
          ? profileData.avoided_colors
          : (existing?.avoided_colors || []),
      style_preferences:
        profileData.style_preferences !== undefined
          ? profileData.style_preferences
          : (existing?.style_preferences || []),
      comfort_preference:
        profileData.comfort_preference !== undefined
          ? profileData.comfort_preference
          : existing?.comfort_preference,
      typical_occasions:
        profileData.typical_occasions !== undefined
          ? profileData.typical_occasions
          : (existing?.typical_occasions || []),
      city: profileData.city !== undefined ? profileData.city : existing?.city,
      profile_completed:
        profileData.profile_completed !== undefined
          ? profileData.profile_completed
          : (existing?.profile_completed ?? false),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      // 1. Sync public.users first (due to foreign key constraint)
      try {
        const userUpdatePayload: Record<string, any> = {
          id: userId,
          name: preferredName,
          mobile_number: cleanMobile || '',
          updated_at: new Date().toISOString(),
        };
        if (updated.email) {
          userUpdatePayload.email = updated.email;
        }

        await supabaseAdmin.from('users').upsert(
          userUpdatePayload,
          { onConflict: 'id' }
        );

        // Update auth user metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            name: preferredName,
            full_name: preferredName,
            mobile_number: cleanMobile,
            age: userAge,
          },
        });
      } catch (userSyncErr) {
        console.warn('User metadata sync note:', userSyncErr);
      }

      // 2. Update public.profiles
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .upsert(
            {
              user_id: userId,
              height: updated.height,
              weight: updated.weight,
              body_build: updated.body_build,
              body_scan_confidence: updated.body_scan_confidence,
              skin_tone: updated.skin_tone,
              skin_scan_confidence: updated.skin_scan_confidence,
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
          updated.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase upsertUserProfile note:', err);
      }
    }

    dbStore.profiles.set(userId, updated);
    dbStore.users.set(userId, {
      id: userId,
      email: updated.email,
      name: preferredName,
      mobile_number: cleanMobile,
      age: userAge,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });

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

  async deleteWardrobeItemsBatch(userId: string, itemIds: string[]): Promise<boolean> {
    if (!userId || !itemIds || itemIds.length === 0) return true;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('wardrobe_items')
          .delete()
          .eq('user_id', userId)
          .in('id', itemIds);

        if (!error) {
          const items = dbStore.wardrobe.get(userId) || [];
          const idSet = new Set(itemIds);
          dbStore.wardrobe.set(userId, items.filter((it) => !idSet.has(it.id)));
          return true;
        }
      } catch (err) {
        console.warn('Supabase deleteWardrobeItemsBatch note:', err);
      }
    }

    const items = dbStore.wardrobe.get(userId) || [];
    const idSet = new Set(itemIds);
    dbStore.wardrobe.set(userId, items.filter((it) => !idSet.has(it.id)));
    return true;
  },

  async deleteAllWardrobeItems(userId: string): Promise<boolean> {
    if (!userId) return false;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('wardrobe_items')
          .delete()
          .eq('user_id', userId);

        if (!error) {
          dbStore.wardrobe.set(userId, []);
          return true;
        }
      } catch (err) {
        console.warn('Supabase deleteAllWardrobeItems note:', err);
      }
    }

    dbStore.wardrobe.set(userId, []);
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
            custom_occasion_text: outfitData.custom_occasion_text || null,
            interpreted_occasion: outfitData.interpreted_occasion || null,
            date: outfitData.date,
            time: outfitData.time,
            location: outfitData.location,
            weather_data: outfitData.weather_data,
            title: outfitData.title,
            ai_explanation: outfitData.ai_explanation,
            style_match: outfitData.style_match,
            style_direction: outfitData.style_direction,
            is_self_styled: outfitData.is_self_styled || false,
            self_styled_analysis: outfitData.self_styled_analysis || null,
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
            is_self_styled: outfitData.is_self_styled,
            self_styled_analysis: outfitData.self_styled_analysis,
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
            custom_occasion_text: row.custom_occasion_text,
            interpreted_occasion: row.interpreted_occasion,
            date: row.date,
            time: row.time,
            location: row.location,
            weather_data: row.weather_data,
            title: row.title,
            ai_explanation: row.ai_explanation,
            style_match: row.style_match,
            style_direction: row.style_direction,
            is_self_styled: Boolean(row.is_self_styled),
            self_styled_analysis: row.self_styled_analysis || null,
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

  async getUserFeedback(userId: string): Promise<OutfitFeedback[]> {
    if (!userId) return [];

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('outfit_feedback')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) return data as OutfitFeedback[];
      } catch (err) {
        console.warn('Supabase getUserFeedback note:', err);
      }
    }

    return dbStore.feedback.get(userId) || [];
  },

  async getLearnedStyleProfile(userId: string): Promise<LearnedStyleProfile> {
    const [feedbacks, outfits, wardrobe] = await Promise.all([
      this.getUserFeedback(userId),
      this.getUserOutfits(userId),
      this.getWardrobeItems(userId, { includeArchived: true }),
    ]);

    return buildLearnedStyleProfile(userId, feedbacks, outfits, wardrobe);
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
