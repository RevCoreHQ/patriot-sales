import { createClient } from './client';
import { pushToQueue, getQueue, removeFromQueue, type OfflineMutation } from './offline';
import { generateId } from '@/lib/utils';

/** Try a Supabase write. If offline, queue it for later. */
export async function syncWrite(
  table: string,
  action: 'upsert' | 'delete',
  payload: Record<string, unknown>
): Promise<{ offline: boolean; error?: string }> {
  try {
    const supabase = createClient();
    let result;

    if (action === 'upsert') {
      result = await supabase.from(table).upsert(payload);
    } else {
      result = await supabase.from(table).delete().eq('id', payload.id);
    }

    if (result.error) {
      // If it's a network error, queue it
      if (isNetworkError(result.error.message)) {
        queueMutation(table, action, payload);
        return { offline: true };
      }
      return { offline: false, error: result.error.message };
    }

    return { offline: false };
  } catch (err) {
    // Network failure — queue for later
    queueMutation(table, action, payload);
    return { offline: true };
  }
}

function queueMutation(table: string, action: 'upsert' | 'delete', payload: Record<string, unknown>) {
  pushToQueue({
    id: generateId(),
    table,
    action,
    payload,
    timestamp: new Date().toISOString(),
  });
}

function isNetworkError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes('fetch') || lower.includes('network') || lower.includes('offline');
}

/** Flush all pending offline mutations. Call on reconnect. */
export async function flushOfflineQueue(): Promise<{ flushed: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  const supabase = createClient();
  let flushed = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      let result;
      if (mutation.action === 'upsert') {
        result = await supabase.from(mutation.table).upsert(mutation.payload);
      } else {
        result = await supabase.from(mutation.table).delete().eq('id', mutation.payload.id);
      }

      if (result.error) {
        failed++;
      } else {
        removeFromQueue(mutation.id);
        flushed++;
      }
    } catch {
      failed++;
    }
  }

  return { flushed, failed };
}

/** Start listening for online events to auto-flush. */
export function startOfflineSync() {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => {
    flushOfflineQueue();
  });
}
