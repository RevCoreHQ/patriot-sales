'use client';

import { create } from 'zustand';
import type { Project, ProjectPhase, ProjectUpdate, ProjectTodo, CloseoutItem, PaymentTransaction, PaymentType, PaymentMethod, ProjectPhoto } from '@/types';
import { DEFAULT_CLOSEOUT_CHECKLIST } from '@/types';
import { generateId } from '@/lib/utils';
import { fetchProjects, upsertProject, deleteProject as deleteProjectRemote } from '@/lib/supabase/db/projects';
import { useAuthStore } from './auth';

const PROJECTS_KEY = 'patriot:projects';
const CACHE_KEY = 'patriot:cache:projects';

function isClient() { return typeof window !== 'undefined'; }

function loadProjects(): Project[] {
  if (!isClient()) return [];
  try {
    const r = localStorage.getItem(PROJECTS_KEY);
    const raw = r ? JSON.parse(r) : [];
    return raw.map((p: Project) => ({
      ...p,
      todos: p.todos ?? [],
      closeoutChecklist: p.closeoutChecklist ?? DEFAULT_CLOSEOUT_CHECKLIST.map(item => ({ ...item, id: generateId() })),
      payments: p.payments ?? [],
      photos: p.photos ?? [],
    }));
  } catch { return []; }
}

function saveProjectsLocal(projects: Project[]) {
  if (!isClient()) return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function cacheProjects(projects: Project[]) {
  if (!isClient()) return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(projects));
}

