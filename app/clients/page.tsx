'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { useClients } from '@/store/clients';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { ContactActions } from '@/components/ui/ContactActions';
import { AnimatedPage } from '@/components/motion/AnimatedPage';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerList';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Search, X, ChevronRight, ChevronDown, MapPin,
} from 'lucide-react';

export default function ClientsPage() {
  const { init: initQuotes, initialized: quotesReady } = useQuotesStore();
  const { init: initProjects, initialized: projectsReady } = useProjectsStore();
  const [search, setSearch] = useState('');
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);

  useEffect(() => {
    initQuotes();
    initProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clients = useClients();

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const totalClients = clients.length;
  const totalRevenue = clients.reduce((s, c) => s + c.totalRevenue, 0);

  if (!quotesReady || !projectsReady) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <div className="skeleton h-8 w-40" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AnimatedPage className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-c-text tracking-tight">Clients</h1>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-c-border bg-c-card px-5 py-4">
            <div className="text-[11px] font-medium text-c-text-4 uppercase tracking-wider mb-1.5">Total Clients</div>
            <div className="text-xl font-bold text-blue-400 tracking-tight">
              <AnimatedNumber value={totalClients} format={(n) => String(n)} />
            </div>
          </div>
          <div className="rounded-2xl border border-c-border bg-c-card px-5 py-4">
            <div className="text-[11px] font-medium text-c-text-4 uppercase tracking-wider mb-1.5">Total Revenue</div>
            <div className="text-xl font-bold text-emerald-400 tracking-tight">
              <AnimatedNumber value={totalRevenue} format={(n) => formatCurrency(n)} />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-c-text-4 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients by name, phone, email, or address..."
            className="w-full h-12 pl-11 pr-10 bg-c-card border border-c-border rounded-2xl text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-[#C62828]/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-c-text-4 active:text-c-text">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-c-border bg-c-card rounded-2xl text-center">
            <Users className="w-12 h-12 text-c-text-5 mb-4" />
            <div className="text-c-text-3 font-medium text-base">
              {search ? `No clients match "${search}"` : 'No clients yet'}
            </div>
            <div className="text-c-text-4 text-sm mt-1">
              {search ? 'Try a different search term.' : 'Clients appear automatically when you create quotes.'}
            </div>
          </div>
        ) : (
          <StaggerContainer className="rounded-2xl border border-c-border bg-c-card overflow-hidden divide-y divide-c-border-inner">
            {filtered.map(client => {
              const isExpanded = expandedPhone === (client.phone || client.email || client.name);
              const toggleKey = client.phone || client.email || client.name;

              return (
                <StaggerItem key={toggleKey}>
                  <div>
                    <button
                      onClick={() => setExpandedPhone(isExpanded ? null : toggleKey)}
                      className="w-full flex items-center gap-4 px-5 py-4 active:bg-c-surface transition-colors min-h-[72px] text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-bold text-c-text truncate">{client.name}</h3>
                          <span className="text-[11px] bg-c-elevated text-c-text-4 px-2 py-0.5 rounded-full">
                            {client.quoteCount} quote{client.quoteCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-c-text-4">
                          {client.phone && <span>{client.phone}</span>}
                          {client.email && <span>{client.email}</span>}
                        </div>
                        {client.address && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-c-text-5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        )}
                      </div>

                      <ContactActions phone={client.phone} email={client.email} size="sm" />

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-c-text tabular-nums">
                          {client.totalRevenue > 0 ? formatCurrency(client.totalRevenue) : '—'}
                        </div>
                        <div className="text-[11px] text-c-text-4 mt-0.5">{formatDateShort(client.lastQuoteDate)}</div>
                      </div>

                      <ChevronDown className={`w-4 h-4 text-c-text-5 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 space-y-3">
                            {/* Quotes */}
                            <div>
                              <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-widest mb-2">Quotes</div>
                              <div className="space-y-1">
                                {client.quotes.map(q => (
                                  <Link
                                    key={q.id}
                                    href={`/quotes/${q.id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 bg-c-surface rounded-xl active:bg-c-elevated transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs text-c-text-2 capitalize">
                                        {q.projectTypes.slice(0, 2).map(pt => pt.replace(/-/g, ' ')).join(', ')}
                                      </span>
                                      <span className="text-[11px] text-c-text-4 ml-2">{formatDateShort(q.createdAt)}</span>
                                    </div>
                                    <StatusBadge status={q.status} />
                                    <span className="text-xs font-bold text-c-text tabular-nums">{formatCurrency(q.total)}</span>
                                    <ChevronRight className="w-3 h-3 text-c-text-5" />
                                  </Link>
                                ))}
                              </div>
                            </div>

                            {/* Projects */}
                            {client.projects.length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-widest mb-2">Projects</div>
                                <div className="space-y-1">
                                  {client.projects.map(p => (
                                    <Link
                                      key={p.id}
                                      href="/projects"
                                      className="flex items-center gap-3 px-4 py-2.5 bg-c-surface rounded-xl active:bg-c-elevated transition-colors"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <span className="text-xs text-c-text-2 capitalize">
                                          {p.projectTypes.slice(0, 2).map(pt => pt.replace(/-/g, ' ')).join(', ')}
                                        </span>
                                      </div>
                                      <span className="text-[11px] font-medium text-c-text-3 capitalize px-2 py-0.5 rounded bg-c-elevated">{p.phase.replace(/-/g, ' ')}</span>
                                      <span className="text-xs font-bold text-c-text tabular-nums">{formatCurrency(p.totalValue)}</span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </AnimatedPage>
    </AppShell>
  );
}
