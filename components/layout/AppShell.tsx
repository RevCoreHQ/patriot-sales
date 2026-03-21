'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { useNotifications } from '@/lib/useNotifications';
import {
  LayoutDashboard,
  FileText,
  Hammer,
  Users,
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
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    match: (p) => p.startsWith('/settings') || p.startsWith('/reports'),
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { init: initSettings } = useSettingsStore();
  const { init: initQuotes } = useQuotesStore();
  const { init: initProjects } = useProjectsStore();
  useNotifications();

  useEffect(() => {
    initSettings();
    initQuotes();
    initProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide sidebar on presentation (fullscreen) routes
  const hideSidebar = pathname.startsWith('/presentation');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* iPadOS-style sidebar rail */}
      {!hideSidebar && (
        <nav
          className="w-[88px] shrink-0 flex flex-col items-center pt-8 pb-5 gap-1.5 border-r"
          style={{
            background: 'var(--c-surface)',
            borderColor: 'var(--c-border-inner)',
          }}
        >
          {TABS.map((tab) => {
            const active = tab.match ? tab.match(pathname) : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center w-[68px] h-[62px] rounded-2xl gap-1 transition-all active:scale-[0.92]',
                  active
                    ? 'bg-accent/12 text-accent'
                    : 'text-c-text-3 hover:text-c-text-2 hover:bg-c-elevated'
                )}
              >
                <tab.icon className="w-6 h-6" strokeWidth={active ? 2.2 : 1.6} />
                <span className={cn(
                  'text-[11px] font-semibold leading-tight',
                  active ? 'text-accent' : ''
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
