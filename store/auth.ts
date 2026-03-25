'use client';

import { create } from 'zustand';
import type { AppUser, UserRole } from '@/types';
import { generateId } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const USERS_KEY = 'patriot:users';
const SESSION_KEY = 'patriot:session';
const PROFILES_CACHE_KEY = 'patriot:cache:profiles';
const ORG_ID_KEY = 'patriot:org_id';

function isClient() { return typeof window !== 'undefined'; }

function loadUsersLocal(): AppUser[] {
  if (!isClient()) return [];
  try {
    const r = localStorage.getItem(USERS_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function saveUsersLocal(users: AppUser[]) {
  if (!isClient()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function cacheProfiles(users: AppUser[]) {
  if (!isClient()) return;
  localStorage.setItem(PROFILES_CACHE_KEY, JSON.stringify(users));
}

function loadCachedProfiles(): AppUser[] {
  if (!isClient()) return [];
  try {
    const r = localStorage.getItem(PROFILES_CACHE_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function loadSession(): { id: string; name: string; role: UserRole } | null {
  if (!isClient()) return null;
  try {
    const r = localStorage.getItem(SESSION_KEY);
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

function saveSession(user: { id: string; name: string; role: UserRole } | null) {
  if (!isClient()) return;
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function loadOrgId(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(ORG_ID_KEY);
}

function saveOrgId(orgId: string) {
  if (!isClient()) return;
  localStorage.setItem(ORG_ID_KEY, orgId);
}

interface AuthStore {
  users: AppUser[];
  currentUser: { id: string; name: string; role: UserRole } | null;
  orgId: string | null;
  supabaseReady: boolean;
  initialized: boolean;
  init: () => void;
  logout: () => void;
  addUser: (name: string, role: UserRole) => AppUser;
  removeUser: (id: string) => void;
  updateUser: (id: string, updates: Partial<Pick<AppUser, 'name' | 'role'>>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  users: [],
  currentUser: null,
  orgId: null,
  supabaseReady: false,
  initialized: false,

  init: () => {
    // Start with cached data immediately
    const cachedOrgId = loadOrgId();
    const session = loadSession();
    const users = loadCachedProfiles().length > 0 ? loadCachedProfiles() : loadUsersLocal();

    set({ users, currentUser: session, orgId: cachedOrgId, initialized: true });

    // Async: fetch from Supabase + auto-login from session
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          set({ supabaseReady: false });
          return;
        }

        // Get profile to find org_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile) {
          set({ supabaseReady: false });
          return;
        }

        const orgId = profile.org_id;
        saveOrgId(orgId);

        // Auto-set current user from Supabase profile
        const currentUser = {
          id: profile.id,
          name: profile.name,
          role: profile.role as UserRole,
        };
        saveSession(currentUser);

        // Fetch all profiles in this org
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('org_id', orgId);

        if (profiles && profiles.length > 0) {
          const appUsers: AppUser[] = profiles.map((p) => ({
            id: p.id,
            name: p.name,
            pin: p.pin ?? '0000',
            role: p.role as UserRole,
            createdAt: p.created_at,
          }));
          cacheProfiles(appUsers);
          set({ users: appUsers, currentUser, orgId, supabaseReady: true });
        } else {
          set({ currentUser, orgId, supabaseReady: true });
        }
      } catch {
        set({ supabaseReady: false });
      }
    })();
  },

  logout: () => {
    saveSession(null);
    set({ currentUser: null });
    // Also sign out of Supabase
    (async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch { /* offline */ }
    })();
  },

  addUser: (name, role) => {
    const user: AppUser = { id: generateId(), name, pin: '0000', role, createdAt: new Date().toISOString() };
    const users = [...get().users, user];
    saveUsersLocal(users);
    cacheProfiles(users);
    set({ users });

    const { orgId } = get();
    if (orgId) {
      (async () => {
        try {
          const supabase = createClient();
          await supabase.from('profiles').insert({
            id: user.id,
            org_id: orgId,
            name: user.name,
            pin: '0000',
            role: user.role,
          });
        } catch { /* offline */ }
      })();
    }

    return user;
  },

  removeUser: (id) => {
    const users = get().users.filter(u => u.id !== id);
    saveUsersLocal(users);
    cacheProfiles(users);
    set({ users });

    (async () => {
      try {
        const supabase = createClient();
        await supabase.from('profiles').delete().eq('id', id);
      } catch { /* offline */ }
    })();
  },

  updateUser: (id, updates) => {
    const users = get().users.map(u => u.id === id ? { ...u, ...updates } : u);
    saveUsersLocal(users);
    cacheProfiles(users);
    set({ users });
    const { currentUser } = get();
    if (currentUser?.id === id) {
      const updated = { ...currentUser, ...updates };
      saveSession(updated);
      set({ currentUser: updated });
    }

    (async () => {
      try {
        const supabase = createClient();
        await supabase.from('profiles').update(updates).eq('id', id);
      } catch { /* offline */ }
    })();
  },
}));
