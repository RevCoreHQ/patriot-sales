'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { formatCurrency } from '@/lib/utils';
import {
  Presentation, Hammer, Plus, Sun, Moon, LogOut,
  FileText, Grid3X3, Image as ImageIcon, Scale, DollarSign, Users,
  Lock, X, LayoutGrid, Bell, ChevronRight, Settings, Sparkles,
} from 'lucide-react';

const LOGO_URL = 'https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/699191dd24813c44b3afb6e9.webp';

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="px-5 py-4">
      <div className="text-[11px] font-semibold text-c-text-4 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-xl font-bold text-c-text tracking-tight leading-none">{value}</div>
      {sub && <div className="text-xs text-c-text-3 mt-1.5">{sub}</div>}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { currentUser, initialized, init, logout } = useAuthStore();
  const { theme, toggle: toggleTheme, init: initTheme } = useThemeStore();
  const { quotes, init: initQuotes } = useQuotesStore();
  const { projects, init: initProjects } = useProjectsStore();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    init();
    initTheme();
    initQuotes();
    initProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialized && !currentUser) router.replace('/login');
  }, [initialized, currentUser, router]);

  if (!initialized || !currentUser) return null;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthWon = quotes.filter(q => q.status === 'accepted' && q.updatedAt >= monthStart);
  const openPipeline = quotes.filter(q => q.status === 'draft' || q.status === 'presented');
  const presented = quotes.filter(q => q.status !== 'draft');
  const followUpNeeded = quotes.filter(q => q.status === 'presented' && daysSince(q.updatedAt) >= 3);
  const activeProjects = projects.filter(p => p.phase !== 'delivered').length;

  const stats = {
    pipeline: openPipeline.reduce((s, q) => s + q.total, 0),
    monthWonRevenue: thisMonthWon.reduce((s, q) => s + q.total, 0),
    closeRate: presented.length > 0 ? Math.round((quotes.filter(q => q.status === 'accepted').length / presented.length) * 100) : 0,
    wonRevenue: quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total, 0),
    cashCollected: projects.reduce((s, p) => s + p.cashCollected, 0),
    delivered: projects.filter(p => p.phase === 'delivered').length,
  };

  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const handleLogout = () => { logout(); router.replace('/login'); };

  // ── Popup menu items ───────────────────────────────────────────────────────
  const menuItems = [
    { href: '/quotes',      icon: FileText,    label: 'Quotes',        locked: false },
    { href: '/catalog',     icon: Grid3X3,     label: 'Catalog',       locked: true },
    { href: '/gallery',     icon: ImageIcon,   label: 'Gallery',       locked: true },
    { href: '/compare',     icon: Scale,       label: 'Compare Tiers', locked: true },
    { href: '/pricing',     icon: DollarSign,  label: 'Pricing',       locked: true },
    { href: '/admin/users', icon: Users,       label: 'Users',         locked: true },
    { href: '/settings',    icon: Settings,    label: 'Settings',      locked: false },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-8 py-5 shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="Rock N Roll Stoneworks" className="h-10 w-auto object-contain" />
          <div>
            <div className="text-[15px] font-semibold text-c-text leading-tight">Rock N Roll Stoneworks</div>
            <div className="text-xs text-c-text-4 mt-0.5">{today}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-c-text-3 mr-3">{currentUser.name}</span>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-c-text-3 active:bg-c-card transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-c-text-3 active:bg-c-card transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* ── Split body ── */}
      <div className="flex-1 flex min-h-0">

        {/* ── Left: tile launcher ── */}
        <div className="w-1/2 flex flex-col items-center justify-center p-10">
          <div className="grid grid-cols-2 gap-5 w-full">

            {/* Features menu tile */}
            <button
              onClick={() => setShowMenu(true)}
              className="flex flex-col justify-between p-6 rounded-3xl border border-c-border bg-c-card active:scale-[0.97] active:bg-c-surface transition-all text-left"
              style={{ minHeight: 210 }}
            >
              <LayoutGrid className="w-7 h-7 text-c-text-3" />
              <div>
                <div className="text-lg font-semibold text-c-text">Features</div>
                <div className="text-xs text-c-text-4 mt-0.5">All tools</div>
              </div>
            </button>

            {/* Presentation */}
            <Link
              href="/presentation"
              className="flex flex-col justify-between p-6 rounded-3xl border border-c-border bg-c-card active:scale-[0.97] active:bg-c-surface transition-all"
              style={{ minHeight: 210 }}
            >
              <Presentation className="w-7 h-7 text-c-text-3" />
              <div>
                <div className="text-lg font-semibold text-c-text">Presentation</div>
                <div className="text-xs text-c-text-4 mt-0.5">Pitch to clients</div>
              </div>
            </Link>

            {/* Job Tracker */}
            <Link
              href="/projects"
              className="flex flex-col justify-between p-6 rounded-3xl border border-c-border bg-c-card active:scale-[0.97] active:bg-c-surface transition-all"
              style={{ minHeight: 210 }}
            >
              <Hammer className="w-7 h-7 text-c-text-3" />
              <div>
                <div className="text-lg font-semibold text-c-text">Job Tracker</div>
                <div className="text-xs text-c-text-4 mt-0.5">
                  {activeProjects > 0 ? `${activeProjects} active` : 'No active jobs'}
                </div>
              </div>
            </Link>

            {/* New Estimate — amber primary */}
            <Link
              href="/quotes/new"
              className="flex flex-col justify-between p-6 rounded-3xl bg-amber-500 active:bg-amber-400 active:scale-[0.97] transition-all"
              style={{ minHeight: 210 }}
            >
              <Plus className="w-7 h-7 text-black/60" />
              <div>
                <div className="text-lg font-semibold text-black">New Estimate</div>
                <div className="text-xs text-black/50 mt-0.5">Start a quote</div>
              </div>
            </Link>

          </div>
        </div>

        {/* ── Vertical divider ── */}
        <div className="w-px shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* ── Right: metrics + alerts ── */}
        <div className="w-1/2 overflow-y-auto px-10 py-10 space-y-4">

          {/* Metrics panel — 3 columns × 2 rows */}
          <div className="rounded-2xl border border-c-border bg-c-card overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-c-border-inner">
              <Metric
                label="Open pipeline"
                value={formatCurrency(stats.pipeline)}
                sub={`${openPipeline.length} active quote${openPipeline.length !== 1 ? 's' : ''}`}
              />
              <Metric
                label="Won this month"
                value={thisMonthWon.length}
                sub={formatCurrency(stats.monthWonRevenue)}
              />
              <Metric
                label="Close rate"
                value={`${stats.closeRate}%`}
                sub={`${quotes.filter(q => q.status === 'accepted').length} of ${presented.length} presented`}
              />
            </div>
            <div className="h-px bg-c-border-inner" />
            <div className="grid grid-cols-3 divide-x divide-c-border-inner">
              <Metric label="Total won revenue" value={formatCurrency(stats.wonRevenue)} />
              <Metric label="Active projects" value={activeProjects} sub="In progress" />
              <Metric label="Cash collected" value={formatCurrency(stats.cashCollected)} />
            </div>
          </div>

          {/* Follow-up alert */}
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
              <Link
                href="/quotes"
                className="text-xs font-semibold text-orange-400/80 active:text-orange-300 transition-colors shrink-0"
              >
                View all
              </Link>
            </div>
          )}

          {/* Active projects */}
          {activeProjects > 0 && (
            <Link
              href="/projects"
              className="flex items-center justify-between px-5 py-3.5 bg-c-card border border-c-border rounded-xl active:bg-c-surface transition-colors"
              style={{ borderLeftColor: 'rgba(245,158,11,0.45)', borderLeftWidth: 2 }}
            >
              <div className="flex items-center gap-3">
                <Hammer className="w-4 h-4 text-amber-400/80 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-c-text">
                    {activeProjects} active project{activeProjects !== 1 ? 's' : ''} in progress
                  </div>
                  <div className="text-xs text-c-text-4 mt-0.5">
                    {formatCurrency(stats.cashCollected)} collected
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-c-text-4 shrink-0" />
            </Link>
          )}

          {/* Recent quotes — last 4 */}
          {quotes.length > 0 && (
            <div className="rounded-2xl border border-c-border bg-c-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-c-border-inner flex items-center justify-between">
                <span className="text-[11px] font-semibold text-c-text-4 uppercase tracking-wider">Recent Quotes</span>
                <Link href="/quotes" className="text-xs font-semibold text-amber-500/70 active:text-amber-400 transition-colors">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-c-border-inner">
                {quotes.slice(0, 4).map(q => (
                  <Link
                    key={q.id}
                    href={`/quotes/${q.id}`}
                    className="flex items-center justify-between px-5 py-3.5 active:bg-c-surface transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-c-text truncate">{q.client.name}</div>
                      <div className="text-xs text-c-text-4 mt-0.5 capitalize">{q.projectTypes[0]?.replace(/-/g, ' ')}</div>
                    </div>
                    <div className="text-sm font-semibold text-c-text shrink-0 ml-4">{formatCurrency(q.total)}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Features popup ── */}
      {showMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowMenu(false)}
        >
          <div
            className="w-80 rounded-3xl border border-c-border bg-c-card p-2"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 mb-1">
              <div>
                <div className="text-sm font-semibold text-c-text">All Features</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500/60" />
                  <span className="text-[11px] text-amber-500/60 font-medium">Upgrade to unlock Pro</span>
                </div>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-c-text-3 active:bg-c-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="space-y-0.5">
              {menuItems.map(item =>
                item.locked ? (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ opacity: 0.38 }}
                  >
                    <item.icon className="w-4 h-4 text-c-text-3 shrink-0" />
                    <span className="text-sm font-medium text-c-text-2 flex-1">{item.label}</span>
                    <Lock className="w-3.5 h-3.5 text-c-text-5" />
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl active:bg-c-elevated transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-c-text-2 shrink-0" />
                    <span className="text-sm font-medium text-c-text flex-1">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-c-text-4" />
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
