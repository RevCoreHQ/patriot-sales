// ─── Client ──────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  projectAddress?: string;
  createdAt: string;
}

// ─── Project Types ────────────────────────────────────────────────────────────
export type ProjectTypeId =
  | 'roof-replacement'
  | 'roof-repair'
  | 'new-roof'
  | 'gutter-install'
  | 'gutter-repair'
  | 'siding'
  | 'home-repair'
  | 'bathroom-renovation'
  | 'kitchen-renovation';

export interface ProjectType {
  id: ProjectTypeId;
  label: string;
  description: string;
  icon: string;
  basePrice: number; // base starting price
  unit: string;
}

// ─── Materials ────────────────────────────────────────────────────────────────
export type MaterialCategory =
  | 'asphalt-shingles'
  | 'architectural-shingles'
  | 'metal-roofing'
  | 'flat-roofing'
  | 'underlayment'
  | 'flashing';

export type MaterialTier = 'good' | 'better' | 'best';

export interface Material {
  id: string;
  name: string;
  brand: string;
  category: MaterialCategory;
  tier: MaterialTier;
  pricePerSqFt: number;
  laborPerSqFt: number;
  image: string;
  description: string;
  colors: string[];
  features: string[];
}

// ─── Add-ons ──────────────────────────────────────────────────────────────────
export type AddonCategory =
  | 'protection'
  | 'ventilation'
  | 'gutters'
  | 'structural'
  | 'insulation'
  | 'finishing';

export interface Addon {
  id: string;
  name: string;
  category: AddonCategory;
  description: string;
  icon: string;
  basePrice: number;
  unit: string; // 'flat' | 'linear-ft' | 'sq-ft' | 'each'
  image?: string;
}

// ─── Quote Line Items ─────────────────────────────────────────────────────────
export interface LineItem {
  id: string;
  description: string;
  category: 'labor' | 'material' | 'addon' | 'misc' | 'discount';
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  costPerUnit?: number; // actual cost for margin tracking
}

// ─── Material Selection ───────────────────────────────────────────────────────
export interface MaterialSelection {
  materialId: string;
  material: Material;
  squareFootage: number;
  area: string; // e.g. "Main Patio", "Pool Deck"
  customPricePerSqFt?: number; // per-quote material cost override
  customLaborPerSqFt?: number; // per-quote labor cost override
}

// ─── Addon Selection ──────────────────────────────────────────────────────────
export interface AddonSelection {
  addonId: string;
  addon: Addon;
  quantity: number;
  customPrice?: number;
  notes?: string;
}

// ─── Site Conditions ──────────────────────────────────────────────────────────
export interface SiteConditions {
  roofArea: number;
  pitch: 'flat' | 'low' | 'moderate' | 'steep';
  stories: 1 | 2 | 3;
  currentMaterial: 'asphalt' | 'metal' | 'tile' | 'wood' | 'flat' | 'other';
  access: 'easy' | 'moderate' | 'difficult';
  tearOff: boolean;
  tearOffDescription?: string;
  layers?: number;
  notes?: string;
}

// ─── Quote Status ─────────────────────────────────────────────────────────────
export type QuoteStatus = 'draft' | 'presented' | 'accepted' | 'lost' | 'expired';

// ─── Quote ────────────────────────────────────────────────────────────────────
export interface Quote {
  id: string;
  client: Client;
  status: QuoteStatus;
  projectTypes: ProjectTypeId[];
  siteConditions: SiteConditions;
  materialSelections: MaterialSelection[];
  addonSelections: AddonSelection[];
  lineItems: LineItem[];
  subtotal: number;
  discountPercent: number;
  discountName?: string;
  discountAmount: number;
  priceOverride?: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  internalNotes?: string;
  // E-Signature
  signatureData?: string; // base64
  signedAt?: string;
  signedBy?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  presentedAt?: string;
  validUntil: string;
  // Sales rep
  salesRep?: string;
}

// ─── Financing ────────────────────────────────────────────────────────────────
export interface FinancingOption {
  id: string;
  label: string;
  termMonths: number;
  apr: number; // annual percentage rate
}

