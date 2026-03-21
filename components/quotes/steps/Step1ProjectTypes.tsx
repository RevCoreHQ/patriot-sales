'use client';

import { useWizardStore } from '@/store/wizard';
import { PROJECT_TYPES } from '@/data/project-types';
import { cn } from '@/lib/utils';
import type { ProjectTypeId } from '@/types';
import {
  Home, Wrench, Construction, Droplets, PenTool, PanelTop,
  Hammer, Bath, ChefHat, Check,
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

interface CategoryConfig {
  dotColor: string;
  iconBg: string;
  iconColor: string;
}

const CATEGORY_STYLES: Record<'roofing' | 'exterior' | 'interior', CategoryConfig> = {
  roofing:  { dotColor: 'bg-accent',    iconBg: 'bg-accent/12',    iconColor: 'text-accent' },
  exterior: { dotColor: 'bg-accent-secondary',    iconBg: 'bg-accent-secondary/12',    iconColor: 'text-accent-secondary' },
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

function CompactCard({
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
        'w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all active:scale-[0.97] cursor-pointer',
        selected
          ? 'border-accent/50 bg-accent/8'
          : 'border-c-border bg-c-card hover:border-c-border-hover hover:bg-c-elevated'
      )}
    >
      <div className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all',
        selected ? 'bg-accent/20' : iconBg
      )}>
        <Icon className={cn('w-5 h-5', selected ? 'text-accent' : iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('text-base font-semibold leading-tight', selected ? 'text-accent' : 'text-c-text')}>
          {pt.label}
        </div>
        <div className="text-sm text-c-text-4">
          From ${pt.basePrice.toLocaleString()} / {pt.unit}
        </div>
      </div>
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all',
        selected ? 'bg-accent' : 'border-2 border-c-border-hover'
      )}>
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}

export function Step1ProjectTypes() {
  const { projectTypes, toggleProjectType } = useWizardStore();

  const roofingTypes = byId(ROOFING_IDS);
  const exteriorTypes = byId(EXTERIOR_IDS);
  const interiorTypes = byId(INTERIOR_IDS);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-c-text">Project Types</h2>
        <p className="text-base text-c-text-3 mt-1">Select all that apply.</p>
      </div>

      {/* Roofing */}
      <div>
        <CategoryLabel label="Roofing" dotColor={CATEGORY_STYLES.roofing.dotColor} />
        <div className="space-y-2">
          {roofingTypes.map(pt => (
            <CompactCard
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

      {/* Exterior */}
      <div>
        <CategoryLabel label="Exterior" dotColor={CATEGORY_STYLES.exterior.dotColor} />
        <div className="space-y-2">
          {exteriorTypes.map(pt => (
            <CompactCard
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

      {/* Interior */}
      <div>
        <CategoryLabel label="Interior & Home" dotColor={CATEGORY_STYLES.interior.dotColor} />
        <div className="space-y-2">
          {interiorTypes.map(pt => (
            <CompactCard
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
        <div className="flex items-center gap-2.5 py-3 px-4 bg-accent/8 border border-accent/20 rounded-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <p className="text-base text-accent font-medium">
            {projectTypes.length} selected
          </p>
        </div>
      )}
    </div>
  );
}
