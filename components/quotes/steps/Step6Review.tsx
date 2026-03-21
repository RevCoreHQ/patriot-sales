'use client';

import { useWizardStore } from '@/store/wizard';
import { useSettingsStore } from '@/store/settings';
import { useQuotesStore } from '@/store/quotes';
import { buildLineItems, calculateTotals } from '@/lib/pricing';
import { formatCurrency, formatDate, generateId, addDays } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Quote } from '@/types';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, User, MapPin, Layers, Sparkles,
  Phone, Mail, Tag, DollarSign,
} from 'lucide-react';

interface Step6ReviewProps { editingId?: string }

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-c-border bg-c-card overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-c-border-inner">
      <Icon className="w-3.5 h-3.5 text-accent/70" />
      <span className="text-[11px] font-bold text-c-text-4 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export function Step6Review({ editingId }: Step6ReviewProps) {
  const router = useRouter();
  const wizard = useWizardStore();
  const { settings } = useSettingsStore();
  const { save } = useQuotesStore();

  const addonItems = buildLineItems([], wizard.addonSelections, wizard.siteConditions, settings.pricing.demolitionRate, {}, settings.pricing.addonPrices);
  const lineItems = [...wizard.manualLineItems, ...addonItems];
  const { subtotal, discountAmount, taxAmount, total } = calculateTotals(lineItems, wizard.discountPercent, settings.pricing.taxRate);

  const saveQuote = () => {
    const now = new Date().toISOString();
    const quote: Quote = {
      id: editingId ?? generateId(),
      client: {
        id: wizard.client.id ?? generateId(),
        name: wizard.client.name ?? '',
        email: wizard.client.email ?? '',
        phone: wizard.client.phone ?? '',
        address: wizard.client.address ?? '',
        projectAddress: wizard.client.projectAddress,
        createdAt: wizard.client.createdAt ?? now,
      },
      status: 'draft',
      projectTypes: wizard.projectTypes,
      siteConditions: {
        roofArea: wizard.siteConditions.roofArea ?? 0,
        pitch: wizard.siteConditions.pitch ?? 'moderate',
        stories: wizard.siteConditions.stories ?? 1,
        currentMaterial: wizard.siteConditions.currentMaterial ?? 'asphalt',
        access: wizard.siteConditions.access ?? 'easy',
        tearOff: wizard.siteConditions.tearOff ?? false,
        tearOffDescription: wizard.siteConditions.tearOffDescription,
        layers: wizard.siteConditions.layers,
        notes: wizard.siteConditions.notes,
      },
      materialSelections: [],
      addonSelections: wizard.addonSelections,
      lineItems,
      subtotal,
      discountPercent: wizard.discountPercent,
      discountName: wizard.discountName || undefined,
      discountAmount,
      taxRate: settings.pricing.taxRate,
      taxAmount,
      total: wizard.priceOverride ?? total,
      priceOverride: wizard.priceOverride,
      notes: wizard.notes,
      internalNotes: wizard.internalNotes,
      salesRep: settings.salesRep.name,
      createdAt: now,
      updatedAt: now,
      validUntil: addDays(new Date(), settings.pricing.quoteValidDays).toISOString(),
    };
    save(quote);
    wizard.reset();
    router.push(`/quotes/${quote.id}`);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-c-text">Review & Save</h2>
        <p className="text-sm text-c-text-3 mt-0.5">Confirm all details before creating the quote.</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-3">

        {/* Client */}
        <GlassCard>
          <SectionLabel icon={User} label="Client" />
          <div className="px-4 py-3 space-y-1.5">
            <div className="text-sm font-bold text-c-text">{wizard.client.name || '—'}</div>
            {wizard.client.phone && (
              <div className="flex items-center gap-2 text-xs text-c-text-3">
                <Phone className="w-3 h-3 shrink-0" />{wizard.client.phone}
              </div>
            )}
            {wizard.client.email && (
              <div className="flex items-center gap-2 text-xs text-c-text-3">
                <Mail className="w-3 h-3 shrink-0" />{wizard.client.email}
              </div>
            )}
            {wizard.client.address && (
              <div className="flex items-center gap-2 text-xs text-c-text-3">
                <MapPin className="w-3 h-3 shrink-0" />{wizard.client.address}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Project */}
        <GlassCard>
          <SectionLabel icon={Tag} label="Project" />
          <div className="px-4 py-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {wizard.projectTypes.map(pt => (
                <span key={pt} className="text-[11px] bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full capitalize font-medium">
                  {pt.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
            <div className="text-xs text-c-text-3 space-y-0.5">
              <div>{wizard.siteConditions.roofArea?.toLocaleString()} sq ft</div>
              <div className="capitalize">
                {wizard.siteConditions.pitch} pitch ·{' '}
                {wizard.siteConditions.stories} {wizard.siteConditions.stories === 1 ? 'story' : 'stories'} ·{' '}
                {wizard.siteConditions.access} access
              </div>
              {wizard.siteConditions.tearOff && (
                <div className="text-orange-400 font-medium">
                  Tear-off required{wizard.siteConditions.layers && wizard.siteConditions.layers > 1 ? ` (${wizard.siteConditions.layers} layers)` : ''}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Line Items */}
      {wizard.manualLineItems.length > 0 && (
        <GlassCard>
          <SectionLabel icon={Layers} label="Line Items" />
          <div className="px-4 py-3 space-y-1.5">
            {wizard.manualLineItems.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-c-text truncate">{item.description}</div>
                  {item.unit !== 'flat' && (
                    <div className="text-xs text-c-text-3">{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</div>
                  )}
                </div>
                <span className="text-c-text-2 font-medium text-xs shrink-0">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Add-ons */}
      {wizard.addonSelections.length > 0 && (
        <GlassCard>
          <SectionLabel icon={Sparkles} label="Add-Ons" />
          <div className="px-4 py-3 space-y-1.5">
            {wizard.addonSelections.map(s => (
              <div key={s.addonId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{s.addon.icon}</span>
                  <span className="text-c-text-2">{s.addon.name}</span>
                  {s.quantity > 1 && <span className="text-xs text-c-text-4">×{s.quantity}</span>}
                </div>
                <span className="text-c-text-2 font-medium text-xs">
                  {formatCurrency((s.customPrice ?? s.addon.basePrice) * s.quantity)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Totals */}
      <GlassCard>
        <SectionLabel icon={DollarSign} label="Quote Summary" />
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm text-c-text-3">
            <span>Subtotal</span>
            <span className="text-c-text">{formatCurrency(subtotal)}</span>
          </div>
          {wizard.discountPercent > 0 && (
            <div className="flex justify-between text-sm text-emerald-400">
              <span>
                {wizard.discountName ? `${wizard.discountName} (${wizard.discountPercent}%)` : `Discount (${wizard.discountPercent}%)`}
              </span>
              <span>−{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-c-text-3">
            <span>Sales Tax ({settings.pricing.taxRate}%)</span>
            <span className="text-c-text">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-3 border-t border-c-border-inner">
            <span className="text-sm font-bold text-c-text">Total Investment</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-accent">{formatCurrency(wizard.priceOverride ?? total)}</span>
              {wizard.priceOverride !== undefined && (
                <div className="text-xs text-neutral-500 line-through">{formatCurrency(total)}</div>
              )}
            </div>
          </div>
          <div className="text-xs text-c-text-4 pt-0.5">
            Valid until {formatDate(addDays(new Date(), settings.pricing.quoteValidDays).toISOString())}
          </div>
        </div>
      </GlassCard>

      {/* Save button */}
      <div className="pt-2">
        <Button size="lg" className="w-full gap-2.5" onClick={saveQuote}>
          <CheckCircle2 className="w-5 h-5" />
          {editingId ? 'Update Quote' : 'Save Quote'}
        </Button>
        <p className="text-center text-xs text-c-text-4 mt-3">
          Quote will be saved as a Draft — you can present or edit it at any time.
        </p>
      </div>
    </div>
  );
}
