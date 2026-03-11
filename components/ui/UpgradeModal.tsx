'use client';

import { X, Lock, Zap, Phone, Mail, BarChart3, Image, Grid3X3, Scale, DollarSign, Settings } from 'lucide-react';
import { REVCORE } from '@/lib/trial';

interface UpgradeModalProps {
  onClose: () => void;
  reason?: 'locked-feature' | 'quote-limit' | 'project-limit';
}

const LOCKED_FEATURES = [
  { icon: Grid3X3,   name: 'Material Catalog',        desc: 'Full library with specs, swatches & pricing' },
  { icon: Image,     name: 'Project Gallery',          desc: 'Client-facing photo gallery by project type' },
  { icon: Scale,     name: 'Tier Comparison Tool',     desc: 'Side-by-side budget vs. premium comparisons' },
  { icon: DollarSign,name: 'Global Pricing Manager',   desc: 'Override rates company-wide in one place' },
  { icon: BarChart3, name: 'Unlimited Estimates',      desc: 'Create and manage as many quotes as you need' },
  { icon: Settings,  name: 'Unlimited Job Tracking',   desc: 'Full pipeline — from permit to final payment' },
];

const REASON_COPY: Record<string, { title: string; sub: string }> = {
  'locked-feature': {
    title: 'Pro Feature',
    sub: "You're on a Presentation trial. Upgrade to unlock the full sales & project management suite.",
  },
  'quote-limit': {
    title: 'Trial Limit Reached',
    sub: "You've used all 3 trial estimates. Upgrade to create unlimited quotes for your team.",
  },
  'project-limit': {
    title: 'Trial Limit Reached',
    sub: "You've used all 3 trial jobs. Upgrade for unlimited project tracking from permit to delivery.",
  },
};

export function UpgradeModal({ onClose, reason = 'locked-feature' }: UpgradeModalProps) {
  const copy = REASON_COPY[reason];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ backdropFilter: 'blur(24px) saturate(180%)', background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #1e1e2e 0%, #17171f 100%)' }}
      >
        {/* Header */}
        <div
          className="relative px-7 pt-7 pb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.04) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/6 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all active:scale-95"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mb-5">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/12 border border-amber-500/20 mb-3">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-amber-400">RevCore Trial</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{copy.title}</h2>
          <p className="text-[15px] text-white/45 leading-relaxed">{copy.sub}</p>
        </div>

        {/* Feature list */}
        <div className="px-7 py-5">
          <div className="text-[11px] font-bold tracking-widest uppercase text-white/25 mb-4">
            Included in Full License
          </div>
          <div className="grid grid-cols-2 gap-3">
            {LOCKED_FEATURES.map(({ icon: Icon, name, desc }) => (
              <div key={name} className="rounded-2xl bg-white/4 border border-white/6 p-3.5">
                <Icon className="w-4.5 h-4.5 text-amber-400 mb-2" />
                <div className="text-[13px] font-semibold text-white leading-tight mb-1">{name}</div>
                <div className="text-[11px] text-white/35 leading-tight">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-7 pb-7">
          <div className="rounded-2xl bg-white/5 border border-white/8 p-5">
            <div className="text-[13px] font-semibold text-white/80 mb-4">Contact RevCore to upgrade</div>
            <div className="flex flex-col gap-3">
              <a
                href={`tel:${REVCORE.phone}`}
                className="flex items-center gap-3 h-12 px-4 rounded-xl bg-amber-500 text-black font-bold text-sm active:scale-[0.98] transition-all"
              >
                <Phone className="w-4.5 h-4.5" />
                {REVCORE.phone}
              </a>
              <a
                href={`mailto:${REVCORE.email}`}
                className="flex items-center gap-3 h-12 px-4 rounded-xl bg-white/7 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all active:scale-[0.98]"
              >
                <Mail className="w-4.5 h-4.5 text-amber-400" />
                {REVCORE.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
