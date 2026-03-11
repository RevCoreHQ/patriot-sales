import type { MaterialSelection, AddonSelection, SiteConditions, LineItem, PoolConfig } from '@/types';
import { generateId } from './utils';

// ─── Pool Pricing ─────────────────────────────────────────────────────────────
export const POOL_PRICING = {
  sizes: {
    small:  { label: 'Small',   dims: '12 × 24 ft', sqft: 288,  price: 52000 },
    medium: { label: 'Medium',  dims: '16 × 32 ft', sqft: 512,  price: 68000 },
    large:  { label: 'Large',   dims: '20 × 40 ft', sqft: 800,  price: 88000 },
    xlarge: { label: 'X-Large', dims: '24 × 48 ft', sqft: 1152, price: 112000 },
    custom: { label: 'Custom',  dims: 'Custom size', sqft: 0,    price: 0, ratePerSqFt: 115 },
  },
  depths: {
    shallow:  { label: 'Shallow',  range: "2.5-4.5 ft",    note: 'Family-friendly',         upcharge: 0 },
    standard: { label: 'Standard', range: "3.5-6 ft",      note: 'Most popular',            upcharge: 0 },
    deep:     { label: 'Deep',     range: "3.5-8 ft",      note: 'Dive-ready',              upcharge: 4500 },
    sport:    { label: 'Sport',    range: "4-5 ft uniform", note: 'Volleyball / basketball', upcharge: 0 },
  },
  finishes: {
    plaster:      { label: 'White Plaster',    color: '#dde8ee', upcharge: 0 },
    quartz:       { label: 'Quartz Aggregate', color: '#8fa3b1', upcharge: 4200 },
    'pebble-tec': { label: 'Pebble Tec',       color: '#7d9e8a', upcharge: 7800 },
    'glass-tile': { label: 'Glass Tile',       color: '#4ab8c1', upcharge: 14000 },
  },
  copings: {
    'bullnose-paver': { label: 'Bullnose Paver',       upcharge: 0 },
    travertine:       { label: 'Travertine',            upcharge: 2800 },
    flagstone:        { label: 'Natural Flagstone',     upcharge: 3500 },
    cantilever:       { label: 'Cantilevered Concrete', upcharge: 1200 },
  },
  features: {
    tanningLedge: { label: 'Tanning Ledge',       icon: 'wave',    desc: 'In-pool shallow shelf',   price: 4500 },
    attachedSpa:  { label: 'Attached Spa',         icon: 'spa',     desc: 'Custom spa with jets',    price: 18000 },
    waterfall:    { label: 'Rock Waterfall',       icon: 'water',   desc: 'Natural stone cascade',   price: 6500 },
    autoCover:    { label: 'Automatic Cover',      icon: 'shield',  desc: 'Motorized safety cover',  price: 8500 },
    deckLighting: { label: 'LED Deck Lighting',    icon: 'light',   desc: 'Landscape lighting',      price: 2800 },
    heating:      { label: 'Solar Heating System', icon: 'sun',     desc: 'Extended swim season',    price: 4200 },
  },
} as const;

export function calculatePoolTotal(config: PoolConfig): number {
  const size = POOL_PRICING.sizes[config.sizePreset];
  let base = size.price;
  if (config.sizePreset === 'custom') {
    const sqft = (config.customLength ?? 20) * (config.customWidth ?? 40);
    base = sqft * POOL_PRICING.sizes.custom.ratePerSqFt;
  }
  const upcharges =
    POOL_PRICING.depths[config.depth].upcharge +
    POOL_PRICING.finishes[config.finish].upcharge +
    POOL_PRICING.copings[config.coping].upcharge;
  const featuresTotal = (Object.keys(config.features) as (keyof PoolConfig['features'])[])
    .reduce((sum, key) => sum + (config.features[key] ? POOL_PRICING.features[key].price : 0), 0);
  return base + upcharges + featuresTotal;
}

