'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useQuotesStore } from '@/store/quotes';
import { useSettingsStore } from '@/store/settings';
import { useProjectsStore } from '@/store/projects';
import { formatCurrency, formatDateShort, isExpired } from '@/lib/utils';
import type { Quote } from '@/types';
import {
  Plus, FileText,
  Trash2, Edit2, Presentation,
  Hammer, ChevronRight,
  Search, Bell, X,
} from 'lucide-react';

// ── Metric cell ───────────────────────────────────────────────────────────────
function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="px-5 py-4">
      <div className="text-[11px] font-semibold text-c-text-4 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold text-c-text tracking-tight leading-none">{value}</div>
      {sub && <div className="text-xs text-c-text-3 mt-1.5">{sub}</div>}
    </div>
  );
}

// ── Follow-up helper ──────────────────────────────────────────────────────────
function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

// ── Status color ──────────────────────────────────────────────────────────────
const STATUS_LEFT_BORDER: Record<string, string> = {
  draft:     'var(--c-border-input)',
  presented: 'rgba(245,158,11,0.6)',
  accepted:  'rgba(34,197,94,0.6)',
  lost:      'rgba(239,68,68,0.5)',
};

// ── Quote card ────────────────────────────────────────────────────────────────
function QuoteCard({ quote, onDelete }: { quote: Quote; onDelete: (id: string) => void }) {
  const router = useRouter();
  const leftColor = STATUS_LEFT_BORDER[quote.status] ?? STATUS_LEFT_BORDER.draft;
  const needsFollowUp = quote.status === 'presented' && daysSince(quote.updatedAt) >= 3;

  return (
    <div
      className="border border-c-border bg-c-card rounded-2xl overflow-hidden active:scale-[0.995] transition-transform cursor-pointer relative"
      onClick={() => router.push(`/quotes/${quote.id}`)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: leftColor }} />

      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-c-text leading-snug truncate">{quote.client.name}</h3>
            {quote.client.address && (
              <p className="text-sm text-c-text-3 mt-1 truncate">{quote.client.address}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusBadge status={quote.status} />
            <span className="text-2xl font-bold text-c-text leading-none">{formatCurrency(quote.total)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {quote.projectTypes.map(pt => (
            <span key={pt} className="text-xs bg-c-elevated text-c-text-3 px-3 py-1.5 rounded-full capitalize border border-c-border-inner">
              {pt.replace(/-/g, ' ')}
            </span>
          ))}
          {needsFollowUp && (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-3 py-1.5 rounded-full">
              <Bell className="w-3.5 h-3.5" />
              Follow up · {daysSince(quote.updatedAt)}d ago
            </span>
          )}
        </div>

        {isExpired(quote.validUntil) && quote.status === 'draft' && (
          <div className="mt-2 text-xs text-orange-400 font-medium">Quote expired</div>
        )}
      </div>

      <div
        className="flex items-center justify-between px-5 py-3 border-t border-c-border-inner"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-xs text-c-text-4">{formatDateShort(quote.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => router.push(`/presentation?id=${quote.id}`)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-400 active:bg-amber-500/20 transition-colors"
          >
            <Presentation className="w-3.5 h-3.5" />
            Present
          </button>
          <button
            onClick={() => router.push(`/quotes/${quote.id}/edit`)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-c-text-4 active:bg-c-elevated active:text-c-text-2 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { if (confirm('Delete this quote?')) onDelete(quote.id); }}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-c-text-5 active:bg-red-500/10 active:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter pill ───────────────────────────────────────────────────────────────
function FilterPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all active:scale-[0.97] border ${
        active
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
          : 'bg-c-elevated text-c-text-3 border-c-border-inner active:bg-c-tag'
      }`}
    >
      {label}
      <span className={`text-[10px] rounded-full px-1.5 py-px font-bold ${active ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-c-text-5'}`}>
        {count}
      </span>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QuotesDashboardPage() {
  const { quotes, init, remove } = useQuotesStore();
  const { settings, init: initSettings } = useSettingsStore();
  const { projects, init: initProjects } = useProjectsStore();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    initSettings();
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
  const thisMonthWon = quotes.filter(q => q.status === 'accepted' && q.updatedAt >= monthStart);
  const openPipeline = quotes.filter(q => q.status === 'draft' || q.status === 'presented');
  const presented = quotes.filter(q => q.status !== 'draft');
  const followUpNeeded = quotes.filter(q => q.status === 'presented' && daysSince(q.updatedAt) >= 3);

  const stats = {
    monthEstimateValue: thisMonth.reduce((s, q) => s + q.total, 0),
    monthWonRevenue: thisMonthWon.reduce((s, q) => s + q.total, 0),
    closeRate: presented.length > 0 ? Math.round((quotes.filter(q => q.status === 'accepted').length / presented.length) * 100) : 0,
    pipeline: openPipeline.reduce((s, q) => s + q.total, 0),
    wonRevenue: quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total, 0),
    activeProjects: projects.filter(p => p.phase !== 'delivered').length,
    cashCollected: projects.reduce((s, p) => s + p.cashCollected, 0),
    delivered: projects.filter(p => p.phase === 'delivered').length,
  };

  const filterCounts: Record<string, number> = {
    all: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    presented: quotes.filter(q => q.status === 'presented').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    lost: quotes.filter(q => q.status === 'lost').length,
  };

  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-c-text tracking-tight">Quotes</h1>
            <p className="text-sm text-c-text-3 mt-1">{today}</p>
          </div>
          <Link href="/quotes/new">
            <Button size="lg" className="gap-2.5">
              <Plus className="w-5 h-5" />
              New Quote
            </Button>
          </Link>
        </div>

        {/* ── Metrics panel ── */}
        <div className="rounded-2xl border border-c-border bg-c-card overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-c-border-inner">
            <Metric label="Estimates this month" value={thisMonth.length} sub={formatCurrency(stats.monthEstimateValue)} />
            <Metric label="Won this month" value={thisMonthWon.length} sub={formatCurrency(stats.monthWonRevenue)} />
            <Metric label="Close rate" value={`${stats.closeRate}%`} sub={`${quotes.filter(q => q.status === 'accepted').length} of ${presented.length} presented`} />
            <Metric label="Open pipeline" value={formatCurrency(stats.pipeline)} sub={`${openPipeline.length} active quotes`} />
          </div>
          <div className="h-px bg-c-border-inner" />
          <div className="grid grid-cols-4 divide-x divide-c-border-inner">
            <Metric label="Total won revenue" value={formatCurrency(stats.wonRevenue)} />
            <Metric label="Active projects" value={stats.activeProjects} sub="In progress" />
            <Metric label="Cash collected" value={formatCurrency(stats.cashCollected)} />
            <Metric label="Projects delivered" value={stats.delivered} />
          </div>
        </div>

        {/* ── Follow-up alert banner ── */}
        {followUpNeeded.length > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3.5 bg-c-card border border-c-border rounded-xl"
            style={{ borderLeftColor: 'rgba(251,146,60,0.5)', borderLeftWidth: 2 }}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-orange-400/80 shrink-0" />
              <div>
                <div className="text-sm font-medium text-c-text">
                  {followUpNeeded.length} quote{followUpNeeded.length !== 1 ? 's' : ''} need{followUpNeeded.length === 1 ? 's' : ''} a follow-up
                </div>
                <div className="text-xs text-c-text-4 mt-0.5">
                  {followUpNeeded.map(q => q.client.name).join(', ')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setFilter('presented')}
              className="text-xs font-semibold text-orange-400/80 active:text-orange-300 transition-colors shrink-0"
            >
              View all
            </button>
          </div>
        )}

        {/* ── Active projects banner ── */}
        {stats.activeProjects > 0 && (
          <Link
            href="/projects"
            className="flex items-center justify-between px-5 py-3.5 bg-c-card border border-c-border rounded-xl active:bg-c-surface transition-colors"
            style={{ borderLeftColor: 'rgba(245,158,11,0.45)', borderLeftWidth: 2 }}
          >
            <div className="flex items-center gap-3">
              <Hammer className="w-4 h-4 text-amber-400/80 shrink-0" />
              <div>
                <div className="text-sm font-medium text-c-text">
                  {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''} in progress
                </div>
                <div className="text-xs text-c-text-4 mt-0.5">{formatCurrency(stats.cashCollected)} collected of {formatCurrency(projects.reduce((s, p) => s + p.totalValue, 0))} total</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-c-text-4 shrink-0" />
          </Link>
        )}

        {/* ── Search + Filter toolbar ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-c-text-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients, addresses, project types…"
              className="w-full h-10 pl-9 pr-8 bg-c-card border border-c-border rounded-xl text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-c-text-4 active:text-c-text transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(['all', 'draft', 'presented', 'accepted', 'lost'] as const).map(f => (
              <FilterPill
                key={f}
                label={f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                count={filterCounts[f]}
                active={filter === f}
                onClick={() => setFilter(f)}
              />
            ))}
          </div>
        </div>

        {/* ── Quote list ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-c-border bg-c-card rounded-2xl text-center">
            <FileText className="w-12 h-12 text-c-text-5 mb-4" />
            <div className="text-c-text-3 font-medium">
              {search ? `No quotes match "${search}"` : 'No quotes found'}
            </div>
            <div className="text-c-text-4 text-sm mt-1 mb-5">
              {search
                ? 'Try a different name or project type.'
                : filter === 'all'
                  ? 'Create your first quote to get started.'
                  : `No ${filter} quotes yet.`}
            </div>
            {!search && (
              <Link href="/quotes/new">
                <Button size="md" variant="outline">
                  <Plus className="w-4 h-4" />
                  Create Quote
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(q => (
              <QuoteCard key={q.id} quote={q} onDelete={remove} />
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </AppShell>
  );
}
