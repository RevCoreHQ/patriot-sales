'use client';

import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import type { Quote, Project } from '@/types';

export interface DerivedClient {
  name: string;
  phone: string;
  email: string;
  address: string;
  quoteCount: number;
  totalRevenue: number;
  lastQuoteDate: string;
  quotes: Quote[];
  projects: Project[];
}

export function useClients(): DerivedClient[] {
  const { quotes } = useQuotesStore();
  const { projects } = useProjectsStore();

  const clientMap = new Map<string, DerivedClient>();

  for (const q of quotes) {
    const key = q.client.phone || q.client.email || q.client.name;
    if (!key) continue;

    const existing = clientMap.get(key);
    if (existing) {
      existing.quoteCount++;
      existing.totalRevenue += q.status === 'accepted' ? q.total : 0;
      if (q.createdAt > existing.lastQuoteDate) {
        existing.lastQuoteDate = q.createdAt;
        // Update name/email/address to most recent
        existing.name = q.client.name || existing.name;
        existing.email = q.client.email || existing.email;
        existing.address = q.client.address || existing.address;
      }
      existing.quotes.push(q);
    } else {
      clientMap.set(key, {
        name: q.client.name,
        phone: q.client.phone,
        email: q.client.email,
        address: q.client.address,
        quoteCount: 1,
        totalRevenue: q.status === 'accepted' ? q.total : 0,
        lastQuoteDate: q.createdAt,
        quotes: [q],
        projects: [],
      });
    }
  }

  // Attach projects
  for (const p of projects) {
    for (const client of clientMap.values()) {
      if (client.quotes.some(q => q.id === p.quoteId)) {
        client.projects.push(p);
        break;
      }
    }
  }

  return Array.from(clientMap.values()).sort(
    (a, b) => new Date(b.lastQuoteDate).getTime() - new Date(a.lastQuoteDate).getTime()
  );
}
