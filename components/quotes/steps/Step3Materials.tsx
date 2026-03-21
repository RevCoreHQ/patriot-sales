'use client';

import { useState } from 'react';
import { useWizardStore } from '@/store/wizard';
import { useSettingsStore } from '@/store/settings';
import { MATERIALS } from '@/data/catalog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { Material, MaterialSelection, MaterialTier } from '@/types';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { MaterialSwatch } from '@/components/ui/MaterialSwatch';

const TIER_LABELS: Record<MaterialTier, string> = { good: 'Good', better: 'Better', best: 'Best' };
const TIER_COLORS: Record<MaterialTier, string> = {
  good: 'text-neutral-400 border-neutral-400/30',
  better: 'text-blue-400 border-blue-400/30',
  best: 'text-accent border-accent/30',
};

function MaterialPicker({ onSelect, selected }: { onSelect: (m: Material) => void; selected?: string }) {
  const [tier, setTier] = useState<MaterialTier | 'all'>('all');
  const filtered = tier === 'all' ? MATERIALS : MATERIALS.filter(m => m.tier === tier);
  const { settings } = useSettingsStore();

  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {(['all', 'good', 'better', 'best'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTier(t)}
            className={cn('px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize cursor-pointer',
              tier === t ? 'bg-accent/15 border-accent/40 text-accent' : 'border-c-border-inner text-neutral-500 hover:text-neutral-300'
            )}>
            {t === 'all' ? 'All' : TIER_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
        {filtered.map(m => {
          const ovMat = settings.pricing.materialPrices?.[m.id]?.pricePerSqFt ?? m.pricePerSqFt;
          const ovLab = settings.pricing.materialPrices?.[m.id]?.laborPerSqFt ?? m.laborPerSqFt;
          const effectiveTotal = ovMat + ovLab;
          const isGlobalOverride = settings.pricing.materialPrices?.[m.id] !== undefined;
          return (
            <button key={m.id} type="button" onClick={() => onSelect(m)}
              className={cn('flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer',
                selected === m.id ? 'border-accent/50 bg-accent/8' : 'border-c-border-inner bg-c-surface hover:border-c-border-hover'
              )}>
              <MaterialSwatch category={m.category} tier={m.tier} name={m.name} className="w-11 h-11 rounded-lg shrink-0" />
              <div className="min-w-0 flex-1">
                <div className={cn('text-sm font-medium truncate', selected === m.id ? 'text-accent' : 'text-c-text')}>{m.name}</div>
                <div className="text-xs text-neutral-500">{m.brand}</div>
                <div className={cn('text-[10px] font-medium border rounded px-1 py-0.5 mt-1 w-fit', TIER_COLORS[m.tier])}>{TIER_LABELS[m.tier]}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={cn('text-xs font-semibold', isGlobalOverride ? 'text-accent' : 'text-neutral-300')}>
                  ${effectiveTotal}/sf
                </div>
                {isGlobalOverride && <div className="text-[9px] text-accent/60">custom</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Step3Materials() {
  const { materialSelections, setMaterialSelections, siteConditions } = useWizardStore();
  const { settings } = useSettingsStore();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(materialSelections.length > 0 ? null : 0);

  const addArea = () => {
    const newSel: MaterialSelection = {
      materialId: '',
      material: MATERIALS[0],
      squareFootage: siteConditions.roofArea ?? 2000,
      area: `Area ${materialSelections.length + 1}`,
    };
    setMaterialSelections([...materialSelections, newSel]);
    setExpandedIdx(materialSelections.length);
  };

  const updateArea = (idx: number, updates: Partial<MaterialSelection>) => {
    setMaterialSelections(materialSelections.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const removeArea = (idx: number) => {
    setMaterialSelections(materialSelections.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-c-text">Material Selection</h2>
        <p className="text-base text-neutral-500 mt-1">Add materials for each area. Optionally override prices per-area.</p>
      </div>
      <div className="space-y-3">
        {materialSelections.map((sel, idx) => {
          const globalMat = settings.pricing.materialPrices?.[sel.materialId];
          const effMat = sel.customPricePerSqFt ?? globalMat?.pricePerSqFt ?? sel.material.pricePerSqFt;
          const effLab = sel.customLaborPerSqFt ?? globalMat?.laborPerSqFt ?? sel.material.laborPerSqFt;
          const totalInstalled = (effMat + effLab) * sel.squareFootage;
          const hasCustom = sel.customPricePerSqFt !== undefined || sel.customLaborPerSqFt !== undefined;

          return (
            <div key={idx} className={cn('border rounded-xl overflow-hidden', hasCustom ? 'border-accent/30' : 'border-c-border-inner')}>
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-c-elevated transition-colors"
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-base font-medium text-c-text">{sel.area || `Area ${idx + 1}`}</div>
                    {hasCustom && <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">custom price</span>}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {sel.material.name} · {sel.squareFootage} sq ft · ${totalInstalled.toLocaleString()} installed
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={e => { e.stopPropagation(); removeArea(idx); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedIdx === idx ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </div>
              </div>

              {expandedIdx === idx && (
                <div className="px-5 pb-5 border-t border-c-border-inner space-y-5 pt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Area Name" placeholder="e.g. Main Roof, Garage, Addition"
                      value={sel.area} onChange={e => updateArea(idx, { area: e.target.value })} />
                    <Input label="Square Footage" type="number" min="1"
                      value={sel.squareFootage} onChange={e => updateArea(idx, { squareFootage: Number(e.target.value) })} />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-c-text-2 mb-2">Select Material</div>
                    <MaterialPicker selected={sel.materialId}
                      onSelect={m => updateArea(idx, { materialId: m.id, material: m, customPricePerSqFt: undefined, customLaborPerSqFt: undefined })} />
                  </div>

                  {/* Per-quote price override */}
                  <div className="border border-c-border-inner rounded-xl p-5 space-y-4 bg-c-input">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-c-text-2">Price Override (this quote only)</div>
                        <div className="text-xs text-neutral-600 mt-0.5">
                          Catalog: ${sel.material.pricePerSqFt} mat + ${sel.material.laborPerSqFt} labor
                          {(globalMat?.pricePerSqFt !== undefined || globalMat?.laborPerSqFt !== undefined) && (
                            <span className="text-accent/70 ml-1">
                              · Global: ${globalMat?.pricePerSqFt ?? sel.material.pricePerSqFt} mat + ${globalMat?.laborPerSqFt ?? sel.material.laborPerSqFt} labor
                            </span>
                          )}
                        </div>
                      </div>
                      {hasCustom && (
                        <button type="button" onClick={() => updateArea(idx, { customPricePerSqFt: undefined, customLaborPerSqFt: undefined })}
                          className="text-xs text-neutral-600 hover:text-red-400 transition-colors">Reset</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-neutral-500 mb-2 block">Material $/sf</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-base">$</span>
                          <input type="number" min="0" step="0.5"
                            placeholder={String(globalMat?.pricePerSqFt ?? sel.material.pricePerSqFt)}
                            value={sel.customPricePerSqFt ?? ''}
                            onChange={e => updateArea(idx, { customPricePerSqFt: e.target.value === '' ? undefined : Number(e.target.value) })}
                            className={cn('w-full h-14 pl-8 pr-4 rounded-2xl bg-c-input border text-base text-c-text focus:outline-none focus:ring-1 focus:ring-accent/30',
                              sel.customPricePerSqFt !== undefined ? 'border-accent/40 bg-accent/5' : 'border-c-border-input'
                            )} />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-neutral-500 mb-2 block">Labor $/sf</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-base">$</span>
                          <input type="number" min="0" step="0.5"
                            placeholder={String(globalMat?.laborPerSqFt ?? sel.material.laborPerSqFt)}
                            value={sel.customLaborPerSqFt ?? ''}
                            onChange={e => updateArea(idx, { customLaborPerSqFt: e.target.value === '' ? undefined : Number(e.target.value) })}
                            className={cn('w-full h-14 pl-8 pr-4 rounded-2xl bg-c-input border text-base text-c-text focus:outline-none focus:ring-1 focus:ring-accent/30',
                              sel.customLaborPerSqFt !== undefined ? 'border-accent/40 bg-accent/5' : 'border-c-border-input'
                            )} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Button variant="outline" onClick={addArea} className="w-full gap-2">
        <Plus className="w-4 h-4" />Add Material Area
      </Button>
      {materialSelections.length === 0 && (
        <p className="text-xs text-neutral-600 text-center">Add at least one material area to continue</p>
      )}
    </div>
  );
}
