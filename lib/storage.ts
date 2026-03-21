import type { Quote, AppSettings, Project, ProjectPhase, PaymentTransaction } from '@/types';
import { DEFAULT_CLOSEOUT_CHECKLIST } from '@/types';

const QUOTES_KEY = 'patriot:quotes';
const SETTINGS_KEY = 'patriot:settings';
const PROJECTS_KEY = 'patriot:projects';

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
  roofArea: number, pitch: 'flat' | 'low' | 'moderate' | 'steep', tearOff: boolean,
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
    siteConditions: { roofArea, pitch, stories: 1, currentMaterial: 'asphalt', access: 'easy', tearOff, tearOffDescription: tearOff ? 'Remove existing shingles' : undefined },
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
  if (force) {
    localStorage.removeItem(QUOTES_KEY);
    localStorage.removeItem(PROJECTS_KEY);
  }

  const tr = settings.pricing.taxRate;
  const rep = settings.salesRep.name;
  const team = settings.team ?? [];
  const timothy = team.find(m => m.name.toLowerCase().includes('timothy'))?.name ?? rep;

  const quotes: Quote[] = [
    // ── Q1: Johnson — Accepted & Delivered — Roof Replacement $14,200 ──────
    makeQuote('demo-01',
      'Mike & Sarah Johnson', 'mjohnson@gmail.com', '(336) 555-0112', '412 Oak Ridge Dr, Lexington, NC 27292',
      'accepted', ['roof-replacement'], 2800, 'moderate', true,
      [
        { id: 'li-01-1', description: 'Tear-off existing shingles (1 layer)', category: 'labor', quantity: 28, unit: 'squares', unitPrice: 85, total: 2380 },
        { id: 'li-01-2', description: 'GAF Timberline HDZ — Charcoal', category: 'material', quantity: 28, unit: 'squares', unitPrice: 130, total: 3640 },
        { id: 'li-01-3', description: 'Shingle installation labor', category: 'labor', quantity: 28, unit: 'squares', unitPrice: 175, total: 4900 },
        { id: 'li-01-4', description: 'Synthetic underlayment', category: 'material', quantity: 2800, unit: 'sq ft', unitPrice: 0.45, total: 1260 },
        { id: 'li-01-5', description: 'Ridge vent — 42 linear ft', category: 'addon', quantity: 42, unit: 'linear ft', unitPrice: 8, total: 336 },
        { id: 'li-01-6', description: 'Drip edge & flashing', category: 'material', quantity: 1, unit: 'flat', unitPrice: 680, total: 680 },
        { id: 'li-01-7', description: 'Debris removal & cleanup', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 450, total: 450 },
        { id: 'li-01-8', description: 'Pipe boot replacement (4)', category: 'addon', quantity: 4, unit: 'each', unitPrice: 75, total: 300 },
      ],
      13946, 0, tr, 60, 42, 55, timothy, 'Sarah Johnson',
      'Complete roof replacement. Client thrilled — left a 5-star Google review.',
    ),
    // ── Q2: Patterson — Accepted, Active Job — $22,500 ─────────────────────
    makeQuote('demo-02',
      'David & Karen Patterson', 'dpatter@icloud.com', '(336) 555-0234', '1887 Meadow Creek Ln, Greensboro, NC 27410',
      'accepted', ['roof-replacement', 'gutter-install'], 3200, 'steep', true,
      [
        { id: 'li-02-1', description: 'Tear-off existing shingles (2 layers)', category: 'labor', quantity: 32, unit: 'squares', unitPrice: 150, total: 4800 },
        { id: 'li-02-2', description: 'Owens Corning Duration — Teak', category: 'material', quantity: 32, unit: 'squares', unitPrice: 160, total: 5120 },
        { id: 'li-02-3', description: 'Shingle installation labor', category: 'labor', quantity: 32, unit: 'squares', unitPrice: 200, total: 6400 },
        { id: 'li-02-4', description: 'Ice & water shield (valleys & eaves)', category: 'material', quantity: 600, unit: 'sq ft', unitPrice: 1.50, total: 900 },
        { id: 'li-02-5', description: 'Synthetic underlayment', category: 'material', quantity: 3200, unit: 'sq ft', unitPrice: 0.45, total: 1440 },
        { id: 'li-02-6', description: 'Seamless gutters — 180 linear ft', category: 'addon', quantity: 180, unit: 'linear ft', unitPrice: 12, total: 2160 },
        { id: 'li-02-7', description: 'Downspouts (6) with extensions', category: 'addon', quantity: 6, unit: 'each', unitPrice: 95, total: 570 },
        { id: 'li-02-8', description: 'Decking repair (3 sheets)', category: 'material', quantity: 3, unit: 'each', unitPrice: 85, total: 255 },
        { id: 'li-02-9', description: 'Debris removal & dumpster', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 650, total: 650 },
      ],
      22295, 0, tr, 30, 18, 25, timothy, 'Karen Patterson',
      'Steep 2-story with 2-layer tear-off. Gutters added. Starting next week.',
    ),
    // ── Q3: Williams — Presented, Big Pipeline — $18,900 ───────────────────
    makeQuote('demo-03',
      'James & Lisa Williams', 'jwilliams@gmail.com', '(336) 555-0345', '2240 Country Club Rd, Winston-Salem, NC 27104',
      'presented', ['roof-replacement', 'siding'], 2600, 'moderate', true,
      [
        { id: 'li-03-1', description: 'Tear-off existing shingles', category: 'labor', quantity: 26, unit: 'squares', unitPrice: 85, total: 2210 },
        { id: 'li-03-2', description: 'CertainTeed Landmark Pro — Pewter', category: 'material', quantity: 26, unit: 'squares', unitPrice: 190, total: 4940 },
        { id: 'li-03-3', description: 'Shingle installation labor', category: 'labor', quantity: 26, unit: 'squares', unitPrice: 185, total: 4810 },
        { id: 'li-03-4', description: 'Vinyl siding — front elevation 600 sq ft', category: 'material', quantity: 600, unit: 'sq ft', unitPrice: 4.50, total: 2700 },
        { id: 'li-03-5', description: 'Siding installation labor', category: 'labor', quantity: 600, unit: 'sq ft', unitPrice: 3.50, total: 2100 },
        { id: 'li-03-6', description: 'Fascia & soffit replacement — 80 linear ft', category: 'addon', quantity: 80, unit: 'linear ft', unitPrice: 14, total: 1120 },
        { id: 'li-03-7', description: 'Cleanup & debris removal', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 550, total: 550 },
      ],
      18430, 0, tr, 10, 3, 3, timothy, undefined,
      'Wants roof and front siding done together. Decision expected this week.',
    ),
    // ── Q4: Garcia — Accepted, Active Job — $9,800 ─────────────────────────
    makeQuote('demo-04',
      'Maria Garcia', 'mgarcia@outlook.com', '(336) 555-0456', '504 W 5th Ave, Lexington, NC 27292',
      'accepted', ['roof-repair', 'gutter-repair'], 800, 'low', false,
      [
        { id: 'li-04-1', description: 'Storm damage repair — replace 8 squares', category: 'labor', quantity: 8, unit: 'squares', unitPrice: 225, total: 1800 },
        { id: 'li-04-2', description: 'Matching shingles — GAF Timberline HDZ', category: 'material', quantity: 8, unit: 'squares', unitPrice: 130, total: 1040 },
        { id: 'li-04-3', description: 'Chimney flashing replacement', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 850, total: 850 },
        { id: 'li-04-4', description: 'Gutter re-slope & reseal — 120 linear ft', category: 'labor', quantity: 120, unit: 'linear ft', unitPrice: 8, total: 960 },
        { id: 'li-04-5', description: 'Gutter guard installation', category: 'addon', quantity: 120, unit: 'linear ft', unitPrice: 10, total: 1200 },
        { id: 'li-04-6', description: 'Replace 2 downspouts', category: 'addon', quantity: 2, unit: 'each', unitPrice: 95, total: 190 },
        { id: 'li-04-7', description: 'Pipe boots (2) & vent caps', category: 'addon', quantity: 2, unit: 'each', unitPrice: 75, total: 150 },
      ],
      6190, 0, tr, 25, 15, 20, timothy, 'Maria Garcia',
      'Storm damage repair plus gutter work. Insurance claim approved.',
    ),
    // ── Q5: Brown — Presented — $16,500 ────────────────────────────────────
    makeQuote('demo-05',
      'Robert & Amy Brown', 'rbrown@yahoo.com', '(336) 555-0567', '3105 Horsepen Creek Rd, Greensboro, NC 27410',
      'presented', ['roof-replacement'], 3000, 'moderate', true,
      [
        { id: 'li-05-1', description: 'Tear-off existing shingles', category: 'labor', quantity: 30, unit: 'squares', unitPrice: 85, total: 2550 },
        { id: 'li-05-2', description: 'GAF Timberline Ultra HD — Barkwood', category: 'material', quantity: 30, unit: 'squares', unitPrice: 155, total: 4650 },
        { id: 'li-05-3', description: 'Shingle installation labor', category: 'labor', quantity: 30, unit: 'squares', unitPrice: 185, total: 5550 },
        { id: 'li-05-4', description: 'Synthetic underlayment', category: 'material', quantity: 3000, unit: 'sq ft', unitPrice: 0.45, total: 1350 },
        { id: 'li-05-5', description: 'Ridge vent — 50 linear ft', category: 'addon', quantity: 50, unit: 'linear ft', unitPrice: 8, total: 400 },
        { id: 'li-05-6', description: 'Drip edge, flashing & pipe boots', category: 'material', quantity: 1, unit: 'flat', unitPrice: 850, total: 850 },
        { id: 'li-05-7', description: 'Debris removal & cleanup', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 500, total: 500 },
      ],
      15850, 0, tr, 7, 2, 2, timothy, undefined,
      'Presented on-site Tuesday. Client comparing one other estimate.',
    ),
    // ── Q6: Taylor — Draft — $24,000 ──────────────────────────────────────
    makeQuote('demo-06',
      'Chris & Jessica Taylor', 'jtaylor@gmail.com', '(336) 555-0678', '891 Knollwood St, Winston-Salem, NC 27103',
      'draft', ['roof-replacement', 'gutter-install', 'home-repair'], 3400, 'steep', true,
      [
        { id: 'li-06-1', description: 'Tear-off (2 layers) — steep pitch surcharge', category: 'labor', quantity: 34, unit: 'squares', unitPrice: 175, total: 5950 },
        { id: 'li-06-2', description: 'Owens Corning TruDefinition FLEX — Aged Copper', category: 'material', quantity: 34, unit: 'squares', unitPrice: 200, total: 6800 },
        { id: 'li-06-3', description: 'Installation labor — steep pitch', category: 'labor', quantity: 34, unit: 'squares', unitPrice: 220, total: 7480 },
        { id: 'li-06-4', description: 'Fascia board replacement — 60 linear ft', category: 'addon', quantity: 60, unit: 'linear ft', unitPrice: 14, total: 840 },
        { id: 'li-06-5', description: 'Soffit repair — 40 linear ft', category: 'addon', quantity: 40, unit: 'linear ft', unitPrice: 14, total: 560 },
        { id: 'li-06-6', description: 'Seamless gutters — 200 linear ft', category: 'addon', quantity: 200, unit: 'linear ft', unitPrice: 12, total: 2400 },
        { id: 'li-06-7', description: 'Debris removal & dumpster', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 750, total: 750 },
      ],
      24780, 0, tr, 3, 1, null, timothy, undefined,
      'Steep roof, 2 layers. Premium shingle selection. Site visit scheduled.',
    ),
    // ── Q7: Martinez — Accepted — $28,500 Bathroom Renovation ──────────────
    makeQuote('demo-07',
      'Carlos & Elena Martinez', 'cmartinez@gmail.com', '(336) 555-0789', '1455 Hanes Mall Blvd, Winston-Salem, NC 27103',
      'accepted', ['bathroom-renovation'], 0, 'flat', false,
      [
        { id: 'li-07-1', description: 'Demo existing bathroom — tile, fixtures, vanity', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 2800, total: 2800 },
        { id: 'li-07-2', description: 'Plumbing rough-in & fixture install', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 4500, total: 4500 },
        { id: 'li-07-3', description: 'Tile — floor & shower surround', category: 'material', quantity: 280, unit: 'sq ft', unitPrice: 18, total: 5040 },
        { id: 'li-07-4', description: 'Tile installation labor', category: 'labor', quantity: 280, unit: 'sq ft', unitPrice: 12, total: 3360 },
        { id: 'li-07-5', description: 'Vanity, mirror & lighting fixtures', category: 'material', quantity: 1, unit: 'flat', unitPrice: 3200, total: 3200 },
        { id: 'li-07-6', description: 'Glass shower enclosure', category: 'material', quantity: 1, unit: 'flat', unitPrice: 2400, total: 2400 },
        { id: 'li-07-7', description: 'Electrical — GFCI outlets, exhaust fan, lighting', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 1800, total: 1800 },
        { id: 'li-07-8', description: 'Drywall, paint & trim', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 2200, total: 2200 },
        { id: 'li-07-9', description: 'Project management', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 1500, total: 1500 },
      ],
      26800, 0, tr, 40, 22, 35, timothy, 'Elena Martinez',
      'Master bathroom complete remodel. Tile selected, fixtures ordered.',
    ),
    // ── Q8: Anderson — Lost — $11,200 ──────────────────────────────────────
    makeQuote('demo-08',
      'Steve Anderson', 'sanderson@hotmail.com', '(336) 555-0890', '720 National Hwy, Thomasville, NC 27360',
      'lost', ['roof-replacement'], 2400, 'moderate', true,
      [
        { id: 'li-08-1', description: 'Tear-off existing shingles', category: 'labor', quantity: 24, unit: 'squares', unitPrice: 85, total: 2040 },
        { id: 'li-08-2', description: 'GAF Timberline HDZ — Pewter Gray', category: 'material', quantity: 24, unit: 'squares', unitPrice: 130, total: 3120 },
        { id: 'li-08-3', description: 'Installation labor', category: 'labor', quantity: 24, unit: 'squares', unitPrice: 175, total: 4200 },
        { id: 'li-08-4', description: 'Underlayment, drip edge & flashing', category: 'material', quantity: 1, unit: 'flat', unitPrice: 980, total: 980 },
        { id: 'li-08-5', description: 'Cleanup & debris removal', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 400, total: 400 },
      ],
      10740, 0, tr, 28, 20, 22, timothy, undefined,
      'Lost to competitor on price. Client went with lowest bid.',
    ),
    // ── Q9: Mitchell — Presented — $8,200 Gutter + Home Repair ─────────────
    makeQuote('demo-09',
      'Tom & Linda Mitchell', 'tmitchell@comcast.net', '(336) 555-0901', '2680 Old Salisbury Rd, Salisbury, NC 28144',
      'presented', ['gutter-install', 'home-repair'], 0, 'flat', false,
      [
        { id: 'li-09-1', description: 'Seamless aluminum gutters — 240 linear ft', category: 'addon', quantity: 240, unit: 'linear ft', unitPrice: 12, total: 2880 },
        { id: 'li-09-2', description: 'Downspouts (8) with extensions', category: 'addon', quantity: 8, unit: 'each', unitPrice: 95, total: 760 },
        { id: 'li-09-3', description: 'Gutter guards — full house', category: 'addon', quantity: 240, unit: 'linear ft', unitPrice: 10, total: 2400 },
        { id: 'li-09-4', description: 'Fascia board replacement — 45 linear ft', category: 'addon', quantity: 45, unit: 'linear ft', unitPrice: 14, total: 630 },
        { id: 'li-09-5', description: 'Soffit repair — 30 linear ft', category: 'addon', quantity: 30, unit: 'linear ft', unitPrice: 14, total: 420 },
        { id: 'li-09-6', description: 'Paint touch-up & trim work', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 650, total: 650 },
      ],
      7740, 0, tr, 5, 1, 1, timothy, undefined,
      'Full gutter system with guards plus fascia/soffit repair. Very interested.',
    ),
    // ── Q10: Davis — Draft — $35,000 Kitchen Renovation ────────────────────
    makeQuote('demo-10',
      'Brian & Michelle Davis', 'bdavis@me.com', '(336) 555-0012', '1540 Westover Terrace, Greensboro, NC 27408',
      'draft', ['kitchen-renovation'], 0, 'flat', false,
      [
        { id: 'li-10-1', description: 'Demo existing kitchen — cabinets, counters, flooring', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 3500, total: 3500 },
        { id: 'li-10-2', description: 'Custom cabinets — 22 linear ft', category: 'material', quantity: 22, unit: 'linear ft', unitPrice: 450, total: 9900 },
        { id: 'li-10-3', description: 'Quartz countertops — 45 sq ft', category: 'material', quantity: 45, unit: 'sq ft', unitPrice: 85, total: 3825 },
        { id: 'li-10-4', description: 'Tile backsplash — 35 sq ft', category: 'material', quantity: 35, unit: 'sq ft', unitPrice: 22, total: 770 },
        { id: 'li-10-5', description: 'LVP flooring — 200 sq ft', category: 'material', quantity: 200, unit: 'sq ft', unitPrice: 8, total: 1600 },
        { id: 'li-10-6', description: 'Plumbing — sink, dishwasher, disposal', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 3200, total: 3200 },
        { id: 'li-10-7', description: 'Electrical — lighting, outlets, appliance circuits', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 2800, total: 2800 },
        { id: 'li-10-8', description: 'Installation labor — cabinets, counters, tile, floor', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 6500, total: 6500 },
        { id: 'li-10-9', description: 'Paint, trim & finishing', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 1800, total: 1800 },
        { id: 'li-10-10', description: 'Project management & design', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 2000, total: 2000 },
      ],
      35895, 0, tr, 2, 1, null, timothy, undefined,
      'Full kitchen renovation. Client reviewing cabinet selections. Site visit Friday.',
    ),
  ];

  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));

  // Seed projects from accepted quotes
  if (!localStorage.getItem(PROJECTS_KEY)) {
    const makeChecklist = () => DEFAULT_CLOSEOUT_CHECKLIST.map((item, i) => ({ ...item, id: `co-${i}` }));
    const q = (id: string) => quotes.find(qq => qq.id === id)!;
    const projects: Project[] = [
      // ── P1: Johnson — Delivered — $14,200 ──────────────────────────────────
      {
        id: 'proj-01', quoteId: 'demo-01',
        clientName: 'Mike & Sarah Johnson',
        projectTypes: ['roof-replacement'],
        totalValue: q('demo-01').total,
        phase: 'delivered' as ProjectPhase,
        startDate: daysAgo(55),
        estimatedCompletion: daysAgo(48),
        actualCompletion: daysAgo(49),
        cashCollected: q('demo-01').total,
        payments: [
          { id: 'pay-01-1', amount: Math.round(q('demo-01').total * 0.50), type: 'deposit', method: 'check', note: 'Deposit check #4012', date: daysAgo(55) },
          { id: 'pay-01-2', amount: Math.round(q('demo-01').total * 0.50), type: 'final', method: 'ach', note: 'Final payment — ACH', date: daysAgo(49) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-01-1', phase: 'site-prep', note: 'Tear-off complete. Decking inspected — 2 sheets replaced.', date: daysAgo(53) },
          { id: 'u-01-2', phase: 'installation', note: 'Underlayment down. Shingles going up — 60% complete.', date: daysAgo(51) },
          { id: 'u-01-3', phase: 'finishing', note: 'Ridge cap installed. Flashing sealed. Cleanup done.', date: daysAgo(50) },
          { id: 'u-01-4', phase: 'delivered', note: 'Final inspection passed. Warranty docs delivered. 5-star review!', date: daysAgo(49) },
        ],
        todos: [],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: true })),
        createdAt: daysAgo(55), updatedAt: daysAgo(49),
      },
      // ── P2: Patterson — Installation — $22,500 ─────────────────────────────
      {
        id: 'proj-02', quoteId: 'demo-02',
        clientName: 'David & Karen Patterson',
        projectTypes: ['roof-replacement', 'gutter-install'],
        totalValue: q('demo-02').total,
        phase: 'installation' as ProjectPhase,
        startDate: daysAgo(8),
        estimatedCompletion: daysFromNow(5),
        cashCollected: Math.round(q('demo-02').total * 0.50),
        payments: [
          { id: 'pay-02-1', amount: Math.round(q('demo-02').total * 0.50), type: 'deposit', method: 'check', note: 'Check #7733', date: daysAgo(8) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-02-1', phase: 'site-prep', note: 'Tear-off complete — 2 layers removed. 3 sheets of decking replaced.', date: daysAgo(6) },
          { id: 'u-02-2', phase: 'installation', note: 'Underlayment and ice & water shield installed. Shingles 40% up.', date: daysAgo(3) },
        ],
        todos: [
          { id: 'td-02-1', text: 'Finish shingle installation — north face remaining', completed: false, createdAt: daysAgo(3) },
          { id: 'td-02-2', text: 'Install gutters after roof completion', completed: false, createdAt: daysAgo(6) },
          { id: 'td-02-3', text: 'Schedule final inspection', completed: false, createdAt: daysAgo(2) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(12), updatedAt: daysAgo(3),
      },
      // ── P3: Garcia — Site Prep — $9,800 ────────────────────────────────────
      {
        id: 'proj-03', quoteId: 'demo-04',
        clientName: 'Maria Garcia',
        projectTypes: ['roof-repair', 'gutter-repair'],
        totalValue: q('demo-04').total,
        phase: 'site-prep' as ProjectPhase,
        startDate: daysAgo(3),
        estimatedCompletion: daysFromNow(7),
        cashCollected: Math.round(q('demo-04').total * 0.50),
        payments: [
          { id: 'pay-03-1', amount: Math.round(q('demo-04').total * 0.50), type: 'deposit', method: 'ach', note: 'ACH deposit', date: daysAgo(3) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-03-1', phase: 'design-review', note: 'Insurance adjuster approved scope. Materials ordered.', date: daysAgo(8) },
          { id: 'u-03-2', phase: 'site-prep', note: 'Damaged shingles removed. Chimney flashing demo started.', date: daysAgo(2) },
        ],
        todos: [
          { id: 'td-03-1', text: 'Replace chimney flashing', completed: false, createdAt: daysAgo(3) },
          { id: 'td-03-2', text: 'Re-slope gutters and install guards', completed: false, createdAt: daysAgo(3) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(10), updatedAt: daysAgo(2),
      },
      // ── P4: Martinez — Installation — $28,500 Bathroom ─────────────────────
      {
        id: 'proj-04', quoteId: 'demo-07',
        clientName: 'Carlos & Elena Martinez',
        projectTypes: ['bathroom-renovation'],
        totalValue: q('demo-07').total,
        phase: 'installation' as ProjectPhase,
        startDate: daysAgo(18),
        estimatedCompletion: daysFromNow(10),
        cashCollected: Math.round(q('demo-07').total * 0.60),
        payments: [
          { id: 'pay-04-1', amount: Math.round(q('demo-07').total * 0.35), type: 'deposit', method: 'check', note: 'Check #3891', date: daysAgo(18) },
          { id: 'pay-04-2', amount: Math.round(q('demo-07').total * 0.25), type: 'stage-1', method: 'ach', note: 'ACH — plumbing complete', date: daysAgo(8) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-04-1', phase: 'site-prep', note: 'Demo complete. Plumbing rough-in done. Electrical updated.', date: daysAgo(14) },
          { id: 'u-04-2', phase: 'installation', note: 'Tile installed on floor and shower. Vanity set. Glass enclosure tomorrow.', date: daysAgo(3) },
        ],
        todos: [
          { id: 'td-04-1', text: 'Install glass shower enclosure', completed: false, createdAt: daysAgo(5) },
          { id: 'td-04-2', text: 'Final paint and trim', completed: false, createdAt: daysAgo(3) },
          { id: 'td-04-3', text: 'Fixture installation — faucet, showerhead, towel bars', completed: false, createdAt: daysAgo(3) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(22), updatedAt: daysAgo(3),
      },
      // ── P5: Simmons — Finishing — $12,800 Roof ─────────────────────────────
      {
        id: 'proj-05', quoteId: 'proj-05-q',
        clientName: 'Dan & Kelly Simmons',
        projectTypes: ['roof-replacement', 'home-repair'],
        totalValue: 13650,
        phase: 'finishing' as ProjectPhase,
        startDate: daysAgo(12),
        estimatedCompletion: daysFromNow(2),
        cashCollected: Math.round(13650 * 0.75),
        payments: [
          { id: 'pay-05-1', amount: Math.round(13650 * 0.50), type: 'deposit', method: 'check', note: 'Check #2215', date: daysAgo(12) },
          { id: 'pay-05-2', amount: Math.round(13650 * 0.25), type: 'stage-1', method: 'zelle', note: 'Zelle — shingles installed', date: daysAgo(5) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-05-1', phase: 'site-prep', note: 'Tear-off complete. All decking solid.', date: daysAgo(10) },
          { id: 'u-05-2', phase: 'installation', note: 'All shingles installed. Ridge vent done.', date: daysAgo(5) },
          { id: 'u-05-3', phase: 'finishing', note: 'Flashing sealed. Fascia boards replaced. Cleanup in progress.', date: daysAgo(1) },
        ],
        todos: [
          { id: 'td-05-1', text: 'Final debris cleanup & magnet sweep', completed: false, createdAt: daysAgo(2) },
          { id: 'td-05-2', text: 'Schedule final walkthrough with client', completed: false, createdAt: daysAgo(1) },
          { id: 'td-05-3', text: 'Collect final payment after walkthrough', completed: false, createdAt: daysAgo(1) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map((item, i) => ({ ...item, completed: i < 4 })),
        createdAt: daysAgo(15), updatedAt: daysAgo(1),
      },
      // ── P6: Cooper — Permitting — $15,200 ──────────────────────────────────
      {
        id: 'proj-06', quoteId: 'proj-06-q',
        clientName: 'Jeff & Diane Cooper',
        projectTypes: ['roof-replacement', 'gutter-install'],
        totalValue: 16200,
        phase: 'permitting' as ProjectPhase,
        startDate: daysAgo(4),
        estimatedCompletion: daysFromNow(18),
        cashCollected: Math.round(16200 * 0.35),
        payments: [
          { id: 'pay-06-1', amount: Math.round(16200 * 0.35), type: 'deposit', method: 'check', note: 'Deposit check #5501', date: daysAgo(4) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-06-1', phase: 'design-review', note: 'Material selection finalized — standing seam metal in charcoal.', date: daysAgo(8) },
          { id: 'u-06-2', phase: 'permitting', note: 'Permit submitted. Metal panels ordered — 2 week lead time.', date: daysAgo(4) },
        ],
        todos: [
          { id: 'td-06-1', text: 'Follow up on building permit status', completed: false, createdAt: daysAgo(2) },
          { id: 'td-06-2', text: 'Confirm metal panel delivery date', completed: false, createdAt: daysAgo(3) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(10), updatedAt: daysAgo(4),
      },
      // ── P7: Walker — Design Review — $18,500 ──────────────────────────────
      {
        id: 'proj-07', quoteId: 'proj-07-q',
        clientName: 'Tom & Annie Walker',
        projectTypes: ['kitchen-renovation'],
        totalValue: 19800,
        phase: 'design-review' as ProjectPhase,
        startDate: daysAgo(2),
        estimatedCompletion: daysFromNow(35),
        cashCollected: Math.round(19800 * 0.15),
        payments: [
          { id: 'pay-07-1', amount: Math.round(19800 * 0.15), type: 'deposit', method: 'ach', note: 'ACH design deposit', date: daysAgo(2) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-07-1', phase: 'design-review', note: 'Initial design concept shared. Client reviewing cabinet options.', date: daysAgo(2) },
        ],
        todos: [
          { id: 'td-07-1', text: 'Finalize cabinet style — shaker vs flat panel', completed: false, createdAt: daysAgo(2) },
          { id: 'td-07-2', text: 'Get client approval on countertop material', completed: false, createdAt: daysAgo(1) },
          { id: 'td-07-3', text: 'Take final kitchen measurements', completed: false, createdAt: daysAgo(1) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(5), updatedAt: daysAgo(2),
      },
    ];

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
}
