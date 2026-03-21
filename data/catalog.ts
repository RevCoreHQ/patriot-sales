import type { Material } from '@/types';

export const MATERIALS: Material[] = [
  // ── ASPHALT SHINGLES — GOOD TIER ──────────────────────────────────────────
  {
    id: 'owens-oakridge',
    name: 'Oakridge',
    brand: 'Owens Corning',
    category: 'asphalt-shingles',
    tier: 'good',
    pricePerSqFt: 1.2,
    laborPerSqFt: 2.5,
    image: '',
    description: '25-year architectural shingles with algae resistance. Dependable and affordable.',
    colors: ['Onyx Black', 'Estate Gray', 'Desert Tan', 'Brownwood'],
    features: ['25-year warranty', 'Algae resistant', 'Wind resistant 110 mph'],
  },
  {
    id: 'gaf-timberline-hdz',
    name: 'Timberline HDZ',
    brand: 'GAF',
    category: 'asphalt-shingles',
    tier: 'good',
    pricePerSqFt: 1.3,
    laborPerSqFt: 2.5,
    image: '',
    description: "America's #1 selling shingle with LayerLock technology for superior wind performance.",
    colors: ['Charcoal', 'Pewter Gray', 'Weathered Wood', 'Hickory'],
    features: ['LayerLock technology', 'Wind warranty 130 mph', 'StainGuard Plus'],
  },

  // ── ARCHITECTURAL SHINGLES — BETTER TIER ──────────────────────────────────
  {
    id: 'owens-duration',
    name: 'Duration',
    brand: 'Owens Corning',
    category: 'architectural-shingles',
    tier: 'better',
    pricePerSqFt: 1.6,
    laborPerSqFt: 2.75,
    image: '',
    description: 'Premium architectural shingle with patented SureNail technology for 130 mph wind resistance.',
    colors: ['Onyx Black', 'Teak', 'Sierra Gray', 'Harbor Blue'],
    features: ['SureNail technology', 'Limited lifetime warranty', '130 mph wind resistance'],
  },
  {
    id: 'gaf-timberline-uhd',
    name: 'Timberline Ultra HD',
    brand: 'GAF',
    category: 'architectural-shingles',
    tier: 'better',
    pricePerSqFt: 1.55,
    laborPerSqFt: 2.75,
    image: '',
    description: 'Ultra-dimensional shingle with bold shadow lines and enhanced curb appeal.',
    colors: ['Charcoal', 'Barkwood', 'Slate', 'Shakewood'],
    features: ['Ultra-dimensional', 'Lifetime warranty', 'StainGuard Plus'],
  },

  // ── ARCHITECTURAL SHINGLES — BEST TIER ────────────────────────────────────
  {
    id: 'owens-trudefinition',
    name: 'TruDefinition Duration FLEX',
    brand: 'Owens Corning',
    category: 'architectural-shingles',
    tier: 'best',
    pricePerSqFt: 2.0,
    laborPerSqFt: 3.0,
    image: '',
    description: 'Premium designer shingle with maximum flexibility and Class 4 impact resistance.',
    colors: ['Aged Copper', 'Merlot', 'Pacific Wave', 'Sand Dune'],
    features: ['Class 4 impact rated', 'SureNail technology', 'Lifetime warranty', 'Flexible design'],
  },
  {
    id: 'certainteed-landmark-pro',
    name: 'Landmark Pro',
    brand: 'CertainTeed',
    category: 'architectural-shingles',
    tier: 'best',
    pricePerSqFt: 1.9,
    laborPerSqFt: 3.0,
    image: '',
    description: 'Max Def color technology for a deep, rich dimensional look with superior protection.',
    colors: ['Moire Black', 'Pewter', 'Burnt Sienna', 'Heather Blend'],
    features: ['Max Def colors', 'Lifetime warranty', '110 mph wind resistance'],
  },

  // ── METAL ROOFING ─────────────────────────────────────────────────────────
  {
    id: 'standing-seam',
    name: 'Standing Seam Metal',
    brand: 'Custom',
    category: 'metal-roofing',
    tier: 'best',
    pricePerSqFt: 5.0,
    laborPerSqFt: 5.0,
    image: '',
    description: 'Premium standing seam metal roofing with 50+ year lifespan and energy efficiency.',
    colors: ['Matte Black', 'Charcoal', 'Galvalume', 'Dark Bronze'],
    features: ['50+ year lifespan', 'Energy efficient', 'Fire resistant', 'No maintenance'],
  },
  {
    id: 'metal-shingle',
    name: 'Metal Shingle',
    brand: 'Custom',
    category: 'metal-roofing',
    tier: 'better',
    pricePerSqFt: 3.5,
    laborPerSqFt: 4.0,
    image: '',
    description: 'Metal shingle system that mimics traditional shingle look with metal durability.',
    colors: ['Weathered Wood', 'Slate', 'Charcoal', 'Sierra'],
    features: ['40+ year lifespan', 'Lightweight', 'Wind resistant'],
  },

  // ── FLAT ROOFING ──────────────────────────────────────────────────────────
  {
    id: 'tpo-membrane',
    name: 'TPO Membrane',
    brand: 'Custom',
    category: 'flat-roofing',
    tier: 'good',
    pricePerSqFt: 2.5,
    laborPerSqFt: 3.0,
    image: '',
    description: 'Thermoplastic polyolefin single-ply membrane for flat or low-slope roofs.',
    colors: ['White', 'Gray'],
    features: ['Energy Star rated', 'UV resistant', 'Seam welded', '20-year warranty'],
  },
];

export function getMaterialsByTier(tier: 'good' | 'better' | 'best') {
  return MATERIALS.filter(m => m.tier === tier);
}

export function getMaterialsByCategory(category: string) {
  return MATERIALS.filter(m => m.category === category);
}
