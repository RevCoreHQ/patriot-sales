'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { TRIAL } from '@/lib/trial';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  Plus,
  Grid3X3,
  Image,
  Settings,
  DollarSign,
  Hammer,
  Presentation,
  Users,
  LogOut,
  Shield,
  Briefcase,
  HardHat,
  Sun,
  Moon,
  Scale,
  Lock,
  Sparkles,
  FileText,
} from 'lucide-react';

const LOGO_URL = 'https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/699191dd24813c44b3afb6e9.webp';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  locked?: boolean;
};

const TRIAL_NAV: NavItem[] = [
  { href: '/quotes',    label: 'Dashboard',   icon: LayoutDashboard, roles: ['admin', 'sales', 'production'] },
  { href: '/projects',  label: 'Job Tracker', icon: Hammer,          roles: ['admin', 'production'] },
  { href: '/settings',  label: 'Settings',    icon: Settings,        roles: ['admin'] },
];

const PRO_NAV: NavItem[] = [
  { href: '/quotes',      label: 'Quotes',    icon: FileText,   roles: ['admin', 'sales'],  locked: true },
  { href: '/catalog',     label: 'Catalog',   icon: Grid3X3,    roles: ['admin', 'sales'],  locked: true },
  { href: '/gallery',     label: 'Gallery',   icon: Image,      roles: ['admin', 'sales'],  locked: true },
  { href: '/compare',     label: 'Compare',   icon: Scale,      roles: ['admin', 'sales'],  locked: true },
  { href: '/pricing',     label: 'Pricing',   icon: DollarSign, roles: ['admin'],            locked: true },
  { href: '/admin/users', label: 'Users',     icon: Users,      roles: ['admin'],            locked: true },
];

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  admin: Shield,
  sales: Briefcase,
  production: HardHat,
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'text-amber-400',
  sales: 'text-blue-400',
  production: 'text-emerald-400',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, initialized, init, logout } = useAuthStore();
  const { theme, toggle: toggleTheme, init: initTheme } = useThemeStore();
  const { quotes, init: initQuotes } = useQuotesStore();
  const { projects, init: initProjects } = useProjectsStore();
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => { init(); initTheme(); initQuotes(); initProjects(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialized && !currentUser) router.replace('/login');
  }, [initialized, currentUser, router]);

  if (!initialized || !currentUser) return null;

  const role = currentUser.role;
  const RoleIcon = ROLE_ICONS[role];
  const canCreateQuote = role === 'admin' || role === 'sales';
  const atQuoteLimit = quotes.length >= TRIAL.maxQuotes;

  const visibleTrial = TRIAL_NAV.filter(i => i.roles.includes(role));
  const visiblePro = PRO_NAV.filter(i => i.roles.includes(role));

  const handleLogout = () => { logout(); router.replace('/login'); };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
    const isProjects = item.href === '/projects';

    if (item.locked) {
      return (
        <button
          onClick={() => setShowUpgrade(true)}
          className="w-full relative flex items-center gap-3.5 px-5 min-h-[52px] rounded-xl text-[15px] font-medium transition-all active:scale-[0.97] opacity-45 hover:opacity-65"
          style={{ color: 'var(--c-text-3)' }}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          {item.label}
          <Lock className="w-3.5 h-3.5 ml-auto text-white/20" />
        </button>
      );
    }

    return (
      <Link
        href={item.href}
        className="flex items-center gap-3.5 px-5 min-h-[52px] rounded-xl text-[15px] font-medium transition-all active:scale-[0.97]"
        style={
          active
            ? { background: 'rgba(255,255,255,0.07)', color: 'var(--c-text)' }
            : { color: 'var(--c-text-3)' }
        }
      >
        <item.icon className="w-5 h-5 shrink-0" style={{ color: active ? '#f59e0b' : undefined }} />
        {item.label}
        {isProjects && (
          <span className={cn(
            'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full',
            projects.length >= TRIAL.maxProjects
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
              : 'bg-white/6 text-white/25 border border-white/8'
          )}>
            {projects.length}/{TRIAL.maxProjects}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason="locked-feature" />}

      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>

        {/* ── Sidebar ── */}
        <aside
          className="flex flex-col w-72 shrink-0 border-r"
          style={{
            background: 'rgba(9,9,15,0.72)',
            borderColor: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Logo */}
          <div
            className="px-6 pt-7 pb-5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <Link href="/" className="block active:opacity-70 transition-opacity">
              <img src={LOGO_URL} alt="Rock N Roll Stoneworks" className="h-16 w-auto object-contain mx-auto block" />
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70 shrink-0" />
                <span className="text-[11px] tracking-widest uppercase font-semibold text-c-text-3">
                  Stoneworks · Pools &amp; Spas
                </span>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">

            {/* ── FEATURED: Presentation ── */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <Sparkles className="w-3 h-3 text-amber-500/60" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500/55">Your Plan</span>
              </div>
              <Link
                href="/presentation"
                className={cn(
                  'flex items-center gap-3 px-5 min-h-[58px] rounded-xl font-bold text-[16px] transition-all active:scale-[0.97]',
                  pathname.startsWith('/presentation') ? 'bg-amber-400 text-black' : 'bg-amber-500 text-black'
                )}
                style={
                  !pathname.startsWith('/presentation')
                    ? { boxShadow: '0 0 28px rgba(245,158,11,0.30), 0 4px 12px rgba(245,158,11,0.18)' }
                    : undefined
                }
              >
                <Presentation className="w-5 h-5 shrink-0" />
                Presentation
                <span className="ml-auto text-[10px] font-black bg-black/20 px-2.5 py-1 rounded-full tracking-wide">
                  ACTIVE
                </span>
              </Link>
            </div>

            <div className="h-px mx-1 bg-c-border-inner" />

            {/* ── TRIAL features ── */}
            <div className="my-1">
              <div className="px-2 mb-2 mt-1">
                <span className="text-[10px] font-bold tracking-widest uppercase text-c-text-5">Trial Included</span>
              </div>

              {canCreateQuote && (
                atQuoteLimit ? (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="w-full flex items-center gap-3 px-5 min-h-[52px] rounded-xl font-semibold text-[15px] mb-1 transition-all active:scale-[0.97] opacity-55 hover:opacity-70"
                    style={{ background: 'var(--c-elevated)', color: 'var(--c-text-3)', border: '1px dashed rgba(245,158,11,0.3)' }}
                  >
                    <Lock className="w-4.5 h-4.5 shrink-0 text-amber-500/60" />
                    New Estimate
                    <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      {quotes.length}/{TRIAL.maxQuotes} used
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/quotes/new"
                    className="flex items-center gap-3 px-5 min-h-[52px] rounded-xl font-semibold text-[15px] transition-all active:scale-[0.97] mb-1 border border-c-border-inner hover:border-c-border-hover"
                    style={{ background: 'var(--c-elevated)', color: 'var(--c-text)' }}
                  >
                    <Plus className="w-5 h-5 shrink-0 text-amber-400" />
                    New Estimate
                    <span className="ml-auto text-[10px] font-bold text-white/25 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                      {quotes.length}/{TRIAL.maxQuotes}
                    </span>
                  </Link>
                )
              )}

              {visibleTrial.map(item => <NavLink key={item.href} item={item} />)}
            </div>

            <div className="h-px mx-1 bg-c-border-inner" />

            {/* ── PRO (locked) ── */}
            {visiblePro.length > 0 && (
              <div className="mt-1">
                <div className="flex items-center gap-1.5 px-2 mb-2 mt-1">
                  <Lock className="w-3 h-3 text-white/18" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-c-text-5">Pro Features</span>
                </div>
                {visiblePro.map(item => <NavLink key={item.href} item={item} />)}
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-c-border-inner">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-c-tag">
              <div className="w-10 h-10 rounded-full bg-c-elevated flex items-center justify-center text-base font-bold text-c-text-2 shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-c-text truncate">{currentUser.name}</div>
                <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${ROLE_COLORS[role]}`}>
                  <RoleIcon className="w-3 h-3" />
                  <span className="capitalize">{role}</span>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-c-text-3 hover:text-c-text-2 hover:bg-c-elevated transition-all active:scale-95"
                title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-c-text-3 hover:text-c-text-2 hover:bg-c-elevated transition-all active:scale-95"
                title="Log out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
