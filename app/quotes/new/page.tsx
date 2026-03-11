'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { useQuotesStore } from '@/store/quotes';
import { TRIAL } from '@/lib/trial';
import { ArrowRight, Layers, Zap, Lock } from 'lucide-react';
import { useState } from 'react';

export default function NewQuotePage() {
  const { quotes } = useQuotesStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const atLimit = quotes.length >= TRIAL.maxQuotes;

  return (
    <AppShell>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason="quote-limit" />}

      <div className="h-full flex flex-col items-center justify-center p-8" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-2xl">

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-5">
              New Estimate
            </div>
            {atLimit ? (
              <>
                <h1 className="text-3xl font-bold text-c-text">Trial Limit Reached</h1>
                <p className="text-c-text-3 mt-2 text-sm">
                  You&apos;ve used all {TRIAL.maxQuotes} trial estimates. Upgrade to create unlimited quotes.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-c-text">Choose your builder</h1>
                <p className="text-c-text-3 mt-2 text-sm">
                  Both builders create the same professional estimate — pick the experience that fits your style.
                  <span className="ml-2 text-amber-400 font-medium">{TRIAL.maxQuotes - quotes.length} estimate{TRIAL.maxQuotes - quotes.length !== 1 ? 's' : ''} remaining in trial.</span>
                </p>
              </>
            )}
          </div>

          {atLimit ? (
            <div className="rounded-3xl border border-amber-500/20 p-10 text-center"
              style={{ background: 'linear-gradient(145deg, rgba(245,158,11,0.07), rgba(245,158,11,0.02))' }}>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-c-text-3 text-base mb-6 leading-relaxed">
                Your trial includes {TRIAL.maxQuotes} estimates. Contact RevCore to unlock unlimited quotes,
                job tracking, the material catalog, and more.
              </p>
              <button
                onClick={() => setShowUpgrade(true)}
                className="inline-flex items-center gap-2.5 h-14 px-8 rounded-xl bg-amber-500 text-black font-bold text-base active:scale-[0.98] transition-all"
                style={{ boxShadow: '0 0 28px rgba(245,158,11,0.3)' }}
              >
                Unlock Full Access <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Link href="/quotes/new/smart" className="group block">
                <div
                  className="h-full rounded-2xl border border-amber-500/25 p-7 transition-all duration-200 group-hover:border-amber-500/50 group-hover:shadow-[0_0_40px_rgba(245,158,11,0.12)] cursor-pointer"
                  style={{ background: 'linear-gradient(145deg, rgba(245,158,11,0.07), rgba(245,158,11,0.02))' }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-5">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Recommended</div>
                  <h2 className="text-xl font-bold text-c-text mb-2">Smart Estimator</h2>
                  <p className="text-c-text-3 text-sm leading-relaxed mb-5">
                    Guided 5-step flow with a live price panel. Category-first material selection so you&apos;re never overwhelmed.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {['Live running total as you build', 'Materials: Category → Tier → Pick', 'Grouped add-ons by category', 'Clean split-panel layout'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-c-text-2">
                        <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold group-hover:gap-2.5 transition-all">
                    Start Estimating <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              <Link href="/quotes/new/classic" className="group block">
                <div className="h-full rounded-2xl border border-c-border bg-c-card p-7 transition-all duration-200 group-hover:border-c-border-hover cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-c-elevated flex items-center justify-center mb-5">
                    <Layers className="w-6 h-6 text-c-text-3" />
                  </div>
                  <div className="text-c-text-4 text-xs font-bold tracking-widest uppercase mb-2">Full Control</div>
                  <h2 className="text-xl font-bold text-c-text mb-2">Classic Wizard</h2>
                  <p className="text-c-text-3 text-sm leading-relaxed mb-5">
                    8-step detailed wizard with full pool builder, per-area price overrides, and every option exposed.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {['Pool construction builder', 'Per-area price overrides', 'Full site condition detail', 'Advanced pricing controls'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-c-text-3">
                        <div className="w-1 h-1 rounded-full bg-c-border-hover shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1.5 text-c-text-3 text-sm font-semibold group-hover:gap-2.5 group-hover:text-c-text-2 transition-all">
                    Open Classic <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-c-text-4 mt-6">
            {atLimit
              ? 'Contact RevCore to unlock unlimited estimates and the full feature suite.'
              : 'Both builders save to the same quote — your data carries over between them.'}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
