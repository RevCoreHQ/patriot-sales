'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import type { Quote } from '@/types';
import {
  Plus, FileText, Search, X, ChevronRight,
  MoreHorizontal, Edit2, Trash2, Presentation, Bell,
  DollarSign, TrendingUp, Target, Percent,
} from 'lucide-react';

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

// ── Quote row ────────────────────────────────────────────────────────────────
function QuoteRow({ quote, onDelete }: { quote: Quote; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const needsFollowUp = quote.status === 'presented' && daysSince(quote.updatedAt) >= 3;

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 active:bg-c-surface transition-colors cursor-pointer min-h-[72px] relative"
      onClick={() => router.push(`/quotes/${quote.id}`)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold text-c-text truncate">{quote.client.name}</h3>
          {needsFollowUp && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2 py-0.5 rounded-full shrink-0">
              <Bell className="w-3 h-3" />
              {daysSince(quote.updatedAt)}d
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {quote.projectTypes.slice(0, 2).map(pt => (
            <span key={pt} className="text-[11px] bg-c-elevated text-c-text-3 px-2.5 py-1 rounded-full capitalize">
              {pt.replace(/-/g, ' ')}
            </span>
          ))}
          {quote.projectTypes.length > 2 && (
            <span className="text-[11px] text-c-text-4">+{quote.projectTypes.length - 2}</span>
          )}
          <span className="text-[11px] text-c-text-5">·</span>
          <span className="text-[11px] text-c-text-4">{formatDateShort(quote.createdAt)}</span>
        </div>
      </div>

      <StatusBadge status={quote.status} />

      <div className="text-lg font-bold text-c-text tabular-nums shrink-0 w-28 text-right">
        {formatCurrency(quote.total)}
      </div>

      {/* Overflow menu */}
      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-c-text-4 active:bg-c-elevated active:text-c-text-2 transition-colors"
        >
          <MoreHorizontal className="w-4.5 h-4.5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-c-card border border-c-border-inner rounded-2xl shadow-2xl z-20 overflow-hidden py-1">
              <button
                onClick={() => { router.push(`/presentation?id=${quote.id}`); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-c-text-2 active:bg-c-elevated transition-colors"
              >
                <Presentation className="w-4 h-4 text-c-text-4" />
                Present
              </button>
              <button
                onClick={() => { router.push(`/quotes/${quote.id}/edit`); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-c-text-2 active:bg-c-elevated transition-colors"
              >
                <Edit2 className="w-4 h-4 text-c-text-4" />
                Edit
              </button>
              <button
                onClick={() => { if (confirm('Delete this quote?')) onDelete(quote.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 active:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-c-text-5 shrink-0" />
    </div>
  );
}

// ── Filter tab ───────────────────────────────────────────────────────────────
function FilterTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 h-12 px-5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.97] ${
        active
          ? 'bg-amber-500/12 text-amber-400 border border-amber-500/25'
          : 'bg-c-card text-c-text-3 border border-c-border active:bg-c-surface'
      }`}
    >
      {label}
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
        active ? 'bg-amber-500/20 text-amber-400' : 'bg-c-elevated text-c-text-5'
      }`}>
        {count}
      </span>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function QuotesDashboardPage() {
  const { quotes, init, remove } = useQuotesStore();
  const { projects, init: initProjects } = useProjectsStore();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    init();
    initProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let result = filter === 'all' ? quotes : quotes.filter(q => q.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(quote =>
        quote.client.name.toLowerCase().includes(q) ||
        (quote.client.address ?? '').toLowerCase().includes(q) ||
        quote.projectTypes.some(pt => pt.replace(/-/g, ' ').includes(q))
      );
    }
    return result;
  }, [quotes, filter, search]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonth = quotes.filter(q => q.createdAt >= monthStart);
  const openPipeline = quotes.filter(q => q.status === 'draft' || q.status === 'presented');
  const presented = quotes.filter(q => q.status !== 'draft');
  const accepted = quotes.filter(q => q.status === 'accepted');

  const stats = {
    thisMonth: thisMonth.length,
    pipeline: openPipeline.reduce((s, q) => s + q.total, 0),
    closeRate: presented.length > 0 ? Math.round((accepted.length / presented.length) * 100) : 0,
    wonRevenue: accepted.reduce((s, q) => s + q.total, 0),
  };

  const filterCounts: Record<string, number> = {
    all: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    presented: quotes.filter(q => q.status === 'presented').length,
    accepted: accepted.length,
    lost: quotes.filter(q => q.status === 'lost').length,
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-c-text tracking-tight">Quotes</h1>
          <Link href="/quotes/new">
            <Button size="lg" className="gap-2.5">
              <Plus className="w-5 h-5" />
              New Quote
            </Button>
          </Link>
        </div>

        {/* Metrics — single row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'This Month', value: String(stats.thisMonth), icon: TrendingUp, color: 'text-blue-400' },
            { label: 'Pipeline', value: formatCurrency(stats.pipeline), icon: DollarSign, color: 'text-amber-400' },
            { label: 'Close Rate', value: `${stats.closeRate}%`, icon: Target, color: 'text-emerald-400' },
            { label: 'Won Revenue', value: formatCurrency(stats.wonRevenue), icon: Percent, color: 'text-purple-400' },
          ].map(m => (
            <div key={m.label} className="rounded-2xl border border-c-border bg-c-card px-5 py-4">
              <div className="text-[11px] font-medium text-c-text-4 uppercase tracking-wider mb-1.5">{m.label}</div>
              <div className={`text-xl font-bold ${m.color} tracking-tight`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-c-text-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients, addresses, project types…"
              className="w-full h-12 pl-11 pr-10 bg-c-card border border-c-border rounded-2xl text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-c-text-4 active:text-c-text transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(['all', 'draft', 'presented', 'accepted', 'lost'] as const).map(f => (
              <FilterTab
                key={f}
                label={f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                count={filterCounts[f]}
                active={filter === f}
                onClick={() => setFilter(f)}
              />
            ))}
          </div>
        </div>

        {/* Quote list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-c-border bg-c-card rounded-2xl text-center">
            <FileText className="w-12 h-12 text-c-text-5 mb-4" />
            <div className="text-c-text-3 font-medium text-base">
              {search ? `No quotes match "${search}"` : 'No quotes found'}
            </div>
            <div className="text-c-text-4 text-sm mt-1 mb-6">
              {search
                ? 'Try a different name or project type.'
                : filter === 'all'
                  ? 'Create your first quote to get started.'
                  : `No ${filter} quotes yet.`}
            </div>
            {!search && (
              <Link href="/quotes/new">
                <Button size="md" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Quote
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-c-border bg-c-card overflow-hidden divide-y divide-c-border-inner">
            {filtered.map(q => (
              <QuoteRow key={q.id} quote={q} onDelete={remove} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
