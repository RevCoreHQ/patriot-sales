'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { formatCurrency } from '@/lib/utils';
import {
  CheckCircle2, Star, Zap, ArrowRight, Scale,
  ChevronUp, Info,
} from 'lucide-react';

// ─── Tier definitions ─────────────────────────────────────────────────────────
const TIERS = [
  {
    id: 'good',
    label: 'Good',
    badge: 'Entry Level',
    color: 'text-neutral-300',
    border: 'border-c-border',
    bg: 'bg-c-card',
    accent: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/25',
    button: 'bg-c-elevated hover:bg-c-tag text-c-text border-c-border',
    glow: '',
    materialName: 'Belgard Cambridge',
    materialDesc: 'Classic cobblestone-style pavers with a tumbled finish.',
    matPerSqFt: 7.00,
    laborPerSqFt: 10.00,
    features: [
      '2-year material warranty',
      'Tumbled finish — classic look',
      'Wide color selection',
      'Quick installation turnaround',
      'Proven, time-tested product',
    ],
    notIncluded: ['Lifetime warranty', 'Premium stone options'],
    popular: false,
  },
  {
    id: 'better',
    label: 'Better',
    badge: 'Most Popular',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-c-card',
    accent: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    button: 'bg-amber-500 hover:bg-amber-400 text-black border-amber-500',
    glow: '0 0 40px rgba(245,158,11,0.12)',
    materialName: 'Belgard Urbana',
    materialDesc: 'Large-format contemporary pavers with a smooth modern finish.',
    matPerSqFt: 9.50,
    laborPerSqFt: 11.00,
    features: [
      'Lifetime Belgard warranty',
      'Large-format modern look',
      'Low maintenance surface',
      'Frost & stain resistant',
      'Premium color options',
      'Designer-grade finish',
    ],
    notIncluded: ['Natural stone texture'],
    popular: true,
  },
  {
    id: 'best',
    label: 'Best',
    badge: 'Premium',
    color: 'text-sky-300',
    border: 'border-sky-500/30',
    bg: 'bg-c-card',
    accent: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
    button: 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30',
    glow: '',
    materialName: 'Belgard Porcelain',
    materialDesc: 'Ultra-premium porcelain pavers — the pinnacle of outdoor luxury.',
    matPerSqFt: 16.00,
    laborPerSqFt: 14.00,
    features: [
      'Lifetime warranty',
      'Porcelain — virtually maintenance-free',
      'Stain & scratch resistant',
      'UV stable — never fades',
      'Frost proof — Colorado rated',
      'Calacatta & stone series',
      'Resale value addition',
    ],
    notIncluded: [],
    popular: false,
  },
] as const;

const PROJECT_TYPES = [
  { value: 'patio', label: 'Patio' },
  { value: 'pool-deck', label: 'Pool Deck' },
  { value: 'driveway', label: 'Driveway' },
  { value: 'walkway', label: 'Walkway' },
  { value: 'seating-wall', label: 'Seating Wall Area' },
];

const TAX_RATE = 0.029; // 2.9% Colorado

