'use client';

import { useEffect, useRef } from 'react';
import { useQuotesStore } from '@/store/quotes';
import { useSettingsStore } from '@/store/settings';
import { checkFollowUps, checkExpiring } from '@/lib/notifications';

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
const LAST_CHECK_KEY = 'rnr:notifications:lastCheck';

export function useNotifications() {
  const { quotes } = useQuotesStore();
  const { settings } = useSettingsStore();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!settings.notifications.enabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (quotes.length === 0) return;

    // Only run once per interval
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();
    if (lastCheck && now - Number(lastCheck) < CHECK_INTERVAL) return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    localStorage.setItem(LAST_CHECK_KEY, String(now));
    const { followUpDays, quoteExpiryDays } = settings.notifications.reminders;
    checkFollowUps(quotes, followUpDays);
    checkExpiring(quotes, quoteExpiryDays);
  }, [quotes, settings.notifications]);
}
