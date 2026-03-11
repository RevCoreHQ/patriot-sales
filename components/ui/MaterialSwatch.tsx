import { cn } from '@/lib/utils';
import type { MaterialCategory, MaterialTier } from '@/types';

/* ─── Per-category visual identity ───────────────────────────────────────── */
const CATEGORY_STYLE: Record<string, {
  bg: string;
  label: string;
  pattern: string;
}> = {
  pavers: {
    bg: 'linear-gradient(145deg, #1e1608 0%, #130e05 100%)',
    label: 'PAVER',
    // Running-bond brick grid
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40'%3E%3Crect fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' x='1' y='1' width='38' height='18' rx='1'/%3E%3Crect fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' x='41' y='1' width='38' height='18' rx='1'/%3E%3Crect fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' x='-19' y='21' width='38' height='18' rx='1'/%3E%3Crect fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' x='21' y='21' width='38' height='18' rx='1'/%3E%3Crect fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' x='61' y='21' width='18' height='18' rx='1'/%3E%3C/svg%3E")`,
  },
  'natural-stone': {
    bg: 'linear-gradient(145deg, #1b1410 0%, #120e0a 100%)',
    label: 'STONE',
    // Irregular flagstone shapes
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='60'%3E%3Cpolygon fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' points='5,5 45,3 48,30 42,38 8,35'/%3E%3Cpolygon fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' points='50,2 88,5 85,28 52,32'/%3E%3Cpolygon fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' points='3,40 40,40 44,57 2,58'/%3E%3Cpolygon fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1' points='46,35 87,30 88,58 44,58'/%3E%3C/svg%3E")`,
  },
  concrete: {
    bg: 'linear-gradient(145deg, #141418 0%, #0d0d11 100%)',
    label: 'CONCRETE',
    // Fine aggregate dots
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgba(255,255,255,0.05)'/%3E%3Ccircle cx='30' cy='8' r='1' fill='rgba(255,255,255,0.04)'/%3E%3Ccircle cx='50' cy='12' r='1.5' fill='rgba(255,255,255,0.05)'/%3E%3Ccircle cx='18' cy='28' r='1' fill='rgba(255,255,255,0.04)'/%3E%3Ccircle cx='42' cy='25' r='1.5' fill='rgba(255,255,255,0.05)'/%3E%3Ccircle cx='8' cy='45' r='1' fill='rgba(255,255,255,0.04)'/%3E%3Ccircle cx='55' cy='40' r='1' fill='rgba(255,255,255,0.04)'/%3E%3Ccircle cx='28' cy='50' r='1.5' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E")`,
  },
  turf: {
    bg: 'linear-gradient(145deg, #0a1409 0%, #060d06 100%)',
    label: 'TURF',
    // Grass blade verticals
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cline x1='5' y1='40' x2='7' y2='20' stroke='rgba(255,255,255,0.06)' stroke-width='1.5' stroke-linecap='round'/%3E%3Cline x1='12' y1='40' x2='14' y2='15' stroke='rgba(255,255,255,0.05)' stroke-width='1' stroke-linecap='round'/%3E%3Cline x1='20' y1='40' x2='18' y2='22' stroke='rgba(255,255,255,0.06)' stroke-width='1.5' stroke-linecap='round'/%3E%3Cline x1='28' y1='40' x2='30' y2='18' stroke='rgba(255,255,255,0.05)' stroke-width='1' stroke-linecap='round'/%3E%3Cline x1='35' y1='40' x2='33' y2='24' stroke='rgba(255,255,255,0.06)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  },
};

const TIER_ACCENT: Record<MaterialTier, { color: string; label: string }> = {
  good:   { color: 'rgba(163,163,163,0.7)', label: 'GOOD' },
  better: { color: 'rgba(96,165,250,0.7)',  label: 'BETTER' },
  best:   { color: 'rgba(245,158,11,0.85)', label: 'BEST' },
};

interface Props {
  category: MaterialCategory | string;
  tier: MaterialTier;
  name: string;
  className?: string;
}

export function MaterialSwatch({ category, tier, name, className }: Props) {
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.concrete;
  const accent = TIER_ACCENT[tier];

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: style.bg }}
    >
      {/* Pattern overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: style.pattern, backgroundRepeat: 'repeat' }}
      />

      {/* Gradient vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.03) 0%, transparent 60%)',
        }}
      />

      {/* Category watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0.06 }}
      >
        <span
          className="font-black tracking-[0.3em] text-white"
          style={{ fontSize: 'clamp(10px, 3vw, 18px)' }}
        >
          {style.label}
        </span>
      </div>

      {/* Tier pill — bottom right */}
      <div className="absolute bottom-2 right-2">
        <span
          className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm"
          style={{
            color: accent.color,
            background: `${accent.color.replace('0.7', '0.12').replace('0.85', '0.12')}`,
            border: `1px solid ${accent.color.replace('0.7', '0.25').replace('0.85', '0.3')}`,
          }}
        >
          {accent.label}
        </span>
      </div>
    </div>
  );
}