function calcTotal(sqft: number, matRate: number, laborRate: number) {
  const sub = (matRate + laborRate) * sqft;
  return sub * (1 + TAX_RATE);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const router = useRouter();
  const [sqft, setSqft] = useState(400);
  const [projectType, setProjectType] = useState('patio');
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);

  const projectLabel = PROJECT_TYPES.find(p => p.value === projectType)?.label ?? 'Project';

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Scale className="w-6 h-6 text-amber-400" />
              <h1 className="text-3xl font-bold text-c-text tracking-tight">Compare Tiers</h1>
            </div>
            <p className="text-sm text-c-text-3">
              See all three investment levels side by side — then create a quote with the right fit.
            </p>
          </div>
          <Link href="/quotes/new">
            <button className="flex items-center gap-2 h-12 px-6 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 active:scale-[0.97] transition-all">
              <ArrowRight className="w-4 h-4" />
              Start a Quote
            </button>
          </Link>
        </div>

        {/* ── Configuration ── */}
        <div className="rounded-2xl border border-c-border bg-c-card px-6 py-5">
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <label className="text-sm font-medium text-c-text-3 whitespace-nowrap">Project type</label>
              <select
                value={projectType}
                onChange={e => setProjectType(e.target.value)}
                className="h-12 px-3 pr-8 bg-c-input border border-c-border-input rounded-xl text-sm text-c-text focus:outline-none focus:border-amber-500/60 appearance-none cursor-pointer"
              >
                {PROJECT_TYPES.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <label className="text-sm font-medium text-c-text-3 whitespace-nowrap">
                Square footage
              </label>
              <div className="flex-1 flex items-center gap-3">
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={sqft}
                  onChange={e => setSqft(Number(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <div className="w-20 h-12 px-3 bg-c-input border border-c-border-input rounded-xl flex items-center">
                  <input
                    type="number"
                    value={sqft}
                    onChange={e => setSqft(Math.max(100, Math.min(2000, Number(e.target.value))))}
                    className="w-full text-sm text-c-text bg-transparent focus:outline-none"
                  />
                </div>
                <span className="text-sm text-c-text-4 whitespace-nowrap">sq ft</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tier columns ── */}
        <div className="grid grid-cols-3 gap-5">
          {TIERS.map(tier => {
            const totalPrice = calcTotal(sqft, tier.matPerSqFt, tier.laborPerSqFt);
            const perSqFt = tier.matPerSqFt + tier.laborPerSqFt;
            const isExpanded = showBreakdown === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border ${tier.border} ${tier.bg} overflow-hidden flex flex-col`}
                style={tier.glow ? { boxShadow: tier.glow } : undefined}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
                )}

                {/* Tier header */}
                <div className="px-6 pt-6 pb-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mb-2 ${tier.accent}`}>
                        {tier.popular && <Star className="w-3 h-3 fill-current" />}
                        {tier.badge}
                      </div>
                      <h2 className={`text-2xl font-bold ${tier.color}`}>{tier.label}</h2>
                    </div>
                    {tier.popular && <Zap className="w-5 h-5 text-amber-400 mt-1" />}
                  </div>

                  {/* Material */}
                  <div className="mb-5">
                    <div className="text-sm font-semibold text-c-text">{tier.materialName}</div>
                    <div className="text-xs text-c-text-4 mt-0.5 leading-relaxed">{tier.materialDesc}</div>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <div className={`text-3xl font-bold tracking-tight ${tier.color}`}>
                      {formatCurrency(totalPrice)}
                    </div>
                    <div className="text-xs text-c-text-4 mt-0.5">
                      estimated total · {sqft.toLocaleString()} sq ft {projectLabel.toLowerCase()}
                    </div>
                  </div>

                  {/* Per sqft */}
                  <div className="text-sm font-medium text-c-text-3">
                    {formatCurrency(perSqFt)}/sq ft installed
                  </div>

                  {/* Breakdown toggle */}
                  <button
                    onClick={() => setShowBreakdown(isExpanded ? null : tier.id)}
                    className="flex items-center gap-1.5 mt-3 min-h-[36px] text-xs text-c-text-4 hover:text-c-text-3 transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    {isExpanded ? 'Hide' : 'Show'} breakdown
                    <ChevronUp className={`w-3 h-3 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
                  </button>

                  {/* Breakdown */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-c-surface rounded-xl border border-c-border-inner space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-c-text-4">Material</span>
                        <span className="text-c-text-3">{formatCurrency(tier.matPerSqFt)}/sf × {sqft.toLocaleString()} = {formatCurrency(tier.matPerSqFt * sqft)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-c-text-4">Labor</span>
                        <span className="text-c-text-3">{formatCurrency(tier.laborPerSqFt)}/sf × {sqft.toLocaleString()} = {formatCurrency(tier.laborPerSqFt * sqft)}</span>
                      </div>
                      <div className="h-px bg-c-border-inner" />
                      <div className="flex justify-between text-xs">
                        <span className="text-c-text-4">Subtotal</span>
                        <span className="text-c-text-3">{formatCurrency((tier.matPerSqFt + tier.laborPerSqFt) * sqft)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-c-text-4">Tax (2.9%)</span>
                        <span className="text-c-text-3">{formatCurrency((tier.matPerSqFt + tier.laborPerSqFt) * sqft * TAX_RATE)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-c-text-3">Total</span>
                        <span className="text-c-text">{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="text-[10px] text-c-text-5 mt-1">
                        *Estimate only. Final price includes site assessment, demo, drainage & any add-ons.
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-6 h-px bg-c-border-inner" />

                {/* Features */}
                <div className="px-6 py-5 flex-1">
                  <div className="text-[11px] font-semibold text-c-text-4 uppercase tracking-wider mb-3">Included</div>
                  <ul className="space-y-2.5">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.color}`} />
                        <span className="text-sm text-c-text-2">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => router.push('/quotes/new')}
                    className={`w-full h-14 rounded-xl text-base font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.97] ${tier.button}`}
                  >
                    Start with {tier.label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Fine print ── */}
        <div className="rounded-2xl border border-c-border-inner bg-c-surface px-6 py-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-c-text-5 mt-0.5 shrink-0" />
            <p className="text-xs text-c-text-4 leading-relaxed">
              Prices shown are representative estimates for paver installations and include material and standard labor.
              Final quotes will include site assessment, demolition (if required), base preparation, drainage, edging, sealing, and any selected add-ons.
              Contact Rock N Roll Stoneworks at <span className="text-c-text-3 font-medium">303-587-3035</span> for a full in-person estimate.
            </p>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </AppShell>
  );
}
