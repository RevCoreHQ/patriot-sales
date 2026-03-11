'use client';

import { useWizardStore } from '@/store/wizard';
import { PROJECT_TYPES } from '@/data/project-types';
import { cn } from '@/lib/utils';
import type { ProjectTypeId } from '@/types';
import {
  Waves, Grid3X3, Flame, ChefHat, TreePine, Lightbulb,
  Leaf, Layers, Car, Route, LayoutGrid,
} from 'lucide-react';

const TYPE_ICONS: Record<ProjectTypeId, React.ElementType> = {
  'pool-construction': Waves,
  'pool-deck':         Grid3X3,
  'patio':             LayoutGrid,
  'driveway':          Car,
  'walkway':           Route,
  'seating-wall':      Layers,
  'deck-pergola':      TreePine,
  'fire-pit':          Flame,
  'outdoor-kitchen':   ChefHat,
  'outdoor-lighting':  Lightbulb,
  'artificial-grass':  Leaf,
};

const POOL_IDS: ProjectTypeId[] = ['pool-construction', 'pool-deck'];
const HARDSCAPE_IDS: ProjectTypeId[] = ['patio', 'driveway', 'walkway', 'seating-wall', 'deck-pergola'];
const OUTDOOR_IDS: ProjectTypeId[] = ['fire-pit', 'outdoor-kitchen', 'outdoor-lighting', 'artificial-grass'];

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

const CATEGORY_STYLES: Record<'pool' | 'hardscape' | 'outdoor', CategoryConfig> = {
  pool:      { dotColor: 'bg-blue-500',    iconBg: 'bg-blue-500/12',    iconColor: 'text-blue-400' },
  hardscape: { dotColor: 'bg-orange-500',  iconBg: 'bg-orange-500/12',  iconColor: 'text-orange-400' },
  outdoor:   { dotColor: 'bg-emerald-500', iconBg: 'bg-emerald-500/12', iconColor: 'text-emerald-400' },
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
          ? 'border-amber-500/50 bg-amber-500/8 ring-1 ring-amber-500/20'
          : 'border-c-border bg-c-card hover:border-c-border-hover hover:bg-c-elevated'
      )}
    >
      {/* Checkmark */}
      <div className={cn(
        'absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all',
        selected ? 'bg-amber-500' : 'border-2 border-c-border-hover'
      )}>
        {selected && <Checkmark />}
      </div>

      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
        selected ? 'bg-amber-500/20' : iconBg
      )}>
        <Icon className={cn('w-5 h-5', selected ? 'text-amber-400' : iconColor)} />
      </div>

      {/* Text */}
      <div>
        <div className={cn('text-sm font-semibold leading-snug', selected ? 'text-amber-400' : 'text-c-text')}>
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

  const hardscapeTypes = byId(HARDSCAPE_IDS);
  const outdoorTypes = byId(OUTDOOR_IDS);
  const poolDeck = PROJECT_TYPES.find(p => p.id === 'pool-deck')!;

  const poolConstruction = PROJECT_TYPES.find(p => p.id === 'pool-construction')!;
  const poolConstructionSelected = projectTypes.includes('pool-construction');
  const poolDeckSelected = projectTypes.includes('pool-deck');

  return (
    <div className="space-y-8 pb-2">
      <div>
        <h2 className="text-xl font-bold text-c-text">Project Types</h2>
        <p className="text-sm text-c-text-3 mt-1">Select all that apply — you can choose multiple.</p>
      </div>

      {/* ── Pools & Spas ── */}
      <div>
        <CategoryLabel label="Pools & Spas" dotColor={CATEGORY_STYLES.pool.dotColor} />
        <div className="space-y-2.5">

          {/* Pool construction — hero card */}
          <button
            type="button"
            onClick={() => toggleProjectType('pool-construction')}
            className={cn(
              'w-full flex items-center gap-5 p-5 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer',
              poolConstructionSelected
                ? 'border-amber-500/60 bg-amber-500/8 ring-1 ring-amber-500/25'
                : 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/35 hover:bg-blue-500/8'
            )}
          >
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all',
              poolConstructionSelected ? 'bg-amber-500/20' : 'bg-blue-500/15'
            )}>
              {(() => { const Icon = TYPE_ICONS['pool-construction']; return <Icon className={cn('w-7 h-7', poolConstructionSelected ? 'text-amber-400' : 'text-blue-400')} />; })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-base font-bold', poolConstructionSelected ? 'text-amber-400' : 'text-c-text')}>
                  {poolConstruction.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  Signature Service
                </span>
              </div>
              <p className="text-xs text-c-text-3 mt-1.5 leading-relaxed">{poolConstruction.description}</p>
              <div className="text-xs text-c-text-4 mt-1.5">
                From ${poolConstruction.basePrice.toLocaleString()} / {poolConstruction.unit}
              </div>
            </div>
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ml-2',
              poolConstructionSelected ? 'bg-amber-500' : 'border-2 border-c-border-hover'
            )}>
              {poolConstructionSelected && <Checkmark />}
            </div>
          </button>

          {/* Pool deck — compact row */}
          <button
            type="button"
            onClick={() => toggleProjectType('pool-deck')}
            className={cn(
              'w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer',
              poolDeckSelected
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-c-border bg-c-card hover:border-c-border-hover hover:bg-c-elevated'
            )}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all', poolDeckSelected ? 'bg-amber-500/20' : CATEGORY_STYLES.pool.iconBg)}>
              {(() => { const Icon = TYPE_ICONS['pool-deck']; return <Icon className={cn('w-5 h-5', poolDeckSelected ? 'text-amber-400' : CATEGORY_STYLES.pool.iconColor)} />; })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn('text-sm font-semibold', poolDeckSelected ? 'text-amber-400' : 'text-c-text')}>{poolDeck.label}</div>
              <div className="text-xs text-c-text-4 mt-0.5">From ${poolDeck.basePrice.toLocaleString()} / {poolDeck.unit}</div>
            </div>
            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all', poolDeckSelected ? 'bg-amber-500' : 'border-2 border-c-border-hover')}>
              {poolDeckSelected && <Checkmark />}
            </div>
          </button>
        </div>
      </div>

      {/* ── Hardscaping ── */}
      <div>
        <CategoryLabel label="Hardscaping" dotColor={CATEGORY_STYLES.hardscape.dotColor} />
        <div className="grid grid-cols-2 gap-3">
          {hardscapeTypes.map(pt => (
            <TypeCard
              key={pt.id}
              pt={pt}
              selected={projectTypes.includes(pt.id)}
              onToggle={() => toggleProjectType(pt.id)}
              iconBg={CATEGORY_STYLES.hardscape.iconBg}
              iconColor={CATEGORY_STYLES.hardscape.iconColor}
            />
          ))}
        </div>
      </div>

      {/* ── Outdoor Living ── */}
      <div>
        <CategoryLabel label="Outdoor Living" dotColor={CATEGORY_STYLES.outdoor.dotColor} />
        <div className="grid grid-cols-2 gap-3">
          {outdoorTypes.map(pt => (
            <TypeCard
              key={pt.id}
              pt={pt}
              selected={projectTypes.includes(pt.id)}
              onToggle={() => toggleProjectType(pt.id)}
              iconBg={CATEGORY_STYLES.outdoor.iconBg}
              iconColor={CATEGORY_STYLES.outdoor.iconColor}
            />
          ))}
        </div>
      </div>

      {projectTypes.length > 0 && (
        <div className="flex items-center gap-2 py-2.5 px-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <p className="text-sm text-amber-400 font-medium">
            {projectTypes.length} project type{projectTypes.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}
