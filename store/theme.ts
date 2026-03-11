'use client';

import { create } from 'zustand';

export type Theme = 'dark';

function applyTheme() {
  if (typeof window === 'undefined') return;
  document.documentElement.setAttribute('data-theme', 'dark');
}

interface ThemeStore {
  theme: Theme;
  init: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',

  init: () => {
    applyTheme();
    set({ theme: 'dark' });
  },
}));
