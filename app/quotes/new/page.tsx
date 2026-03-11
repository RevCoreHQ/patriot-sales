'use client';

import { AppShell } from '@/components/layout/AppShell';
import { QuoteWizard } from '@/components/quotes/QuoteWizard';

export default function NewQuotePage() {
  return (
    <AppShell>
      <QuoteWizard />
    </AppShell>
  );
}