export interface FinancingCalculation {
  principal: number;
  downPayment: number;
  financed: number;
  apr: number;
  termMonths: number;
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  team: TeamMember[];
  company: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    address: string;
    website: string;
    license: string;
    logoUrl?: string;
  };
  salesRep: {
    name: string;
    phone: string;
    email: string;
    title: string;
  };
  pricing: {
    taxRate: number; // percent
    defaultMarkup: number; // percent over cost
    laborRate: number; // per hour
    demolitionRate: number; // per sq ft
    quoteValidDays: number;
    materialPrices: Record<string, { pricePerSqFt?: number; laborPerSqFt?: number }>;
    addonPrices: Record<string, number>;
  };
  financing: FinancingOption[];
  presentation: {
    accentColor: string;
    showFinancing: boolean;
    customSlideText?: string;
  };
  notifications: {
    enabled: boolean;
    reminders: {
      followUpDays: number;
      quoteExpiryDays: number;
    };
  };
}

// ─── Payment Tracking ────────────────────────────────────────────────────────
export type PaymentType = 'deposit' | 'stage-1' | 'stage-2' | 'stage-3' | 'final' | 'other';
export type PaymentMethod = 'cash' | 'check' | 'credit-card' | 'ach' | 'zelle' | 'venmo';

export interface PaymentTransaction {
  id: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  note?: string;
  date: string;
}

// ─── Project Tracking ────────────────────────────────────────────────────────
export type ProjectPhase =
  | 'design-review'
  | 'permitting'
  | 'site-prep'
  | 'installation'
  | 'finishing'
  | 'delivered';

export interface ProjectUpdate {
  id: string;
  phase: ProjectPhase;
  note: string;
  date: string;
}

export interface ProjectTodo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface CloseoutItem {
  id: string;
  label: string;
  completed: boolean;
}

export const DEFAULT_CLOSEOUT_CHECKLIST: Omit<CloseoutItem, 'id'>[] = [
  { label: 'Final roof inspection completed', completed: false },
  { label: 'All debris and old materials removed', completed: false },
  { label: 'Gutters cleaned and flushed', completed: false },
  { label: 'Flashing and drip edge verified sealed', completed: false },
  { label: 'Client walkthrough completed', completed: false },
  { label: 'Before & after photos taken', completed: false },
  { label: 'Final payment collected in full', completed: false },
  { label: 'Warranty documents provided to client', completed: false },
];

// ─── Project Photos ──────────────────────────────────────────────────────────
export interface ProjectPhoto {
  id: string;
  phase: 'before' | 'during' | 'after';
  dataUrl: string;
  caption?: string;
  timestamp: string;
}

export interface Project {
  id: string;
  quoteId: string;
  clientName: string;
  projectTypes: ProjectTypeId[];
  totalValue: number;
  phase: ProjectPhase;
  startDate?: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  cashCollected: number;
  payments: PaymentTransaction[];
  updates: ProjectUpdate[];
  todos: ProjectTodo[];
  closeoutChecklist: CloseoutItem[];
  photos: ProjectPhoto[];
  ghlContactId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Team ────────────────────────────────────────────────────────────────────
export type TeamRole = 'admin' | 'closer' | 'setter';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  phone?: string;
  email?: string;
}

// ─── Auth / Users ─────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'sales' | 'production';

export interface AppUser {
  id: string;
  name: string;
  pin: string; // 4-digit PIN stored as string
  role: UserRole;
  createdAt: string;
}

// ─── Gallery Photo ────────────────────────────────────────────────────────────
export type GalleryCategory =
  | 'roof-replacement'
  | 'roof-repair'
  | 'gutter'
  | 'siding'
  | 'home-repair'
  | 'all';

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  category: GalleryCategory;
  title?: string;
  description?: string;
}

// ─── Wizard State ─────────────────────────────────────────────────────────────
export interface WizardState {
  currentStep: number;
  totalSteps: number;
  quoteId?: string; // when editing
  client: Partial<Client>;
  projectTypes: ProjectTypeId[];
  siteConditions: Partial<SiteConditions>;
  manualLineItems: LineItem[];
  materialSelections: MaterialSelection[]; // legacy – kept for backward compat
  addonSelections: AddonSelection[];
  discountPercent: number;
  discountName: string;
  priceOverride?: number;
  notes: string;
  internalNotes: string;
}
