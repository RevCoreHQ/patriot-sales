'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { MaterialSwatch } from '@/components/ui/MaterialSwatch';
import { useQuotesStore } from '@/store/quotes';
import { useSettingsStore } from '@/store/settings';
import { calculateFinancing } from '@/lib/financing';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import { generateQuotePDF, getQuotePDFBase64 } from '@/lib/pdf';
import type { Quote, QuoteStatus } from '@/types';
import {
  ArrowLeft, Edit2, Presentation, Trash2, ChevronDown, Hammer,
  Download, Send, PenLine, CheckCircle2, Clock, AlertTriangle,
  CreditCard, ChevronUp, ExternalLink, Copy,
} from 'lucide-react';
import { useProjectsStore } from '@/store/projects';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { TRIAL } from '@/lib/trial';

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'presented', label: 'Presented' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'lost', label: 'Lost' },
];

const CAT_COLORS: Record<string, string> = {
  material: 'bg-blue-500/10 text-blue-400',
  labor:    'bg-emerald-500/10 text-emerald-400',
  addon:    'bg-purple-500/10 text-purple-400',
  pool:     'bg-sky-500/10 text-sky-400',
  misc:     'bg-neutral-500/10 text-neutral-400',
};

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { quotes, init, remove, updateStatus, sign } = useQuotesStore();
  const { settings, init: initSettings } = useSettingsStore();
  const { projects, createFromQuote, getByQuoteId, init: initProjects } = useProjectsStore();

  const [statusOpen, setStatusOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showFinancing, setShowFinancing] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    initSettings();
    init();
    initProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quote = quotes.find(q => q.id === id);

  if (quotes.length > 0 && !quote) { router.push('/'); return null; }
  if (!quote) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-c-text-3 text-sm">Loading...</div>
        </div>
      </AppShell>
    );
  }

  // ── Computed values ─────────────────────────────────────────────────────────
  const daysLeft = Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / 86400000);
  const isExpired = daysLeft <= 0;
  const isSigned = !!quote.signedBy;
  const alreadyInProjects = !!getByQuoteId(quote.id);

  const financingOption = settings.financing[selectedTerm];
  const financing = financingOption
    ? calculateFinancing(quote.total, 20, financingOption.apr, financingOption.termMonths)
    : null;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (confirm('Delete this quote? This cannot be undone.')) {
      remove(id);
      router.push('/');
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try { await generateQuotePDF(quote, settings); }
    finally { setPdfLoading(false); }
  };

  const handleSendEmail = async () => {
    if (!quote.client.email) {
      alert('This client has no email address on file.');
      return;
    }
    setEmailLoading(true);
    try {
      const pdfBase64 = await getQuotePDFBase64(quote, settings);
      const res = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote, settings, pdfBase64 }),
      });
      if (res.ok) {
        setEmailSent(true);
        if (quote.status === 'draft') updateStatus(id, 'presented');
        setTimeout(() => setEmailSent(false), 4000);
      } else {
        alert('Failed to send email. Check your Resend API key in .env.local.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSign = (dataUrl: string) => {
    sign(id, dataUrl, quote.client.name);
    setShowSignature(false);
  };

  const handleMoveToProjects = () => {
    if (alreadyInProjects) { router.push('/projects'); return; }
    if (projects.length >= TRIAL.maxProjects) { setShowUpgrade(true); return; }
    createFromQuote(quote.id, quote.client.name, quote.projectTypes, quote.total);
    router.push('/projects');
  };

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason="project-limit" />}
      {showSignature && (
        <SignaturePad
          clientName={quote.client.name}
          total={formatCurrency(quote.total)}
          onSave={handleSign}
          onCancel={() => setShowSignature(false)}
        />
      )}

      <AppShell>
        <div className="p-6 max-w-4xl mx-auto">

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 rounded-lg hover:bg-c-elevated text-c-text-4 hover:text-c-text transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-c-text leading-none">{quote.client.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <StatusBadge status={quote.status} />
                  {isSigned && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />Signed
                    </span>
                  )}
                  {!isExpired && daysLeft <= 10 && !isSigned && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                      <Clock className="w-3 h-3" />
                      Expires in {daysLeft}d
                    </span>
                  )}
                  {isExpired && !isSigned && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-red-400">
                      <AlertTriangle className="w-3 h-3" />Expired
                    </span>
                  )}
                  <span className="text-xs text-c-text-4">
                    {formatDateShort(quote.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Status dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusOpen(!statusOpen)}
                  className="flex items-center gap-1.5 h-8 px-3 bg-c-elevated border border-c-border-inner rounded-lg text-xs text-c-text-3 hover:text-c-text hover:border-c-border-hover transition-all"
                >
                  Status
                  <ChevronDown className="w-3 h-3" />
                </button>
                {statusOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-38 bg-c-card border border-c-border-inner rounded-xl shadow-2xl z-20 overflow-hidden py-1">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { updateStatus(id, opt.value); setStatusOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-c-text-2 hover:bg-c-elevated hover:text-c-text transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {!isSigned && quote.status !== 'lost' && (
                <Button size="sm" onClick={() => setShowSignature(true)} className="gap-1.5">
                  <PenLine className="w-3.5 h-3.5" />
                  Sign & Accept
                </Button>
              )}

              <Button
                variant="secondary" size="sm"
                onClick={handleSendEmail}
                disabled={emailLoading || !quote.client.email}
                className="gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {emailLoading ? 'Sending...' : emailSent ? '✓ Sent!' : 'Send to Client'}
              </Button>

              <Button
                variant="secondary" size="sm"
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>

              {quote.status === 'accepted' && (
                <Button
                  variant={alreadyInProjects ? 'ghost' : 'secondary'}
                  size="sm"
                  onClick={handleMoveToProjects}
                  className="gap-1.5"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  {alreadyInProjects ? 'View Project' : 'Move to Projects'}
                </Button>
              )}

              <Link href={`/presentation?id=${id}`}>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Presentation className="w-3.5 h-3.5" />
                  Present
                </Button>
              </Link>

              <Button
                variant="secondary" size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/q/${id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2500);
                  });
                }}
                className="gap-1.5"
                title="Copy client-facing quote link"
              >
                {linkCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </Button>

              <Link href={`/q/${id}`} target="_blank">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Client View
                </Button>
              </Link>

              <Link href={`/quotes/${id}/edit`}>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </Link>

              <Button variant="danger" size="sm" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* ── Signed banner ── */}
          {isSigned && (
            <div className="mb-4 flex items-center gap-3 px-5 py-4 bg-emerald-500/8 border border-emerald-500/25 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-c-text">
                  Signed by {quote.signedBy}
                </div>
                <div className="text-xs text-c-text-3 mt-0.5">
                  {quote.signedAt ? formatDate(quote.signedAt) : ''} · Digital signature captured
                </div>
              </div>
              {quote.signatureData && (
                <div className="ml-auto bg-white rounded-lg overflow-hidden border border-white/10" style={{ width: 80, height: 36 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={quote.signatureData} alt="Signature" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {/* ── Main content ── */}
            <div className="col-span-2 space-y-4">

              {/* Stat bar */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Quote Total', value: formatCurrency(quote.total), color: 'text-amber-400' },
                  { label: 'Valid Until', value: formatDateShort(quote.validUntil), color: isExpired ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-c-text' },
                ].map(s => (
                  <div key={s.label}
                    className="rounded-xl border border-c-border bg-c-card px-4 py-3">
                    <div className="text-[10px] text-c-text-4 uppercase tracking-wider font-medium mb-1">{s.label}</div>
                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Line items */}
              <div className="rounded-2xl border border-c-border bg-c-card overflow-hidden">
                <div className="px-5 py-3 border-b border-c-border-inner">
                  <div className="text-[11px] font-bold text-c-text-4 uppercase tracking-widest">Scope of Work</div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-c-border-inner bg-c-surface">
                      <th className="px-5 py-2.5 text-left text-[11px] text-c-text-4 font-medium">Description</th>
                      <th className="px-4 py-2.5 text-right text-[11px] text-c-text-4 font-medium">Qty</th>
                      <th className="px-4 py-2.5 text-right text-[11px] text-c-text-4 font-medium">Unit Price</th>
                      <th className="px-5 py-2.5 text-right text-[11px] text-c-text-4 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-c-border-inner">
                    {quote.lineItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-5 py-3">
                          <div className="text-sm text-c-text">{item.description}</div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${CAT_COLORS[item.category] ?? CAT_COLORS.misc}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-c-text-3">{item.unit !== 'flat' ? `${item.quantity} ${item.unit}` : '—'}</td>
                        <td className="px-4 py-3 text-right text-sm text-c-text-3">{item.unit !== 'flat' ? formatCurrency(item.unitPrice) : '—'}</td>
                        <td className="px-5 py-3 text-right text-sm font-semibold text-c-text">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-c-border-inner divide-y divide-c-border-inner">
                  <div className="px-5 py-2.5 flex justify-between text-sm">
                    <span className="text-c-text-3">Subtotal</span>
                    <span className="text-c-text">{formatCurrency(quote.subtotal)}</span>
                  </div>
                  {quote.discountPercent > 0 && (
                    <div className="px-5 py-2.5 flex justify-between text-sm">
                      <span className="text-emerald-400">
                        {quote.discountName ? `${quote.discountName} (${quote.discountPercent}%)` : `Discount (${quote.discountPercent}%)`}
                      </span>
                      <span className="text-emerald-400">−{formatCurrency(quote.discountAmount)}</span>
                    </div>
                  )}
                  <div className="px-5 py-2.5 flex justify-between text-sm">
                    <span className="text-c-text-3">Sales Tax ({quote.taxRate}%)</span>
                    <span className="text-c-text">{formatCurrency(quote.taxAmount)}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="font-bold text-c-text">Total Investment</span>
                    <span className="font-bold text-2xl text-amber-400">{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {quote.notes && (
                <div className="rounded-2xl border border-c-border bg-c-card p-5">
                  <div className="text-[11px] font-bold text-c-text-4 uppercase tracking-widest mb-2">Client Notes</div>
                  <p className="text-sm text-c-text-2 leading-relaxed">{quote.notes}</p>
                </div>
              )}
              {quote.internalNotes && (
                <div className="rounded-2xl border border-amber-500/15 p-5 bg-amber-500/5">
                  <div className="text-[11px] font-bold text-amber-500/60 uppercase tracking-widest mb-2">Internal Notes</div>
                  <p className="text-sm text-c-text-2 leading-relaxed">{quote.internalNotes}</p>
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">

              {/* Client */}
              <div className="rounded-2xl border border-c-border bg-c-card p-4 space-y-2">
                <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-widest">Client</div>
                <div className="text-sm font-bold text-c-text">{quote.client.name}</div>
                <div className="space-y-1">
                  {quote.client.email && <div className="text-xs text-c-text-3">{quote.client.email}</div>}
                  {quote.client.phone && <div className="text-xs text-c-text-3">{quote.client.phone}</div>}
                  {quote.client.address && <div className="text-xs text-c-text-4 pt-0.5">{quote.client.address}</div>}
                </div>
              </div>

              {/* Project */}
              <div className="rounded-2xl border border-c-border bg-c-card p-4 space-y-2">
                <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-widest">Project</div>
                <div className="flex flex-wrap gap-1">
                  {quote.projectTypes.map(pt => (
                    <span key={pt} className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full capitalize font-medium">
                      {pt.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-c-text-4 space-y-0.5">
                  <div>{quote.siteConditions.squareFootage?.toLocaleString()} sq ft</div>
                  <div className="capitalize">{quote.siteConditions.slope} slope · {quote.siteConditions.access} access</div>
                  {quote.siteConditions.demo && <div className="text-amber-400/60 font-medium">Demo required</div>}
                </div>
              </div>

              {/* Materials */}
              {quote.materialSelections.length > 0 && (
                <div className="rounded-2xl border border-c-border bg-c-card p-4 space-y-2">
                  <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-widest">Materials</div>
                  {quote.materialSelections.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <MaterialSwatch category={s.material.category} tier={s.material.tier} name={s.material.name} className="w-8 h-8 rounded-lg shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-c-text">{s.material.name}</div>
                        <div className="text-[10px] text-c-text-4">{s.area} · {s.squareFootage} sf</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Financing widget ── */}
              <div className="rounded-2xl border border-amber-500/20 overflow-hidden"
                style={{ background: 'linear-gradient(160deg, rgba(245,158,11,0.07), rgba(245,158,11,0.03))' }}>
                <button
                  onClick={() => setShowFinancing(!showFinancing)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-amber-400/70" />
                    <div>
                      <div className="text-xs font-bold text-amber-400">Financing Available</div>
                      {financing && !showFinancing && (
                        <div className="text-[11px] text-c-text-3 mt-0.5">
                          From {formatCurrency(financing.monthlyPayment)}/mo
                        </div>
                      )}
                    </div>
                  </div>
                  {showFinancing
                    ? <ChevronUp className="w-3.5 h-3.5 text-amber-400/50" />
                    : <ChevronDown className="w-3.5 h-3.5 text-amber-400/50" />
                  }
                </button>

                {showFinancing && (
                  <div className="px-4 pb-4 border-t border-amber-500/15 pt-3 space-y-3">
                    {/* Term selector */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {settings.financing.map((opt, i) => (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedTerm(i)}
                          className={`px-1.5 py-2 rounded-lg text-[11px] font-semibold text-center transition-all ${
                            selectedTerm === i
                              ? 'bg-amber-500 text-black'
                              : 'bg-c-elevated text-c-text-3 hover:bg-c-tag'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Payment display */}
                    {financing && (
                      <div className="rounded-xl bg-c-surface border border-c-border-inner p-3 text-center">
                        <div className="text-[10px] text-c-text-4 uppercase tracking-widest mb-1">As low as</div>
                        <div className="text-2xl font-bold text-c-text">{formatCurrency(financing.monthlyPayment)}</div>
                        <div className="text-xs text-c-text-3 mt-0.5">/month</div>
                        <div className="text-[11px] text-c-text-4 mt-2 leading-relaxed">
                          {financingOption.termMonths} months · {financingOption.apr}% APR<br />
                          20% down ({formatCurrency(financing.downPayment)})
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-c-text-4 text-center leading-relaxed">
                      Through Lyon Financial — no home equity required
                    </div>
                  </div>
                )}
              </div>

              {/* Signature block */}
              {isSigned ? (
                <div className="rounded-2xl border border-emerald-500/25 p-4 bg-emerald-500/5">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Signed & Accepted</div>
                  <div className="text-sm font-semibold text-c-text">{quote.signedBy}</div>
                  {quote.signedAt && <div className="text-xs text-c-text-4 mt-0.5">{formatDate(quote.signedAt)}</div>}
                  {quote.signatureData && (
                    <div className="mt-3 bg-white rounded-lg overflow-hidden border border-white/10 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={quote.signatureData} alt="Client signature" className="w-full h-12 object-contain" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowSignature(true)}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border border-c-border bg-c-card hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-c-elevated flex items-center justify-center group-hover:bg-amber-500/10 transition-all">
                      <PenLine className="w-4 h-4 text-c-text-4 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-c-text-2 group-hover:text-c-text transition-colors">Sign & Accept</div>
                      <div className="text-xs text-c-text-4 mt-0.5">Capture client signature</div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-c-text-4 group-hover:text-amber-400 transition-colors rotate-[-90deg]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}
