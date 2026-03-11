'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settings';
import { MATERIALS } from '@/data/catalog';
import { ADDONS } from '@/data/addons';
import { cn } from '@/lib/utils';
import type { MaterialCategory, MaterialTier, AddonCategory } from '@/types';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const TIER_LABELS: Record<MaterialTier, string> = { good: 'Good', better: 'Better', best: 'Best' };
const TIER_COLORS: Record<MaterialTier, string> = {
  good: 'bg-neutral-500/15 text-neutral-400',
  better: 'bg-blue-500/15 text-blue-400',
  best: 'bg-amber-500/15 text-amber-400',
};
const MAT_CAT_LABELS: Record<MaterialCategory, string> = {
  pavers: 'Pavers', 'natural-stone': 'Natural Stone', concrete: 'Concrete', turf: 'Artificial Turf', gravel: 'Gravel',
};
const ADDON_CAT_LABELS: Record<AddonCategory, string> = {
  structures: 'Structures', fire: 'Fire Features', lighting: 'Lighting',
  water: 'Water Features', drainage: 'Drainage', planting: 'Planting', finishing: 'Finishing',
};
const UNIT_LABELS: Record<string, string> = {
  flat: 'flat', 'linear-ft': '/linear ft', 'sq-ft': '/sq ft', each: '/each',
};

type Tab = 'materials' | 'addons';

