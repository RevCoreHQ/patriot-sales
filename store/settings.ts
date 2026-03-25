'use client';

import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/data/default-settings';
import { getSettings, saveSettings } from '@/lib/storage';
import { fetchSettings, upsertSettings } from '@/lib/supabase/db/settings';
import { useAuthStore } from './auth';

const CACHE_KEY = 'patriot:cache:settings';

function isClient() { return typeof window !== 'undefined'; }

function cacheSettings(settings: AppSettings) {
  if (!isClient()) return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
}

function loadCachedSettings(): AppSettings | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function mergeSettings(stored: AppSettings | null): AppSettings {
  if (!stored) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
    team: stored.team ?? DEFAULT_SETTINGS.team,
    theme: stored.theme ?? DEFAULT_SETTINGS.theme,
  };
}

interface SettingsStore {
  settings: AppSettings;
  initialized: boolean;
  init: () => void;
  update: (settings: AppSettings) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  initialized: false,

  init: () => {
    // 1. Start with localStorage (instant)
    const stored = getSettings() ?? loadCachedSettings();
    const merged = mergeSettings(stored);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', merged.theme);
    }
    set({ settings: merged, initialized: true });

    // 2. Async: try Supabase
    (async () => {
      try {
        const orgId = useAuthStore.getState().orgId;
        if (!orgId) return;

        const remote = await fetchSettings(orgId);
        if (remote) {
          const final = mergeSettings(remote);
          cacheSettings(final);
          saveSettings(final);
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', final.theme);
          }
          set({ settings: final });
        }
      } catch { /* offline — keep local */ }
    })();
  },

  update: (settings: AppSettings) => {
    saveSettings(settings);
    cacheSettings(settings);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    set({ settings });

    // Async: write to Supabase
    (async () => {
      try {
        const orgId = useAuthStore.getState().orgId;
        if (!orgId) return;
        await upsertSettings(orgId, settings);
      } catch { /* offline */ }
    })();
  },
}));
