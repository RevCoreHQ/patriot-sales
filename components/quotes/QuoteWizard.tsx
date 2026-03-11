'use client';

import { useWizardStore } from '@/store/wizard';
import { useSettingsStore } from '@/store/settings';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { LiveQuoteSummary } from './LiveQuoteSummary';
import { Step0ClientInfo } from './steps/Step0ClientInfo';
import { Step1ProjectTypes } from './steps/Step1ProjectTypes';
import { Step2SiteConditions } from './steps/Step2SiteConditions';
import { StepPoolConfig } from './steps/StepPoolConfig';
import { StepLineItems } from './steps/StepLineItems';
import { Step4Addons } from './steps/Step4Addons';
import { Step5Pricing } from './steps/Step5Pricing';
import { Step6Review } from './steps/Step6Review';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { WizardState } from '@/types';

interface StepDef {
  label: string;
  render: () => React.ReactNode;
}

function buildSteps(hasPool: boolean, editingId?: string): StepDef[] {
  return [
    {
      label: 'Client & Project',
      render: () => (
        <div className="space-y-8">
          <Step0ClientInfo />
          <div className="h-px bg-c-border-inner" />
          <Step1ProjectTypes />
        </div>
      ),
    },
    {
      label: 'Site Details',
      render: () => (
        <div className="space-y-8">
          <Step2SiteConditions />
          {hasPool && (
            <>
              <div className="h-px bg-c-border-inner" />
              <StepPoolConfig />
            </>
          )}
        </div>
      ),
    },
    {
      label: 'Items & Add-ons',
      render: () => (
        <div className="space-y-8">
          <StepLineItems />
          <div className="h-px bg-c-border-inner" />
          <Step4Addons />
        </div>
      ),
    },
    {
      label: 'Review & Save',
      render: () => (
        <div className="space-y-8">
          <Step5Pricing />
          <div className="h-px bg-c-border-inner" />
          <Step6Review editingId={editingId} />
        </div>
      ),
    },
  ];
}

function validateStep(stepIndex: number, state: WizardState): boolean {
  switch (stepIndex) {
    case 0: return !!(state.client.name && state.client.phone) && state.projectTypes.length > 0;
    default: return true;
  }
}

interface QuoteWizardProps {
  editingId?: string;
  initialState?: Partial<WizardState>;
}

export function QuoteWizard({ editingId, initialState }: QuoteWizardProps) {
  const wizard = useWizardStore();
  const { init: initSettings } = useSettingsStore();

  useEffect(() => {
    initSettings();
    if (initialState) {
      wizard.loadFromQuote(initialState);
    } else if (!editingId) {
      wizard.reset();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPool = wizard.projectTypes.includes('pool-construction');
  const steps = useMemo(() => buildSteps(hasPool, editingId), [hasPool, editingId]);

  const currentStep = Math.min(wizard.currentStep, steps.length - 1);
  const isLastStep = currentStep === steps.length - 1;
  const canNext = validateStep(currentStep, wizard);

  const goNext = () => wizard.setStep(Math.min(currentStep + 1, steps.length - 1));
  const goPrev = () => wizard.setStep(Math.max(currentStep - 1, 0));

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="px-6 py-4 border-b border-c-border-inner shrink-0">
        <div className="flex items-center gap-0">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <div key={idx} className="flex items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => isDone && wizard.setStep(idx)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all shrink-0',
                    isDone ? 'cursor-pointer active:bg-c-elevated' : 'cursor-default'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                    isActive
                      ? 'bg-amber-500 text-black shadow-[0_0_16px_rgba(245,158,11,0.35)]'
                      : isDone
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-c-elevated text-c-text-4'
                  )}>
                    {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : idx + 1}
                  </span>
                  <span className={cn(
                    'text-sm font-semibold transition-all whitespace-nowrap',
                    isActive ? 'text-c-text' : isDone ? 'text-c-text-3' : 'text-c-text-5'
                  )}>
                    {step.label}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-px mx-2 transition-all',
                    isDone ? 'bg-amber-500/40' : 'bg-c-border-inner'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Split panel content */}
      <div className="flex-1 flex min-h-0">
        {/* Left: form (60%) */}
        <div className="flex-[3] overflow-y-auto px-6 py-6 border-r border-c-border-inner">
          {steps[currentStep]?.render()}
        </div>

        {/* Right: live summary (40%) */}
        <div className="flex-[2] bg-c-surface overflow-hidden">
          <LiveQuoteSummary />
        </div>
      </div>

      {/* Navigation */}
      {!isLastStep && (
        <div className="px-6 py-4 border-t border-c-border-inner flex items-center justify-between gap-4 shrink-0">
          <Button
            variant="ghost"
            size="md"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-2 min-w-[100px] text-c-text-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-xs text-c-text-4 tabular-nums font-medium">
            Step {currentStep + 1} of {steps.length}
          </div>

          <Button
            size="md"
            onClick={goNext}
            disabled={!canNext}
            className="gap-2 min-w-[140px]"
          >
            {currentStep === steps.length - 2 ? 'Review Quote' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
