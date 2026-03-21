'use client';

import { useState } from 'react';
import { useWizardStore } from '@/store/wizard';
import { useSettingsStore } from '@/store/settings';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { buildLineItems, calculateTotals } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';
import { Lock } from 'lucide-react';

export function Step5Pricing() {
  const { manualLineItems, addonSelections, siteConditions, discountPercent, setDiscountPercent, discountName, setDiscountName, priceOverride, setPriceOverride, notes, setNotes, internalNotes, setInternalNotes, updateManualLineItem } = useWizardStore();
  const { settings } = useSettingsStore();
  const isAdmin = true;
  const [overrideEnabled, setOverrideEnabled] = useState(priceOverride !== undefined);

  // addons + tear-off from site conditions; manual items handle everything else
  const addonItems = buildLineItems([], addonSelections, siteConditions, settings.pricing.demolitionRate, {}, settings.pricing.addonPrices);
  const lineItems = [...manualLineItems, ...addonItems];
  const { subtotal, discountAmount, taxAmount, total } = calculateTotals(lineItems, discountPercent, settings.pricing.taxRate);

  // Margin calculations
  const totalCost = lineItems.reduce((s, item) => {
    if (item.costPerUnit) return s + (item.costPerUnit * item.quantity);
    return s;
  }, 0);
  const hasCosts = lineItems.some(item => item.costPerUnit !== undefined && item.costPerUnit > 0);
  const overallMarginPct = hasCosts && subtotal > 0 ? ((subtotal - totalCost) / subtotal * 100) : null;
  const overallMarginColor = overallMarginPct !== null
    ? overallMarginPct >= 30 ? 'text-emerald-400' : overallMarginPct >= 15 ? 'text-accent' : 'text-red-400'
    : '';

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'material': return 'text-blue-400/70';
      case 'labor':    return 'text-emerald-400/70';
      case 'addon':    return 'text-purple-400/70';
      default:         return 'text-neutral-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-c-text">Pricing & Discount</h2>
        <p className="text-base text-neutral-500 mt-1">Review the calculated pricing and apply any discounts.</p>
      </div>

      <div className="bg-c-card border border-c-border-inner rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-c-border-inner">
          <div className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Line Items</div>
        </div>
        <div className="divide-y divide-c-border-inner">
          {lineItems.map(item => {
            const isManual = manualLineItems.some(m => m.id === item.id);
            const itemMargin = item.costPerUnit && item.unitPrice > 0
              ? ((item.unitPrice - item.costPerUnit) / item.unitPrice * 100)
              : null;
            const marginColor = itemMargin !== null
              ? itemMargin >= 30 ? 'text-emerald-400' : itemMargin >= 15 ? 'text-accent' : 'text-red-400'
              : '';
            return (
              <div key={item.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-base text-c-text truncate">{item.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-sm capitalize', categoryColor(item.category))}>{item.category}</span>
                    {item.unit !== 'flat' && (
                      <span className="text-xs text-neutral-600">{item.quantity} {item.unit} &times; {formatCurrency(item.unitPrice)}</span>
                    )}
                    {itemMargin !== null && (
                      <span className={cn('text-[10px] font-semibold', marginColor)}>{itemMargin.toFixed(0)}% margin</span>
                    )}
                  </div>
                </div>
                {isManual && (
                  <div className="w-20 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cost"
                      value={item.costPerUnit ?? ''}
                      onChange={e => updateManualLineItem(item.id, { costPerUnit: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-full bg-c-input border border-c-border-input rounded-lg px-2 py-1 text-xs text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-accent-secondary/50 tabular-nums"
                    />
                  </div>
                )}
                <div className="text-base font-medium text-c-text shrink-0">{formatCurrency(item.total)}</div>
              </div>
            );
          })}
          {lineItems.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-c-text-3">
              No line items yet — add items in the previous step.
            </div>
          )}
        </div>

        <div className="border-t border-c-border-inner divide-y divide-c-border-inner">
          <div className="px-5 py-3.5 flex justify-between text-base">
            <span className="text-neutral-400">Subtotal</span>
            <span className="text-c-text">{formatCurrency(subtotal)}</span>
          </div>
          {hasCosts && (
            <div className="px-5 py-3.5 flex justify-between text-base">
              <span className="text-neutral-400">Total Cost</span>
              <div className="flex items-center gap-3">
                <span className="text-c-text-3">{formatCurrency(totalCost)}</span>
                <span className={cn('text-xs font-semibold', overallMarginColor)}>
                  {overallMarginPct !== null ? `${overallMarginPct.toFixed(1)}% margin` : ''}
                </span>
                <span className="text-emerald-400 font-semibold">{formatCurrency(subtotal - totalCost)} profit</span>
              </div>
            </div>
          )}
          {discountPercent > 0 && (
            <div className="px-5 py-3.5 flex justify-between text-base">
              <span className="text-emerald-400">Discount ({discountPercent}%)</span>
              <span className="text-emerald-400">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="px-5 py-3.5 flex justify-between text-base">
            <span className="text-neutral-400">Sales Tax ({settings.pricing.taxRate}%)</span>
            <span className="text-c-text">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="px-5 py-4 flex justify-between">
            <span className="text-lg font-bold text-c-text">Total</span>
            <div className="text-right">
              <span className="font-bold text-2xl text-accent">
                {formatCurrency(priceOverride !== undefined ? priceOverride : total)}
              </span>
              {priceOverride !== undefined && (
                <div className="text-xs text-neutral-500 line-through">{formatCurrency(total)}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="w-48">
          <Input label="Discount (%)" type="number" min="0" max="100" placeholder="0"
            value={discountPercent || ''} onChange={e => setDiscountPercent(Number(e.target.value))} />
        </div>
        {discountPercent > 0 && (
          <div className="flex-1 max-w-xs">
            <Input label="Discount Label (optional)" placeholder="e.g. Returning customer, Seasonal promo…"
              value={discountName} onChange={e => setDiscountName(e.target.value)} />
          </div>
        )}
      </div>

      {/* ── Admin Override ── */}
      {isAdmin && (
        <div className="border border-accent/20 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => {
              const next = !overrideEnabled;
              setOverrideEnabled(next);
              if (!next) setPriceOverride(undefined);
            }}
            className="w-full flex items-center gap-3 px-5 py-4 bg-accent/5 text-left hover:bg-accent/8 transition-colors"
          >
            <Lock className="w-4 h-4 text-accent/70 shrink-0" />
            <span className="text-sm font-bold text-accent/80 uppercase tracking-widest flex-1">Admin Price Controls</span>
            <div className={cn('w-10 h-[22px] rounded-full flex items-center px-0.5 transition-colors', overrideEnabled ? 'bg-accent' : 'bg-c-border-input')}>
              <div className={cn('w-4 h-4 rounded-full bg-white shadow transition-transform', overrideEnabled ? 'translate-x-[18px]' : 'translate-x-0')} />
            </div>
          </button>
          {overrideEnabled && (
            <div className="px-5 py-5 space-y-4 border-t border-accent/15">
              <div className="flex gap-4 items-end">
                <div className="w-48">
                  <Input
                    label="Manual Price Override ($)"
                    type="number"
                    min="0"
                    placeholder={String(Math.round(total))}
                    value={priceOverride ?? ''}
                    onChange={e => setPriceOverride(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>
                <div className="flex-1 max-w-[180px]">
                  <div className="text-xs text-neutral-500 mb-1.5">Margin</div>
                  <div className="h-9 flex items-center px-3 bg-c-input border border-c-border-inner rounded-lg text-sm font-semibold text-emerald-400">
                    {priceOverride !== undefined && subtotal > 0
                      ? `${(((priceOverride - subtotal) / priceOverride) * 100).toFixed(1)}%`
                      : subtotal > 0
                      ? `${(((total - subtotal) / total) * 100).toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
                <div className="flex-1 max-w-[180px]">
                  <div className="text-xs text-neutral-500 mb-1.5">Gross Profit</div>
                  <div className="h-9 flex items-center px-3 bg-c-input border border-c-border-inner rounded-lg text-sm font-semibold text-emerald-400">
                    {priceOverride !== undefined
                      ? formatCurrency(priceOverride - subtotal)
                      : formatCurrency(total - subtotal)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">
                Override replaces the calculated total on the quote. Margin = (Override − Subtotal) / Override.
              </p>
            </div>
          )}
        </div>
      )}

      <Textarea label="Client Notes (shown on quote)" placeholder="Warranty info, what is included, project timeline, etc."
        rows={3} value={notes} onChange={e => setNotes(e.target.value)} />

      <Textarea label="Internal Notes (not shown to client)" placeholder="Commission notes, special instructions, follow-up reminders..."
        rows={2} value={internalNotes} onChange={e => setInternalNotes(e.target.value)} />
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
