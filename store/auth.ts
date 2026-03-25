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

// ─── localStorage helpers (fallback / cache) ────────────────────────────────

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
    const r = sessionStorage.getItem(SESSION_KEY);
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

function saveSession(user: { id: string; name: string; role: UserRole } | null) {
  if (!isClient()) return;
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
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

const DEFAULT_ADMIN: AppUser = {
  id: 'default-admin',
  name: 'Admin',
  pin: '1234',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

interface AuthStore {
  users: AppUser[];
  currentUser: { id: string; name: string; role: UserRole } | null;
  orgId: string | null;
  supabaseReady: boolean;
  initialized: boolean;
  init: () => void;
  login: (name: string, pin: string) => boolean;
  logout: () => void;
  addUser: (name: string, pin: string, role: UserRole) => AppUser;
  removeUser: (id: string) => void;
  updateUser: (id: string, updates: Partial<Pick<AppUser, 'name' | 'pin' | 'role'>>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  users: [],
  currentUser: null,
  orgId: null,
  supabaseReady: false,
  initialized: false,

  init: () => {
    // 1. Start with cached / local data immediately
    const cachedOrgId = loadOrgId();
    const session = loadSession();

    let users = loadCachedProfiles();
    if (users.length === 0) {
      users = loadUsersLocal();
    }
    if (users.length === 0) {
      users = [DEFAULT_ADMIN];
      saveUsersLocal(users);
    }

    set({ users, currentUser: session, orgId: cachedOrgId, initialized: true });

    // 2. Async: try to fetch profiles from Supabase
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
          .select('org_id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          set({ supabaseReady: false });
          return;
        }

        const orgId = profile.org_id;
        saveOrgId(orgId);

        // Fetch all profiles in this org
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('org_id', orgId);

        if (profiles && profiles.length > 0) {
          const appUsers: AppUser[] = profiles.map((p) => ({
            id: p.id,
            name: p.name,
            pin: p.pin,
            role: p.role as UserRole,
            createdAt: p.created_at,
          }));
          cacheProfiles(appUsers);
          set({ users: appUsers, orgId, supabaseReady: true });
        } else {
          set({ orgId, supabaseReady: true });
        }
      } catch {
        // Offline — keep using cached data
        set({ supabaseReady: false });
      }
    })();
  },

  login: (name, pin) => {
    const { users } = get();
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.pin === pin);
    if (!user) return false;
    const session = { id: user.id, name: user.name, role: user.role };
    saveSession(session);
    set({ currentUser: session });
    return true;
  },

  logout: () => {
    saveSession(null);
    set({ currentUser: null });
  },

  addUser: (name, pin, role) => {
    const user: AppUser = { id: generateId(), name, pin, role, createdAt: new Date().toISOString() };
    const users = [...get().users, user];
    saveUsersLocal(users);
    cacheProfiles(users);
    set({ users });

    // Async: save to Supabase if connected
    const { orgId } = get();
    if (orgId) {
      (async () => {
        try {
          const supabase = createClient();
          await supabase.from('profiles').insert({
            id: user.id,
            org_id: orgId,
            name: user.name,
            pin: user.pin,
            role: user.role,
          });
        } catch { /* offline — local only */ }
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
