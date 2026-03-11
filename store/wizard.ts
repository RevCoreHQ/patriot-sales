'use client';

import { create } from 'zustand';
import type { WizardState, ProjectTypeId, MaterialSelection, AddonSelection, SiteConditions, Client, PoolConfig, LineItem } from '@/types';

const TOTAL_STEPS = 4;

const INITIAL_STATE: WizardState = {
  currentStep: 0,
  totalSteps: TOTAL_STEPS,
  client: {},
  projectTypes: [],
  siteConditions: {
    squareFootage: 400,
    shape: 'rectangle',
    slope: 'flat',
    access: 'easy',
    demo: false,
  },
  manualLineItems: [],
  materialSelections: [],
  addonSelections: [],
  poolConfig: undefined,
  discountPercent: 0,
  discountName: '',
  priceOverride: undefined,
  notes: '',
  internalNotes: '',
};

interface WizardStore extends WizardState {
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setClient: (client: Partial<Client>) => void;
  setProjectTypes: (types: ProjectTypeId[]) => void;
  toggleProjectType: (type: ProjectTypeId) => void;
  setSiteConditions: (conditions: Partial<SiteConditions>) => void;
  setManualLineItems: (items: LineItem[]) => void;
  addManualLineItem: (item: LineItem) => void;
  updateManualLineItem: (id: string, updates: Partial<LineItem>) => void;
  removeManualLineItem: (id: string) => void;
  setMaterialSelections: (selections: MaterialSelection[]) => void;
  setAddonSelections: (selections: AddonSelection[]) => void;
  setPoolConfig: (config: PoolConfig) => void;
  setDiscountPercent: (discount: number) => void;
  setDiscountName: (name: string) => void;
  setPriceOverride: (price: number | undefined) => void;
  setNotes: (notes: string) => void;
  setInternalNotes: (notes: string) => void;
  reset: () => void;
  loadFromQuote: (state: Partial<WizardState>) => void;
}

export const useWizardStore = create<WizardStore>((set) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps - 1) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

  setClient: (client) => set((s) => ({ client: { ...s.client, ...client } })),
  setProjectTypes: (projectTypes) => set({ projectTypes, totalSteps: TOTAL_STEPS }),
  toggleProjectType: (type) =>
    set((s) => {
      const newTypes = s.projectTypes.includes(type)
        ? s.projectTypes.filter((t) => t !== type)
        : [...s.projectTypes, type];
      return { projectTypes: newTypes, totalSteps: TOTAL_STEPS };
    }),

  setSiteConditions: (conditions) =>
    set((s) => ({ siteConditions: { ...s.siteConditions, ...conditions } })),

  setManualLineItems: (manualLineItems) => set({ manualLineItems }),
  addManualLineItem: (item) => set((s) => ({ manualLineItems: [...s.manualLineItems, item] })),
  updateManualLineItem: (id, updates) => set((s) => ({
    manualLineItems: s.manualLineItems.map(i => i.id === id ? { ...i, ...updates, total: (updates.quantity ?? i.quantity) * (updates.unitPrice ?? i.unitPrice) } : i),
  })),
  removeManualLineItem: (id) => set((s) => ({ manualLineItems: s.manualLineItems.filter(i => i.id !== id) })),
  setMaterialSelections: (materialSelections) => set({ materialSelections }),
  setAddonSelections: (addonSelections) => set({ addonSelections }),
  setPoolConfig: (poolConfig) => set({ poolConfig }),
  setDiscountPercent: (discountPercent) => set({ discountPercent }),
  setDiscountName: (discountName) => set({ discountName }),
  setPriceOverride: (priceOverride) => set({ priceOverride }),
  setNotes: (notes) => set({ notes }),
  setInternalNotes: (internalNotes) => set({ internalNotes }),

  reset: () => set(INITIAL_STATE),

  loadFromQuote: (state) => set({ ...INITIAL_STATE, ...state }),
}));
