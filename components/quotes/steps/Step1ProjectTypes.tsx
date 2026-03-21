'use client';

import { useWizardStore } from '@/store/wizard';
import { PROJECT_TYPES } from '@/data/project-types';
import { cn } from '@/lib/utils';
import type { ProjectTypeId } from '@/types';
import {
  Home, Wrench, Construction, Droplets, PenTool, PanelTop,
  Hammer, Bath, ChefHat,
} from 'lucide-react';

const TYPE_ICONS: Record<ProjectTypeId, React.ElementType> = {
  'roof-replacement':      Home,
  'roof-repair':           Wrench,
  'new-roof':              Construction,
  'gutter-install':        Droplets,
  'gutter-repair':         PenTool,
  'siding':                PanelTop,
  'home-repair':           Hammer,
  'bathroom-renovation':   Bath,
  'kitchen-renovation':    ChefHat,
};

const ROOFING_IDS: ProjectTypeId[] = ['roof-replacement', 'roof-repair', 'new-roof'];
const EXTERIOR_IDS: ProjectTypeId[] = ['gutter-install', 'gutter-repair', 'siding'];
const INTERIOR_IDS: ProjectTypeId[] = ['home-repair', 'bathroom-renovation', 'kitchen-renovation'];

const byId = (ids: ProjectTypeId[]) => ids.map(id => PROJECT_TYPES.find(p => p.id === id)!).filter(Boolean);

function Checkmark() {
  return (
    <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

interface CategoryConfig {
  dotColor: string;
  iconBg: string;
  iconColor: string;
}

const CATEGORY_STYLES: Record<'roofing' | 'exterior' | 'interior', CategoryConfig> = {
  roofing:  { dotColor: 'bg-[#fb8e28]',    iconBg: 'bg-[#fb8e28]/12',    iconColor: 'text-[#fb8e28]' },
  exterior: { dotColor: 'bg-blue-500',      iconBg: 'bg-blue-500/12',     iconColor: 'text-blue-400' },
  interior: { dotColor: 'bg-emerald-500',   iconBg: 'bg-emerald-500/12',  iconColor: 'text-emerald-400' },
};

function CategoryLabel({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
      <span className="text-xs font-bold text-c-text-3 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-c-border-inner" />
    </div>
  );
}

function TypeCard({
  pt,
  selected,
  onToggle,
  iconBg,
  iconColor,
}: {
  pt: { id: ProjectTypeId; label: string; basePrice: number; unit: string };
  selected: boolean;
  onToggle: () => void;
  iconBg: string;
  iconColor: string;
}) {
  const Icon = TYPE_ICONS[pt.id];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.97] cursor-pointer',
        selected
          ? 'border-[#fb8e28]/50 bg-[#fb8e28]/8 ring-1 ring-[#fb8e28]/20'
          : 'border-c-border bg-c-card hover:border-c-border-hover hover:bg-c-elevated'
      )}
    >
      {/* Checkmark */}
      <div className={cn(
        'absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all',
        selected ? 'bg-[#fb8e28]' : 'border-2 border-c-border-hover'
      )}>
        {selected && <Checkmark />}
      </div>

      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
        selected ? 'bg-[#fb8e28]/20' : iconBg
      )}>
        <Icon className={cn('w-5 h-5', selected ? 'text-[#fb8e28]' : iconColor)} />
      </div>

      {/* Text */}
      <div>
        <div className={cn('text-sm font-semibold leading-snug', selected ? 'text-[#fb8e28]' : 'text-c-text')}>
          {pt.label}
        </div>
        <div className="text-xs text-c-text-4 mt-0.5">
          From ${pt.basePrice.toLocaleString()} / {pt.unit}
        </div>
      </div>
    </button>
  );
}