export function buildPoolLineItems(config: PoolConfig): LineItem[] {
  const items: LineItem[] = [];
  const size = POOL_PRICING.sizes[config.sizePreset];
  let basePrice = size.price;
  let sqft = size.sqft;
  if (config.sizePreset === 'custom') {
    sqft = (config.customLength ?? 20) * (config.customWidth ?? 40);
    basePrice = sqft * POOL_PRICING.sizes.custom.ratePerSqFt;
  }
  const shapeLabel = config.shape.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  items.push({
    id: generateId(), description: `Pool Construction -- ${size.label} ${shapeLabel} (${sqft.toLocaleString()} sq ft)`,
    category: 'labor', quantity: 1, unit: 'flat', unitPrice: basePrice, total: basePrice,
  });
  const depthUp = POOL_PRICING.depths[config.depth].upcharge;
  if (depthUp > 0) items.push({ id: generateId(), description: `Depth Upgrade -- ${POOL_PRICING.depths[config.depth].label}`, category: 'addon', quantity: 1, unit: 'flat', unitPrice: depthUp, total: depthUp });
  const finishUp = POOL_PRICING.finishes[config.finish].upcharge;
  if (finishUp > 0) items.push({ id: generateId(), description: `Interior Finish -- ${POOL_PRICING.finishes[config.finish].label}`, category: 'material', quantity: 1, unit: 'flat', unitPrice: finishUp, total: finishUp });
  const copingUp = POOL_PRICING.copings[config.coping].upcharge;
  if (copingUp > 0) items.push({ id: generateId(), description: `Coping Upgrade -- ${POOL_PRICING.copings[config.coping].label}`, category: 'material', quantity: 1, unit: 'flat', unitPrice: copingUp, total: copingUp });
  (Object.keys(config.features) as (keyof PoolConfig['features'])[]).forEach(key => {
    if (!config.features[key]) return;
    const feat = POOL_PRICING.features[key];
    items.push({ id: generateId(), description: feat.label, category: 'addon', quantity: 1, unit: 'flat', unitPrice: feat.price, total: feat.price });
  });
  return items;
}

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

export function calculateDemoCost(site: Partial<SiteConditions>, ratePerSqFt: number = 2.5): number {
  if (!site.demo) return 0;
  return (site.squareFootage ?? 0) * ratePerSqFt;
}

export function buildLineItems(
  materialSelections: MaterialSelection[],
  addonSelections: AddonSelection[],
  siteConditions: Partial<SiteConditions>,
  demoRate: number = 2.5,
  globalMaterialPrices?: MaterialPriceOverrides,
  globalAddonPrices?: AddonPriceOverrides
): LineItem[] {
  const items: LineItem[] = [];
  for (const sel of materialSelections) {
    const { pricePerSqFt, laborPerSqFt } = effectiveMatPrice(sel, globalMaterialPrices);
    items.push({ id: generateId(), description: `${sel.material.name} -- ${sel.area}`, category: 'material', quantity: sel.squareFootage, unit: 'sq ft', unitPrice: pricePerSqFt, total: pricePerSqFt * sel.squareFootage });
    items.push({ id: generateId(), description: `Installation Labor -- ${sel.area}`, category: 'labor', quantity: sel.squareFootage, unit: 'sq ft', unitPrice: laborPerSqFt, total: laborPerSqFt * sel.squareFootage });
  }
  if (siteConditions.demo && siteConditions.squareFootage) {
    const demoCost = siteConditions.squareFootage * demoRate;
    items.push({ id: generateId(), description: 'Demolition & Removal' + (siteConditions.demoDescription ? ` -- ${siteConditions.demoDescription}` : ''), category: 'labor', quantity: siteConditions.squareFootage, unit: 'sq ft', unitPrice: demoRate, total: demoCost });
  }
  for (const sel of addonSelections) {
    const price = effectiveAddonPrice(sel, globalAddonPrices);
    items.push({ id: generateId(), description: sel.addon.name + (sel.notes ? ` -- ${sel.notes}` : ''), category: 'addon', quantity: sel.quantity, unit: sel.addon.unit === 'flat' ? 'flat' : sel.addon.unit, unitPrice: price, total: price * sel.quantity });
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
