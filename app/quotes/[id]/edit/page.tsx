'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { QuoteWizard } from '@/components/quotes/QuoteWizard';
import { useQuotesStore } from '@/store/quotes';
import { useSettingsStore } from '@/store/settings';
import { buildLineItems } from '@/lib/pricing';
import type { WizardState } from '@/types';

export default function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { quotes, init } = useQuotesStore();
  const { settings, init: initSettings } = useSettingsStore();
  const [initialState, setInitialState] = useState<Partial<WizardState> | null>(null);

  useEffect(() => { init(); initSettings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;
    // Convert existing materialSelections to manualLineItems so they're editable
    const fromMaterials = buildLineItems(
      quote.materialSelections, [], { tearOff: false, roofArea: 0, pitch: 'moderate', stories: 1, currentMaterial: 'asphalt', access: 'easy' },
      0, settings.pricing.materialPrices, {}
    );
    // Also include any stored lineItems that aren't from addons (misc/material/labor categories)
    // For fresh quotes built with the new flow, lineItems already has the manual items
    const manualLineItems = fromMaterials.length > 0 ? fromMaterials
      : quote.lineItems.filter(i => i.category !== 'addon');
    setInitialState({
      quoteId: quote.id,
      client: quote.client,
      projectTypes: quote.projectTypes,
      siteConditions: quote.siteConditions,
      manualLineItems,
      materialSelections: [],
      addonSelections: quote.addonSelections,
      discountPercent: quote.discountPercent,
      discountName: quote.discountName ?? '',
      notes: quote.notes ?? '',
      internalNotes: quote.internalNotes ?? '',
    });
  }, [quotes, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (quotes.length > 0 && !quotes.find(q => q.id === id)) {
    router.push('/');
    return null;
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="px-6 pt-5 border-b border-c-border-inner pb-4 shrink-0">
          <h1 className="text-xl font-bold text-c-text">Edit Quote</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Update the quote details</p>
        </div>
        <div className="flex-1 overflow-hidden">
          {initialState && <QuoteWizard editingId={id} initialState={initialState} />}
        </div>
      </div>
    </AppShell>
  );
}
