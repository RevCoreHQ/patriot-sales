'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { useNotifications } from '@/lib/useNotifications';
import { subscribeToChanges, unsubscribe } from '@/lib/supabase/realtime';
import { startOfflineSync } from '@/lib/supabase/sync';
import { fetchQuoteById } from '@/lib/supabase/db/quotes';
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
  const { orgId, supabaseReady } = useAuthStore();
  const { init: initSettings } = useSettingsStore();
  const { init: initQuotes } = useQuotesStore();
  const { init: initProjects } = useProjectsStore();
  const realtimeStarted = useRef(false);
  useNotifications();

  useEffect(() => {
    initSettings();
    initQuotes();
    initProjects();
    startOfflineSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start realtime subscriptions once Supabase is ready
  useEffect(() => {
    if (!orgId || !supabaseReady || realtimeStarted.current) return;
    realtimeStarted.current = true;

    subscribeToChanges(
      orgId,
      // Quote changes
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          useQuotesStore.getState().removeFromRemote(payload.old.id as string);
        } else {
          const quote = await fetchQuoteById(payload.new.id as string);
          if (quote) useQuotesStore.getState().mergeFromRemote(quote);
        }
      },
      // Project changes
      (payload) => {
        if (payload.eventType === 'DELETE') {
          useProjectsStore.getState().removeFromRemote(payload.old.id as string);
        } else {
          // Re-init to get full project data
          useProjectsStore.getState().init();
        }
      },
      // Settings changes
      () => {
        useSettingsStore.getState().init();
      }
    );

    return () => { unsubscribe(); realtimeStarted.current = false; };
  }, [orgId, supabaseReady]);

  // Hide sidebar on presentation (fullscreen) routes
  const hideSidebar = pathname.startsWith('/presentation');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* iPadOS-style sidebar rail */}
      {!hideSidebar && (
        <nav
          className="w-[96px] shrink-0 flex flex-col items-center pt-8 pb-5 gap-1.5 border-r"
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
                  'flex flex-col items-center justify-center w-[78px] h-[70px] rounded-2xl gap-1.5 transition-all active:scale-[0.92]',
                  active
                    ? 'bg-accent/12 text-accent'
                    : 'text-c-text-3 hover:text-c-text-2 hover:bg-c-elevated'
                )}
              >
                <tab.icon className="w-7 h-7" strokeWidth={active ? 2.2 : 1.6} />
                <span className={cn(
                  'text-xs font-semibold leading-tight',
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