export function Step1ProjectTypes() {
  const { projectTypes, toggleProjectType } = useWizardStore();

  const exteriorTypes = byId(EXTERIOR_IDS);
  const interiorTypes = byId(INTERIOR_IDS);

  const roofReplacement = PROJECT_TYPES.find(p => p.id === 'roof-replacement')!;
  const roofReplacementSelected = projectTypes.includes('roof-replacement');

  const otherRoofing = byId(ROOFING_IDS).filter(p => p.id !== 'roof-replacement');

  return (
    <div className="space-y-8 pb-2">
      <div>
        <h2 className="text-xl font-bold text-c-text">Project Types</h2>
        <p className="text-sm text-c-text-3 mt-1">Select all that apply — you can choose multiple.</p>
      </div>

      {/* ── Roofing ── */}
      <div>
        <CategoryLabel label="Roofing" dotColor={CATEGORY_STYLES.roofing.dotColor} />
        <div className="space-y-2.5">

          {/* Roof Replacement — hero card */}
          <button
            type="button"
            onClick={() => toggleProjectType('roof-replacement')}
            className={cn(
              'w-full flex items-center gap-5 p-5 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer',
              roofReplacementSelected
                ? 'border-[#fb8e28]/60 bg-[#fb8e28]/8 ring-1 ring-[#fb8e28]/25'
                : 'border-[#fb8e28]/20 bg-[#fb8e28]/5 hover:border-[#fb8e28]/35 hover:bg-[#fb8e28]/8'
            )}
          >
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all',
              roofReplacementSelected ? 'bg-[#fb8e28]/20' : 'bg-[#fb8e28]/15'
            )}>
              <Home className={cn('w-7 h-7', roofReplacementSelected ? 'text-[#fb8e28]' : 'text-[#fb8e28]/70')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-base font-bold', roofReplacementSelected ? 'text-[#fb8e28]' : 'text-c-text')}>
                  {roofReplacement.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fb8e28]/15 text-[#fb8e28] border border-[#fb8e28]/25">
                  Most Popular
                </span>
              </div>
              <p className="text-xs text-c-text-3 mt-1.5 leading-relaxed">{roofReplacement.description}</p>
              <div className="text-xs text-c-text-4 mt-1.5">
                From ${roofReplacement.basePrice.toLocaleString()} / {roofReplacement.unit}
              </div>
            </div>
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ml-2',
              roofReplacementSelected ? 'bg-[#fb8e28]' : 'border-2 border-c-border-hover'
            )}>
              {roofReplacementSelected && <Checkmark />}
            </div>
          </button>

          {/* Other roofing — compact cards */}
          <div className="grid grid-cols-2 gap-3">
            {otherRoofing.map(pt => (
              <TypeCard
                key={pt.id}
                pt={pt}
                selected={projectTypes.includes(pt.id)}
                onToggle={() => toggleProjectType(pt.id)}
                iconBg={CATEGORY_STYLES.roofing.iconBg}
                iconColor={CATEGORY_STYLES.roofing.iconColor}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Exterior ── */}
      <div>
        <CategoryLabel label="Exterior" dotColor={CATEGORY_STYLES.exterior.dotColor} />
        <div className="grid grid-cols-2 gap-3">
          {exteriorTypes.map(pt => (
            <TypeCard
              key={pt.id}
              pt={pt}
              selected={projectTypes.includes(pt.id)}
              onToggle={() => toggleProjectType(pt.id)}
              iconBg={CATEGORY_STYLES.exterior.iconBg}
              iconColor={CATEGORY_STYLES.exterior.iconColor}
            />
          ))}
        </div>
      </div>

      {/* ── Interior / Home ── */}
      <div>
        <CategoryLabel label="Interior & Home" dotColor={CATEGORY_STYLES.interior.dotColor} />
        <div className="grid grid-cols-2 gap-3">
          {interiorTypes.map(pt => (
            <TypeCard
              key={pt.id}
              pt={pt}
              selected={projectTypes.includes(pt.id)}
              onToggle={() => toggleProjectType(pt.id)}
              iconBg={CATEGORY_STYLES.interior.iconBg}
              iconColor={CATEGORY_STYLES.interior.iconColor}
            />
          ))}
        </div>
      </div>

      {projectTypes.length > 0 && (
        <div className="flex items-center gap-2 py-2.5 px-4 bg-[#fb8e28]/8 border border-[#fb8e28]/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-[#fb8e28]" />
          <p className="text-sm text-[#fb8e28] font-medium">
            {projectTypes.length} project type{projectTypes.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}
