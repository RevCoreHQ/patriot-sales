'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { formatCurrency } from '@/lib/utils';
import { AnimatedPage } from '@/components/motion/AnimatedPage';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerList';
import {
  DollarSign, TrendingUp, Target, FileText,
  BarChart3, Users, Calendar, ChevronDown,
} from 'lucide-react';

type DatePreset = 'this-month' | 'last-month' | 'this-quarter' | 'ytd' | 'all-time' | 'custom';

function getPresetRange(preset: DatePreset): [Date, Date] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'this-month':
      return [new Date(y, m, 1), now];
    case 'last-month':
      return [new Date(y, m - 1, 1), new Date(y, m, 0)];
    case 'this-quarter': {
      const qStart = Math.floor(m / 3) * 3;
      return [new Date(y, qStart, 1), now];
    }
    case 'ytd':
      return [new Date(y, 0, 1), now];
    case 'all-time':
      return [new Date(2020, 0, 1), now];
    case 'custom':
      return [new Date(y, m, 1), now];
  }
}

const PRESET_LABELS: Record<DatePreset, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-quarter': 'This Quarter',
  'ytd': 'Year to Date',
  'all-time': 'All Time',
  'custom': 'Custom',
};

export default function ReportsPage() {
  const { quotes, initialized: qReady, init: initQ } = useQuotesStore();
  const { projects, initialized: pReady, init: initP } = useProjectsStore();

  useEffect(() => { initQ(); initP(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [preset, setPreset] = useState<DatePreset>('ytd');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedRep, setSelectedRep] = useState('all');

  // Derive unique rep names from quotes
  const repNames = useMemo(() => {
    const names = new Set<string>();
    quotes.forEach(q => { if (q.salesRep) names.add(q.salesRep); });
    return Array.from(names).sort();
  }, [quotes]);

  // Compute date range
  const [rangeStart, rangeEnd] = useMemo(() => {
    if (preset === 'custom' && customStart && customEnd) {
      return [new Date(customStart), new Date(customEnd + 'T23:59:59')];
    }
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  // Filter quotes by date range and rep
  const filtered = useMemo(() => {
    return quotes.filter(q => {
      const d = new Date(q.createdAt);
      if (d < rangeStart || d > rangeEnd) return false;
      if (selectedRep !== 'all' && q.salesRep !== selectedRep) return false;
      return true;
    });
  }, [quotes, rangeStart, rangeEnd, selectedRep]);

  // Filter projects by date range
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const d = new Date(p.createdAt);
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [projects, rangeStart, rangeEnd]);

  // ─── Metrics ─────────────────────────────────────────────────────
  const accepted = filtered.filter(q => q.status === 'accepted');
  const presented = filtered.filter(q => q.status === 'presented' || q.status === 'accepted' || q.status === 'lost');
  const totalRevenue = accepted.reduce((s, q) => s + q.total, 0);
  const pipeline = filtered.filter(q => q.status === 'draft' || q.status === 'presented').reduce((s, q) => s + q.total, 0);
  const closeRate = presented.length > 0 ? Math.round((accepted.length / presented.length) * 100) : 0;
  const avgDeal = accepted.length > 0 ? Math.round(totalRevenue / accepted.length) : 0;
  const cashCollected = filteredProjects.reduce((s, p) => s + p.cashCollected, 0);

  // ─── Per-rep breakdown ───────────────────────────────────────────
  const repStats = useMemo(() => {
    const map = new Map<string, { revenue: number; quotes: number; accepted: number; presented: number; pipeline: number }>();
    filtered.forEach(q => {
      const rep = q.salesRep || 'Unknown';
      const s = map.get(rep) ?? { revenue: 0, quotes: 0, accepted: 0, presented: 0, pipeline: 0 };
      s.quotes++;
      if (q.status === 'accepted') { s.accepted++; s.revenue += q.total; }
      if (q.status === 'presented' || q.status === 'accepted' || q.status === 'lost') s.presented++;
      if (q.status === 'draft' || q.status === 'presented') s.pipeline += q.total;
      map.set(rep, s);
    });
    return Array.from(map.entries())
      .map(([name, s]) => ({ name, ...s, closeRate: s.presented > 0 ? Math.round((s.accepted / s.presented) * 100) : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // ─── Status breakdown ───────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { draft: 0, presented: 0, accepted: 0, lost: 0, expired: 0 };
    filtered.forEach(q => { counts[q.status]++; });
    return counts;
  }, [filtered]);

  // ─── Monthly revenue breakdown ──────────────────────────────────
  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    accepted.forEach(q => {
      const d = new Date(q.updatedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + q.total);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue,
      }));
  }, [accepted]);

  const maxMonthly = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  const ready = qReady && pReady;

  if (!ready) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="skeleton h-8 w-48 mb-6" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const metrics = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Open Pipeline', value: formatCurrency(pipeline), icon: TrendingUp, color: 'text-[#C62828]', bg: 'bg-[#C62828]/10' },
    { label: 'Quotes Created', value: String(filtered.length), icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Close Rate', value: `${closeRate}%`, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Avg Deal Size', value: formatCurrency(avgDeal), icon: BarChart3, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Cash Collected', value: formatCurrency(cashCollected), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const statusColors: Record<string, string> = {
    draft: 'bg-zinc-500', presented: 'bg-blue-500', accepted: 'bg-emerald-500', lost: 'bg-red-500', expired: 'bg-orange-500',
  };

  return (
    <AppShell>
      <AnimatedPage className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-c-text tracking-tight">Reports</h1>
            <p className="text-sm text-c-text-3 mt-0.5">Company performance and team metrics</p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date preset pills */}
          <div className="flex items-center gap-1 bg-c-card border border-c-border rounded-xl p-1">
            {(Object.keys(PRESET_LABELS) as DatePreset[]).map(p => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  preset === p
                    ? 'bg-[#C62828] text-black'
                    : 'text-c-text-3 hover:text-c-text hover:bg-c-elevated'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="h-9 px-3 rounded-lg bg-c-elevated border border-c-border-inner text-sm text-c-text"
              />
              <span className="text-c-text-4 text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="h-9 px-3 rounded-lg bg-c-elevated border border-c-border-inner text-sm text-c-text"
              />
            </div>
          )}

          {/* Rep filter */}
          <div className="relative ml-auto">
            <select
              value={selectedRep}
              onChange={e => setSelectedRep(e.target.value)}
              className="h-9 pl-8 pr-8 rounded-lg bg-c-card border border-c-border text-sm text-c-text appearance-none cursor-pointer"
            >
              <option value="all">All Reps</option>
              {repNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-c-text-4 pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-c-text-4 pointer-events-none" />
          </div>
        </div>

        {/* Metric cards */}
        <StaggerContainer className="grid grid-cols-3 gap-3">
          {metrics.map(m => (
            <StaggerItem key={m.label}>
              <div className="rounded-2xl border border-c-border bg-c-card p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center`}>
                    <m.icon className={`w-4.5 h-4.5 ${m.color}`} />
                  </div>
                  <span className="text-xs font-medium text-c-text-3">{m.label}</span>
                </div>
                <div className={`text-2xl font-bold ${m.color} tracking-tight`}>
                  {m.value}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="grid grid-cols-2 gap-6">

          {/* Rep Leaderboard */}
          {selectedRep === 'all' && repStats.length > 0 && (
            <section className="bg-c-card border border-c-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-c-border-inner flex items-center gap-2.5">
                <Users className="w-4 h-4 text-c-text-4" />
                <span className="text-sm font-semibold text-c-text">Team Leaderboard</span>
              </div>
              <div className="divide-y divide-c-border-inner">
                {repStats.map((rep, i) => (
                  <button
                    key={rep.name}
                    onClick={() => setSelectedRep(rep.name)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-c-surface transition-colors text-left"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-[#C62828]/15 text-[#C62828]' : 'bg-c-elevated text-c-text-4'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-c-text truncate">{rep.name}</div>
                      <div className="text-xs text-c-text-4">
                        {rep.quotes} quotes · {rep.closeRate}% close rate
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-400 tabular-nums">{formatCurrency(rep.revenue)}</div>
                      <div className="text-xs text-c-text-4 tabular-nums">{formatCurrency(rep.pipeline)} pipeline</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Quote Status Breakdown */}
          <section className="bg-c-card border border-c-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-c-border-inner flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-c-text-4" />
              <span className="text-sm font-semibold text-c-text">Quote Breakdown</span>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => {
                const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-c-text capitalize">{status}</span>
                      <span className="text-sm font-semibold text-c-text tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 bg-c-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusColors[status]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Monthly Revenue */}
        {monthlyRevenue.length > 0 && (
          <section className="bg-c-card border border-c-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-c-border-inner flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-c-text-4" />
              <span className="text-sm font-semibold text-c-text">Revenue by Month</span>
            </div>
            <div className="p-5">
              <div className="flex items-end gap-2 h-40">
                {monthlyRevenue.map(m => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="text-[10px] font-semibold text-emerald-400 tabular-nums">
                      {formatCurrency(m.revenue)}
                    </div>
                    <div className="w-full flex items-end" style={{ height: '100px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-[#C62828]/80 to-[#C62828]/40 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max((m.revenue / maxMonthly) * 100, 4)}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-medium text-c-text-4">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </AnimatedPage>
    </AppShell>
  );
}
