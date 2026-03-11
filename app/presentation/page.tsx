'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuotesStore } from '@/store/quotes';
import { useSettingsStore } from '@/store/settings';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateFinancing } from '@/lib/financing';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Shield,
  Phone,
  CheckCircle2,
  ClipboardList,
  HardHat,
  Sparkles,
  BadgeCheck,
  Users,
  Clock,
  Award,
  Layers,
  Maximize2,
  Minimize2,
  Wrench,
  ThumbsUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGO_URL = 'https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/699191dd24813c44b3afb6e9.webp';

/* ─── Slide definitions ────────────────────────────────────────────────────── */
const ALL_SLIDES = [
  'welcome',
  'about',
  'why-us',
  'portfolio',
  'journey',
  'phase-1',
  'phase-2',
  'phase-3',
  'phase-4',
  'phase-5',
  'phase-6',
  'investment',
  'financing',
  'nextsteps',
] as const;
type SlideId = typeof ALL_SLIDES[number];

const QUOTE_SLIDES: SlideId[] = ['investment', 'financing'];

/* ─── Phase data — mirrors the real RNR process ─────────────────────────────── */
const PHASES = [
  {
    id: 'phase-1',
    number: '01',
    label: 'Free Design Consultation',
    icon: ClipboardList,
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    accent: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=85',
    description: 'We come to you — no charge, no obligation. Our outdoor living specialist visits your property, takes measurements, reviews drainage and site conditions, and listens to exactly what you\'re envisioning. We\'ll show you Belgard material samples, review our portfolio, and walk you through what\'s possible for your budget.',
    steps: [
      'Free on-site visit & measurements',
      'Belgard material samples & Umbriano visualization',
      'Portfolio review of completed Colorado projects',
      'Detailed written proposal within 48 hours',
    ],
  },
  {
    id: 'phase-2',
    number: '02',
    label: 'Planning & Permitting',
    icon: Shield,
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    accent: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=85',
    description: 'Once you approve the quote, we handle all the paperwork. We pull every required permit, schedule material delivery through our Colorado Paver Supply partnership, confirm utility locates, and lock in your start date — so your project begins on time with zero surprises.',
    steps: [
      'Permit applications pulled & managed',
      'Materials ordered through Colorado Paver Supply',
      'Utility locates scheduled',
      'Start date confirmed & crew assigned',
    ],
  },
  {
    id: 'phase-3',
    number: '03',
    label: 'Site Preparation',
    icon: HardHat,
    color: 'from-orange-500/20 to-orange-500/5',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    accent: '#f97316',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=85',
    description: 'The foundation determines how long your outdoor space lasts. Our crew excavates to the correct depth, removes all existing materials (demo included when quoted), grades the site for positive drainage, and installs a road base that\'s mechanically compacted to spec. No shortcuts — ever.',
    steps: [
      'Excavation & demolition removal',
      'Precision grading for drainage',
      'Road base installation (4"–6" compacted)',
      'Mechanical plate compaction to ICPI spec',
    ],
  },
  {
    id: 'phase-4',
    number: '04',
    label: 'Installation',
    icon: Layers,
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    accent: '#10b981',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85',
    description: 'This is where your vision becomes reality. Our ICPI-certified installers lay your Belgard pavers, natural stone, or concrete with precision — setting edge restraints, screeding bedding sand to exact tolerances, and placing every piece according to your approved design pattern.',
    steps: [
      'Steel edge restraint installation',
      'Bedding sand screeded to 1" uniform depth',
      'Paver / stone placement per design pattern',
      'Precision cuts & border detailing',
    ],
  },
  {
    id: 'phase-5',
    number: '05',
    label: 'Finishing & Sealing',
    icon: Sparkles,
    color: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    accent: '#a855f7',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=85',
    description: 'The finishing phase is what separates a professional installation from a DIY job. We sweep Techniseal polymeric sand deep into every joint, compact the entire surface with a plate vibrator, apply a professional-grade sealer to protect and enhance color — then clean up everything and haul away all debris.',
    steps: [
      'Techniseal polymeric sand joint fill',
      'Full surface plate compaction',
      'Professional paver sealer application',
      'Complete site cleanup & debris hauling',
    ],
  },
  {
    id: 'phase-6',
    number: '06',
    label: 'Final Walkthrough & Warranty',
    icon: BadgeCheck,
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    accent: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85',
    description: 'We don\'t consider a project finished until you sign off. We walk every square foot with you, explain ongoing care and maintenance, and hand over your warranty paperwork. You\'re backed by our 2-year installation guarantee and — on Belgard materials — a full lifetime product warranty.',
    steps: [
      'Full site inspection walkthrough with you',
      'Care & maintenance guide provided',
      '2-year RNR installation guarantee',
      'Belgard lifetime product warranty on applicable materials',
    ],
  },
];

