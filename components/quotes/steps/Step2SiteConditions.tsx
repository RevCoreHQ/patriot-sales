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
    <div className="space-y-2">
      <div className="text-sm font-semibold text-c-text-2 tracking-wide">{label}</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, 1fr)` }}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center justify-center text-center min-h-[56px] px-3 py-3 rounded-xl border transition-all active:scale-[0.96] cursor-pointer',
              value === opt.value
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                : 'border-c-border bg-c-card text-c-text-3 active:border-c-border-hover'
            )}
          >
            <span className={cn('text-sm font-semibold', value === opt.value ? 'text-amber-400' : 'text-c-text')}>{opt.label}</span>
            {opt.sub && <span className="text-[11px] text-c-text-4 mt-0.5 leading-tight">{opt.sub}</span>}
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
        <p className="text-sm text-c-text-3 mt-1">Describe the job site to calculate accurate pricing.</p>
      </div>

      {/* Square footage */}
      <Input
        label="Total Square Footage"
        type="number"
        min="1"
        placeholder="e.g. 500"
        value={siteConditions.squareFootage ?? ''}
        onChange={e => setSiteConditions({ squareFootage: Number(e.target.value) })}
      />

      {/* Shape */}
      <OptionGroup
        label="Site Shape"
        value={siteConditions.shape ?? 'rectangle'}
        onChange={v => setSiteConditions({ shape: v })}
        options={[
          { value: 'rectangle', label: 'Rectangle' },
          { value: 'l-shape',   label: 'L-Shape' },
          { value: 'irregular', label: 'Irregular' },
          { value: 'curved',    label: 'Curved' },
        ]}
      />

      {/* Slope */}
      <OptionGroup
        label="Slope / Grade"
        value={siteConditions.slope ?? 'flat'}
        onChange={v => setSiteConditions({ slope: v })}
        options={[
          { value: 'flat',     label: 'Flat',     sub: 'Level site' },
          { value: 'slight',   label: 'Slight',   sub: '< 5% grade' },
          { value: 'moderate', label: 'Moderate', sub: '5–15%' },
          { value: 'steep',    label: 'Steep',    sub: 'Needs grading' },
        ]}
      />

      {/* Access */}
      <OptionGroup
        label="Site Access"
        value={siteConditions.access ?? 'easy'}
        onChange={v => setSiteConditions({ access: v })}
        options={[
          { value: 'easy',     label: 'Easy',     sub: 'Open access' },
          { value: 'moderate', label: 'Moderate', sub: 'Side gate' },
          { value: 'difficult',label: 'Difficult', sub: 'Limited access' },
        ]}
      />

      {/* Demolition */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-c-text-2 tracking-wide">Demolition Required?</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: true,  label: 'Yes — Demo Needed' },
            { val: false, label: 'No — Clean Site' },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setSiteConditions({ demo: val })}
              className={cn(
                'h-14 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] cursor-pointer',
                siteConditions.demo === val
                  ? val ? 'border-orange-500/60 bg-orange-500/10 text-orange-400' : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                  : 'border-c-border bg-c-card text-c-text-3 active:border-c-border-hover'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {siteConditions.demo && (
          <Input
            placeholder="Describe what needs to be removed (e.g. existing concrete slab, old pavers)"
            value={siteConditions.demoDescription ?? ''}
            onChange={e => setSiteConditions({ demoDescription: e.target.value })}
          />
        )}
      </div>

      <Textarea
        label="Site Notes (optional)"
        placeholder="Drainage concerns, soil conditions, special access restrictions..."
        rows={3}
        value={siteConditions.notes ?? ''}
        onChange={e => setSiteConditions({ notes: e.target.value })}
      />
    </div>
  );
}
