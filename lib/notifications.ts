import type { Quote } from '@/types';

export function requestPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then(p => p === 'granted');
}

export function sendNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/icons/icon-192.png' });
}

export function checkFollowUps(quotes: Quote[], followUpDays: number) {
  const now = Date.now();
  const threshold = followUpDays * 24 * 60 * 60 * 1000;
  const needsFollowUp = quotes.filter(q => {
    if (q.status !== 'presented' || !q.presentedAt) return false;
    return now - new Date(q.presentedAt).getTime() > threshold;
  });
  if (needsFollowUp.length > 0) {
    sendNotification(
      'Follow-up Reminder',
      `${needsFollowUp.length} quote${needsFollowUp.length > 1 ? 's' : ''} waiting ${followUpDays}+ days for a response.`
    );
  }
}

export function checkExpiring(quotes: Quote[], expiryWarningDays: number) {
  const now = Date.now();
  const threshold = expiryWarningDays * 24 * 60 * 60 * 1000;
  const expiringSoon = quotes.filter(q => {
    if (q.status !== 'draft' && q.status !== 'presented') return false;
    if (!q.validUntil) return false;
    const expiresAt = new Date(q.validUntil).getTime();
    return expiresAt - now > 0 && expiresAt - now < threshold;
  });
  if (expiringSoon.length > 0) {
    sendNotification(
      'Quotes Expiring Soon',
      `${expiringSoon.length} quote${expiringSoon.length > 1 ? 's' : ''} will expire in the next ${expiryWarningDays} day${expiryWarningDays > 1 ? 's' : ''}.`
    );
  }
}
