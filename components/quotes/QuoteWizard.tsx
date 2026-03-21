'use client';

import { useWizardStore } from '@/store/wizard';
import { useSettingsStore } from '@/store/settings';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { LiveQuoteSummary } from './LiveQuoteSummary';
import { Step0ClientInfo } from './steps/Step0ClientInfo';
import { Step1ProjectTypes } from './steps/Step1ProjectTypes';
import { Step2SiteConditions } from './steps/Step2SiteConditions';
import { StepLineItems } from './steps/StepLineItems';
import { Step4Addons } from './steps/Step4Addons';
import { Step5Pricing } from './steps/Step5Pricing';
import { Step6Review } from './steps/Step6Review';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { buildLineItems, calculateTotals } from '@/lib/pricing';
import type { WizardState } from '@/types';

interface StepDef {
  label: string;
  render: () => React.ReactNode;
}

function buildSteps(editingId?: string): StepDef[] {
  return [
    { label: 'Client',      render: () => <Step0ClientInfo /> },
    { label: 'Project',     render: () => <Step1ProjectTypes /> },
    { label: 'Site',        render: () => <Step2SiteConditions /> },
    { label: 'Line Items',  render: () => <StepLineItems /> },
    { label: 'Add-Ons',     render: () => <Step4Addons /> },
    { label: 'Pricing',     render: () => <Step5Pricing /> },
    { label: 'Review',      render: () => <Step6Review editingId={editingId} /> },
  ];
}

function validateStep(stepIndex: number, state: WizardState): boolean {
  switch (stepIndex) {
    case 0: return !!(state.client.name && state.client.phone);
    case 1: return state.projectTypes.length > 0;
    default: return true;
  }
}

interface QuoteWizardProps {
  editingId?: string;
  initialState?: Partial<WizardState>;
}

export function QuoteWizard({ editingId, initialState }: QuoteWizardProps) {
  const wizard = useWizardStore();
  const { settings, init: initSettings } = useSettingsStore();
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    initSettings();
    if (initialState) {
      wizard.loadFromQuote(initialState);
    } else if (!editingId) {
      wizard.reset();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = useMemo(() => buildSteps(editingId), [editingId]);

  const currentStep = Math.min(wizard.currentStep, steps.length - 1);
  const isLastStep = currentStep === steps.length - 1;
  const canNext = validateStep(currentStep, wizard);
  const directionRef = useRef(1);

  // Auto-open summary on review step
  useEffect(() => {
    if (currentStep === steps.length - 1) setSummaryOpen(true);
  }, [currentStep, steps.length]);

  const goNext = () => { directionRef.current = 1; wizard.setStep(Math.min(currentStep + 1, steps.length - 1)); };
  const goPrev = () => { directionRef.current = -1; wizard.setStep(Math.max(currentStep - 1, 0)); };

  // Running total for the summary toggle button
  const autoItems = buildLineItems(
    wizard.materialSelections, wizard.addonSelections, wizard.siteConditions,
    settings.pricing.demolitionRate, settings.pricing.materialPrices, settings.pricing.addonPrices,
  );
  const allItems = [...autoItems, ...wizard.manualLineItems];
  const { total } = wizard.priceOverride
    ? { total: wizard.priceOverride * (1 + settings.pricing.taxRate / 100) }
    : calculateTotals(allItems, wizard.discountPercent, settings.pricing.taxRate);

  return (
    <div className="flex flex-col h-full">
      {/* Apple-style progress indicator */}
      <div className="px-8 py-4 border-b border-c-border-inner shrink-0">
        <div className="h-[3px] w-full bg-c-border-inner rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent via-white/80 to-accent-secondary"
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-c-text">{steps[currentStep]?.label}</span>
            {currentStep > 0 && (
              <div className="flex items-center gap-1">
                {steps.slice(0, currentStep).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => wizard.setStep(idx)}
                    className="w-1.5 h-1.5 rounded-full bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                  />
                ))}
              </div>
            )}
          </div>
          <span className="text-sm text-c-text-4 tabular-nums font-medium">
            {currentStep + 1} / {steps.length}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Form — full width, shifts left when summary opens */}
        <motion.div
          className="flex-1 overflow-y-auto"
          animate={{ marginRight: summaryOpen ? 360 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: directionRef.current * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: directionRef.current * -20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="px-8 py-6 max-w-3xl mx-auto"
            >
              {steps[currentStep]?.render()}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Summary toggle button */}
        <button
          type="button"
          onClick={() => setSummaryOpen(!summaryOpen)}
          className={cn(
            'absolute top-4 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-l-xl border border-r-0 transition-all',
            'bg-c-card border-c-border-inner hover:bg-c-elevated active:scale-[0.97]',
            summaryOpen ? 'right-[360px]' : 'right-0'
          )}
        >
          {summaryOpen ? (
            <PanelRightClose className="w-5 h-5 text-c-text-3" />
          ) : (
            <>
              <PanelRightOpen className="w-5 h-5 text-c-text-3" />
              <span className="text-base font-bold text-accent tabular-nums">
                {formatCurrency(total)}
              </span>
            </>
          )}
        </button>

        {/* Slide-out summary drawer */}
        <AnimatePresence>
          {summaryOpen && (
            <motion.div
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute right-0 top-0 bottom-0 w-[360px] bg-c-surface border-l border-c-border-inner z-10"
            >
              <LiveQuoteSummary />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {!isLastStep && (
        <div className="px-8 py-4 border-t border-c-border-inner flex items-center justify-between gap-4 shrink-0">
          <Button
            variant="ghost"
            size="md"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-2 min-w-[120px] text-c-text-3"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>

          <Button
            size="md"
            onClick={goNext}
            disabled={!canNext}
            className="gap-2 min-w-[160px]"
          >
            {currentStep === steps.length - 2 ? 'Review Quote' : 'Continue'}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
