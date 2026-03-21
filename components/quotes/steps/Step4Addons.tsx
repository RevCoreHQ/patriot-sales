'use client';

import { useWizardStore } from '@/store/wizard';
import { useSettingsStore } from '@/store/settings';
import { ADDONS } from '@/data/addons';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { AddonCategory, AddonSelection } from '@/types';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const CATEGORY_LABELS: Record<AddonCategory, string> = {
  protection: 'Protection', ventilation: 'Ventilation', gutters: 'Gutters',
  structural: 'Structural', insulation: 'Insulation', finishing: 'Finishing',
};
const UNIT_LABELS: Record<string, string> = {
  flat: 'flat rate', 'linear-ft': 'per linear ft', 'sq-ft': 'per sq ft', each: 'each',
};

export function Step4Addons() {
  const { addonSelections, setAddonSelections } = useWizardStore();
  const { settings } = useSettingsStore();
  const [filter, setFilter] = useState<AddonCategory | 'all'>('all');

  const categories = Array.from(new Set(ADDONS.map(a => a.category))) as AddonCategory[];
  const filtered = filter === 'all' ? ADDONS : ADDONS.filter(a => a.category === filter);

  const getSelection = (addonId: string) => addonSelections.find(s => s.addonId === addonId);

  const toggle = (addonId: string) => {
    const addon = ADDONS.find(a => a.id === addonId)!;
    if (getSelection(addonId)) {
      setAddonSelections(addonSelections.filter(s => s.addonId !== addonId));
    } else {
      setAddonSelections([...addonSelections, { addonId, addon, quantity: 1 }]);
    }
  };

  const updateQty = (addonId: string, qty: number) => {
    if (qty <= 0) { setAddonSelections(addonSelections.filter(s => s.addonId !== addonId)); return; }
    setAddonSelections(addonSelections.map(s => s.addonId === addonId ? { ...s, quantity: qty } : s));
  };

  const updateNote = (addonId: string, notes: string) =>
    setAddonSelections(addonSelections.map(s => s.addonId === addonId ? { ...s, notes } : s));

  const updateCustomPrice = (addonId: string, val: string) => {
    const p = val === '' ? undefined : Number(val);
    setAddonSelections(addonSelections.map(s => s.addonId === addonId ? { ...s, customPrice: p } : s));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-c-text">Add-Ons & Upgrades</h2>
        <p className="text-sm text-neutral-500 mt-1">Select optional features. Override price per item for this quote.</p>
      </div>

      <div className="flex flex-wrap gap-1">
        <button type="button" onClick={() => setFilter('all')}
          className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
            filter === 'all' ? 'bg-[#fb8e28]/15 border-[#fb8e28]/40 text-[#fb8e28]' : 'border-c-border-inner text-neutral-500 hover:text-neutral-300'
          )}>All</button>
        {categories.map(cat => (
          <button key={cat} type="button" onClick={() => setFilter(cat)}
            className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
              filter === cat ? 'bg-[#fb8e28]/15 border-[#fb8e28]/40 text-[#fb8e28]' : 'border-c-border-inner text-c-text-3 hover:text-c-text-2'
            )}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(addon => {
          const sel = getSelection(addon.id);
          const globalPrice = settings.pricing.addonPrices?.[addon.id];
          const displayPrice = sel?.customPrice ?? globalPrice ?? addon.basePrice;
          const isGlobalOverride = globalPrice !== undefined;
          const isCustom = sel?.customPrice !== undefined;

          return (
            <div key={addon.id} className={cn('border rounded-xl transition-all',
              sel ? 'border-[#fb8e28]/30 bg-[#fb8e28]/5' : 'border-c-border-inner bg-c-surface'
            )}>
              <div className="flex items-center gap-3 p-4">
                <div className="text-xl w-8 text-center shrink-0">{addon.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-sm font-medium', sel ? 'text-[#fb8e28]' : 'text-c-text')}>{addon.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{addon.description}</div>
                </div>
                <div className="text-right shrink-0 mr-2">
                  <div className={cn('text-sm font-semibold', isCustom ? 'text-[#fb8e28]' : isGlobalOverride ? 'text-[#fcad55]/70' : 'text-c-text')}>
                    ${displayPrice.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-500">{UNIT_LABELS[addon.unit]}</div>
                  {(isCustom || isGlobalOverride) && !isCustom && (
                    <div className="text-[9px] text-[#fb8e28]/50">global override</div>
                  )}
                  {addon.basePrice !== displayPrice && !isCustom && (
                    <div className="text-[9px] text-neutral-600 line-through">${addon.basePrice.toLocaleString()}</div>
                  )}
                </div>
                <button type="button" onClick={() => toggle(addon.id)}
                  className={cn('w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer',
                    sel ? 'bg-[#fb8e28] border-[#fb8e28] text-black hover:bg-[#fb8e28]'
                       : 'border-c-border-input text-neutral-500 hover:border-[#fb8e28]/50 hover:text-[#fb8e28] bg-transparent'
                  )}>
                  {sel ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>

              {sel && (
                <div className="px-4 pb-4 pt-0 grid grid-cols-3 gap-3">
                  {addon.unit !== 'flat' && (
                    <Input label="Quantity" type="number" min="1"
                      value={sel.quantity}
                      onChange={e => { const n = Number(e.target.value); if (n > 0) updateQty(addon.id, n); }}
                      onKeyDown={e => e.stopPropagation()} />
                  )}
                  <div className="relative">
                    <label className="text-xs text-neutral-500 mb-1.5 block">
                      Custom Price {addon.unit !== 'flat' ? `(${UNIT_LABELS[addon.unit]})` : ''}
                    </label>
                    <span className="absolute left-3 bottom-2.5 text-neutral-500 text-sm">$</span>
                    <input type="number" min="0"
                      placeholder={String(globalPrice ?? addon.basePrice)}
                      value={sel.customPrice ?? ''}
                      onChange={e => updateCustomPrice(addon.id, e.target.value)}
                      className={cn('w-full pl-7 pr-3 py-2.5 rounded-lg bg-c-input border text-sm text-c-text focus:outline-none focus:ring-1 focus:ring-[#fb8e28]/30',
                        sel.customPrice !== undefined ? 'border-[#fb8e28]/40 bg-[#fb8e28]/5' : 'border-c-border-input'
                      )}
                    />
                    {isGlobalOverride && sel.customPrice === undefined && (
                      <div className="text-[10px] text-[#fb8e28]/50 mt-0.5">Using global override: ${globalPrice}</div>
                    )}
                  </div>
                  <Input label="Notes" placeholder="Specification notes..."
                    value={sel.notes ?? ''} onChange={e => updateNote(addon.id, e.target.value)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addonSelections.length > 0 && (
        <div className="text-xs text-[#fb8e28] text-right">
          {addonSelections.length} add-on{addonSelections.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