export default function PricingPage() {
  const { settings, init, update } = useSettingsStore();
  const [tab, setTab] = useState<Tab>('materials');
  const [saved, setSaved] = useState(false);

  // Local mutable price maps
  const [matPrices, setMatPrices] = useState<Record<string, { pricePerSqFt: string; laborPerSqFt: string }>>({});
  const [addonPrices, setAddonPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    init();
  }, []); // eslint-disable-line

  // Seed local state from settings once loaded
  useEffect(() => {
    const mp: Record<string, { pricePerSqFt: string; laborPerSqFt: string }> = {};
    for (const m of MATERIALS) {
      const ov = settings.pricing.materialPrices?.[m.id];
      mp[m.id] = {
        pricePerSqFt: ov?.pricePerSqFt !== undefined ? String(ov.pricePerSqFt) : '',
        laborPerSqFt: ov?.laborPerSqFt !== undefined ? String(ov.laborPerSqFt) : '',
      };
    }
    setMatPrices(mp);

    const ap: Record<string, string> = {};
    for (const a of ADDONS) {
      const ov = settings.pricing.addonPrices?.[a.id];
      ap[a.id] = ov !== undefined ? String(ov) : '';
    }
    setAddonPrices(ap);
  }, [settings.pricing.materialPrices, settings.pricing.addonPrices]);

  const handleSave = () => {
    // Build clean override maps (only non-empty values)
    const materialPrices: Record<string, { pricePerSqFt?: number; laborPerSqFt?: number }> = {};
    for (const [id, val] of Object.entries(matPrices)) {
      const p = val.pricePerSqFt !== '' ? Number(val.pricePerSqFt) : undefined;
      const l = val.laborPerSqFt !== '' ? Number(val.laborPerSqFt) : undefined;
      if (p !== undefined || l !== undefined) materialPrices[id] = { pricePerSqFt: p, laborPerSqFt: l };
    }
    const addonPricesMap: Record<string, number> = {};
    for (const [id, val] of Object.entries(addonPrices)) {
      if (val !== '') addonPricesMap[id] = Number(val);
    }
    update({ ...settings, pricing: { ...settings.pricing, materialPrices, addonPrices: addonPricesMap } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const resetMaterial = (id: string) => {
    setMatPrices(p => ({ ...p, [id]: { pricePerSqFt: '', laborPerSqFt: '' } }));
  };
  const resetAddon = (id: string) => {
    setAddonPrices(p => ({ ...p, [id]: '' }));
  };
  const resetAll = () => {
    if (!confirm('Reset all price overrides to catalog defaults?')) return;
    const mp: Record<string, { pricePerSqFt: string; laborPerSqFt: string }> = {};
    for (const m of MATERIALS) mp[m.id] = { pricePerSqFt: '', laborPerSqFt: '' };
    const ap: Record<string, string> = {};
    for (const a of ADDONS) ap[a.id] = '';
    setMatPrices(mp);
    setAddonPrices(ap);
  };

  const isMatOverridden = (id: string) => matPrices[id]?.pricePerSqFt !== '' || matPrices[id]?.laborPerSqFt !== '';
  const isAddonOverridden = (id: string) => addonPrices[id] !== '';
  const overriddenMats = MATERIALS.filter(m => isMatOverridden(m.id)).length;
  const overriddenAddons = ADDONS.filter(a => isAddonOverridden(a.id)).length;

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-c-text">Pricing Management</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Override catalog prices for all new quotes.{' '}
              <span className="text-amber-400">Blank = use catalog default.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetAll} className="gap-1.5 text-neutral-500">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </Button>
            <Button onClick={handleSave} className="gap-2">
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : 'Save Prices'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-c-border-inner pb-0">
          {(['materials', 'addons'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-3 min-h-[48px] text-sm font-medium capitalize transition-all border-b-2 -mb-px',
                tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'
              )}
            >
              {t === 'materials' ? `Materials${overriddenMats > 0 ? ` (${overriddenMats} override${overriddenMats > 1 ? 's' : ''})` : ''}` : `Add-Ons${overriddenAddons > 0 ? ` (${overriddenAddons} override${overriddenAddons > 1 ? 's' : ''})` : ''}`}
            </button>
          ))}
        </div>

        {/* Materials Table */}
        {tab === 'materials' && (
          <div className="bg-c-card border border-c-border-inner rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-c-border-inner">
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Category / Tier</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500">
                    Catalog<br />Material $/sf
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500">
                    <span className="text-amber-400">Your Price</span><br />Material $/sf
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500">
                    Catalog<br />Labor $/sf
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500">
                    <span className="text-amber-400">Your Price</span><br />Labor $/sf
                  </th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-c-border-inner">
                {MATERIALS.map(m => {
                  const overridden = isMatOverridden(m.id);
                  return (
                    <tr key={m.id} className={cn('hover:bg-c-surface transition-colors', overridden && 'bg-amber-500/3')}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {overridden && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                          <img src={m.image} alt={m.name} className="w-8 h-8 rounded-md object-cover shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-c-text">{m.name}</div>
                            <div className="text-xs text-neutral-500">{m.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-neutral-400">{MAT_CAT_LABELS[m.category as MaterialCategory]}</div>
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block', TIER_COLORS[m.tier])}>
                          {TIER_LABELS[m.tier]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-neutral-400">${m.pricePerSqFt}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder={String(m.pricePerSqFt)}
                            value={matPrices[m.id]?.pricePerSqFt ?? ''}
                            onChange={e => setMatPrices(p => ({
                              ...p, [m.id]: { ...p[m.id], pricePerSqFt: e.target.value }
                            }))}
                            className={cn(
                              'w-24 h-11 pl-6 pr-2 rounded-xl bg-c-input border text-sm text-c-text text-right focus:outline-none focus:ring-1 focus:ring-amber-500/30',
                              matPrices[m.id]?.pricePerSqFt ? 'border-amber-500/40 bg-amber-500/5' : 'border-c-border-input'
                            )}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-neutral-400">${m.laborPerSqFt}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder={String(m.laborPerSqFt)}
                            value={matPrices[m.id]?.laborPerSqFt ?? ''}
                            onChange={e => setMatPrices(p => ({
                              ...p, [m.id]: { ...p[m.id], laborPerSqFt: e.target.value }
                            }))}
                            className={cn(
                              'w-24 h-11 pl-6 pr-2 rounded-xl bg-c-input border text-sm text-c-text text-right focus:outline-none focus:ring-1 focus:ring-amber-500/30',
                              matPrices[m.id]?.laborPerSqFt ? 'border-amber-500/40 bg-amber-500/5' : 'border-c-border-input'
                            )}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {overridden && (
                          <button
                            onClick={() => resetMaterial(m.id)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-c-elevated text-neutral-600 hover:text-neutral-300 transition-all"
                            title="Reset to default"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add-Ons Table */}
        {tab === 'addons' && (
          <div className="bg-c-card border border-c-border-inner rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-c-border-inner">
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500">Add-On</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Unit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500">Catalog Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-amber-500">Your Price</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-c-border-inner">
                {ADDONS.map(a => {
                  const overridden = isAddonOverridden(a.id);
                  return (
                    <tr key={a.id} className={cn('hover:bg-c-surface transition-colors', overridden && 'bg-amber-500/3')}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {overridden && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                          <span className="text-xl">{a.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-c-text">{a.name}</div>
                            <div className="text-xs text-neutral-500 max-w-xs truncate">{a.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-neutral-400">{ADDON_CAT_LABELS[a.category as AddonCategory]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-neutral-500">{UNIT_LABELS[a.unit] ?? a.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-neutral-400">${a.basePrice.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative flex justify-center">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            step={a.unit === 'flat' ? 100 : 1}
                            placeholder={String(a.basePrice)}
                            value={addonPrices[a.id] ?? ''}
                            onChange={e => setAddonPrices(p => ({ ...p, [a.id]: e.target.value }))}
                            className={cn(
                              'w-32 h-11 pl-6 pr-2 rounded-xl bg-c-input border text-sm text-c-text text-right focus:outline-none focus:ring-1 focus:ring-amber-500/30',
                              overridden ? 'border-amber-500/40 bg-amber-500/5' : 'border-c-border-input'
                            )}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {overridden && (
                          <button
                            onClick={() => resetAddon(a.id)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-c-elevated text-neutral-600 hover:text-neutral-300 transition-all"
                            title="Reset to default"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            {saved ? <><CheckCircle2 className="w-5 h-5" /> Saved!</> : 'Save All Prices'}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
