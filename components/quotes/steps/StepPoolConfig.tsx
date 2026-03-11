'use client';

import { useWizardStore } from '@/store/wizard';
import { POOL_PRICING, calculatePoolTotal } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { PoolConfig, PoolShape, PoolSizePreset, PoolDepth, PoolFinish, PoolCoping } from '@/types';
import { Check, Waves, Sparkles, Sun, Shield } from 'lucide-react';

const DEFAULT_CONFIG: PoolConfig = {
  shape: 'rectangle',
  sizePreset: 'medium',
  depth: 'standard',
  finish: 'plaster',
  coping: 'bullnose-paver',
  features: { tanningLedge: false, attachedSpa: false, waterfall: false, autoCover: false, deckLighting: false, heating: false },
};

// SVG pool shapes
function PoolShapeSVG({ shape, active }: { shape: PoolShape; active: boolean }) {
  const color = active ? '#f59e0b' : '#6b7280';
  const fill = active ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.08)';
  const props = { viewBox: '0 0 100 68', className: 'w-full h-full', fill, stroke: color, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  switch (shape) {
    case 'rectangle':
      return <svg {...props}><rect x="6" y="10" width="88" height="48" rx="5" /></svg>;
    case 'l-shape':
      return <svg {...props}><path d="M6,10 H94 V38 H56 V58 H6 Z" strokeLinejoin="round" /></svg>;
    case 'kidney':
      return <svg {...props}><path d="M50,9 C28,9 6,21 6,39 C6,54 18,61 34,59 C41,58 45,51 50,51 C55,51 59,58 66,59 C82,61 94,54 94,39 C94,21 72,9 50,9 Z" /></svg>;
    case 'freeform':
      return <svg {...props}><path d="M42,7 C62,4 90,14 92,34 C94,54 77,64 58,64 C45,64 39,55 29,59 C14,64 5,51 7,37 C9,23 22,10 42,7 Z" /></svg>;
    case 'roman':
      return <svg {...props}><path d="M26,10 H74 Q94,10 94,30 V38 Q94,58 74,58 H26 Q6,58 6,38 V30 Q6,10 26,10 Z" /></svg>;
    default: return null;
  }
}

interface SectionProps { num: string; title: string; children: React.ReactNode }
function Section({ num, title, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-amber-500/60 tabular-nums tracking-widest">{num}</span>
        <div className="h-px flex-1 bg-c-border-inner" />
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">{title}</span>
        <div className="h-px flex-1 bg-c-border-inner" />
      </div>
      {children}
    </div>
  );
}

interface CardProps { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }
function ChoiceCard({ selected, onClick, children, className }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative text-left rounded-xl border transition-all duration-150 cursor-pointer',
        selected ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_0_1px_rgba(245,158,11,0.3)]' : 'border-c-border-inner bg-c-surface hover:border-c-border-hover hover:bg-c-elevated',
        className
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center z-10">
          <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
        </div>
      )}
      {children}
    </button>
  );
}

function ToggleCard({ selected, onClick, icon, label, desc, price }: { selected: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string; price: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative text-left rounded-xl border transition-all duration-150 cursor-pointer p-4',
        selected ? 'border-amber-500 bg-amber-500/5' : 'border-c-border-inner bg-c-surface hover:border-c-border-hover hover:bg-c-elevated'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', selected ? 'bg-amber-500/15' : 'bg-c-elevated')}>
          <span className={cn(selected ? 'text-amber-400' : 'text-neutral-500')}>{icon}</span>
        </div>
        <div className={cn('w-9 h-5 rounded-full transition-colors flex items-center px-0.5', selected ? 'bg-amber-500' : 'bg-c-border-input')}>
          <div className={cn('w-4 h-4 rounded-full bg-white shadow transition-transform', selected ? 'translate-x-4' : 'translate-x-0')} />
        </div>
      </div>
      <div className={cn('text-sm font-semibold mb-0.5', selected ? 'text-amber-400' : 'text-c-text')}>{label}</div>
      <div className="text-xs text-neutral-500 mb-2">{desc}</div>
      <div className={cn('text-xs font-medium', selected ? 'text-amber-400' : 'text-neutral-500')}>+{formatCurrency(price)}</div>
    </button>
  );
}

