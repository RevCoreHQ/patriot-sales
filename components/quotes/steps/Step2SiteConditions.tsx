'use client';

import { useWizardStore } from '@/store/wizard';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-base font-semibold text-c-text-2 tracking-wide">{label}</div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, 1fr)` }}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center justify-center text-center min-h-[64px] px-4 py-4 rounded-xl border transition-all active:scale-[0.96] cursor-pointer',
              value === opt.value
                ? 'border-accent/60 bg-accent/10 text-accent'
                : 'border-c-border bg-c-card text-c-text-3 active:border-c-border-hover'
            )}
          >
            <span className={cn('text-base font-semibold', value === opt.value ? 'text-accent' : 'text-c-text')}>{opt.label}</span>
            {opt.sub && <span className="text-sm text-c-text-4 mt-0.5 leading-tight">{opt.sub}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Step2SiteConditions() {
  const { siteConditions, setSiteConditions } = useWizardStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-c-text">Site Conditions</h2>
        <p className="text-base text-c-text-3 mt-1">Describe the roof and job site for accurate pricing.</p>
      </div>

      {/* Roof area */}
      <Input
        label="Roof Area (sq ft)"
        type="number"
        min="1"
        placeholder="e.g. 2000"
        value={siteConditions.roofArea ?? ''}
        onChange={e => setSiteConditions({ roofArea: Number(e.target.value) })}
      />

      {/* Pitch */}
      <OptionGroup
        label="Roof Pitch"
        value={siteConditions.pitch ?? 'moderate'}
        onChange={v => setSiteConditions({ pitch: v })}
        options={[
          { value: 'flat',     label: 'Flat',     sub: '0–2/12' },
          { value: 'low',      label: 'Low',      sub: '3–5/12' },
          { value: 'moderate', label: 'Moderate', sub: '6–9/12' },
          { value: 'steep',    label: 'Steep',    sub: '10+/12' },
        ]}
      />

      {/* Stories */}
      <OptionGroup
        label="Number of Stories"
        value={String(siteConditions.stories ?? 1) as '1' | '2' | '3'}
        onChange={v => setSiteConditions({ stories: Number(v) as 1 | 2 | 3 })}
        options={[
          { value: '1', label: '1 Story',  sub: 'Ranch / single' },
          { value: '2', label: '2 Stories', sub: 'Standard home' },
          { value: '3', label: '3 Stories', sub: 'Multi-level' },
        ]}
      />

      {/* Current Material */}
      <OptionGroup
        label="Current Roof Material"
        value={siteConditions.currentMaterial ?? 'asphalt'}
        onChange={v => setSiteConditions({ currentMaterial: v })}
        options={[
          { value: 'asphalt', label: 'Asphalt' },
          { value: 'metal',   label: 'Metal' },
          { value: 'tile',    label: 'Tile' },
          { value: 'wood',    label: 'Wood' },
          { value: 'flat',    label: 'Flat' },
          { value: 'other',   label: 'Other' },
        ]}
      />

      {/* Access */}
      <OptionGroup
        label="Site Access"
        value={siteConditions.access ?? 'easy'}
        onChange={v => setSiteConditions({ access: v })}
        options={[
          { value: 'easy',     label: 'Easy',     sub: 'Open access' },
          { value: 'moderate', label: 'Moderate', sub: 'Side access' },
          { value: 'difficult',label: 'Difficult', sub: 'Limited access' },
        ]}
      />

      {/* Tear-Off */}
      <div className="space-y-3">
        <div className="text-base font-semibold text-c-text-2 tracking-wide">Tear-Off Required?</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: true,  label: 'Yes — Tear-Off Needed' },
            { val: false, label: 'No — New Install' },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setSiteConditions({ tearOff: val })}
              className={cn(
                'h-16 rounded-xl border text-base font-semibold transition-all active:scale-[0.97] cursor-pointer',
                siteConditions.tearOff === val
                  ? val ? 'border-orange-500/60 bg-orange-500/10 text-orange-400' : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                  : 'border-c-border bg-c-card text-c-text-3 active:border-c-border-hover'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {siteConditions.tearOff && (
          <div className="space-y-3">
            <OptionGroup
              label="Number of Existing Layers"
              value={String(siteConditions.layers ?? 1)}
              onChange={v => setSiteConditions({ layers: Number(v) })}
              options={[
                { value: '1', label: '1 Layer' },
                { value: '2', label: '2 Layers' },
                { value: '3', label: '3 Layers' },
              ]}
            />
            <Input
              placeholder="Describe existing roof condition (optional)"
              value={siteConditions.tearOffDescription ?? ''}
              onChange={e => setSiteConditions({ tearOffDescription: e.target.value })}
            />
          </div>
        )}
      </div>

      <Textarea
        label="Site Notes (optional)"
        placeholder="Drainage concerns, chimney flashing, skylights, special access restrictions..."
        rows={3}
        value={siteConditions.notes ?? ''}
        onChange={e => setSiteConditions({ notes: e.target.value })}
      />
    </div>
  );
}