/* ─── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 text-center">
      <div className="text-3xl font-bold text-amber-400 mb-1">{value}</div>
      <div className="text-xs text-white/40 leading-tight">{label}</div>
    </div>
  );
}

/* ─── Tag badge ─────────────────────────────────────────────────────────────── */
function Tag({ label }: { label: string }) {
  return (
    <span className="text-xs bg-white/[0.05] border border-white/[0.1] text-white/50 px-3 py-1.5 rounded-full">
      {label}
    </span>
  );
}

/* ─── Phase slide ────────────────────────────────────────────────────────────── */
function PhaseSlide({ phase }: { phase: typeof PHASES[number] }) {
  return (
    <div className="h-full grid grid-cols-2">
      {/* Left: image */}
      <div className="relative overflow-hidden">
        <img src={phase.image} alt={phase.label} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/20 to-black/75" />
        <div className={`absolute bottom-8 left-8 flex items-center gap-3 bg-black/50 backdrop-blur-md border ${phase.border} rounded-2xl px-5 py-3.5`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${phase.accent}22` }}>
            <phase.icon className={`w-5 h-5 ${phase.text}`} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Phase {phase.number}</div>
            <div className={`text-base font-bold ${phase.text}`}>{phase.label}</div>
          </div>
        </div>
      </div>

      {/* Right: content */}
      <div className="flex flex-col justify-center px-14 py-12 bg-[#0a0a0a]">
        <div className={`text-[11px] font-bold tracking-widest uppercase mb-3 ${phase.text}`}>
          Phase {phase.number} of 06
        </div>
        <h2 className="text-4xl font-bold text-white mb-5 leading-tight">{phase.label}</h2>
        <p className="text-white/50 leading-relaxed mb-9 text-[15px]">{phase.description}</p>
        <div className="space-y-3.5">
          {phase.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${phase.accent}18`, border: `1px solid ${phase.accent}40` }}>
                <span className={`text-[11px] font-bold ${phase.text}`}>{i + 1}</span>
              </div>
              <span className="text-sm text-white/65">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */
function PresentationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { quotes, init } = useQuotesStore();
  const { settings, init: initSettings } = useSettingsStore();
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedTerm, setSelectedTerm] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    initSettings();
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quote = quotes.length > 0 ? quotes.find(q => q.id === id) ?? null : id ? null : null;
  const hasQuote = !!quote;
  const slides: SlideId[] = ALL_SLIDES.filter(s => hasQuote || !QUOTE_SLIDES.includes(s));
  const totalSlides = slides.length;

  const goTo = useCallback((target: number) => {
    if (target < 0 || target >= totalSlides) return;
    setDirection(target > slide ? 1 : -1);
    setSlide(target);
  }, [slide, totalSlides]);

  const next = useCallback(() => goTo(slide + 1), [goTo, slide]);
  const prev = useCallback(() => goTo(slide - 1), [goTo, slide]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Escape') {
        if (isFullscreen) { document.exitFullscreen?.(); }
        else { router.back(); }
      } else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen?.(); }
    else { document.exitFullscreen?.(); }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next(); else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const currentSlide = slides[slide];
  const financingOption = settings.financing[selectedTerm];
  const financing = (quote && financingOption)
    ? calculateFinancing(quote.total, 20, financingOption.apr, financingOption.termMonths)
    : null;
  const progressPct = ((slide + 1) / totalSlides) * 100;

  return (
    <div
      ref={containerRef}
      data-theme="dark"
      className="h-screen w-screen bg-[#060606] flex flex-col overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Progress bar ── */}
      <div className="h-[2px] w-full bg-white/[0.04] shrink-0 relative">
        <motion.div
          className="h-full bg-amber-500"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-8 py-3.5 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Rock N Roll Stoneworks" className="h-9 w-auto object-contain opacity-90" />
          <div className="w-px h-5 bg-white/10" />
          <span className="text-[11px] text-white/20 tracking-widest uppercase font-medium">Stoneworks · Pools &amp; Spas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/20 mr-2 tabular-nums">{slide + 1} / {totalSlides}</span>
          <button onClick={toggleFullscreen}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white/25 active:bg-white/10 active:text-white transition-all">
            {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>
          <button onClick={() => router.back()}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white/25 active:bg-white/10 active:text-white transition-all">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* ── Slide area ── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
          <motion.div
            key={slide}
            initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
            transition={{ duration: 0.42, ease: 'easeInOut' }}
            className="absolute inset-0"
          >

            {/* ── WELCOME ── */}
            {currentSlide === 'welcome' && (
              <div className="h-full flex flex-col items-center justify-center text-center px-12 relative overflow-hidden">
                <div className="absolute inset-0"
                  style={{ backgroundImage: 'url(https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/69aa9a13b003fa04e8de88ee.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18 }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#060606]/70 to-[#060606]" />
                <div className="relative z-10 max-w-2xl">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Rock N Roll Stoneworks · Pools &amp; Spas
                    </div>
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.65 }}
                    className="text-6xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
                    Your Backyard.<br />
                    <span className="text-amber-400">Completely Transformed.</span>
                  </motion.h1>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-lg text-white/40 max-w-lg mx-auto mb-10 leading-relaxed">
                    Premium hardscaping, fiberglass pools, outdoor kitchens & fire features — built by Colorado&apos;s outdoor living specialists. Zero subcontractors. Every time.
                  </motion.p>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.6 }}
                    className="flex items-center justify-center gap-8 text-sm text-white/35 mb-12">
                    {[
                      { icon: Star, label: 'ICPI Certified' },
                      { icon: Shield, label: 'Belgard Authorized' },
                      { icon: CheckCircle2, label: '2-Year Guarantee' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-amber-500" />
                        {label}
                      </div>
                    ))}
                  </motion.div>
                  {quote && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.5 }}
                      className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5">
                      <span className="text-sm text-white/30">Prepared for</span>
                      <span className="text-sm text-white/70 font-semibold">{quote.client.name}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* ── ABOUT ── */}
            {currentSlide === 'about' && (
              <div className="h-full grid grid-cols-2">
                <div className="relative overflow-hidden">
                  <img src="https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/69aa9a13b003fa9b0bde88ef.jpg" alt="RNR Project" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-black/20 to-black/75" />
                  <div className="absolute inset-0 flex items-end p-10">
                    <blockquote className="text-xl font-medium text-white/80 italic leading-relaxed max-w-xs">
                      &ldquo;We&apos;re not just contractors — we&apos;re the neighbors who built your dream backyard.&rdquo;
                    </blockquote>
                  </div>
                </div>
                <div className="flex flex-col justify-center px-14 py-12 bg-[#0a0a0a]">
                  <div className="text-amber-500 text-[11px] font-bold tracking-widest uppercase mb-3">Who We Are</div>
                  <h2 className="text-4xl font-bold text-white mb-5 leading-tight">
                    Lafayette, Colorado&apos;s<br />Backyard Specialists
                  </h2>
                  <p className="text-white/50 leading-relaxed mb-7 text-[15px]">
                    Rock N Roll Stoneworks &amp; Rock N Roll Pools &amp; Spas are sister companies serving the Denver/Boulder metro — specializing in premium paver hardscaping, custom fiberglass pools, outdoor kitchens, fire features, artificial turf, and pergolas. Everything is handled in-house by our own certified crew. No subcontractors, ever.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-7">
                    <StatCard value="500+" label="Projects Completed" />
                    <StatCard value="15+" label="Years Experience" />
                    <StatCard value="4.9★" label="Google Rating" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['ICPI Certified', 'Belgard Authorized', 'Zero Subcontractors', 'Locally Owned', 'Lyon Financial Partner', 'Free Estimates'].map(tag => (
                      <Tag key={tag} label={tag} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── WHY US ── */}
            {currentSlide === 'why-us' && (
              <div className="h-full flex flex-col items-center justify-center px-16 relative overflow-hidden">
                <div className="absolute inset-0"
                  style={{ backgroundImage: 'url(https://assets.cdn.filesafe.space/NYlSya2nYSkSnnXEbY2l/media/69ac9a94b2a274d908f9b89a.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
                <div className="absolute inset-0 bg-gradient-to-b from-[#060606]/60 via-[#060606]/75 to-[#060606]" />
                <div className="relative z-10 w-full max-w-4xl mt-6">
                  <div className="text-amber-500 text-[11px] font-bold tracking-widest uppercase mb-3">The RNR Difference</div>
                  <h2 className="text-4xl font-bold text-white mb-10">Why Colorado Homeowners Choose Us</h2>
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      {
                        icon: Award,
                        title: 'ICPI Certified · Belgard Authorized',
                        desc: 'We hold the highest certifications in the hardscape industry. As a Belgard Authorized Contractor, every installation qualifies for Belgard\'s lifetime product warranty — on top of our own 2-year workmanship guarantee.',
                        color: 'text-amber-400',
                        bg: 'rgba(245,158,11,0.1)',
                      },
                      {
                        icon: Wrench,
                        title: 'Zero Subcontractors. Ever.',
                        desc: 'Our own certified crew handles every phase — excavation, plumbing, electrical, installation, and finishing. No handoffs, no miscommunication, no strangers on your property. Just our team, start to finish.',
                        color: 'text-blue-400',
                        bg: 'rgba(59,130,246,0.1)',
                      },
                      {
                        icon: Clock,
                        title: 'On Time. Every Time.',
                        desc: 'We schedule realistically and communicate proactively. You\'ll know your start date, milestones, and finish date before we break ground — and we deliver on what we promise.',
                        color: 'text-emerald-400',
                        bg: 'rgba(16,185,129,0.1)',
                      },
                      {
                        icon: Users,
                        title: 'Local. Rooted. Invested.',
                        desc: 'Based in Lafayette, CO — we live and work in the same neighborhoods we build for. Our reputation in this community is everything. Every project we build is a permanent reflection of our name.',
                        color: 'text-purple-400',
                        bg: 'rgba(168,85,247,0.1)',
                      },
                    ].map(({ icon: Icon, title, desc, color, bg }) => (
                      <div key={title} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <div className="text-[15px] font-semibold text-white mb-2">{title}</div>
                          <div className="text-sm text-white/45 leading-relaxed">{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PORTFOLIO ── */}
            {currentSlide === 'portfolio' && (
              <div className="h-full flex flex-col px-12 py-8">
                <div className="text-amber-500 text-[11px] font-bold tracking-widest uppercase mb-2">Our Work</div>
                <h2 className="text-3xl font-bold text-white mb-5">Recent Colorado Projects</h2>
                <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 min-h-0">
                  {/* Real RNR photos */}
                  {[
                    { src: 'https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/69aa9a13b003fa04e8de88ee.jpg', label: 'Colorado', sub: 'Belgard Paver Patio & Outdoor Living' },
                    { src: 'https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/69aa9a13b003fa9b0bde88ef.jpg', label: 'Colorado', sub: 'Custom Hardscape & Fire Feature' },
                    { src: 'https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/69aa9a1336702f66070d71c3.jpg', label: 'Colorado', sub: 'Backyard Transformation' },
                  ].map(({ src, label, sub }) => (
                    <div key={src} className="rounded-2xl overflow-hidden relative">
                      <img src={src} alt={label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-sm font-semibold text-white">{label}</div>
                        <div className="text-xs text-white/50">{sub}</div>
                      </div>
                    </div>
                  ))}
                  {/* Placeholder cards for upcoming portfolio photos */}
                  {[
                    { label: 'Lafayette', sub: 'Custom Outdoor Fireplace', icon: '🔥', color: 'from-orange-500/15 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400' },
                    { label: 'Broomfield', sub: 'Fiberglass Pool & Travertine Deck', icon: '🏊', color: 'from-blue-500/15 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400' },
                    { label: 'Westminster', sub: 'Aluminum Louvered Pergola', icon: '🏡', color: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                  ].map(({ label, sub, icon, color, border, text }) => (
                    <div key={label} className={`rounded-2xl overflow-hidden relative bg-gradient-to-br ${color} border ${border} flex flex-col items-center justify-center gap-3`}>
                      <div className="text-4xl opacity-40">{icon}</div>
                      <div className="text-center px-4">
                        <div className={`text-xs font-bold uppercase tracking-widest ${text} mb-1`}>{label}</div>
                        <div className="text-xs text-white/30 leading-tight">{sub}</div>
                        <div className="text-[10px] text-white/15 mt-2 italic">Photo coming soon</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── JOURNEY OVERVIEW ── */}
            {currentSlide === 'journey' && (
              <div className="h-full flex flex-col items-center justify-center px-16"
                style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(245,158,11,0.05) 0%, transparent 60%)' }}>
                <div className="w-full max-w-5xl">
                  <div className="text-amber-500 text-[11px] font-bold tracking-widest uppercase mb-3">Your Backyard Transformation</div>
                  <h2 className="text-4xl font-bold text-white mb-3">From First Call to Final Walkthrough</h2>
                  <p className="text-white/35 mb-10 text-[15px]">A process we&apos;ve refined across 500+ Colorado projects — always with our own crew, never subcontracted.</p>
                  <div className="grid grid-cols-3 gap-4">
                    {PHASES.map((phase, i) => (
                      <motion.div
                        key={phase.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.4 }}
                        className={`bg-gradient-to-br ${phase.color} border ${phase.border} rounded-2xl p-5`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
                            <phase.icon className={`w-4 h-4 ${phase.text}`} />
                          </div>
                          <span className={`text-[10px] font-bold ${phase.text} uppercase tracking-wider`}>Phase {phase.number}</span>
                        </div>
                        <div className="text-sm font-semibold text-white mb-1.5">{phase.label}</div>
                        <div className="text-xs text-white/40 leading-relaxed">{phase.steps[0]}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── INDIVIDUAL PHASE SLIDES ── */}
            {PHASES.map(phase => currentSlide === phase.id && (
              <PhaseSlide key={phase.id} phase={phase} />
            ))}

            {/* ── INVESTMENT ── */}
            {currentSlide === 'investment' && quote && (
              <div className="h-full flex flex-col items-center justify-center px-12"
                style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(245,158,11,0.07) 0%, transparent 65%)' }}>
                <div className="w-full max-w-3xl">
                  <div className="text-amber-500 text-[11px] font-bold tracking-widest uppercase mb-2">Your Investment</div>
                  <h2 className="text-4xl font-bold text-white mb-8">Project Summary for {quote?.client.name}</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                        <div className="text-[10px] text-white/35 uppercase tracking-widest mb-4 font-semibold">Scope of Work</div>
                        {quote.projectTypes.map(pt => (
                          <div key={pt} className="flex items-center gap-2.5 text-sm text-white/75 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="capitalize">{pt.replace(/-/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                        <div className="text-[10px] text-white/35 uppercase tracking-widest mb-4 font-semibold">Site Details</div>
                        <div className="space-y-2 text-sm text-white/55">
                          <div>{quote.siteConditions.squareFootage?.toLocaleString()} total sq ft</div>
                          <div className="capitalize">{quote.siteConditions.shape?.replace(/-/g, ' ')} layout</div>
                          <div className="capitalize">{quote.siteConditions.slope} slope · {quote.siteConditions.access} access</div>
                          {quote.siteConditions.demo && <div className="text-amber-400/70">Includes demolition</div>}
                        </div>
                      </div>
                      {/* Warranty badge */}
                      <div className="bg-amber-500/8 border border-amber-500/25 rounded-2xl p-4 flex items-center gap-3">
                        <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-amber-400">2-Year Install Guarantee</div>
                          <div className="text-[11px] text-white/35 mt-0.5">+ Belgard lifetime product warranty</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-7 flex flex-col justify-between">
                      <div className="space-y-3">
                        {quote.discountPercent > 0 && (
                          <>
                            <div className="flex justify-between text-sm text-white/45"><span>Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
                            <div className="flex justify-between text-sm text-emerald-400"><span>Discount ({quote.discountPercent}%)</span><span>−{formatCurrency(quote.discountAmount)}</span></div>
                          </>
                        )}
                        <div className="flex justify-between text-sm text-white/45"><span>Sales Tax ({quote.taxRate}%)</span><span>{formatCurrency(quote.taxAmount)}</span></div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/[0.08]">
                        <div className="text-xs text-white/35 uppercase tracking-widest mb-3">Total Investment</div>
                        <div className="text-6xl font-bold text-amber-400 leading-none mb-3">{formatCurrency(quote.total)}</div>
                        <div className="text-xs text-white/20">Quote valid until {formatDate(quote.validUntil)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── FINANCING ── */}
            {currentSlide === 'financing' && quote && (
              <div className="h-full flex flex-col items-center justify-center px-12">
                <div className="w-full max-w-2xl">
                  <div className="text-amber-500 text-[11px] font-bold tracking-widest uppercase mb-2">Flexible Options</div>
                  <h2 className="text-4xl font-bold text-white mb-2">Financing Through Lyon Financial</h2>
                  <p className="text-white/40 mb-2 text-[15px]">
                    We partner with Lyon Financial — the nation&apos;s leading outdoor living lender. Fast approvals, competitive rates, no home equity required.
                  </p>
                  <div className="flex items-center gap-3 mb-7">
                    {['24–48 hr approval', 'No home collateral', 'Up to 20 years', 'All credit types'].map(t => (
                      <span key={t} className="text-[11px] bg-white/[0.05] border border-white/[0.08] text-white/40 px-3 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-6 p-1 bg-white/[0.04] border border-white/[0.07] rounded-2xl">
                    {settings.financing.map((opt, i) => (
                      <button key={opt.id} onClick={() => setSelectedTerm(i)}
                        className={cn('flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer',
                          selectedTerm === i ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25' : 'text-white/35 active:bg-white/5'
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {financing && (
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                      <div className="grid grid-cols-3 gap-8 text-center mb-6">
                        <div>
                          <div className="text-5xl font-bold text-amber-400 mb-2">{formatCurrency(financing.monthlyPayment)}</div>
                          <div className="text-xs text-white/35 uppercase tracking-wider">per month</div>
                        </div>
                        <div>
                          <div className="text-5xl font-bold text-white mb-2">{financingOption.termMonths}</div>
                          <div className="text-xs text-white/35 uppercase tracking-wider">months</div>
                        </div>
                        <div>
                          <div className="text-5xl font-bold text-white mb-2">{financingOption.apr}%</div>
                          <div className="text-xs text-white/35 uppercase tracking-wider">APR</div>
                        </div>
                      </div>
                      <div className="pt-5 border-t border-white/[0.06] flex justify-between text-sm text-white/30">
                        <span>20% down: {formatCurrency(financing.downPayment)}</span>
                        <span>Financed: {formatCurrency(financing.financed)}</span>
                        <span>Total cost: {formatCurrency(financing.totalCost)}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-white/15 mt-3 text-center">Financing subject to credit approval. Terms shown for illustration purposes only.</p>
                </div>
              </div>
            )}

            {/* ── NEXT STEPS / CTA ── */}
            {currentSlide === 'nextsteps' && (
              <div className="h-full flex flex-col items-center justify-center text-center px-12 relative overflow-hidden">
                <div className="absolute inset-0"
                  style={{ backgroundImage: 'url(https://assets.cdn.filesafe.space/9Er0a3QxE3UXUVoCQNyS/media/69aa9a1336702f66070d71c3.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
                <div className="absolute inset-0 bg-gradient-to-b from-[#060606]/60 via-[#060606]/85 to-[#060606]" />
                <div className="relative z-10 w-full max-w-3xl">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Ready to Transform Your Backyard?
                    </div>
                  </motion.div>
                  <motion.h2 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-5xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
                    Let&apos;s Build Something<br />
                    <span className="text-amber-400">You&apos;ll Love for Decades</span>
                  </motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-white/40 max-w-lg mx-auto mb-10 text-[15px] leading-relaxed">
                    Accepting this quote kicks off a process refined across 500+ Colorado projects. Our crew handles everything — you just enjoy the result.
                  </motion.p>
                  <div className="grid grid-cols-3 gap-4 mb-10 text-left">
                    {[
                      { step: '01', label: 'Accept & Deposit', desc: 'Sign the quote and submit a 30% deposit to lock in your project on our schedule' },
                      { step: '02', label: 'We Handle Everything', desc: 'Permits, materials, scheduling — managed by our team. Zero subcontractors, full accountability.' },
                      { step: '03', label: 'Enjoy Your Space', desc: 'Final walkthrough, 2-year guarantee, Belgard warranty docs, and your transformed backyard.' },
                    ].map((s, i) => (
                      <motion.div key={s.step}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1, duration: 0.45 }}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                        <div className="text-3xl font-bold text-amber-500/25 mb-3">{s.step}</div>
                        <div className="text-sm font-semibold text-white mb-1.5">{s.label}</div>
                        <div className="text-xs text-white/35 leading-relaxed">{s.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
                    className="flex items-center justify-center gap-5 text-sm text-white/35">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-amber-500/70" />
                      {settings.company.phone}
                    </div>
                    <span className="text-white/10">|</span>
                    <span>{settings.company.email}</span>
                    <span className="text-white/10">|</span>
                    <span>rnrstoneworks.com · rocknrollpoolsspas.com</span>
                  </motion.div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="flex items-center justify-center gap-5 py-4 shrink-0">
        <button onClick={prev} disabled={slide === 0}
          className="w-11 h-11 rounded-full border border-white/[0.1] flex items-center justify-center text-white/30 disabled:opacity-20 disabled:cursor-not-allowed active:bg-white/10 active:text-white active:scale-95 transition-all cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="p-1.5 cursor-pointer"
            >
              <div className={cn('rounded-full transition-all',
                i === slide ? 'w-5 h-2 bg-amber-500' : 'w-2 h-2 bg-white/[0.12]'
              )} />
            </button>
          ))}
        </div>
        <button onClick={next} disabled={slide === totalSlides - 1}
          className="w-11 h-11 rounded-full border border-white/[0.1] flex items-center justify-center text-white/30 disabled:opacity-20 disabled:cursor-not-allowed active:bg-white/10 active:text-white active:scale-95 transition-all cursor-pointer">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function PresentationPage() {
  return (
    <Suspense fallback={
      <div data-theme="dark" className="h-screen bg-[#060606] flex items-center justify-center text-neutral-500">Loading…</div>
    }>
      <PresentationContent />
    </Suspense>
  );
}
