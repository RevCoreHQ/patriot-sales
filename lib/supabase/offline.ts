const QUEUE_KEY = 'patriot:offline:queue';

export interface OfflineMutation {
  id: string;
  table: string;
  action: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  timestamp: string;
}

function isClient() {
  return typeof window !== 'undefined';
}

export function getQueue(): OfflineMutation[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushToQueue(mutation: OfflineMutation) {
  if (!isClient()) return;
  const queue = getQueue();
  queue.push(mutation);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(id: string) {
  if (!isClient()) return;
  const queue = getQueue().filter((m) => m.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  if (!isClient()) return;
  localStorage.removeItem(QUEUE_KEY);
}
