import type { Quote, AppSettings, Project, ProjectPhase, PaymentTransaction } from '@/types';
import { DEFAULT_CLOSEOUT_CHECKLIST } from '@/types';

const QUOTES_KEY = 'rnr:quotes';
const SETTINGS_KEY = 'rnr:settings';
const PROJECTS_KEY = 'rnr:projects';

function isClient() {
  return typeof window !== 'undefined';
}

// ─── Quotes ───────────────────────────────────────────────────────────────────
export function getQuotes(): Quote[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(QUOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuote(quote: Quote): void {
  if (!isClient()) return;
  const quotes = getQuotes();
  const idx = quotes.findIndex(q => q.id === quote.id);
  if (idx >= 0) {
    quotes[idx] = quote;
  } else {
    quotes.unshift(quote);
  }
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

export function getQuote(id: string): Quote | null {
  return getQuotes().find(q => q.id === id) ?? null;
}

export function deleteQuote(id: string): void {
  if (!isClient()) return;
  const quotes = getQuotes().filter(q => q.id !== id);
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function getSettings(): AppSettings | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (!isClient()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Seed sample quotes + projects for demo ───────────────────────────────────
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}
function makeQuote(
  id: string,
  name: string, email: string, phone: string, address: string,
  status: Quote['status'],
  projectTypes: Quote['projectTypes'],
  sqft: number, slope: Quote['siteConditions']['slope'], demo: boolean,
  lineItems: Quote['lineItems'],
  subtotal: number,
  discountPct: number,
  taxRate: number,
  createdDaysAgo: number,
  updatedDaysAgo: number,
  presentedDaysAgo: number | null,
  salesRep: string,
  signedBy?: string,
  notes?: string,
): Quote {
  const disc = Math.round(subtotal * (discountPct / 100));
  const taxBase = subtotal - disc;
  const tax = Math.round(taxBase * (taxRate / 100));
  return {
    id,
    client: { id: `c-${id}`, name, email, phone, address, createdAt: daysAgo(createdDaysAgo) },
    status,
    projectTypes,
    siteConditions: { squareFootage: sqft, shape: 'rectangle', slope, access: 'easy', demo, demoDescription: demo ? 'Existing concrete removal' : undefined },
    materialSelections: [],
    addonSelections: [],
    lineItems,
    subtotal,
    discountPercent: discountPct,
    discountAmount: disc,
    taxRate,
    taxAmount: tax,
    total: taxBase + tax,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(updatedDaysAgo),
    presentedAt: presentedDaysAgo !== null ? daysAgo(presentedDaysAgo) : undefined,
    validUntil: daysFromNow(30 - updatedDaysAgo),
    salesRep,
    signedBy,
    signedAt: signedBy ? daysAgo(updatedDaysAgo) : undefined,
    notes,
  };
}

export function seedSampleData(settings: AppSettings, force = false): void {
  if (!isClient()) return;
  if (!force && getQuotes().length > 0) return;
  // Clear existing data when forcing
  if (force) {
    localStorage.removeItem(QUOTES_KEY);
    localStorage.removeItem(PROJECTS_KEY);
  }

  const tr = settings.pricing.taxRate;
  const rep = settings.salesRep.name;

  const quotes: Quote[] = [
    // ── Quote 1: Harrison — Accepted & Delivered ────────────────────────────
    makeQuote('demo-01',
      'James & Amanda Harrison', 'jharrison@gmail.com', '(303) 555-0112', '5642 Red Rock Ln, Boulder, CO 80303',
      'accepted', ['patio', 'seating-wall', 'fire-pit'], 780, 'slight', true,
      [
        { id: 'li-01-1', description: 'Belgard Cambridge Cobble Pavers — 780 sq ft', category: 'material', quantity: 780, unit: 'sq ft', unitPrice: 7.00, total: 5460 },
        { id: 'li-01-2', description: 'Base preparation, compaction & installation', category: 'labor', quantity: 780, unit: 'sq ft', unitPrice: 10.50, total: 8190 },
        { id: 'li-01-3', description: 'Seating wall — 28 linear ft, two-course', category: 'addon', quantity: 28, unit: 'linear ft', unitPrice: 185, total: 5180 },
        { id: 'li-01-4', description: 'Natural gas fire pit with ignition kit', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 4800, total: 4800 },
        { id: 'li-01-5', description: 'Demolition — existing concrete slab', category: 'labor', quantity: 780, unit: 'sq ft', unitPrice: 2.50, total: 1950 },
        { id: 'li-01-6', description: 'Polymeric sand, edging & final seal coat', category: 'material', quantity: 1, unit: 'flat', unitPrice: 1200, total: 1200 },
      ],
      26780, 0, tr, 148, 90, 130, rep, 'Amanda Harrison',
      'Client loved the Cambridge Cobble color range. Fire pit placement approved by city permit.',
    ),
    // ── Quote 2: Murphy — Accepted, Active Job ──────────────────────────────
    makeQuote('demo-05',
      'Patrick & Colleen Murphy', 'cmurphy@icloud.com', '(303) 555-0519', '1498 Foothills Pkwy, Golden, CO 80401',
      'accepted', ['patio', 'outdoor-kitchen', 'outdoor-lighting'],
      950, 'flat', false,
      [
        { id: 'li-05-1', description: 'Belgard Urbana Pavers — 950 sq ft', category: 'material', quantity: 950, unit: 'sq ft', unitPrice: 9.50, total: 9025 },
        { id: 'li-05-2', description: 'Base prep, excavation & installation', category: 'labor', quantity: 950, unit: 'sq ft', unitPrice: 11.00, total: 10450 },
        { id: 'li-05-3', description: 'Outdoor kitchen — granite counter, grill, fridge, sink', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 22500, total: 22500 },
        { id: 'li-05-4', description: 'Pergola — 14×16 ft steel frame with shade sail', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 8900, total: 8900 },
        { id: 'li-05-5', description: 'LED string lighting & recessed path lights (18)', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 3400, total: 3400 },
        { id: 'li-05-6', description: 'Polymeric sand, border edging & seal coat', category: 'material', quantity: 1, unit: 'flat', unitPrice: 1400, total: 1400 },
      ],
      55675, 0, tr, 79, 50, 68, rep, 'Colleen Murphy',
    ),

    // ── Quote 3: Williams — Big Pipeline ($120k) ─────────────────────────────
    makeQuote('demo-10',
      'Grant & Melissa Williams', 'gwilliams@gmail.com', '(303) 555-0891', '7720 Valmont Rd, Boulder, CO 80301',
      'presented', ['pool-deck', 'pool-construction', 'patio'],
      1400, 'flat', true,
      [
        { id: 'li-10-1', description: 'Belgard Porcelain Pavers — pool surround 1,400 sq ft', category: 'material', quantity: 1400, unit: 'sq ft', unitPrice: 16.00, total: 22400 },
        { id: 'li-10-2', description: 'Install, base prep & waterproofing', category: 'labor', quantity: 1400, unit: 'sq ft', unitPrice: 14.00, total: 19600 },
        { id: 'li-10-3', description: 'Fiberglass pool — 16×36 ft, Pebble-Tec finish', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 58000, total: 58000 },
        { id: 'li-10-4', description: 'Equipment pad, pump, filter & automation', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 12500, total: 12500 },
        { id: 'li-10-5', description: 'Demolition — existing landscaping & old deck', category: 'labor', quantity: 1400, unit: 'sq ft', unitPrice: 2.50, total: 3500 },
        { id: 'li-10-6', description: 'LED pool & perimeter lighting package', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 4800, total: 4800 },
      ],
      120800, 0, tr, 18, 5, 5, rep, undefined,
      'Largest project in the pipeline. Client comparing pool suppliers. Decision expected this week.',
    ),
  ];

  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));

  // Seed projects from accepted quotes if not already seeded
  if (!localStorage.getItem(PROJECTS_KEY)) {
    const makeChecklist = () => DEFAULT_CLOSEOUT_CHECKLIST.map((item, i) => ({ ...item, id: `co-${i}` }));
    const projects: Project[] = [
      {
        id: 'proj-01', quoteId: 'demo-01',
        clientName: 'James & Amanda Harrison',
        projectTypes: ['patio', 'seating-wall', 'fire-pit'],
        totalValue: quotes.find(q => q.id === 'demo-01')!.total,
        phase: 'delivered' as ProjectPhase,
        startDate: daysAgo(82),
        estimatedCompletion: daysAgo(55),
        actualCompletion: daysAgo(57),
        cashCollected: quotes.find(q => q.id === 'demo-01')!.total,
        payments: [
          { id: 'pay-01-1', amount: Math.round(quotes.find(q => q.id === 'demo-01')!.total * 0.35), type: 'deposit', method: 'check', note: 'Check #1041', date: daysAgo(82) },
          { id: 'pay-01-2', amount: Math.round(quotes.find(q => q.id === 'demo-01')!.total * 0.40), type: 'stage-1', method: 'ach', note: 'ACH transfer', date: daysAgo(70) },
          { id: 'pay-01-3', amount: Math.round(quotes.find(q => q.id === 'demo-01')!.total * 0.25), type: 'final', method: 'zelle', date: daysAgo(57) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-01-1', phase: 'site-prep', note: 'Site cleared, concrete demo complete. Ready for base.', date: daysAgo(80) },
          { id: 'u-01-2', phase: 'installation', note: 'Base compacted, paver layout started. Looking great.', date: daysAgo(72) },
          { id: 'u-01-3', phase: 'finishing', note: 'Fire pit installed, final seal coat applied. Ready for walkthrough.', date: daysAgo(58) },
          { id: 'u-01-4', phase: 'delivered', note: 'Client walkthrough complete. 5-star review received!', date: daysAgo(57) },
        ],
        todos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: true })),
        createdAt: daysAgo(82), updatedAt: daysAgo(57),
      },
      {
        id: 'proj-02', quoteId: 'demo-05',
        clientName: 'Patrick & Colleen Murphy',
        projectTypes: ['patio', 'outdoor-kitchen', 'outdoor-lighting'],
        totalValue: quotes.find(q => q.id === 'demo-05')!.total,
        phase: 'installation' as ProjectPhase,
        startDate: daysAgo(25),
        estimatedCompletion: daysFromNow(18),
        cashCollected: Math.round(quotes.find(q => q.id === 'demo-05')!.total * 0.35),
        payments: [
          { id: 'pay-02-1', amount: Math.round(quotes.find(q => q.id === 'demo-05')!.total * 0.35), type: 'deposit', method: 'check', note: 'Deposit check #2201', date: daysAgo(25) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-02-1', phase: 'design-review', note: 'Final design approved. Kitchen layout confirmed with client.', date: daysAgo(30) },
          { id: 'u-02-2', phase: 'site-prep', note: 'Excavation complete, compacted base ready for pavers.', date: daysAgo(22) },
          { id: 'u-02-3', phase: 'installation', note: 'Paver field 60% complete. Kitchen frame going up tomorrow.', date: daysAgo(8) },
        ],
        todos: [
          { id: 'td-02-1', text: 'Order kitchen countertop — confirm Silestone Quartz color', completed: true, createdAt: daysAgo(20) },
          { id: 'td-02-2', text: 'Rough-in gas line for grill', completed: true, createdAt: daysAgo(15) },
          { id: 'td-02-3', text: 'Schedule pergola delivery', completed: false, createdAt: daysAgo(8) },
          { id: 'td-02-4', text: 'Lighting fixture order — confirm qty', completed: false, createdAt: daysAgo(8) },
        ],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(25), updatedAt: daysAgo(8),
      },
    ];

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
}
