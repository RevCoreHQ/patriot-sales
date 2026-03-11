'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/theme';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { useNotifications } from '@/lib/useNotifications';
import {
  LayoutDashboard,
  FileText,
  Hammer,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';

type Tab = {
  href: string;
  label: string;
  icon: React.ElementType;
  match?: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: '/',
    label: 'Home',
    icon: LayoutDashboard,
    match: (p) => p === '/',
  },
  {
    href: '/quotes',
    label: 'Quotes',
    icon: FileText,
    match: (p) => p.startsWith('/quotes'),
  },
  {
    href: '/projects',
    label: 'Jobs',
    icon: Hammer,
    match: (p) => p.startsWith('/projects'),
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: Users,
    match: (p) => p.startsWith('/clients'),
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    match: (p) => p.startsWith('/reports'),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    match: (p) => p.startsWith('/settings'),
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { init: initTheme } = useThemeStore();
  const { init: initQuotes } = useQuotesStore();
  const { init: initProjects } = useProjectsStore();
  useNotifications();

  useEffect(() => {
    initTheme();
    initQuotes();
    initProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide tab bar on presentation (fullscreen) routes
  const hideTabBar = pathname.startsWith('/presentation');

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      {!hideTabBar && (
        <nav
          className="h-16 shrink-0 border-t flex items-stretch pb-safe"
          style={{
            background: 'rgba(8,8,14,0.85)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {TABS.map((tab) => {
            const active = tab.match ? tab.match(pathname) : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors active:scale-[0.95]',
                  active ? 'text-amber-400' : 'text-white/30'
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-amber-400" />
                )}
                <tab.icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
                <span className={cn(
                  'text-[10px] font-semibold tracking-wide',
                  active ? 'text-amber-400' : 'text-white/25'
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
