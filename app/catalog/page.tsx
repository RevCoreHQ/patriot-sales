'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MATERIALS } from '@/data/catalog';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { MaterialCategory, MaterialTier } from '@/types';
import { MaterialSwatch } from '@/components/ui/MaterialSwatch';

const TIER_LABELS: Record<MaterialTier, string> = { good: 'Good', better: 'Better', best: 'Best' };
const TIER_COLORS: Record<MaterialTier, string> = {
  good: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/20',
  better: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  best: 'bg-accent/15 text-accent border-accent/20',
};

const CAT_LABELS: Record<MaterialCategory, string> = {
  'asphalt-shingles': 'Asphalt Shingles',
  'architectural-shingles': 'Architectural Shingles',
  'metal-roofing': 'Metal Roofing',
  'flat-roofing': 'Flat Roofing',
  'underlayment': 'Underlayment',
  'flashing': 'Flashing',
};

export default function CatalogPage() {
  const [tier, setTier] = useState<MaterialTier | 'all'>('all');
  const [cat, setCat] = useState<MaterialCategory | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const categories = Array.from(new Set(MATERIALS.map(m => m.category))) as MaterialCategory[];
  const filtered = MATERIALS.filter(m =>
    (tier === 'all' || m.tier === tier) &&
    (cat === 'all' || m.category === cat)
  );

  const selectedMaterial = selected ? MATERIALS.find(m => m.id === selected) : null;

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-c-text">Material Catalog</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Browse available materials by tier and category</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-1">
            {(['all', 'good', 'better', 'best'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={cn(
                  'h-11 px-4 rounded-xl text-sm font-medium border transition-all cursor-pointer capitalize',
                  tier === t ? 'border-accent/50 bg-accent/10 text-accent' : 'border-c-border-inner text-neutral-500 hover:text-neutral-300'
                )}
              >
                {t === 'all' ? 'All Tiers' : TIER_LABELS[t as MaterialTier]}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setCat('all')}
              className={cn('h-11 px-4 rounded-xl text-sm font-medium border transition-all cursor-pointer', cat === 'all' ? 'border-accent/50 bg-accent/10 text-accent' : 'border-c-border-inner text-neutral-500 hover:text-neutral-300')}
            >All Categories</button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn('h-11 px-4 rounded-xl text-sm font-medium border transition-all cursor-pointer', cat === c ? 'border-accent/50 bg-accent/10 text-accent' : 'border-c-border-inner text-neutral-500 hover:text-neutral-300')}
              >
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {/* Grid */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id === selected ? null : m.id)}
                className={cn(
                  'text-left rounded-xl border overflow-hidden transition-all cursor-pointer',
                  m.id === selected ? 'border-accent/50 ring-1 ring-accent/20' : 'border-c-border-inner hover:border-c-border-hover'
                )}
              >
                <div className="relative">
                  <MaterialSwatch category={m.category} tier={m.tier} name={m.name} className="w-full h-40" />
                  <div className={cn('absolute top-2 right-2 text-[10px] font-semibold border rounded px-1.5 py-0.5', TIER_COLORS[m.tier])}>
                    {TIER_LABELS[m.tier]}
                  </div>
                </div>
                <div className="p-3 bg-c-card">
                  <div className="text-sm font-medium text-c-text">{m.name}</div>
                  <div className="text-xs text-neutral-500">{m.brand}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-neutral-400 capitalize">{CAT_LABELS[m.category as MaterialCategory]}</span>
                    <span className="text-xs font-semibold text-accent">${m.pricePerSqFt + m.laborPerSqFt}/sf installed</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selectedMaterial && (
            <div className="w-72 shrink-0 bg-c-card border border-c-border-inner rounded-xl overflow-hidden self-start sticky top-0">
              <MaterialSwatch category={selectedMaterial.category} tier={selectedMaterial.tier} name={selectedMaterial.name} className="w-full h-40" />
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-semibold border rounded px-1.5 py-0.5', TIER_COLORS[selectedMaterial.tier])}>
                      {TIER_LABELS[selectedMaterial.tier]}
                    </span>
                    <span className="text-xs text-neutral-500">{selectedMaterial.brand}</span>
                  </div>
                  <div className="text-base font-bold text-c-text">{selectedMaterial.name}</div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{selectedMaterial.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-c-surface rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-c-text">${selectedMaterial.pricePerSqFt}</div>
                    <div className="text-[10px] text-neutral-500">material/sf</div>
                  </div>
                  <div className="bg-c-surface rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-c-text">${selectedMaterial.laborPerSqFt}</div>
                    <div className="text-[10px] text-neutral-500">labor/sf</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-500 mb-1.5">Colors</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedMaterial.colors.map(c => (
                      <span key={c} className="text-xs bg-c-elevated text-c-text-2 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-500 mb-1.5">Features</div>
                  <div className="space-y-1">
                    {selectedMaterial.features.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-c-text-2">
                        <div className="w-1 h-1 rounded-full bg-accent shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
