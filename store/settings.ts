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
    set({
      // Merge stored settings with defaults so new fields (e.g. notifications) get filled
      settings: stored ? { ...DEFAULT_SETTINGS, ...stored, notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications } } : DEFAULT_SETTINGS,
      initialized: true,
    });
  },

  update: (settings: AppSettings) => {
    saveSettings(settings);
    set({ settings });
  },
}));
