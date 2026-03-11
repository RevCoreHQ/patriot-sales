'use client';

import { create } from 'zustand';
import type { Quote, QuoteStatus } from '@/types';
import { getQuotes, saveQuote, deleteQuote } from '@/lib/storage';

interface QuotesStore {
  quotes: Quote[];
  initialized: boolean;
  init: () => void;
  save: (quote: Quote) => void;
  remove: (id: string) => void;
  updateStatus: (id: string, status: QuoteStatus) => void;
  sign: (id: string, signatureData: string, signedBy: string) => void;
  getById: (id: string) => Quote | undefined;
}

export const useQuotesStore = create<QuotesStore>((set, get) => ({
  quotes: [],
  initialized: false,

  init: () => {
    const quotes = getQuotes();
    set({ quotes, initialized: true });
  },

  save: (quote: Quote) => {
    saveQuote(quote);
    const quotes = getQuotes();
    set({ quotes });
  },

  remove: (id: string) => {
    deleteQuote(id);
    set((state) => ({ quotes: state.quotes.filter((q) => q.id !== id) }));
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

  getById: (id: string) => {
    return get().quotes.find((q) => q.id === id);
  },
}));
