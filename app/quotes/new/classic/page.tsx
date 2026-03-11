'use client';

import { AppShell } from '@/components/layout/AppShell';
import { QuoteWizard } from '@/components/quotes/QuoteWizard';

export default function ClassicBuilderPage() {
  return (
    <AppShell>
      <div className="h-full flex flex-col bg-c-surface">
        <div className="px-7 py-5 border-b border-c-border-inner shrink-0 bg-c-card">
          <h1 className="text-xl font-bold text-c-text">New Quote — Classic Builder</h1>
          <p className="text-sm text-c-text-3 mt-0.5">Step-by-step detailed quote wizard</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <QuoteWizard />
        </div>
      </div>
    </AppShell>
  );
}
