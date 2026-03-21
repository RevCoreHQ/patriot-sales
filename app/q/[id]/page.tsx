'use client';

import { use, useEffect, useRef, useState } from 'react';
import { getQuote, saveQuote, getSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/data/default-settings';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateFinancing } from '@/lib/financing';
import type { Quote, AppSettings } from '@/types';
import {
  CheckCircle2, Phone, Shield, Star, PenLine,
  RotateCcw, ChevronDown, ChevronUp, Clock,
  CreditCard, MapPin, Layers,
} from 'lucide-react';

const LOGO_URL = 'https://assets.cdn.filesafe.space/UrIbmSbNwH6Sfvb4CBZw/media/69be3176402511cd924021b3.png';

// ─── Inline signature canvas ───────────────────────────────────────────────────
function ClientSignature({ quote, onSigned }: {
  quote: Quote;
  onSigned: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signed, setSigned] = useState(!!quote.signedBy);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0f0f1a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    setHasSignature(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
  };

  const stopDrawing = () => { setIsDrawing(false); lastPos.current = null; };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const dataUrl = canvas.toDataURL('image/png');
    const now = new Date().toISOString();
    const updated: Quote = {
      ...quote,
      signatureData: dataUrl,
      signedAt: now,
      signedBy: quote.client.name,
      status: 'accepted',
      updatedAt: now,
    };
    saveQuote(updated);
    setSigned(true);
    onSigned();
  };

  if (signed) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">Quote Accepted!</div>
          <div className="text-sm text-gray-500 mt-1">
            Thank you, {quote.client.name}. We&apos;ll be in touch shortly to schedule your project.
          </div>
        </div>
        <div className="text-xs text-gray-400">Signed {quote.signedAt ? formatDate(quote.signedAt) : 'just now'}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs text-gray-400 mb-2 font-medium">Draw your signature below</div>
      <div
        className="relative rounded-xl border border-gray-200 bg-white overflow-hidden"
        style={{ touchAction: 'none', height: 240 }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm italic select-none">Sign here…</span>
          </div>
        )}
        <div className="absolute bottom-14 left-6 right-6 border-b border-gray-200" />
        <div className="absolute bottom-6 left-6 text-[10px] text-gray-300 font-medium tracking-widest uppercase select-none">
          Signature
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={clear}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </button>
        <button
          onClick={handleSign}
          disabled={!hasSignature}
          className={`flex items-center gap-2 h-12 px-7 rounded-xl text-sm font-bold transition-all ${
            hasSignature
              ? 'bg-accent hover:bg-accent text-black'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Sign & Accept Quote
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showLineItems, setShowLineItems] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(0);
  const [, setSignedNow] = useState(false);

  useEffect(() => {
    const q = getQuote(id);
    const s = getSettings();
    if (!q) { setNotFound(true); return; }
    setQuote(q);
    setSettings(s ?? DEFAULT_SETTINGS);
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        {LOGO_URL && <img src={LOGO_URL} alt="Patriot Roofing" className="h-16 mb-6 object-contain" />}
        <div className="text-gray-400 text-center">
          <div className="text-lg font-semibold text-gray-700 mb-2">Quote not found</div>
          <div className="text-sm">This link may have expired. Please contact us for a new copy.</div>
          <a href="tel:3364796059" className="mt-4 inline-flex items-center gap-2 text-[#e67a1f] font-medium text-sm">
            <Phone className="w-4 h-4" /> 336-479-6059
          </a>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const effectiveSettings = settings ?? DEFAULT_SETTINGS;
  const financingOption = effectiveSettings.financing[selectedTerm];
  const financing = financingOption
    ? calculateFinancing(quote.total, 20, financingOption.apr, financingOption.termMonths)
    : null;

  const daysLeft = Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / 86400000);
  const isExpired = daysLeft <= 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Company header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          {LOGO_URL ? <img src={LOGO_URL} alt="Patriot Roofing" className="h-12 object-contain" /> : <span className="text-lg font-bold text-gray-900">Patriot Roofing &amp; Home Repairs</span>}
          <a
            href={`tel:${effectiveSettings.company.phone.replace(/\D/g, '')}`}
            className="flex items-center gap-2 h-9 px-4 rounded-full bg-orange-50 border border-orange-200 text-[#d4700f] text-sm font-medium hover:bg-orange-100 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {effectiveSettings.company.phone}
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* ── Hero section ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fff 60%)' }}>
            <div className="text-xs font-bold text-[#e67a1f] tracking-widest uppercase mb-3">
              Custom Project Quote
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Hello, {quote.client.name.split(' ')[0]}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here&apos;s your personalized estimate from Patriot Roofing &amp; Home Repairs.
            </p>

            {/* Project tags */}
            {quote.projectTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {quote.projectTypes.map(pt => (
                  <span key={pt} className="text-xs bg-accent/10 text-[#d4700f] px-2.5 py-1 rounded-full capitalize font-medium">
                    {pt.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Address */}
            {quote.client.projectAddress && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5" />
                {quote.client.projectAddress}
              </div>
            )}
          </div>

          {/* Validity */}
          <div className={`px-6 py-3 border-t text-xs font-medium flex items-center gap-2 ${
            isExpired
              ? 'bg-red-50 border-red-100 text-red-600'
              : daysLeft <= 7
                ? 'bg-orange-50 border-orange-100 text-orange-600'
                : 'bg-gray-50 border-gray-100 text-gray-400'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {isExpired
              ? 'This quote has expired — contact us for a fresh estimate.'
              : `Quote valid for ${daysLeft} more day${daysLeft !== 1 ? 's' : ''} · Expires ${formatDate(quote.validUntil)}`}
          </div>
        </div>

        {/* ── Investment summary ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5">
            <h2 className="text-base font-bold text-gray-800 mb-4">Your Investment</h2>
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-4xl font-bold text-gray-900 tracking-tight">{formatCurrency(quote.total)}</div>
                <div className="text-sm text-gray-400 mt-1">Total project investment</div>
              </div>
              {quote.discountPercent > 0 && (
                <div className="text-right">
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    {quote.discountName || 'Discount'} — {quote.discountPercent}% off
                  </div>
                  <div className="text-xs text-gray-400 mt-1">You save {formatCurrency(quote.discountAmount)}</div>
                </div>
              )}
            </div>

            {/* Subtotals */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700 font-medium">{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">{quote.discountName || 'Discount'}</span>
                  <span className="text-emerald-600 font-medium">−{formatCurrency(quote.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({quote.taxRate}%)</span>
                <span className="text-gray-700 font-medium">{formatCurrency(quote.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100">
                <span className="text-gray-800">Total</span>
                <span className="text-gray-900">{formatCurrency(quote.total)}</span>
              </div>
            </div>

            {/* Line items toggle */}
            {quote.lineItems.length > 0 && (
              <button
                onClick={() => setShowLineItems(!showLineItems)}
                className="flex items-center gap-2 mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                {showLineItems ? 'Hide' : 'View'} full scope breakdown
                {showLineItems ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {showLineItems && (
              <div className="mt-4 rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider grid grid-cols-12">
                  <span className="col-span-6">Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                {quote.lineItems
                  .filter(li => li.category !== 'discount')
                  .map(li => (
                    <div key={li.id} className="px-4 py-2.5 border-t border-gray-50 grid grid-cols-12 items-center">
                      <span className="col-span-6 text-xs text-gray-700">{li.description}</span>
                      <span className="col-span-2 text-right text-xs text-gray-400">{li.quantity} {li.unit}</span>
                      <span className="col-span-2 text-right text-xs text-gray-400">{formatCurrency(li.unitPrice)}</span>
                      <span className="col-span-2 text-right text-xs font-medium text-gray-700">{formatCurrency(li.total)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Financing ── */}
        {effectiveSettings.presentation.showFinancing && effectiveSettings.financing.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4.5 h-4.5 text-accent" />
                <h2 className="text-base font-bold text-gray-800">Financing Options</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Make your dream project more affordable with flexible payment plans.
              </p>

              {/* Term selector */}
              <div className="flex flex-wrap gap-2 mb-5">
                {effectiveSettings.financing.map((opt, i) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedTerm(i)}
                    className={`h-9 px-4 rounded-full text-xs font-semibold border transition-all ${
                      selectedTerm === i
                        ? 'bg-accent text-black border-accent'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#fcad55]'
                    }`}
                  >
                    {opt.termMonths}mo @ {opt.apr}%
                  </button>
                ))}
              </div>

              {financing && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <div className="text-3xl font-bold text-[#d4700f] mb-1">
                    {formatCurrency(financing.monthlyPayment)}
                    <span className="text-base font-medium text-accent">/mo</span>
                  </div>
                  <div className="text-xs text-[#e67a1f] mb-3">
                    {financingOption.termMonths} months · {financingOption.apr}% APR · 20% down ({formatCurrency(financing.downPayment)})
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-accent">Amount Financed</div>
                      <div className="text-sm font-semibold text-[#d4700f]">{formatCurrency(financing.financed)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-accent">Total Cost</div>
                      <div className="text-sm font-semibold text-[#d4700f]">{formatCurrency(financing.totalCost)}</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-accent mt-3">
                    *Financing subject to credit approval. Contact us for details.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Why Patriot ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">Why Patriot Roofing?</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Star, label: 'Top-Rated', sub: '5-star reviewed' },
              { icon: Shield, label: 'Licensed & Insured', sub: 'Full coverage' },
              { icon: CheckCircle2, label: 'Local NC', sub: 'Lexington, NC' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700">{label}</div>
                  <div className="text-[10px] text-gray-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Signature ── */}
        {!isExpired && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <PenLine className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800">Sign & Accept</div>
                <div className="text-xs text-gray-400">Authorize Patriot Roofing &amp; Home Repairs to proceed</div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 leading-relaxed mb-5">
                By signing, you authorize Patriot Roofing &amp; Home Repairs to proceed with the described scope of work and agree to
                the terms, payment schedule, and conditions outlined in this estimate. Total: <strong className="text-gray-700">{formatCurrency(quote.total)}</strong>.
              </p>
              <ClientSignature
                quote={quote}
                onSigned={() => setSignedNow(true)}
              />
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {quote.notes && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
            <h2 className="text-sm font-bold text-gray-800 mb-2">Project Notes</h2>
            <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* ── Contact footer ── */}
        <div className="rounded-2xl border border-orange-100 bg-orange-50 px-6 py-5 text-center">
          <div className="text-sm font-semibold text-[#d4700f] mb-1">Questions? We&apos;re here to help.</div>
          <div className="text-xs text-[#e67a1f] mb-3">{effectiveSettings.company.address}</div>
          <div className="flex items-center justify-center gap-4">
            <a
              href={`tel:${effectiveSettings.company.phone.replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#d4700f] hover:text-[#d4700f] transition-colors"
            >
              <Phone className="w-4 h-4" />
              {effectiveSettings.company.phone}
            </a>
          </div>
          <div className="mt-4 pt-4 border-t border-orange-100 text-[10px] text-accent">
            Prepared by {effectiveSettings.salesRep.name} · {effectiveSettings.company.name}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
