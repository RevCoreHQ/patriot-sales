'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { AnimatedPage } from '@/components/motion/AnimatedPage';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerList';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { MetricCardSkeleton, QuoteRowSkeleton } from '@/components/ui/Skeleton';
import { ContactActions } from '@/components/ui/ContactActions';
import {
  Plus, Bell, ChevronRight, Hammer, TrendingUp,
  Target, DollarSign, FolderOpen,
} from 'lucide-react';

const LOGO_URL = 'https://assets.cdn.filesafe.space/UrIbmSbNwH6Sfvb4CBZw/media/69be15640d1cfcbcd90ec244.png';

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

const fmtCurrency = (n: number) => formatCurrency(n);
const fmtPercent = (n: number) => `${n}%`;
const fmtInt = (n: number) => String(n);

export default function HomePage() {
  const { quotes, initialized: quotesReady, init: initQuotes } = useQuotesStore();
  const { projects, initialized: projectsReady, init: initProjects } = useProjectsStore();

  useEffect(() => {
    initQuotes();
    initProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = quotesReady && projectsReady;

  if (!ready) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="skeleton h-11 w-28 rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton h-7 w-52" />
                <div className="skeleton h-4 w-36" />
              </div>
            </div>
            <div className="skeleton h-14 w-36 rounded-2xl" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <div className="rounded-2xl border border-c-border bg-c-card overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => <QuoteRowSkeleton key={i} />)}
          </div>
        </div>
      </AppShell>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthWon = quotes.filter(q => q.status === 'accepted' && q.updatedAt >= monthStart);
  const openPipeline = quotes.filter(q => q.status === 'draft' || q.status === 'presented');
  const presented = quotes.filter(q => q.status !== 'draft');
  const followUpNeeded = quotes.filter(q => q.status === 'presented' && daysSince(q.updatedAt) >= 3);
  const activeProjects = projects.filter(p => p.phase !== 'delivered').length;
  const accepted = quotes.filter(q => q.status === 'accepted');
  const closeRate = presented.length > 0 ? Math.round((accepted.length / presented.length) * 100) : 0;
  const pipeline = openPipeline.reduce((s, q) => s + q.total, 0);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const metrics = [
    { label: 'Open Pipeline', value: pipeline, format: fmtCurrency, icon: DollarSign, color: 'text-[#fb8e28]', bg: 'bg-[#fb8e28]/10' },
    { label: 'Won This Month', value: thisMonthWon.length, format: fmtInt, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Close Rate', value: closeRate, format: fmtPercent, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Jobs', value: activeProjects, format: fmtInt, icon: Hammer, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <AppShell>
      <AnimatedPage className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Patriot Roofing" className="h-11 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-c-text tracking-tight">
                {greeting}
              </h1>
              <p className="text-sm text-c-text-3 mt-0.5">{today}</p>
            </div>
          </div>
          <Link
            href="/quotes/new"
            className="flex items-center gap-2.5 h-14 px-7 rounded-2xl bg-[#fb8e28] active:bg-[#fb8e28] text-black font-bold text-base active:scale-[0.97] transition-all"
            style={{ boxShadow: '0 0 24px rgba(251,142,40,0.25)' }}
          >
            <Plus className="w-5 h-5" />
            New Quote
          </Link>
        </div>

        {/* Metrics */}
        <StaggerContainer className="grid grid-cols-4 gap-3">
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
                  <AnimatedNumber value={m.value} format={m.format} />
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Follow-up alert */}
        {followUpNeeded.length > 0 && (
          <Link
            href="/quotes"
            className="w-full flex items-center justify-between px-5 py-4 bg-c-card border border-c-border rounded-2xl active:bg-c-surface transition-colors"
            style={{ borderLeftColor: 'rgba(251,146,60,0.5)', borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4.5 h-4.5 text-orange-400 shrink-0" />
              <div className="text-left">
                <div className="text-sm font-semibold text-c-text">
                  {followUpNeeded.length} quote{followUpNeeded.length !== 1 ? 's' : ''} need{followUpNeeded.length === 1 ? 's' : ''} follow-up
                </div>
                <div className="text-xs text-c-text-4 mt-0.5">
                  {followUpNeeded.map(q => q.client.name).join(', ')}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-c-text-4 shrink-0" />
          </Link>
        )}

        {/* Active jobs banner */}
        {activeProjects > 0 && (
          <Link
            href="/projects"
            className="flex items-center justify-between px-5 py-4 bg-c-card border border-c-border rounded-2xl active:bg-c-surface transition-colors"
            style={{ borderLeftColor: 'rgba(251,142,40,0.4)', borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-3">
              <Hammer className="w-4.5 h-4.5 text-[#fb8e28] shrink-0" />
              <div>
                <div className="text-sm font-semibold text-c-text">
                  {activeProjects} active project{activeProjects !== 1 ? 's' : ''} in progress
                </div>
                <div className="text-xs text-c-text-4 mt-0.5">
                  {formatCurrency(projects.reduce((s, p) => s + p.cashCollected, 0))} collected
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-c-text-4 shrink-0" />
          </Link>
        )}

        {/* Recent quotes */}
        {quotes.length > 0 && (
          <div className="rounded-2xl border border-c-border bg-c-card overflow-hidden">
            <div className="px-5 py-4 border-b border-c-border-inner flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-c-text-4" />
                <span className="text-sm font-semibold text-c-text">Recent Quotes</span>
              </div>
              <Link
                href="/quotes"
                className="text-xs font-semibold text-[#fb8e28] active:text-[#fcad55] transition-colors"
              >
                View all
              </Link>
            </div>
            <StaggerContainer className="divide-y divide-c-border-inner">
              {quotes.slice(0, 6).map(q => (
                <StaggerItem key={q.id}>
                  <Link
                    href={`/quotes/${q.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 active:bg-c-surface transition-colors min-h-[56px]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-c-text truncate">{q.client.name}</div>
                      <div className="text-xs text-c-text-4 mt-0.5 flex items-center gap-2">
                        <span className="capitalize">{q.projectTypes[0]?.replace(/-/g, ' ')}</span>
                        <span>·</span>
                        <span>{formatDateShort(q.createdAt)}</span>
                      </div>
                    </div>
                    <ContactActions phone={q.client.phone} size="sm" />
                    <StatusBadge status={q.status} />
                    <div className="text-sm font-bold text-c-text shrink-0 tabular-nums">{formatCurrency(q.total)}</div>
                    <ChevronRight className="w-4 h-4 text-c-text-5 shrink-0" />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        )}

        {/* Empty state */}
        {quotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-c-border bg-c-card rounded-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#fb8e28]/10 flex items-center justify-center mb-5">
              <Plus className="w-7 h-7 text-[#fb8e28]" />
            </div>
            <div className="text-lg font-semibold text-c-text mb-1">Create your first quote</div>
            <div className="text-sm text-c-text-3 mb-6 max-w-xs">
              Build professional estimates for your clients in minutes.
            </div>
            <Link
              href="/quotes/new"
              className="flex items-center gap-2 h-14 px-8 rounded-2xl bg-[#fb8e28] text-black font-bold text-base active:scale-[0.97] transition-all"
            >
              <Plus className="w-5 h-5" />
              New Quote
            </Link>
          </div>
        )}
      </AnimatedPage>
    </AppShell>
  );
}
