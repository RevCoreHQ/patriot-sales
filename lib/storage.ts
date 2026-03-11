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
  // Use team members if available, otherwise fall back to salesRep name
  const team = settings.team ?? [];
  const hayden = team.find(m => m.name.toLowerCase().includes('hayden'))?.name ?? rep;
  const derick = team.find(m => m.name.toLowerCase().includes('derick'))?.name ?? 'Derick';
  const evan = team.find(m => m.name.toLowerCase().includes('evan'))?.name ?? 'Evan';

  const quotes: Quote[] = [
    // ── Q1: Harrison — Accepted & Delivered — $92k ──────────────────────────
    makeQuote('demo-01',
      'James & Amanda Harrison', 'jharrison@gmail.com', '(303) 555-0112', '5642 Red Rock Ln, Boulder, CO 80303',
      'accepted', ['patio', 'seating-wall', 'fire-pit', 'outdoor-lighting'], 1200, 'slight', true,
      [
        { id: 'li-01-1', description: 'Belgard Cambridge Cobble Pavers — 1,200 sq ft', category: 'material', quantity: 1200, unit: 'sq ft', unitPrice: 9.50, total: 11400 },
        { id: 'li-01-2', description: 'Base preparation, compaction & installation', category: 'labor', quantity: 1200, unit: 'sq ft', unitPrice: 12.00, total: 14400 },
        { id: 'li-01-3', description: 'Seating wall — 52 linear ft, three-course', category: 'addon', quantity: 52, unit: 'linear ft', unitPrice: 210, total: 10920 },
        { id: 'li-01-4', description: 'Natural gas fire pit with ignition kit & stone surround', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 7800, total: 7800 },
        { id: 'li-01-5', description: 'Demolition — existing concrete slab & retaining wall', category: 'labor', quantity: 1200, unit: 'sq ft', unitPrice: 3.50, total: 4200 },
        { id: 'li-01-6', description: 'LED path & perimeter lighting (24 fixtures)', category: 'addon', quantity: 24, unit: 'each', unitPrice: 285, total: 6840 },
        { id: 'li-01-7', description: 'Polymeric sand, edging & final seal coat', category: 'material', quantity: 1, unit: 'flat', unitPrice: 2200, total: 2200 },
        { id: 'li-01-8', description: 'Drainage system — French drain 60 linear ft', category: 'labor', quantity: 60, unit: 'linear ft', unitPrice: 85, total: 5100 },
        { id: 'li-01-9', description: 'Project management & permits', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 3500, total: 3500 },
      ],
      86360, 0, tr, 148, 90, 130, hayden, 'Amanda Harrison',
      'Completed backyard transformation. Client thrilled with results — left a 5-star Google review.',
    ),
    // ── Q2: Murphy — Accepted, Active Job — $142k ───────────────────────────
    makeQuote('demo-05',
      'Patrick & Colleen Murphy', 'cmurphy@icloud.com', '(303) 555-0519', '1498 Foothills Pkwy, Golden, CO 80401',
      'accepted', ['patio', 'outdoor-kitchen', 'outdoor-lighting', 'seating-wall'],
      1400, 'flat', false,
      [
        { id: 'li-05-1', description: 'Belgard Urbana Pavers — 1,400 sq ft', category: 'material', quantity: 1400, unit: 'sq ft', unitPrice: 11.00, total: 15400 },
        { id: 'li-05-2', description: 'Base prep, excavation & installation', category: 'labor', quantity: 1400, unit: 'sq ft', unitPrice: 12.50, total: 17500 },
        { id: 'li-05-3', description: 'Outdoor kitchen — quartzite counter, built-in grill, fridge, sink, storage', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 38500, total: 38500 },
        { id: 'li-05-4', description: 'Pergola — 16×20 ft cedar with motorized louvered roof', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 22000, total: 22000 },
        { id: 'li-05-5', description: 'LED string & recessed lighting package (32 fixtures)', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 5800, total: 5800 },
        { id: 'li-05-6', description: 'Seating wall — 36 linear ft with cap stones', category: 'addon', quantity: 36, unit: 'linear ft', unitPrice: 195, total: 7020 },
        { id: 'li-05-7', description: 'Polymeric sand, border edging & seal coat', category: 'material', quantity: 1, unit: 'flat', unitPrice: 2800, total: 2800 },
        { id: 'li-05-8', description: 'Gas line rough-in & electrical for kitchen', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 6500, total: 6500 },
        { id: 'li-05-9', description: 'Project management & design', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 4500, total: 4500 },
      ],
      133020, 0, tr, 79, 50, 68, derick, 'Colleen Murphy',
      'Premium outdoor living space. Kitchen appliances on order, expected delivery in 2 weeks.',
    ),
    // ── Q3: Williams — Presented, Big Pipeline — $195k ──────────────────────
    makeQuote('demo-10',
      'Grant & Melissa Williams', 'gwilliams@gmail.com', '(303) 555-0891', '7720 Valmont Rd, Boulder, CO 80301',
      'presented', ['pool-deck', 'pool-construction', 'patio', 'outdoor-lighting'],
      1800, 'flat', true,
      [
        { id: 'li-10-1', description: 'Belgard Porcelain Pavers — pool surround 1,800 sq ft', category: 'material', quantity: 1800, unit: 'sq ft', unitPrice: 18.00, total: 32400 },
        { id: 'li-10-2', description: 'Install, base prep & waterproofing', category: 'labor', quantity: 1800, unit: 'sq ft', unitPrice: 14.00, total: 25200 },
        { id: 'li-10-3', description: 'Gunite pool — 18×40 ft, Pebble-Tec finish, spa combo', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 78000, total: 78000 },
        { id: 'li-10-4', description: 'Equipment pad, variable speed pump, filter & smart automation', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 16500, total: 16500 },
        { id: 'li-10-5', description: 'Demolition — existing landscaping, old deck & grading', category: 'labor', quantity: 1800, unit: 'sq ft', unitPrice: 3.00, total: 5400 },
        { id: 'li-10-6', description: 'LED pool, spa & perimeter lighting package', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 8200, total: 8200 },
        { id: 'li-10-7', description: 'Water features — 3 deck jets & sheer descent', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 9500, total: 9500 },
        { id: 'li-10-8', description: 'Project management, engineering & permits', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 7500, total: 7500 },
      ],
      182700, 0, tr, 18, 5, 5, hayden, undefined,
      'Largest prospect in the pipeline. Clients comparing 2 other pool builders. Decision expected this week.',
    ),
    // ── Q4: Ramirez — Accepted, Active Job — $118k ──────────────────────────
    makeQuote('demo-04',
      'Carlos & Elena Ramirez', 'carlos.ramirez@outlook.com', '(720) 555-0234', '3210 Mesa Trail, Louisville, CO 80027',
      'accepted', ['driveway', 'walkway', 'outdoor-lighting'], 2200, 'slight', true,
      [
        { id: 'li-04-1', description: 'Belgard Holland Stone Pavers — driveway 1,800 sq ft', category: 'material', quantity: 1800, unit: 'sq ft', unitPrice: 12.00, total: 21600 },
        { id: 'li-04-2', description: 'Belgard Holland Stone Pavers — walkway 400 sq ft', category: 'material', quantity: 400, unit: 'sq ft', unitPrice: 12.00, total: 4800 },
        { id: 'li-04-3', description: 'Excavation, grading & base installation', category: 'labor', quantity: 2200, unit: 'sq ft', unitPrice: 11.50, total: 25300 },
        { id: 'li-04-4', description: 'Demolition — existing asphalt driveway & concrete walk', category: 'labor', quantity: 2200, unit: 'sq ft', unitPrice: 3.00, total: 6600 },
        { id: 'li-04-5', description: 'Heated driveway system — glycol loops & boiler', category: 'addon', quantity: 1800, unit: 'sq ft', unitPrice: 18.00, total: 32400 },
        { id: 'li-04-6', description: 'LED bollard & path lighting (16 fixtures)', category: 'addon', quantity: 16, unit: 'each', unitPrice: 320, total: 5120 },
        { id: 'li-04-7', description: 'Polymeric sand, edging & seal coat', category: 'material', quantity: 1, unit: 'flat', unitPrice: 3200, total: 3200 },
        { id: 'li-04-8', description: 'Project management & permits', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 4200, total: 4200 },
      ],
      110620, 5, tr, 62, 45, 55, evan, 'Carlos Ramirez',
      'Heated driveway is the premium upsell. Snow-melt system requires boiler install coordination.',
    ),
    // ── Q5: Chen — Presented, Awaiting Decision — $165k ─────────────────────
    makeQuote('demo-06',
      'David & Sarah Chen', 'dchen@gmail.com', '(303) 555-0678', '9450 Baseline Rd, Boulder, CO 80303',
      'presented', ['pool-deck', 'pool-construction', 'outdoor-kitchen'], 1600, 'flat', false,
      [
        { id: 'li-06-1', description: 'Travertine pavers — pool deck 1,200 sq ft', category: 'material', quantity: 1200, unit: 'sq ft', unitPrice: 22.00, total: 26400 },
        { id: 'li-06-2', description: 'Travertine pavers — kitchen patio 400 sq ft', category: 'material', quantity: 400, unit: 'sq ft', unitPrice: 22.00, total: 8800 },
        { id: 'li-06-3', description: 'Base prep, leveling & installation', category: 'labor', quantity: 1600, unit: 'sq ft', unitPrice: 13.00, total: 20800 },
        { id: 'li-06-4', description: 'Fiberglass pool — 16×32 ft, midnight blue finish', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 62000, total: 62000 },
        { id: 'li-06-5', description: 'Pool equipment, smart controls & heater', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 14000, total: 14000 },
        { id: 'li-06-6', description: 'Outdoor kitchen — L-shape, granite, grill & smoker', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 28000, total: 28000 },
        { id: 'li-06-7', description: 'Project management, engineering & permits', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 6000, total: 6000 },
      ],
      155000, 0, tr, 12, 3, 3, derick, undefined,
      'Premium travertine selection. Client wants to start before Memorial Day. Following up Thursday.',
    ),
    // ── Q6: Thompson — Draft — $88k ─────────────────────────────────────────
    makeQuote('demo-07',
      'Mike & Jennifer Thompson', 'jthompson22@yahoo.com', '(720) 555-0445', '6821 Lookout Rd, Longmont, CO 80503',
      'draft', ['patio', 'fire-pit', 'deck-pergola'], 1100, 'steep', true,
      [
        { id: 'li-07-1', description: 'Belgard Mega-Lafitt Pavers — 1,100 sq ft', category: 'material', quantity: 1100, unit: 'sq ft', unitPrice: 10.00, total: 11000 },
        { id: 'li-07-2', description: 'Retaining wall & terraced base system', category: 'labor', quantity: 1100, unit: 'sq ft', unitPrice: 16.00, total: 17600 },
        { id: 'li-07-3', description: 'Custom fire pit — rectangular, natural stone veneer', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 9200, total: 9200 },
        { id: 'li-07-4', description: 'Cedar pergola — 14×18 ft with fan & heater', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 18500, total: 18500 },
        { id: 'li-07-5', description: 'Demolition — hillside clearing & old timber deck', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 8500, total: 8500 },
        { id: 'li-07-6', description: 'Drainage, grading & erosion control', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 6200, total: 6200 },
        { id: 'li-07-7', description: 'Polymeric sand, seal coat & cleanup', category: 'material', quantity: 1, unit: 'flat', unitPrice: 1800, total: 1800 },
        { id: 'li-07-8', description: 'Project management & design', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 3800, total: 3800 },
      ],
      82600, 5, tr, 4, 2, null, evan, undefined,
      'Steep hillside lot — requires significant retaining work. Waiting on final measurements.',
    ),
    // ── Q7: Nguyen — Accepted, Active Job — $175k ───────────────────────────
    makeQuote('demo-08',
      'Tony & Lisa Nguyen', 'tnguyen@gmail.com', '(303) 555-0912', '2180 Arapahoe Ave, Boulder, CO 80302',
      'accepted', ['pool-deck', 'pool-construction', 'seating-wall', 'outdoor-lighting'],
      1500, 'flat', true,
      [
        { id: 'li-08-1', description: 'Belgard Porcelain Pavers — pool deck 1,500 sq ft', category: 'material', quantity: 1500, unit: 'sq ft', unitPrice: 18.00, total: 27000 },
        { id: 'li-08-2', description: 'Base prep, leveling & installation', category: 'labor', quantity: 1500, unit: 'sq ft', unitPrice: 13.50, total: 20250 },
        { id: 'li-08-3', description: 'Gunite pool — 16×34 ft, quartz plaster finish', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 72000, total: 72000 },
        { id: 'li-08-4', description: 'Pool equipment, heater & automation system', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 15500, total: 15500 },
        { id: 'li-08-5', description: 'Seating wall — 44 linear ft with integrated planters', category: 'addon', quantity: 44, unit: 'linear ft', unitPrice: 225, total: 9900 },
        { id: 'li-08-6', description: 'LED pool lighting, deck lights & landscape spots (28)', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 7200, total: 7200 },
        { id: 'li-08-7', description: 'Demolition — existing patio & landscaping', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 5500, total: 5500 },
        { id: 'li-08-8', description: 'Project management, engineering & permits', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 6500, total: 6500 },
      ],
      163850, 0, tr, 45, 20, 38, hayden, 'Tony Nguyen',
      'Pool shell poured. Deck work starts next week. Client very engaged — visits site daily.',
    ),
    // ── Q8: Patel — Lost — $98k ─────────────────────────────────────────────
    makeQuote('demo-09',
      'Raj & Priya Patel', 'rpatel@hotmail.com', '(720) 555-0331', '4455 S Broadway, Boulder, CO 80305',
      'lost', ['patio', 'outdoor-kitchen', 'fire-pit'], 1300, 'flat', false,
      [
        { id: 'li-09-1', description: 'Belgard Lafitt Rustic Pavers — 1,300 sq ft', category: 'material', quantity: 1300, unit: 'sq ft', unitPrice: 8.50, total: 11050 },
        { id: 'li-09-2', description: 'Base prep, compaction & installation', category: 'labor', quantity: 1300, unit: 'sq ft', unitPrice: 11.00, total: 14300 },
        { id: 'li-09-3', description: 'Outdoor kitchen — straight run, granite, grill & fridge', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 26000, total: 26000 },
        { id: 'li-09-4', description: 'Fire pit — circular with natural stone cap', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 6800, total: 6800 },
        { id: 'li-09-5', description: 'Pergola — 12×14 ft aluminum with retractable canopy', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 15000, total: 15000 },
        { id: 'li-09-6', description: 'Polymeric sand, edging & seal coat', category: 'material', quantity: 1, unit: 'flat', unitPrice: 2100, total: 2100 },
        { id: 'li-09-7', description: 'Project management & design', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 4000, total: 4000 },
      ],
      92250, 5, tr, 35, 28, 30, derick, undefined,
      'Lost to competitor on price. Client went with a lower bid — no outdoor kitchen experience.',
    ),
    // ── Q9: Foster — Presented — $128k ──────────────────────────────────────
    makeQuote('demo-11',
      'Brian & Michelle Foster', 'bfoster@comcast.net', '(303) 555-0756', '8830 Eldorado Springs Dr, Boulder, CO 80303',
      'presented', ['patio', 'seating-wall', 'outdoor-lighting', 'artificial-grass'], 1650, 'slight', true,
      [
        { id: 'li-11-1', description: 'Natural flagstone pavers — 1,250 sq ft', category: 'material', quantity: 1250, unit: 'sq ft', unitPrice: 16.00, total: 20000 },
        { id: 'li-11-2', description: 'Artificial turf — premium 400 sq ft play area', category: 'material', quantity: 400, unit: 'sq ft', unitPrice: 14.00, total: 5600 },
        { id: 'li-11-3', description: 'Base prep, leveling & stone installation', category: 'labor', quantity: 1650, unit: 'sq ft', unitPrice: 14.00, total: 23100 },
        { id: 'li-11-4', description: 'Boulder seating walls — 65 linear ft', category: 'addon', quantity: 65, unit: 'linear ft', unitPrice: 240, total: 15600 },
        { id: 'li-11-5', description: 'LED landscape & path lighting (22 fixtures)', category: 'addon', quantity: 22, unit: 'each', unitPrice: 310, total: 6820 },
        { id: 'li-11-6', description: 'Built-in stone BBQ & counter', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 18500, total: 18500 },
        { id: 'li-11-7', description: 'Demolition — old deck, grading & drainage', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 9500, total: 9500 },
        { id: 'li-11-8', description: 'Turf sub-base, drainage mat & infill', category: 'labor', quantity: 400, unit: 'sq ft', unitPrice: 6.00, total: 2400 },
        { id: 'li-11-9', description: 'Project management, design & permits', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 5500, total: 5500 },
      ],
      120020, 0, tr, 8, 2, 2, evan, undefined,
      'Natural flagstone look with kid-friendly turf zone. Presented on-site Monday — very interested.',
    ),
    // ── Q10: Dixon — Draft — $200k ──────────────────────────────────────────
    makeQuote('demo-12',
      'Robert & Catherine Dixon', 'rdixon@me.com', '(720) 555-0889', '1120 Mapleton Ave, Boulder, CO 80304',
      'draft', ['pool-construction', 'pool-deck', 'outdoor-kitchen', 'outdoor-lighting', 'seating-wall'],
      2400, 'flat', true,
      [
        { id: 'li-12-1', description: 'Travertine pavers — pool deck & patio 2,000 sq ft', category: 'material', quantity: 2000, unit: 'sq ft', unitPrice: 22.00, total: 44000 },
        { id: 'li-12-2', description: 'Base prep, leveling & installation', category: 'labor', quantity: 2000, unit: 'sq ft', unitPrice: 14.00, total: 28000 },
        { id: 'li-12-3', description: 'Infinity-edge gunite pool — 20×42 ft with spa', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 95000, total: 95000 },
        { id: 'li-12-4', description: 'Pool equipment, automation, heater & salt system', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 18000, total: 18000 },
        { id: 'li-12-5', description: 'Outdoor kitchen — U-shape, quartzite, full appliance suite', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 42000, total: 42000 },
        { id: 'li-12-6', description: 'Curved seating wall — 48 linear ft with fire bowls', category: 'addon', quantity: 48, unit: 'linear ft', unitPrice: 265, total: 12720 },
        { id: 'li-12-7', description: 'Full LED lighting — pool, landscape, kitchen (40+ fixtures)', category: 'addon', quantity: 1, unit: 'flat', unitPrice: 12000, total: 12000 },
        { id: 'li-12-8', description: 'Demolition — existing pool, deck & landscaping', category: 'labor', quantity: 2400, unit: 'sq ft', unitPrice: 4.00, total: 9600 },
        { id: 'li-12-9', description: 'Structural engineering, permits & project management', category: 'labor', quantity: 1, unit: 'flat', unitPrice: 9500, total: 9500 },
      ],
      187820, 0, tr, 2, 1, null, hayden, undefined,
      'Complete backyard renovation — tear out old pool, build infinity edge. Site visit scheduled Friday.',
    ),
  ];

  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));

  // Seed projects from accepted quotes if not already seeded
  if (!localStorage.getItem(PROJECTS_KEY)) {
    const makeChecklist = () => DEFAULT_CLOSEOUT_CHECKLIST.map((item, i) => ({ ...item, id: `co-${i}` }));
    const q = (id: string) => quotes.find(qq => qq.id === id)!;
    const projects: Project[] = [
      // ── P1: Harrison — Delivered — $92k ───────────────────────────────────
      {
        id: 'proj-01', quoteId: 'demo-01',
        clientName: 'James & Amanda Harrison',
        projectTypes: ['patio', 'seating-wall', 'fire-pit', 'outdoor-lighting'],
        totalValue: q('demo-01').total,
        phase: 'delivered' as ProjectPhase,
        startDate: daysAgo(82),
        estimatedCompletion: daysAgo(50),
        actualCompletion: daysAgo(52),
        cashCollected: q('demo-01').total,
        payments: [
          { id: 'pay-01-1', amount: Math.round(q('demo-01').total * 0.35), type: 'deposit', method: 'check', note: 'Check #1041', date: daysAgo(82) },
          { id: 'pay-01-2', amount: Math.round(q('demo-01').total * 0.40), type: 'stage-1', method: 'ach', note: 'ACH transfer — base complete', date: daysAgo(68) },
          { id: 'pay-01-3', amount: Math.round(q('demo-01').total * 0.25), type: 'final', method: 'zelle', date: daysAgo(52) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-01-1', phase: 'site-prep', note: 'Demo complete, concrete hauled. French drain trenched.', date: daysAgo(78) },
          { id: 'u-01-2', phase: 'installation', note: 'Base compacted, pavers going down. Seating wall 50% up.', date: daysAgo(68) },
          { id: 'u-01-3', phase: 'finishing', note: 'Fire pit plumbed, lighting wired, seal coat applied.', date: daysAgo(55) },
          { id: 'u-01-4', phase: 'delivered', note: 'Final walkthrough — 5-star Google review received!', date: daysAgo(52) },
        ],
        todos: [],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: true })),
        createdAt: daysAgo(82), updatedAt: daysAgo(52),
      },
      // ── P2: Murphy — Installation — $142k ─────────────────────────────────
      {
        id: 'proj-02', quoteId: 'demo-05',
        clientName: 'Patrick & Colleen Murphy',
        projectTypes: ['patio', 'outdoor-kitchen', 'outdoor-lighting', 'seating-wall'],
        totalValue: q('demo-05').total,
        phase: 'installation' as ProjectPhase,
        startDate: daysAgo(25),
        estimatedCompletion: daysFromNow(18),
        cashCollected: Math.round(q('demo-05').total * 0.60),
        payments: [
          { id: 'pay-02-1', amount: Math.round(q('demo-05').total * 0.35), type: 'deposit', method: 'check', note: 'Deposit check #2201', date: daysAgo(25) },
          { id: 'pay-02-2', amount: Math.round(q('demo-05').total * 0.25), type: 'stage-1', method: 'ach', note: 'ACH — base & paver progress', date: daysAgo(12) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-02-1', phase: 'design-review', note: 'Final design approved. Kitchen layout confirmed with client.', date: daysAgo(32) },
          { id: 'u-02-2', phase: 'site-prep', note: 'Excavation complete, compacted base ready for pavers.', date: daysAgo(22) },
          { id: 'u-02-3', phase: 'installation', note: 'Paver field 75% complete. Kitchen frame & gas rough-in done.', date: daysAgo(5) },
        ],
        todos: [
          { id: 'td-02-1', text: 'Order quartzite countertop — confirm color with client', completed: true, createdAt: daysAgo(20) },
          { id: 'td-02-2', text: 'Rough-in gas line for grill', completed: true, createdAt: daysAgo(15) },
          { id: 'td-02-3', text: 'Schedule pergola delivery & crane', completed: false, createdAt: daysAgo(8) },
          { id: 'td-02-4', text: 'Lighting fixture order — confirm qty (32 fixtures)', completed: false, createdAt: daysAgo(8) },
          { id: 'td-02-5', text: 'Seating wall cap stones — verify color match', completed: false, createdAt: daysAgo(3) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(30), updatedAt: daysAgo(5),
      },
      // ── P3: Ramirez — Site Prep — $118k ───────────────────────────────────
      {
        id: 'proj-03', quoteId: 'demo-04',
        clientName: 'Carlos & Elena Ramirez',
        projectTypes: ['driveway', 'walkway', 'outdoor-lighting'],
        totalValue: q('demo-04').total,
        phase: 'site-prep' as ProjectPhase,
        startDate: daysAgo(10),
        estimatedCompletion: daysFromNow(35),
        cashCollected: Math.round(q('demo-04').total * 0.35),
        payments: [
          { id: 'pay-03-1', amount: Math.round(q('demo-04').total * 0.35), type: 'deposit', method: 'ach', note: 'ACH deposit', date: daysAgo(10) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-03-1', phase: 'design-review', note: 'Heated driveway design finalized. Boiler location confirmed.', date: daysAgo(15) },
          { id: 'u-03-2', phase: 'site-prep', note: 'Asphalt demo complete. Grading for drainage in progress.', date: daysAgo(6) },
        ],
        todos: [
          { id: 'td-03-1', text: 'Confirm glycol loop supplier delivery date', completed: true, createdAt: daysAgo(12) },
          { id: 'td-03-2', text: 'Schedule boiler installer for week 3', completed: false, createdAt: daysAgo(8) },
          { id: 'td-03-3', text: 'Order LED bollard fixtures (16 units)', completed: false, createdAt: daysAgo(5) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(15), updatedAt: daysAgo(6),
      },
      // ── P4: Nguyen — Installation — $175k ─────────────────────────────────
      {
        id: 'proj-04', quoteId: 'demo-08',
        clientName: 'Tony & Lisa Nguyen',
        projectTypes: ['pool-deck', 'pool-construction', 'seating-wall', 'outdoor-lighting'],
        totalValue: q('demo-08').total,
        phase: 'installation' as ProjectPhase,
        startDate: daysAgo(30),
        estimatedCompletion: daysFromNow(25),
        cashCollected: Math.round(q('demo-08').total * 0.50),
        payments: [
          { id: 'pay-04-1', amount: Math.round(q('demo-08').total * 0.30), type: 'deposit', method: 'check', note: 'Check #5540', date: daysAgo(30) },
          { id: 'pay-04-2', amount: Math.round(q('demo-08').total * 0.20), type: 'stage-1', method: 'ach', note: 'ACH — pool shell complete', date: daysAgo(14) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-04-1', phase: 'permitting', note: 'Building permit approved. Pool engineering drawings signed off.', date: daysAgo(35) },
          { id: 'u-04-2', phase: 'site-prep', note: 'Excavation done, rebar & plumbing set. Ready for gunite.', date: daysAgo(26) },
          { id: 'u-04-3', phase: 'installation', note: 'Pool shell poured & curing. Deck base prep started.', date: daysAgo(14) },
          { id: 'u-04-4', phase: 'installation', note: 'Deck pavers 40% laid. Seating wall footings poured.', date: daysAgo(4) },
        ],
        todos: [
          { id: 'td-04-1', text: 'Schedule plaster crew for pool interior — week 4', completed: false, createdAt: daysAgo(10) },
          { id: 'td-04-2', text: 'Order pool equipment — pump, filter, heater', completed: true, createdAt: daysAgo(20) },
          { id: 'td-04-3', text: 'Lighting conduit rough-in before deck completion', completed: false, createdAt: daysAgo(8) },
          { id: 'td-04-4', text: 'Coordinate equipment pad pour with electrician', completed: false, createdAt: daysAgo(5) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(38), updatedAt: daysAgo(4),
      },
      // ── P5: Simmons — Finishing — $105k (from older quote not in sample) ──
      {
        id: 'proj-05', quoteId: 'proj-05-q',
        clientName: 'Dan & Kelly Simmons',
        projectTypes: ['patio', 'outdoor-kitchen', 'fire-pit'],
        totalValue: 112350,
        phase: 'finishing' as ProjectPhase,
        startDate: daysAgo(42),
        estimatedCompletion: daysFromNow(5),
        cashCollected: Math.round(112350 * 0.75),
        payments: [
          { id: 'pay-05-1', amount: Math.round(112350 * 0.35), type: 'deposit', method: 'check', note: 'Check #3322', date: daysAgo(42) },
          { id: 'pay-05-2', amount: Math.round(112350 * 0.25), type: 'stage-1', method: 'ach', note: 'ACH — base & patio complete', date: daysAgo(28) },
          { id: 'pay-05-3', amount: Math.round(112350 * 0.15), type: 'stage-2', method: 'zelle', note: 'Zelle — kitchen installed', date: daysAgo(12) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-05-1', phase: 'site-prep', note: 'Site cleared, forms set. Base gravel delivered.', date: daysAgo(40) },
          { id: 'u-05-2', phase: 'installation', note: 'Pavers installed. Kitchen counter set. Fire pit built.', date: daysAgo(18) },
          { id: 'u-05-3', phase: 'finishing', note: 'Seal coat applied. Final gas connection for fire pit tomorrow. Punch list walk scheduled.', date: daysAgo(3) },
        ],
        todos: [
          { id: 'td-05-1', text: 'Final gas inspection — fire pit', completed: false, createdAt: daysAgo(5) },
          { id: 'td-05-2', text: 'Touch-up seal coat on kitchen counter', completed: false, createdAt: daysAgo(3) },
          { id: 'td-05-3', text: 'Schedule final walkthrough with client', completed: false, createdAt: daysAgo(2) },
          { id: 'td-05-4', text: 'Collect final payment after walkthrough', completed: false, createdAt: daysAgo(2) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map((item, i) => ({ ...item, completed: i < 3 })),
        createdAt: daysAgo(48), updatedAt: daysAgo(3),
      },
      // ── P6: Kowalski — Permitting — $135k (from older quote) ──────────────
      {
        id: 'proj-06', quoteId: 'proj-06-q',
        clientName: 'Steve & Maria Kowalski',
        projectTypes: ['pool-construction', 'pool-deck', 'outdoor-lighting'],
        totalValue: 144500,
        phase: 'permitting' as ProjectPhase,
        startDate: daysAgo(5),
        estimatedCompletion: daysFromNow(55),
        cashCollected: Math.round(144500 * 0.20),
        payments: [
          { id: 'pay-06-1', amount: Math.round(144500 * 0.20), type: 'deposit', method: 'check', note: 'Deposit check #7712', date: daysAgo(5) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-06-1', phase: 'design-review', note: 'Pool design finalized — 18×36 ft freeform with tanning ledge.', date: daysAgo(12) },
          { id: 'u-06-2', phase: 'permitting', note: 'Permit submitted to city. Engineering review in progress.', date: daysAgo(5) },
        ],
        todos: [
          { id: 'td-06-1', text: 'Follow up with city on permit status', completed: false, createdAt: daysAgo(3) },
          { id: 'td-06-2', text: 'Confirm pool shell manufacturer lead time', completed: false, createdAt: daysAgo(5) },
          { id: 'td-06-3', text: 'Schedule utility locate (811) before dig', completed: false, createdAt: daysAgo(2) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(15), updatedAt: daysAgo(5),
      },
      // ── P7: Walsh — Design Review — $98k (from older quote) ───────────────
      {
        id: 'proj-07', quoteId: 'proj-07-q',
        clientName: 'Tom & Annie Walsh',
        projectTypes: ['patio', 'deck-pergola', 'fire-pit', 'seating-wall'],
        totalValue: 104800,
        phase: 'design-review' as ProjectPhase,
        startDate: daysAgo(2),
        estimatedCompletion: daysFromNow(45),
        cashCollected: Math.round(104800 * 0.15),
        payments: [
          { id: 'pay-07-1', amount: Math.round(104800 * 0.15), type: 'deposit', method: 'ach', note: 'ACH design deposit', date: daysAgo(2) },
        ] as PaymentTransaction[],
        updates: [
          { id: 'u-07-1', phase: 'design-review', note: 'Initial design concept shared. Client reviewing pergola options.', date: daysAgo(2) },
        ],
        todos: [
          { id: 'td-07-1', text: 'Finalize pergola style — cedar vs aluminum', completed: false, createdAt: daysAgo(2) },
          { id: 'td-07-2', text: 'Get client approval on fire pit placement', completed: false, createdAt: daysAgo(1) },
          { id: 'td-07-3', text: 'Take final site measurements', completed: false, createdAt: daysAgo(1) },
        ],
        photos: [],
        closeoutChecklist: makeChecklist().map(i => ({ ...i, completed: false })),
        createdAt: daysAgo(5), updatedAt: daysAgo(2),
      },
    ];

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
}
