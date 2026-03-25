'use client';

import { create } from 'zustand';
import type { Quote, QuoteStatus } from '@/types';
import { getQuotes, saveQuote, deleteQuote as deleteQuoteLocal } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { fetchQuotes, upsertQuote, deleteQuote as deleteQuoteRemote } from '@/lib/supabase/db/quotes';
import { useAuthStore } from './auth';

const CACHE_KEY = 'patriot:cache:quotes';

function isClient() { return typeof window !== 'undefined'; }

function cacheQuotes(quotes: Quote[]) {
  if (!isClient()) return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(quotes));
}

function loadCachedQuotes(): Quote[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** Write to both localStorage + Supabase (fire-and-forget). */
function persistQuote(quote: Quote) {
  saveQuote(quote);
  const orgId = useAuthStore.getState().orgId;
  if (orgId) {
    upsertQuote(quote, orgId).catch(() => { /* offline */ });
  }
}

interface QuotesStore {
  quotes: Quote[];
  initialized: boolean;
  init: () => void;
  save: (quote: Quote) => void;
  remove: (id: string) => void;
  updateStatus: (id: string, status: QuoteStatus) => void;
  sign: (id: string, signatureData: string, signedBy: string) => void;
  duplicate: (id: string) => string | undefined;
  getById: (id: string) => Quote | undefined;
  mergeFromRemote: (remote: Quote) => void;
  removeFromRemote: (id: string) => void;
}

export const useQuotesStore = create<QuotesStore>((set, get) => ({
  quotes: [],
  initialized: false,

  init: () => {
    // 1. Load from localStorage instantly
    let quotes = getQuotes();
    if (quotes.length === 0) {
      quotes = loadCachedQuotes();
    }
    set({ quotes, initialized: true });

    // 2. Async: fetch from Supabase
    (async () => {
      try {
        const orgId = useAuthStore.getState().orgId;
        if (!orgId) return;

        const remote = await fetchQuotes(orgId);
        if (remote.length > 0) {
          cacheQuotes(remote);
          // Also update legacy localStorage so seedSampleData doesn't re-seed
          remote.forEach((q) => saveQuote(q));
          set({ quotes: remote });
        }
      } catch { /* offline */ }
    })();
  },

  save: (quote: Quote) => {
    persistQuote(quote);
    const quotes = getQuotes();
    cacheQuotes(quotes);
    set({ quotes });
  },

  remove: (id: string) => {
    deleteQuoteLocal(id);
    set((state) => {
      const quotes = state.quotes.filter((q) => q.id !== id);
      cacheQuotes(quotes);
      return { quotes };
    });

    // Async: delete from Supabase
    deleteQuoteRemote(id).catch(() => { /* offline */ });
  },

  updateStatus: (id: string, status: QuoteStatus) => {
    const { quotes, save } = get();
    const quote = quotes.find((q) => q.id === id);
    if (!quote) return;
    const updated: Quote = {
      ...quote,
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'presented' ? { presentedAt: new Date().toISOString() } : {}),
    };
    save(updated);
  },

  sign: (id: string, signatureData: string, signedBy: string) => {
    const { quotes, save } = get();
    const quote = quotes.find((q) => q.id === id);
    if (!quote) return;
    const updated: Quote = {
      ...quote,
      status: 'accepted',
      signatureData,
      signedBy,
      signedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save(updated);
  },

  duplicate: (id: string) => {
    const quote = get().quotes.find((q) => q.id === id);
    if (!quote) return undefined;
    const now = new Date().toISOString();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    const newQuote: Quote = {
      ...structuredClone(quote),
      id: generateId(),
      status: 'draft',
      signatureData: undefined,
      signedAt: undefined,
      signedBy: undefined,
      presentedAt: undefined,
      createdAt: now,
      updatedAt: now,
      validUntil: validUntil.toISOString(),
      internalNotes: quote.internalNotes
        ? `Duplicated from quote. ${quote.internalNotes}`
        : 'Duplicated from previous quote.',
    };
    const { save } = get();
    save(newQuote);
    return newQuote.id;
  },

  getById: (id: string) => {
    return get().quotes.find((q) => q.id === id);
  },

  // ─── Realtime helpers ──────────────────────────────────────────────────────
  mergeFromRemote: (remote: Quote) => {
    set((state) => {
      const existing = state.quotes.findIndex((q) => q.id === remote.id);
      let quotes: Quote[];
      if (existing >= 0) {
        quotes = [...state.quotes];
        quotes[existing] = remote;
      } else {
        quotes = [remote, ...state.quotes];
      }
      cacheQuotes(quotes);
      return { quotes };
    });
  },

  removeFromRemote: (id: string) => {
    set((state) => {
      const quotes = state.quotes.filter((q) => q.id !== id);
      cacheQuotes(quotes);
      return { quotes };
    });
  },
}));
