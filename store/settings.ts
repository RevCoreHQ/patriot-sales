'use client';

import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/data/default-settings';
import { getSettings, saveSettings } from '@/lib/storage';

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
    const stored = getSettings();
    const merged = stored ? {
      ...DEFAULT_SETTINGS,
      ...stored,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
      team: stored.team ?? DEFAULT_SETTINGS.team,
      theme: stored.theme ?? DEFAULT_SETTINGS.theme,
    } : DEFAULT_SETTINGS;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', merged.theme);
    }
    set({ settings: merged, initialized: true });
  },

  update: (settings: AppSettings) => {
    saveSettings(settings);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    set({ settings });
  },
}));
