'use client';

import { create } from 'zustand';

export type Theme = 'dark' | 'light';
const THEME_KEY = 'rnr:theme';

function isClient() { return typeof window !== 'undefined'; }

function applyTheme(theme: Theme) {
  if (!isClient()) return;
  document.documentElement.setAttribute('data-theme', theme);
}

interface ThemeStore {
  theme: Theme;
  init: () => void;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'dark',

  init: () => {
    if (!isClient()) return;
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    const theme = saved ?? 'dark';
    applyTheme(theme);
    set({ theme });
  },

  setTheme: (theme) => {
    if (!isClient()) return;
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
