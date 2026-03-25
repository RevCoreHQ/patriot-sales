import { createClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ChangeCallback = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}) => void;

let channel: RealtimeChannel | null = null;

export function subscribeToChanges(orgId: string, onQuoteChange: ChangeCallback, onProjectChange: ChangeCallback, onSettingsChange: ChangeCallback) {
  const supabase = createClient();

  // Unsubscribe from previous channel if it exists
  if (channel) {
    supabase.removeChannel(channel);
  }

  channel = supabase
    .channel('org-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quotes', filter: `org_id=eq.${orgId}` },
      (payload) => onQuoteChange({
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        table: 'quotes',
        new: (payload.new ?? {}) as Record<string, unknown>,
        old: (payload.old ?? {}) as Record<string, unknown>,
      })
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects', filter: `org_id=eq.${orgId}` },
      (payload) => onProjectChange({
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        table: 'projects',
        new: (payload.new ?? {}) as Record<string, unknown>,
        old: (payload.old ?? {}) as Record<string, unknown>,
      })
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_settings', filter: `org_id=eq.${orgId}` },
      (payload) => onSettingsChange({
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        table: 'app_settings',
        new: (payload.new ?? {}) as Record<string, unknown>,
        old: (payload.old ?? {}) as Record<string, unknown>,
      })
    )
    .subscribe();

  return channel;
}

export function unsubscribe() {
  if (!channel) return;
  const supabase = createClient();
  supabase.removeChannel(channel);
  channel = null;
}
