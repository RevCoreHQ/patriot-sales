'use client';

import { useWizardStore } from '@/store/wizard';
import { useSettingsStore } from '@/store/settings';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
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
  short: string;
  render: () => React.ReactNode;
}

function buildSteps(hasPool: boolean, editingId?: string): StepDef[] {
  const steps: StepDef[] = [
    { label: 'Client',    short: 'Client',    render: () => <Step0ClientInfo /> },
    { label: 'Project',   short: 'Project',   render: () => <Step1ProjectTypes /> },
    { label: 'Site',      short: 'Site',      render: () => <Step2SiteConditions /> },
  ];
  if (hasPool) {
    steps.push({ label: 'Pool Builder', short: 'Pool', render: () => <StepPoolConfig /> });
  }
  steps.push(
    { label: 'Line Items', short: 'Items', render: () => <StepLineItems /> },
    { label: 'Add-Ons',   short: 'Add-Ons',   render: () => <Step4Addons /> },
    { label: 'Pricing',   short: 'Pricing',   render: () => <Step5Pricing /> },
    { label: 'Review',    short: 'Review',    render: () => <Step6Review editingId={editingId} /> },
  );
  return steps;
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
  const { init: initSettings } = useSettingsStore();

  useEffect(() => {
    initSettings();
    if (initialState) {
      wizard.loadFromQuote(initialState);
    } else if (!editingId) {
      wizard.reset();
    }
  }, []);

  const hasPool = wizard.projectTypes.includes('pool-construction');
  const steps = useMemo(() => buildSteps(hasPool, editingId), [hasPool, editingId]);

  const currentStep = Math.min(wizard.currentStep, steps.length - 1);
  const isLastStep = currentStep === steps.length - 1;
  const canNext = validateStep(currentStep, wizard);

  const goNext = () => wizard.setStep(Math.min(currentStep + 1, steps.length - 1));
  const goPrev = () => wizard.setStep(Math.max(currentStep - 1, 0));

  const progressPct = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Step progress bar */}
      <div className="h-[2px] w-full bg-c-border-inner shrink-0">
        <div
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step indicator — compact horizontal track */}
      <div className="px-7 pt-5 pb-4 border-b border-c-border-inner shrink-0">
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
                    'flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all shrink-0',
                    isActive ? 'cursor-default' : isDone ? 'cursor-pointer active:bg-c-elevated' : 'cursor-default'
                  )}
                >
                  {/* Number bubble */}
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all',
                    isActive
                      ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : isDone
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-c-elevated text-c-text-4'
                  )}>
                    {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : idx + 1}
                  </span>
                  {/* Label — only show on active */}
                  <span className={cn(
                    'text-xs font-semibold transition-all whitespace-nowrap hidden sm:block',
                    isActive ? 'text-c-text' : isDone ? 'text-c-text-3' : 'text-c-text-5'
                  )}>
                    {isActive ? step.label : step.short}
                  </span>
                </button>
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-px mx-1 transition-all',
                    isDone ? 'bg-amber-500/40' : 'bg-c-border-inner'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {steps[currentStep]?.render()}
      </div>

      {/* Navigation */}
      {!isLastStep && (
        <div
          className="px-7 py-4 border-t border-c-border-inner flex items-center justify-between gap-4 shrink-0 bg-c-surface"
        >
          <Button
            variant="ghost"
            size="md"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-2 min-w-[90px] text-c-text-3 hover:text-c-text-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-xs text-c-text-4 tabular-nums">
            {currentStep + 1} / {steps.length}
          </div>

          <Button
            size="md"
            onClick={goNext}
            disabled={!canNext}
            className="gap-2 min-w-[130px]"
          >
            {currentStep === steps.length - 2 ? 'Review Quote' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
