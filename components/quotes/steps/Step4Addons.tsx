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
    if (qty < 0) return;
    setAddonSelections(addonSelections.map(s => s.addonId === addonId ? { ...s, quantity: qty } : s));
  };

  const updateNote = (addonId: string, notes: string) =>
    setAddonSelections(addonSelections.map(s => s.addonId === addonId ? { ...s, notes } : s));

  const updateCustomPrice = (addonId: string, val: string) => {
    const p = val === '' ? undefined : Number(val);
    setAddonSelections(addonSelections.map(s => s.addonId === addonId ? { ...s, customPrice: p } : s));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-c-text">Add-Ons & Upgrades</h2>
        <p className="text-base text-neutral-500 mt-1">Select optional features. Override price per item for this quote.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setFilter('all')}
          className={cn('px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer',
            filter === 'all' ? 'bg-accent-secondary/15 border-accent-secondary/40 text-accent-secondary' : 'border-c-border-inner text-neutral-500 hover:text-neutral-300'
          )}>All</button>
        {categories.map(cat => (
          <button key={cat} type="button" onClick={() => setFilter(cat)}
            className={cn('px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer',
              filter === cat ? 'bg-accent-secondary/15 border-accent-secondary/40 text-accent-secondary' : 'border-c-border-inner text-c-text-3 hover:text-c-text-2'
            )}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(addon => {
          const sel = getSelection(addon.id);
          const globalPrice = settings.pricing.addonPrices?.[addon.id];
          const displayPrice = sel?.customPrice ?? globalPrice ?? addon.basePrice;
          const isGlobalOverride = globalPrice !== undefined;
          const isCustom = sel?.customPrice !== undefined;

          return (
            <div key={addon.id} className={cn('border rounded-xl transition-all',
              sel ? 'border-accent/30 bg-accent/5' : 'border-c-border-inner bg-c-surface'
            )}>
              <div className="flex items-center gap-4 p-5">
                <div className="text-2xl w-10 text-center shrink-0">{addon.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-base font-medium', sel ? 'text-accent' : 'text-c-text')}>{addon.name}</div>
                  <div className="text-sm text-neutral-500 mt-0.5">{addon.description}</div>
                </div>
                <div className="text-right shrink-0 mr-2">
                  <div className={cn('text-base font-semibold', isCustom ? 'text-accent' : isGlobalOverride ? 'text-[#fcad55]/70' : 'text-c-text')}>
                    ${displayPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-500">{UNIT_LABELS[addon.unit]}</div>
                  {(isCustom || isGlobalOverride) && !isCustom && (
                    <div className="text-[9px] text-accent/50">global override</div>
                  )}
                  {addon.basePrice !== displayPrice && !isCustom && (
                    <div className="text-[9px] text-neutral-600 line-through">${addon.basePrice.toLocaleString()}</div>
                  )}
                </div>
                <button type="button" onClick={() => toggle(addon.id)}
                  className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer',
                    sel ? 'bg-accent border-accent text-black hover:bg-accent'
                       : 'border-c-border-input text-neutral-500 hover:border-accent/50 hover:text-accent bg-transparent'
                  )}>
                  {sel ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>

              {sel && (
                <div className="px-5 pb-5 pt-1 grid grid-cols-3 gap-4">
                  {addon.unit !== 'flat' && (
                    <Input label="Quantity" type="number" min="1"
                      value={sel.quantity || ''}
                      onChange={e => updateQty(addon.id, e.target.value === '' ? 0 : Number(e.target.value))}
                      onBlur={e => { if (!e.target.value || Number(e.target.value) <= 0) updateQty(addon.id, 1); }}
                      onKeyDown={e => e.stopPropagation()} />
                  )}
                  <div>
                    <label className="text-sm text-neutral-500 mb-2 block">
                      Custom Price {addon.unit !== 'flat' ? `(${UNIT_LABELS[addon.unit]})` : ''}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-base">$</span>
                      <input type="number" min="0"
                        placeholder={String(globalPrice ?? addon.basePrice)}
                        value={sel.customPrice ?? ''}
                        onChange={e => updateCustomPrice(addon.id, e.target.value)}
                        className={cn('w-full h-14 pl-8 pr-4 rounded-2xl bg-c-input border text-base text-c-text focus:outline-none focus:ring-1 focus:ring-accent-secondary/30',
                          sel.customPrice !== undefined ? 'border-accent/40 bg-accent/5' : 'border-c-border-input'
                        )}
                      />
                    </div>
                    {isGlobalOverride && sel.customPrice === undefined && (
                      <div className="text-xs text-accent/50 mt-1">Using global override: ${globalPrice}</div>
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
        <div className="text-xs text-accent text-right">
          {addonSelections.length} add-on{addonSelections.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
