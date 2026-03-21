import type { MaterialSelection, AddonSelection, SiteConditions, LineItem } from '@/types';
import { generateId } from './utils';

// ─── Standard Pricing ─────────────────────────────────────────────────────────
export type MaterialPriceOverrides = Record<string, { pricePerSqFt?: number; laborPerSqFt?: number }>;
export type AddonPriceOverrides = Record<string, number>;

export function effectiveMatPrice(sel: MaterialSelection, globals?: MaterialPriceOverrides) {
  const g = globals?.[sel.materialId];
  return {
    pricePerSqFt: sel.customPricePerSqFt ?? g?.pricePerSqFt ?? sel.material.pricePerSqFt,
    laborPerSqFt: sel.customLaborPerSqFt ?? g?.laborPerSqFt ?? sel.material.laborPerSqFt,
  };
}

export function effectiveAddonPrice(sel: AddonSelection, globals?: AddonPriceOverrides): number {
  return sel.customPrice ?? globals?.[sel.addonId] ?? sel.addon.basePrice;
}

export function calculateMaterialCost(selections: MaterialSelection[], globals?: MaterialPriceOverrides): number {
  return selections.reduce((sum, s) => {
    const { pricePerSqFt, laborPerSqFt } = effectiveMatPrice(s, globals);
    return sum + (pricePerSqFt + laborPerSqFt) * s.squareFootage;
  }, 0);
}

export function calculateAddonCost(selections: AddonSelection[], globals?: AddonPriceOverrides): number {
  return selections.reduce((sum, s) => sum + effectiveAddonPrice(s, globals) * s.quantity, 0);
}

export function calculateTearOffCost(site: Partial<SiteConditions>, ratePerSqFt: number = 1.5): number {
  if (!site.tearOff) return 0;
  return (site.roofArea ?? 0) * ratePerSqFt;
}

export function buildLineItems(
  materialSelections: MaterialSelection[],
  addonSelections: AddonSelection[],
  siteConditions: Partial<SiteConditions>,
  tearOffRate: number = 1.5,
  globalMaterialPrices?: MaterialPriceOverrides,
  globalAddonPrices?: AddonPriceOverrides
): LineItem[] {
  const items: LineItem[] = [];
  for (const sel of materialSelections) {
    const { pricePerSqFt, laborPerSqFt } = effectiveMatPrice(sel, globalMaterialPrices);
    items.push({ id: generateId(), description: `${sel.material.name} — ${sel.area}`, category: 'material', quantity: sel.squareFootage, unit: 'sq ft', unitPrice: pricePerSqFt, total: pricePerSqFt * sel.squareFootage });
    items.push({ id: generateId(), description: `Installation Labor — ${sel.area}`, category: 'labor', quantity: sel.squareFootage, unit: 'sq ft', unitPrice: laborPerSqFt, total: laborPerSqFt * sel.squareFootage });
  }
  if (siteConditions.tearOff && siteConditions.roofArea) {
    const layers = siteConditions.layers ?? 1;
    const tearOffCost = siteConditions.roofArea * tearOffRate * layers;
    items.push({ id: generateId(), description: `Tear-Off & Disposal${layers > 1 ? ` (${layers} layers)` : ''}${siteConditions.tearOffDescription ? ` — ${siteConditions.tearOffDescription}` : ''}`, category: 'labor', quantity: siteConditions.roofArea, unit: 'sq ft', unitPrice: tearOffRate * layers, total: tearOffCost });
  }
  for (const sel of addonSelections) {
    const price = effectiveAddonPrice(sel, globalAddonPrices);
    items.push({ id: generateId(), description: sel.addon.name + (sel.notes ? ` — ${sel.notes}` : ''), category: 'addon', quantity: sel.quantity, unit: sel.addon.unit === 'flat' ? 'flat' : sel.addon.unit, unitPrice: price, total: price * sel.quantity });
  }
  return items;
}

export function calculateTotals(lineItems: LineItem[], discountPercent: number, taxRate: number) {
  const subtotal = lineItems.filter(i => i.category !== 'discount').reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
}
