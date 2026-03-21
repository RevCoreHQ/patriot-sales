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

const LOGO_URL = 'https://assets.cdn.filesafe.space/UrIbmSbNwH6Sfvb4CBZw/media/69be15640d1cfcbcd90ec244.png';

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

/* ─── Phase data — mirrors the Patriot Roofing process ───────────────────────── */
const PHASES = [
  {
    id: 'phase-1',
    number: '01',
    label: 'Free Roof Inspection',
    icon: ClipboardList,
    color: 'from-[#C62828]/20 to-[#C62828]/5',
    border: 'border-[#C62828]/30',
    text: 'text-[#C62828]',
    accent: '#C62828',
    image: 'https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?w=1200&q=85',
    description: 'We come to you — no charge, no obligation. Our inspector visits your property, examines shingles, flashing, and gutters, checks for storm damage, and takes detailed measurements and photos. We\'ll walk you through our findings, recommend materials, and provide a written estimate.',
    steps: [
      'Roof inspection & damage assessment',
      'Detailed measurements & photos',
      'Material recommendations',
      'Written estimate — no obligation',
    ],
  },
  {
    id: 'phase-2',
    number: '02',
    label: 'Planning & Permits',
    icon: Shield,
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    accent: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85',
    description: 'Once you approve the quote, we handle all the paperwork. We schedule your start date, pull all required permits, order materials from our trusted suppliers, and confirm everything — so your project begins on time with zero surprises.',
    steps: [
      'Permits pulled & scheduled',
      'Materials ordered from top suppliers',
      'Utility locates & prep',
      'Start date confirmed',
    ],
  },
  {
    id: 'phase-3',
    number: '03',
    label: 'Preparation & Tear-Off',
    icon: HardHat,
    color: 'from-orange-500/20 to-orange-500/5',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    accent: '#f97316',
    image: 'https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?w=1200&q=85',
    description: 'Proper preparation is what separates a quality roof from a short-lived one. Our crew protects your landscaping, sets up a dumpster, tears off old shingles and underlayment, and inspects the decking for any hidden damage. No shortcuts — ever.',
    steps: [
      'Property protection setup',
      'Old roofing tear-off & disposal',
      'Deck inspection for damage',
      'Repair any damaged decking',
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
    image: 'https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?w=1200&q=85',
    description: 'This is where your new roof takes shape. Our experienced crew installs ice and water shield, synthetic underlayment, drip edge, new shingles or metal panels, ridge cap, and all flashings — every component placed with precision.',
    steps: [
      'Underlayment & ice/water shield',
      'Shingle/panel installation',
      'Ridge cap & flashing',
      'Ventilation installation',
    ],
  },
  {
    id: 'phase-5',
    number: '05',
    label: 'Finishing Touches',
    icon: Sparkles,
    color: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    accent: '#a855f7',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85',
    description: 'The finishing phase is what separates a professional installation from an average job. We install pipe boots, seal chimney flashing, inspect and repair gutters, perform a thorough debris cleanup, and run a magnet sweep across your entire property.',
    steps: [
      'Pipe boots & chimney flashing',
      'Gutter inspection & repair',
      'Debris cleanup & magnet sweep',
      'Final roof inspection',
    ],
  },
  {
    id: 'phase-6',
    number: '06',
    label: 'Final Walkthrough',
    icon: BadgeCheck,
    color: 'from-[#C62828]/20 to-[#C62828]/5',
    border: 'border-[#C62828]/30',
    text: 'text-[#C62828]',
    accent: '#C62828',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85',
    description: 'We don\'t consider a project finished until you sign off. We walk the entire property with you, explain ongoing maintenance, and hand over all warranty documentation. You\'re backed by our workmanship guarantee and full manufacturer warranty registration.',
    steps: [
      'Complete walkthrough with homeowner',
      'Maintenance recommendations',
      'Manufacturer warranty registration',
      'Workmanship guarantee documentation',
    ],
  },
];

/* ─── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 text-center">
      <div className="text-3xl font-bold text-[#C62828] mb-1">{value}</div>
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
          className="h-full bg-[#C62828]"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-8 py-3.5 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {LOGO_URL && <img src={LOGO_URL} alt="Patriot Roofing & Home Repairs" className="h-9 w-auto object-contain opacity-90" />}
          {LOGO_URL && <div className="w-px h-5 bg-white/10" />}
          <span className="text-[11px] text-white/20 tracking-widest uppercase font-medium">Roofing &amp; Home Repairs</span>
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
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?w=1200&q=85)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18 }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#060606]/70 to-[#060606]" />
                <div className="relative z-10 max-w-2xl">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
                    <div className="inline-flex items-center gap-2 bg-[#C62828]/10 border border-[#C62828]/25 text-[#C62828] text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C62828]" />
                      Patriot Roofing &amp; Home Repairs
                    </div>
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.65 }}
                    className="text-6xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
                    Your Home.<br />
                    <span className="text-[#C62828]">Protected &amp; Beautiful.</span>
                  </motion.h1>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-lg text-white/40 max-w-lg mx-auto mb-10 leading-relaxed">
                    Quality roofing installation, repair &amp; replacement, plus home renovations — built by the Piedmont Triad&apos;s trusted roofing professionals. In-house crews. Every time.
                  </motion.p>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.6 }}
                    className="flex items-center justify-center gap-8 text-sm text-white/35 mb-12">
                    {[
                      { icon: Star, label: 'GAF Certified' },
                      { icon: Shield, label: 'Licensed & Insured' },
                      { icon: CheckCircle2, label: 'Workmanship Guarantee' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#C62828]" />
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
                  <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85" alt="Patriot Roofing Project" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-black/20 to-black/75" />
                  <div className="absolute inset-0 flex items-end p-10">
                    <blockquote className="text-xl font-medium text-white/80 italic leading-relaxed max-w-xs">
                      &ldquo;We&apos;re not just contractors — we&apos;re the neighbors who protect your home.&rdquo;
                    </blockquote>
                  </div>
                </div>
                <div className="flex flex-col justify-center px-14 py-12 bg-[#0a0a0a]">
                  <div className="text-[#C62828] text-[11px] font-bold tracking-widest uppercase mb-3">Who We Are</div>
                  <h2 className="text-4xl font-bold text-white mb-5 leading-tight">
                    Lexington, NC&apos;s<br />Roofing Specialists
                  </h2>
                  <p className="text-white/50 leading-relaxed mb-7 text-[15px]">
                    Patriot Roofing &amp; Home Repairs serves Lexington and the Piedmont Triad — specializing in roofing installation, repair, replacement, and home renovations including bathroom &amp; kitchen remodels. Everything is handled in-house by our own experienced crew. No subcontractors, ever.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-7">
                    <StatCard value="500+" label="Projects Completed" />
                    <StatCard value="15+" label="Years Experience" />
                    <StatCard value="4.9★" label="Google Rating" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['GAF Certified', 'Licensed & Insured', 'In-House Crews', 'Locally Owned', 'Free Estimates'].map(tag => (
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
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?w=1200&q=85)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
                <div className="absolute inset-0 bg-gradient-to-b from-[#060606]/60 via-[#060606]/75 to-[#060606]" />
                <div className="relative z-10 w-full max-w-4xl mt-6">
                  <div className="text-[#C62828] text-[11px] font-bold tracking-widest uppercase mb-3">The Patriot Difference</div>
                  <h2 className="text-4xl font-bold text-white mb-10">Why Piedmont Triad Homeowners Choose Us</h2>
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      {
                        icon: Award,
                        title: 'Safety First',
                        desc: 'Roofing is serious work. Our crews follow strict safety protocols on every job — proper fall protection, equipment inspection, and worksite management. Your family and property are always protected during our work.',
                        color: 'text-[#C62828]',
                        bg: 'rgba(198,40,40,0.1)',
                      },
                      {
                        icon: Wrench,
                        title: 'Attention to Detail',
                        desc: 'From precise flashing installation to clean shingle lines, we sweat the details that keep water out for decades. Every component is installed to manufacturer specifications — no shortcuts, no cutting corners.',
                        color: 'text-blue-400',
                        bg: 'rgba(59,130,246,0.1)',
                      },
                      {
                        icon: Clock,
                        title: 'Experienced Pros',
                        desc: 'Our in-house crew has the training and experience to handle any roofing challenge — from simple repairs to full tear-off replacements. GAF certified and ready for every project.',
                        color: 'text-emerald-400',
                        bg: 'rgba(16,185,129,0.1)',
                      },
                      {
                        icon: Users,
                        title: 'Transparent Pricing',
                        desc: 'Based in Lexington, NC — we provide clear, honest pricing with no hidden fees. You\'ll know exactly what you\'re paying for before we start. Our reputation in this community is everything.',
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
                <div className="text-[#C62828] text-[11px] font-bold tracking-widest uppercase mb-2">Our Work</div>
                <h2 className="text-3xl font-bold text-white mb-5">Recent Piedmont Triad Projects</h2>
                <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 min-h-0">
                  {/* Project photos */}
                  {[
                    { src: 'https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?w=1200&q=85', label: 'Lexington', sub: 'Full Roof Replacement' },
                    { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85', label: 'Greensboro', sub: 'Storm Damage Repair & New Shingles' },
                    { src: 'https://images.unsplash.com/photo-1632823471565-1ecdf5c6da20?w=1200&q=85', label: 'Winston-Salem', sub: 'Roof & Gutter Installation' },
                  ].map(({ src, label, sub }) => (
                    <div key={src + label} className="rounded-2xl overflow-hidden relative">
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
                    { label: 'High Point', sub: 'Roof Repair & Flashing', icon: HardHat, color: 'from-orange-500/15 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400' },
                    { label: 'Salisbury', sub: 'Siding & Gutter Replacement', icon: Layers, color: 'from-blue-500/15 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400' },
                    { label: 'Thomasville', sub: 'Kitchen & Bathroom Renovation', icon: Wrench, color: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                  ].map(({ label, sub, icon: Icon, color, border, text }) => (
                    <div key={label} className={`rounded-2xl overflow-hidden relative bg-gradient-to-br ${color} border ${border} flex flex-col items-center justify-center gap-3`}>
                      <Icon className={`w-10 h-10 ${text} opacity-40`} />
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
                style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(198,40,40,0.05) 0%, transparent 60%)' }}>
                <div className="w-full max-w-5xl">
                  <div className="text-[#C62828] text-[11px] font-bold tracking-widest uppercase mb-3">Your Roofing Project</div>
                  <h2 className="text-4xl font-bold text-white mb-3">From First Call to Final Walkthrough</h2>
                  <p className="text-white/35 mb-10 text-[15px]">A process we&apos;ve refined across 500+ Piedmont Triad projects — always with our own crew, never subcontracted.</p>
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
                style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(198,40,40,0.07) 0%, transparent 65%)' }}>
                <div className="w-full max-w-3xl">
                  <div className="text-[#C62828] text-[11px] font-bold tracking-widest uppercase mb-2">Your Investment</div>
                  <h2 className="text-4xl font-bold text-white mb-8">Project Summary for {quote?.client.name}</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                        <div className="text-[10px] text-white/35 uppercase tracking-widest mb-4 font-semibold">Scope of Work</div>
                        {quote.projectTypes.map(pt => (
                          <div key={pt} className="flex items-center gap-2.5 text-sm text-white/75 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C62828] shrink-0" />
                            <span className="capitalize">{pt.replace(/-/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                        <div className="text-[10px] text-white/35 uppercase tracking-widest mb-4 font-semibold">Site Details</div>
                        <div className="space-y-2 text-sm text-white/55">
                          <div>{quote.siteConditions.roofArea?.toLocaleString()} total sq ft</div>
                          <div className="capitalize">{quote.siteConditions.pitch} pitch · {quote.siteConditions.stories} {quote.siteConditions.stories === 1 ? 'story' : 'stories'}</div>
                          <div className="capitalize">{quote.siteConditions.access} access</div>
                          {quote.siteConditions.tearOff && <div className="text-[#C62828]/70">Includes tear-off{quote.siteConditions.layers && quote.siteConditions.layers > 1 ? ` (${quote.siteConditions.layers} layers)` : ''}</div>}
                        </div>
                      </div>
                      {/* Warranty badge */}
                      <div className="bg-[#C62828]/8 border border-[#C62828]/25 rounded-2xl p-4 flex items-center gap-3">
                        <BadgeCheck className="w-5 h-5 text-[#C62828] shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-[#C62828]">Workmanship Guarantee</div>
                          <div className="text-[11px] text-white/35 mt-0.5">+ Manufacturer warranty on all materials</div>
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
                        <div className="text-6xl font-bold text-[#C62828] leading-none mb-3">{formatCurrency(quote.total)}</div>
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
                  <div className="text-[#C62828] text-[11px] font-bold tracking-widest uppercase mb-2">Flexible Options</div>
                  <h2 className="text-4xl font-bold text-white mb-2">Financing Available</h2>
                  <p className="text-white/40 mb-2 text-[15px]">
                    We offer flexible financing options to fit your budget. Fast approvals, competitive rates, and easy monthly payments for your roofing project.
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
                          selectedTerm === i ? 'bg-[#C62828] text-black shadow-lg shadow-[#C62828]/25' : 'text-white/35 active:bg-white/5'
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {financing && (
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                      <div className="grid grid-cols-3 gap-8 text-center mb-6">
                        <div>
                          <div className="text-5xl font-bold text-[#C62828] mb-2">{formatCurrency(financing.monthlyPayment)}</div>
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
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
                <div className="absolute inset-0 bg-gradient-to-b from-[#060606]/60 via-[#060606]/85 to-[#060606]" />
                <div className="relative z-10 w-full max-w-3xl">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="inline-flex items-center gap-2 bg-[#C62828]/10 border border-[#C62828]/25 text-[#C62828] text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Ready to Protect Your Home?
                    </div>
                  </motion.div>
                  <motion.h2 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-5xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
                    Let&apos;s Protect Your Home<br />
                    <span className="text-[#C62828]">For Years to Come</span>
                  </motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-white/40 max-w-lg mx-auto mb-10 text-[15px] leading-relaxed">
                    Accepting this quote kicks off a process refined across 500+ Piedmont Triad projects. Our crew handles everything — you just enjoy the result.
                  </motion.p>
                  <div className="grid grid-cols-3 gap-4 mb-10 text-left">
                    {[
                      { step: '01', label: 'Accept & Deposit', desc: 'Sign the quote and submit a 30% deposit to lock in your project on our schedule' },
                      { step: '02', label: 'We Handle Everything', desc: 'Permits, materials, scheduling — managed by our team. In-house crews, full accountability.' },
                      { step: '03', label: 'Enjoy Your Home', desc: 'Final walkthrough, workmanship guarantee, warranty registration, and your protected home.' },
                    ].map((s, i) => (
                      <motion.div key={s.step}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1, duration: 0.45 }}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                        <div className="text-3xl font-bold text-[#C62828]/25 mb-3">{s.step}</div>
                        <div className="text-sm font-semibold text-white mb-1.5">{s.label}</div>
                        <div className="text-xs text-white/35 leading-relaxed">{s.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
                    className="flex items-center justify-center gap-5 text-sm text-white/35">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#C62828]/70" />
                      {settings.company.phone}
                    </div>
                    <span className="text-white/10">|</span>
                    <span>{settings.company.email}</span>
                    <span className="text-white/10">|</span>
                    <span>patriotroofingandhomerepair.com</span>
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
                i === slide ? 'w-5 h-2 bg-[#C62828]' : 'w-2 h-2 bg-white/[0.12]'
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
