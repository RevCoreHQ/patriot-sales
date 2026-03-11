'use client';

import { create } from 'zustand';
import type { AppUser, UserRole } from '@/types';
import { generateId } from '@/lib/utils';

const USERS_KEY = 'rnr:users';
const SESSION_KEY = 'rnr:session';

function isClient() { return typeof window !== 'undefined'; }

function loadUsers(): AppUser[] {
  if (!isClient()) return [];
  try {
    const r = localStorage.getItem(USERS_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function saveUsers(users: AppUser[]) {
  if (!isClient()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  initialized: false,

  init: () => {
    let users = loadUsers();
    // Seed default admin if no users exist
    if (users.length === 0) {
      users = [DEFAULT_ADMIN];
      saveUsers(users);
    }
    const session = loadSession();
    set({ users, currentUser: session, initialized: true });
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
    saveUsers(users);
    set({ users });
    return user;
  },

  removeUser: (id) => {
    const users = get().users.filter(u => u.id !== id);
    saveUsers(users);
    set({ users });
  },

  updateUser: (id, updates) => {
    const users = get().users.map(u => u.id === id ? { ...u, ...updates } : u);
    saveUsers(users);
    set({ users });
    // Update session if it's the current user
    const { currentUser } = get();
    if (currentUser?.id === id) {
      const updated = { ...currentUser, ...updates };
      saveSession(updated);
      set({ currentUser: updated });
    }
  },
}));
