'use client';

import { create } from 'zustand';
import type { Project, ProjectPhase, ProjectUpdate, ProjectTodo, CloseoutItem, PaymentTransaction, PaymentType, PaymentMethod } from '@/types';
import { DEFAULT_CLOSEOUT_CHECKLIST } from '@/types';
import { generateId } from '@/lib/utils';

const PROJECTS_KEY = 'rnr:projects';

function isClient() { return typeof window !== 'undefined'; }

function loadProjects(): Project[] {
  if (!isClient()) return [];
  try {
    const r = localStorage.getItem(PROJECTS_KEY);
    const raw = r ? JSON.parse(r) : [];
    // Migrate older records that lack todos/closeoutChecklist/payments
    return raw.map((p: Project) => ({
      ...p,
      todos: p.todos ?? [],
      closeoutChecklist: p.closeoutChecklist ?? DEFAULT_CLOSEOUT_CHECKLIST.map(item => ({ ...item, id: generateId() })),
      payments: p.payments ?? [],
    }));
  } catch { return []; }
}

function saveProjects(projects: Project[]) {
  if (!isClient()) return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
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
  // Todos
  addTodo: (id: string, text: string) => void;
  toggleTodo: (id: string, todoId: string) => void;
  removeTodo: (id: string, todoId: string) => void;
  // Closeout checklist
  toggleCloseout: (id: string, itemId: string) => void;
  // Payments
  addPayment: (id: string, amount: number, type: PaymentType, method: PaymentMethod, note?: string) => void;
  removePayment: (id: string, paymentId: string) => void;
  remove: (id: string) => void;
  getByQuoteId: (quoteId: string) => Project | undefined;
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  initialized: false,

  init: () => {
    const projects = loadProjects();
    set({ projects, initialized: true });
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
    saveProjects(updated);
    set({ projects: updated });
    return project;
  },

  updatePhase: (id, phase) => {
    const projects = get().projects.map(p => {
      if (p.id !== id) return p;
      const now = new Date().toISOString();
      return {
        ...p,
        phase,
        updatedAt: now,
        ...(phase === 'delivered' ? { actualCompletion: now } : {}),
      };
    });
    saveProjects(projects);
    set({ projects });
  },

  addUpdate: (id, phase, note) => {
    const projects = get().projects.map(p => {
      if (p.id !== id) return p;
      const update: ProjectUpdate = { id: generateId(), phase, note, date: new Date().toISOString() };
      return { ...p, updates: [update, ...p.updates], updatedAt: new Date().toISOString() };
    });
    saveProjects(projects);
    set({ projects });
  },

  setDates: (id, dates) => {
    const projects = get().projects.map(p =>
      p.id !== id ? p : { ...p, ...dates, updatedAt: new Date().toISOString() }
    );
    saveProjects(projects);
    set({ projects });
  },

  setCashCollected: (id, amount) => {
    const projects = get().projects.map(p =>
      p.id !== id ? p : { ...p, cashCollected: amount, updatedAt: new Date().toISOString() }
    );
    saveProjects(projects);
    set({ projects });
  },

  setGhlContactId: (id, ghlId) => {
    const projects = get().projects.map(p =>
      p.id !== id ? p : { ...p, ghlContactId: ghlId, updatedAt: new Date().toISOString() }
    );
    saveProjects(projects);
    set({ projects });
  },

  addTodo: (id, text) => {
    const todo: ProjectTodo = { id: generateId(), text, completed: false, createdAt: new Date().toISOString() };
    const projects = get().projects.map(p =>
      p.id !== id ? p : { ...p, todos: [...p.todos, todo], updatedAt: new Date().toISOString() }
    );
    saveProjects(projects);
    set({ projects });
  },

  toggleTodo: (id, todoId) => {
    const projects = get().projects.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        todos: p.todos.map((t: ProjectTodo) => t.id === todoId ? { ...t, completed: !t.completed } : t),
        updatedAt: new Date().toISOString(),
      };
    });
    saveProjects(projects);
    set({ projects });
  },

  removeTodo: (id, todoId) => {
    const projects = get().projects.map(p =>
      p.id !== id ? p : { ...p, todos: p.todos.filter((t: ProjectTodo) => t.id !== todoId), updatedAt: new Date().toISOString() }
    );
    saveProjects(projects);
    set({ projects });
  },

  toggleCloseout: (id, itemId) => {
    const projects = get().projects.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        closeoutChecklist: p.closeoutChecklist.map((c: CloseoutItem) =>
          c.id === itemId ? { ...c, completed: !c.completed } : c
        ),
        updatedAt: new Date().toISOString(),
      };
    });
    saveProjects(projects);
    set({ projects });
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
    const projects = get().projects.map(p => {
      if (p.id !== id) return p;
      const payments = [...(p.payments ?? []), payment];
      const cashCollected = payments.reduce((s, t) => s + t.amount, 0);
      return { ...p, payments, cashCollected, updatedAt: new Date().toISOString() };
    });
    saveProjects(projects);
    set({ projects });
  },

  removePayment: (id, paymentId) => {
    const projects = get().projects.map(p => {
      if (p.id !== id) return p;
      const payments = (p.payments ?? []).filter(t => t.id !== paymentId);
      const cashCollected = payments.reduce((s, t) => s + t.amount, 0);
      return { ...p, payments, cashCollected, updatedAt: new Date().toISOString() };
    });
    saveProjects(projects);
    set({ projects });
  },

  remove: (id) => {
    const projects = get().projects.filter(p => p.id !== id);
    saveProjects(projects);
    set({ projects });
  },

  getByQuoteId: (quoteId) => get().projects.find(p => p.quoteId === quoteId),
}));