function loadCachedProjects(): Project[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** Save to localStorage + Supabase (fire-and-forget). */
function persistProject(project: Project, allProjects: Project[]) {
  saveProjectsLocal(allProjects);
  cacheProjects(allProjects);
  const orgId = useAuthStore.getState().orgId;
  if (orgId) {
    upsertProject(project, orgId).catch(() => { /* offline */ });
  }
}

interface ProjectsStore {
  projects: Project[];
  initialized: boolean;
  init: () => void;
  createFromQuote: (quoteId: string, clientName: string, projectTypes: string[], totalValue: number) => Project;
  updatePhase: (id: string, phase: ProjectPhase) => void;
  addUpdate: (id: string, phase: ProjectPhase, note: string) => void;
  setDates: (id: string, dates: { startDate?: string; estimatedCompletion?: string; actualCompletion?: string }) => void;
  setCashCollected: (id: string, amount: number) => void;
  setGhlContactId: (id: string, ghlId: string) => void;
  addTodo: (id: string, text: string) => void;
  toggleTodo: (id: string, todoId: string) => void;
  removeTodo: (id: string, todoId: string) => void;
  toggleCloseout: (id: string, itemId: string) => void;
  addPayment: (id: string, amount: number, type: PaymentType, method: PaymentMethod, note?: string) => void;
  removePayment: (id: string, paymentId: string) => void;
  addPhoto: (id: string, photo: Omit<ProjectPhoto, 'id' | 'timestamp'>) => void;
  removePhoto: (id: string, photoId: string) => void;
  remove: (id: string) => void;
  getByQuoteId: (quoteId: string) => Project | undefined;
  mergeFromRemote: (remote: Project) => void;
  removeFromRemote: (id: string) => void;
}

function mutateProject(
  get: () => ProjectsStore,
  set: (partial: Partial<ProjectsStore>) => void,
  id: string,
  fn: (p: Project) => Project
) {
  const projects = get().projects.map(p => p.id !== id ? p : fn(p));
  const changed = projects.find(p => p.id === id);
  if (changed) persistProject(changed, projects);
  set({ projects });
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
    projects: [],
    initialized: false,

    init: () => {
      let projects = loadProjects();
      if (projects.length === 0) {
        projects = loadCachedProjects();
      }
      set({ projects, initialized: true });

      // Async: fetch from Supabase
      (async () => {
        try {
          const orgId = useAuthStore.getState().orgId;
          if (!orgId) return;

          const remote = await fetchProjects(orgId);
          if (remote.length > 0) {
            cacheProjects(remote);
            saveProjectsLocal(remote);
            set({ projects: remote });
          }
        } catch { /* offline */ }
      })();
    },

    createFromQuote: (quoteId, clientName, projectTypes, totalValue) => {
      const project: Project = {
        id: generateId(),
        quoteId,
        clientName,
        projectTypes: projectTypes as never,
        totalValue,
        phase: 'design-review',
        cashCollected: 0,
        payments: [],
        todos: [],
        photos: [],
        closeoutChecklist: DEFAULT_CLOSEOUT_CHECKLIST.map(item => ({ ...item, id: generateId() })),
        updates: [{
          id: generateId(),
          phase: 'design-review',
          note: 'Project created from accepted quote.',
          date: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [project, ...get().projects];
      persistProject(project, updated);
      set({ projects: updated });
      return project;
    },

    updatePhase: (id, phase) => {
      mutateProject(get, set, id, (p) => {
        const now = new Date().toISOString();
        return { ...p, phase, updatedAt: now, ...(phase === 'delivered' ? { actualCompletion: now } : {}) };
      });
    },

    addUpdate: (id, phase, note) => {
      mutateProject(get, set, id, (p) => {
        const update: ProjectUpdate = { id: generateId(), phase, note, date: new Date().toISOString() };
        return { ...p, updates: [update, ...p.updates], updatedAt: new Date().toISOString() };
      });
    },

    setDates: (id, dates) => {
      mutateProject(get, set, id, (p) => ({ ...p, ...dates, updatedAt: new Date().toISOString() }));
    },

    setCashCollected: (id, amount) => {
      mutateProject(get, set, id, (p) => ({ ...p, cashCollected: amount, updatedAt: new Date().toISOString() }));
    },

    setGhlContactId: (id, ghlId) => {
      mutateProject(get, set, id, (p) => ({ ...p, ghlContactId: ghlId, updatedAt: new Date().toISOString() }));
    },

    addTodo: (id, text) => {
      const todo: ProjectTodo = { id: generateId(), text, completed: false, createdAt: new Date().toISOString() };
      mutateProject(get, set, id, (p) => ({ ...p, todos: [...p.todos, todo], updatedAt: new Date().toISOString() }));
    },

    toggleTodo: (id, todoId) => {
      mutateProject(get, set, id, (p) => ({
        ...p,
        todos: p.todos.map((t: ProjectTodo) => t.id === todoId ? { ...t, completed: !t.completed } : t),
        updatedAt: new Date().toISOString(),
      }));
    },

    removeTodo: (id, todoId) => {
      mutateProject(get, set, id, (p) => ({
        ...p,
        todos: p.todos.filter((t: ProjectTodo) => t.id !== todoId),
        updatedAt: new Date().toISOString(),
      }));
    },

    toggleCloseout: (id, itemId) => {
      mutateProject(get, set, id, (p) => ({
        ...p,
        closeoutChecklist: p.closeoutChecklist.map((c: CloseoutItem) =>
          c.id === itemId ? { ...c, completed: !c.completed } : c
        ),
        updatedAt: new Date().toISOString(),
      }));
    },

    addPayment: (id, amount, type, method, note) => {
      const payment: PaymentTransaction = {
        id: generateId(),
        amount,
        type,
        method,
        note: note?.trim() || undefined,
        date: new Date().toISOString(),
      };
      mutateProject(get, set, id, (p) => {
        const payments = [...(p.payments ?? []), payment];
        const cashCollected = payments.reduce((s, t) => s + t.amount, 0);
        return { ...p, payments, cashCollected, updatedAt: new Date().toISOString() };
      });
    },

    removePayment: (id, paymentId) => {
      mutateProject(get, set, id, (p) => {
        const payments = (p.payments ?? []).filter(t => t.id !== paymentId);
        const cashCollected = payments.reduce((s, t) => s + t.amount, 0);
        return { ...p, payments, cashCollected, updatedAt: new Date().toISOString() };
      });
    },

    addPhoto: (id, photoData) => {
      const photo: ProjectPhoto = { ...photoData, id: generateId(), timestamp: new Date().toISOString() };
      mutateProject(get, set, id, (p) => ({ ...p, photos: [...p.photos, photo], updatedAt: new Date().toISOString() }));
    },

    removePhoto: (id, photoId) => {
      mutateProject(get, set, id, (p) => ({
        ...p,
        photos: p.photos.filter(ph => ph.id !== photoId),
        updatedAt: new Date().toISOString(),
      }));
    },

    remove: (id) => {
      const projects = get().projects.filter(p => p.id !== id);
      saveProjectsLocal(projects);
      cacheProjects(projects);
      set({ projects });
      deleteProjectRemote(id).catch(() => { /* offline */ });
    },

    getByQuoteId: (quoteId) => get().projects.find(p => p.quoteId === quoteId),

    // ─── Realtime helpers ──────────────────────────────────────────────────
    mergeFromRemote: (remote: Project) => {
      set((state) => {
        const existing = state.projects.findIndex((p) => p.id === remote.id);
        let projects: Project[];
        if (existing >= 0) {
          projects = [...state.projects];
          projects[existing] = remote;
        } else {
          projects = [remote, ...state.projects];
        }
        cacheProjects(projects);
        return { projects };
      });
    },

    removeFromRemote: (id: string) => {
      set((state) => {
        const projects = state.projects.filter((p) => p.id !== id);
        cacheProjects(projects);
        return { projects };
      });
    },
}));