export function StepPoolConfig() {
  const { poolConfig, setPoolConfig } = useWizardStore();
  const config = poolConfig ?? DEFAULT_CONFIG;
  const update = (partial: Partial<PoolConfig>) => setPoolConfig({ ...config, ...partial });
  const toggleFeature = (key: keyof PoolConfig['features']) =>
    setPoolConfig({ ...config, features: { ...config.features, [key]: !config.features[key] } });

  const total = calculatePoolTotal(config);

  const shapes: { id: PoolShape; label: string }[] = [
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'l-shape', label: 'L-Shape' },
    { id: 'kidney', label: 'Kidney' },
    { id: 'freeform', label: 'Freeform' },
    { id: 'roman', label: 'Roman' },
  ];

  const sizes: { id: PoolSizePreset; label: string; dims: string; perimeter: number | null; price: number | null }[] = [
    { id: 'small',  label: 'Small',   dims: '12 × 24 ft', perimeter: 2*(12+24), price: POOL_PRICING.sizes.small.price },
    { id: 'medium', label: 'Medium',  dims: '16 × 32 ft', perimeter: 2*(16+32), price: POOL_PRICING.sizes.medium.price },
    { id: 'large',  label: 'Large',   dims: '20 × 40 ft', perimeter: 2*(20+40), price: POOL_PRICING.sizes.large.price },
    { id: 'xlarge', label: 'X-Large', dims: '24 × 48 ft', perimeter: 2*(24+48), price: POOL_PRICING.sizes.xlarge.price },
    { id: 'custom', label: 'Custom',  dims: 'Your size',  perimeter: null,       price: null },
  ];

  const depths: { id: PoolDepth; label: string; range: string; note: string; upcharge: number }[] = [
    { id: 'shallow',  label: 'Shallow',  range: "2.5–4.5 ft",    note: 'Family-friendly',        upcharge: 0 },
    { id: 'standard', label: 'Standard', range: "3.5–6 ft",      note: 'Most popular',           upcharge: 0 },
    { id: 'deep',     label: 'Deep',     range: "3.5–8 ft",      note: 'Diving board ready',     upcharge: POOL_PRICING.depths.deep.upcharge },
    { id: 'sport',    label: 'Sport',    range: "4–5 ft uniform", note: 'Volleyball / basketball', upcharge: 0 },
  ];

  const finishes: { id: PoolFinish; label: string; desc: string; color: string; upcharge: number }[] = [
    { id: 'plaster',      label: 'White Plaster',    desc: 'Classic smooth finish',      color: POOL_PRICING.finishes.plaster.color,       upcharge: 0 },
    { id: 'quartz',       label: 'Quartz Aggregate', desc: 'Durable speckled texture',   color: POOL_PRICING.finishes.quartz.color,        upcharge: POOL_PRICING.finishes.quartz.upcharge },
    { id: 'pebble-tec',   label: 'Pebble Tec',       desc: 'Natural pebble aggregate',   color: POOL_PRICING.finishes['pebble-tec'].color, upcharge: POOL_PRICING.finishes['pebble-tec'].upcharge },
    { id: 'glass-tile',   label: 'Glass Tile',       desc: 'Premium luxury shimmer',     color: POOL_PRICING.finishes['glass-tile'].color, upcharge: POOL_PRICING.finishes['glass-tile'].upcharge },
  ];

  const copings: { id: PoolCoping; label: string; desc: string; upcharge: number }[] = [
    { id: 'bullnose-paver', label: 'Bullnose Paver',       desc: 'Matching paver edge coping',   upcharge: 0 },
    { id: 'travertine',     label: 'Travertine',           desc: 'Natural travertine coping',    upcharge: POOL_PRICING.copings.travertine.upcharge },
    { id: 'flagstone',      label: 'Natural Flagstone',    desc: 'Colorado flagstone edge',      upcharge: POOL_PRICING.copings.flagstone.upcharge },
    { id: 'cantilever',     label: 'Cantilevered',         desc: 'Modern concrete overhang',     upcharge: POOL_PRICING.copings.cantilever.upcharge },
  ];

  const featureList: { id: keyof PoolConfig['features']; icon: React.ReactNode; label: string; desc: string; price: number }[] = [
    { id: 'tanningLedge', icon: <Waves className="w-4 h-4" />,    label: 'Tanning Ledge',       desc: 'In-pool shallow shelf w/ umbrella sleeve', price: POOL_PRICING.features.tanningLedge.price },
    { id: 'attachedSpa',  icon: <span className="text-base">♨️</span>, label: 'Attached Spa', desc: 'Custom spa with jets & blower',            price: POOL_PRICING.features.attachedSpa.price },
    { id: 'waterfall',    icon: <span className="text-base">💦</span>, label: 'Rock Waterfall', desc: 'Natural stone cascade feature',           price: POOL_PRICING.features.waterfall.price },
    { id: 'autoCover',    icon: <Shield className="w-4 h-4" />,   label: 'Automatic Cover',     desc: 'Motorized safety cover w/ housing',       price: POOL_PRICING.features.autoCover.price },
    { id: 'deckLighting', icon: <Sparkles className="w-4 h-4" />, label: 'LED Deck Lighting',   desc: 'Integrated landscape lighting system',    price: POOL_PRICING.features.deckLighting.price },
    { id: 'heating',      icon: <Sun className="w-4 h-4" />,      label: 'Solar Heating',       desc: 'Extend your swim season by months',       price: POOL_PRICING.features.heating.price },
  ];

  return (
    <div className="space-y-8 pb-6">
      {/* Header with live total */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-c-text">Pool Builder</h2>
          <p className="text-sm text-neutral-500 mt-1">Configure your custom pool. Each selection updates the estimated investment.</p>
        </div>
        <div className="text-right bg-c-surface border border-c-border-inner rounded-xl px-4 py-3 min-w-[160px]">
          <div className="text-xs text-neutral-500 mb-1">Estimated Investment</div>
          <div className="text-xl font-bold text-amber-400">{formatCurrency(total)}</div>
        </div>
      </div>

      {/* 01 SHAPE */}
      <Section num="01" title="Shape">
        <div className="grid grid-cols-5 gap-3">
          {shapes.map(s => (
            <ChoiceCard key={s.id} selected={config.shape === s.id} onClick={() => update({ shape: s.id })}>
              <div className="p-4 space-y-2.5">
                <div className="h-[72px] flex items-center justify-center">
                  <PoolShapeSVG shape={s.id} active={config.shape === s.id} />
                </div>
                <div className={cn('text-xs font-medium text-center', config.shape === s.id ? 'text-amber-400' : 'text-neutral-400')}>
                  {s.label}
                </div>
              </div>
            </ChoiceCard>
          ))}
        </div>
      </Section>

      {/* 02 SIZE */}
      <Section num="02" title="Size">
        <div className="grid grid-cols-5 gap-3">
          {sizes.map(s => (
            <ChoiceCard key={s.id} selected={config.sizePreset === s.id} onClick={() => update({ sizePreset: s.id })}>
              <div className="p-3.5 space-y-1.5">
                <div className={cn('text-sm font-bold', config.sizePreset === s.id ? 'text-amber-400' : 'text-c-text')}>{s.label}</div>
                <div className="text-xs text-neutral-500">{s.dims}</div>
                {s.perimeter !== null && (
                  <div className="text-xs text-neutral-600">{s.perimeter} ln ft</div>
                )}
                {s.price !== null ? (
                  <div className="text-xs font-medium text-neutral-400 pt-0.5">{formatCurrency(s.price)}</div>
                ) : (
                  <div className="text-xs text-neutral-600 pt-0.5">$115 / sq ft</div>
                )}
              </div>
            </ChoiceCard>
          ))}
        </div>
        {config.sizePreset === 'custom' && (() => {
          const l = config.customLength ?? 0;
          const w = config.customWidth ?? 0;
          const sqft = l * w;
          const perim = l > 0 && w > 0 ? 2 * (l + w) : 0;
          return (
            <div className="flex gap-3 mt-1">
              <div className="flex-1">
                <Input label="Length (ft)" type="number" min="10" max="100" placeholder="20"
                  value={config.customLength || ''} onChange={e => update({ customLength: Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <Input label="Width (ft)" type="number" min="10" max="60" placeholder="40"
                  value={config.customWidth || ''} onChange={e => update({ customWidth: Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500 mb-1.5">Sq Ft</div>
                <div className="h-9 flex items-center px-3 bg-c-input border border-c-border-inner rounded-lg text-sm text-c-text-2">
                  {sqft > 0 ? sqft.toLocaleString() : '—'} sq ft
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500 mb-1.5">Perimeter</div>
                <div className="h-9 flex items-center px-3 bg-c-input border border-c-border-inner rounded-lg text-sm text-c-text-2">
                  {perim > 0 ? perim.toLocaleString() : '—'} ln ft
                </div>
              </div>
            </div>
          );
        })()}
      </Section>

      {/* 03 DEPTH */}
      <Section num="03" title="Depth Profile">
        <div className="grid grid-cols-4 gap-2.5">
          {depths.map(d => (
            <ChoiceCard key={d.id} selected={config.depth === d.id} onClick={() => update({ depth: d.id })}>
              <div className="p-4 space-y-1.5">
                <div className={cn('text-sm font-bold', config.depth === d.id ? 'text-amber-400' : 'text-c-text')}>{d.label}</div>
                <div className="text-xs text-neutral-400">{d.range}</div>
                <div className="text-xs text-neutral-600">{d.note}</div>
                {d.upcharge > 0 && <div className="text-xs text-amber-500/70 font-medium pt-0.5">+{formatCurrency(d.upcharge)}</div>}
                {d.upcharge === 0 && <div className="text-xs text-emerald-500/60 pt-0.5">Included</div>}
              </div>
            </ChoiceCard>
          ))}
        </div>
      </Section>

      {/* 04 INTERIOR FINISH */}
      <Section num="04" title="Interior Finish">
        <div className="grid grid-cols-4 gap-2.5">
          {finishes.map(f => (
            <ChoiceCard key={f.id} selected={config.finish === f.id} onClick={() => update({ finish: f.id as PoolFinish })}>
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border-2 shrink-0" style={{ backgroundColor: f.color, borderColor: config.finish === f.id ? '#f59e0b' : 'var(--c-border-input)' }} />
                  <div>
                    <div className={cn('text-sm font-semibold leading-tight', config.finish === f.id ? 'text-amber-400' : 'text-c-text')}>{f.label}</div>
                  </div>
                </div>
                <div className="text-xs text-neutral-500">{f.desc}</div>
                {f.upcharge > 0 ? (
                  <div className="text-xs text-amber-500/70 font-medium">+{formatCurrency(f.upcharge)}</div>
                ) : (
                  <div className="text-xs text-emerald-500/60">Included</div>
                )}
              </div>
            </ChoiceCard>
          ))}
        </div>
      </Section>

      {/* 05 COPING */}
      <Section num="05" title="Coping">
        <div className="grid grid-cols-4 gap-2.5">
          {copings.map(c => (
            <ChoiceCard key={c.id} selected={config.coping === c.id} onClick={() => update({ coping: c.id as PoolCoping })}>
              <div className="p-4 space-y-1.5">
                <div className={cn('text-sm font-bold', config.coping === c.id ? 'text-amber-400' : 'text-c-text')}>{c.label}</div>
                <div className="text-xs text-neutral-500">{c.desc}</div>
                {c.upcharge > 0 ? (
                  <div className="text-xs text-amber-500/70 font-medium pt-1">+{formatCurrency(c.upcharge)}</div>
                ) : (
                  <div className="text-xs text-emerald-500/60 pt-1">Included</div>
                )}
              </div>
            </ChoiceCard>
          ))}
        </div>
      </Section>

      {/* 06 ENHANCEMENTS */}
      <Section num="06" title="Enhancements">
        <div className="grid grid-cols-3 gap-2.5">
          {featureList.map(f => (
            <ToggleCard
              key={f.id}
              selected={config.features[f.id]}
              onClick={() => toggleFeature(f.id)}
              icon={f.icon}
              label={f.label}
              desc={f.desc}
              price={f.price}
            />
          ))}
        </div>
      </Section>

      {/* Summary */}
      <div className="bg-c-card border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-c-text">Pool Configuration Summary</div>
          <div className="text-xl font-bold text-amber-400">{formatCurrency(total)}</div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div className="flex justify-between text-c-text-3"><span>Shape</span><span className="text-c-text capitalize">{config.shape.replace(/-/g, ' ')}</span></div>
          <div className="flex justify-between text-c-text-3"><span>Size</span><span className="text-c-text">{POOL_PRICING.sizes[config.sizePreset].label} {config.sizePreset !== 'custom' ? `(${POOL_PRICING.sizes[config.sizePreset].dims})` : `(${(config.customLength ?? 0) * (config.customWidth ?? 0)} sq ft)`}</span></div>
          <div className="flex justify-between text-c-text-3"><span>Perimeter</span><span className="text-c-text">{config.sizePreset !== 'custom' ? `${sizes.find(s => s.id === config.sizePreset)?.perimeter ?? 0} ln ft` : `${2 * ((config.customLength ?? 0) + (config.customWidth ?? 0))} ln ft`}</span></div>
          <div className="flex justify-between text-c-text-3"><span>Depth</span><span className="text-c-text">{POOL_PRICING.depths[config.depth].label}</span></div>
          <div className="flex justify-between text-c-text-3"><span>Finish</span><span className="text-c-text">{POOL_PRICING.finishes[config.finish].label}</span></div>
          <div className="flex justify-between text-c-text-3"><span>Coping</span><span className="text-c-text">{POOL_PRICING.copings[config.coping].label}</span></div>
          <div className="flex justify-between text-c-text-3">
            <span>Enhancements</span>
            <span className="text-c-text">{Object.values(config.features).filter(Boolean).length} selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
