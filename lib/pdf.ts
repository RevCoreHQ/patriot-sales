import { jsPDF } from 'jspdf';
import type { Quote, AppSettings } from '@/types';

// ─── Constants ──────────────────────────────────────────────────────────────
const LOGO_URL = '';
const PAGE_W = 215.9;   // Letter width mm
const PAGE_H = 279.4;   // Letter height mm
const M = 14;           // Margin mm
const CW = PAGE_W - M * 2; // Content width
const FOOTER_H = 14;    // Footer band height mm
const CONTENT_BOTTOM = PAGE_H - FOOTER_H - 4;

// Brand colors (RGB)
const AMBER: [number, number, number] = [251, 142, 40];
const DARK: [number, number, number] = [18, 18, 22];
const DARK2: [number, number, number] = [30, 30, 36];
const GRAY: [number, number, number] = [100, 100, 112];
const LIGHT_GRAY: [number, number, number] = [190, 190, 200];
const RULE: [number, number, number] = [220, 220, 228];
const ROW_ALT: [number, number, number] = [247, 247, 250];
const WHITE: [number, number, number] = [255, 255, 255];
const PANEL: [number, number, number] = [243, 243, 246];
const GREEN: [number, number, number] = [34, 197, 94];

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function fmtShortDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = LOGO_URL;
    });
  } catch {
    return null;
  }
}

// ─── PDF Builder ────────────────────────────────────────────────────────────
async function buildPDF(quote: Quote, settings: AppSettings): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const logoBase64 = await loadLogoBase64();

  // ── Page 1: Header + Client + Line Items ─────────────────────────────────
  let y = drawHeader(doc, settings, logoBase64);
  y = drawEstimateMeta(doc, quote, settings, y);
  y = drawClientAndProject(doc, quote, y);
  y = drawLineItemsSection(doc, quote, settings, y);
  drawTotals(doc, quote, y);

  // ── Page 2+: Notes + Terms + Signature ───────────────────────────────────
  doc.addPage();
  let y2 = drawSmallHeader(doc, settings);
  y2 = drawNotesSection(doc, quote, y2);
  y2 = drawTermsSection(doc, settings, y2);
  drawSignatureBlock(doc, quote, y2);

  // ── Footer on every page ─────────────────────────────────────────────────
  const numPages = doc.getNumberOfPages();
  for (let p = 1; p <= numPages; p++) {
    doc.setPage(p);
    drawFooter(doc, settings, p, numPages);
  }

  return doc;
}

export async function generateQuotePDF(quote: Quote, settings: AppSettings): Promise<void> {
  const doc = await buildPDF(quote, settings);
  const clientSlug = quote.client.name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
  doc.save(`Patriot-Estimate-${clientSlug}.pdf`);
}

export async function getQuotePDFBase64(quote: Quote, settings: AppSettings): Promise<string> {
  const doc = await buildPDF(quote, settings);
  const dataUri = doc.output('datauristring') as string;
  return dataUri.split(',')[1]; // strip the "data:application/pdf;base64," prefix
}

// ─── Header band ─────────────────────────────────────────────────────────────
function drawHeader(doc: jsPDF, settings: AppSettings, logoBase64: string | null): number {
  const H = 42;

  // Dark background
  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_W, H, 'F');

  // Amber left accent bar
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, 5, H, 'F');

  // Amber bottom rule
  doc.setFillColor(...AMBER);
  doc.rect(0, H - 0.8, PAGE_W, 0.8, 'F');

  // Logo — top-right of header
  const LOGO_W = 30;
  const LOGO_H = 30;
  const logoX = PAGE_W - M - LOGO_W;
  const logoY = (H - LOGO_H) / 2;
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', logoX, logoY, LOGO_W, LOGO_H);
  }

  // Company name — large, white
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...WHITE);
  doc.text('PATRIOT ROOFING', M + 3, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...AMBER);
  doc.text('& HOME REPAIRS', M + 3, 22);

  // Tagline
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(160, 140, 80);
  doc.text(settings.company.tagline, M + 3, 30);

  // Certifications
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 150);
  doc.text('Licensed & Insured  ·  GAF Certified  ·  Workmanship Guarantee', M + 3, 37);

  // Contact info — to the left of the logo
  const rx = logoX - 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 210);

  const contacts = [
    settings.company.phone,
    settings.company.email,
    settings.company.website,
  ];
  contacts.forEach((line, i) => {
    doc.text(line, rx, 14 + i * 6, { align: 'right' });
  });

  doc.setFontSize(7);
  doc.setTextColor(130, 130, 150);
  const addrParts = settings.company.address.split(',');
  if (addrParts.length >= 2) {
    doc.text(addrParts[0].trim(), rx, 32, { align: 'right' });
    doc.text(addrParts.slice(1).join(',').trim(), rx, 37, { align: 'right' });
  } else {
    doc.text(settings.company.address, rx, 32, { align: 'right' });
  }

  return H + 8;
}

// ─── Estimate title + meta ────────────────────────────────────────────────────
function drawEstimateMeta(doc: jsPDF, quote: Quote, settings: AppSettings, y: number): number {
  // ESTIMATE heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...DARK);
  doc.text('ESTIMATE', M, y + 8);

  // Underline
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.8);
  doc.line(M, y + 10, M + 46, y + 10);

  // Quote number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const quoteNum = `#${quote.id.slice(0, 8).toUpperCase()}`;
  doc.text(quoteNum, M, y + 16);

  // Right meta block
  const rx = PAGE_W - M;
  const metaItems: [string, string][] = [
    ['Date Issued:', fmtDate(quote.createdAt)],
    ['Valid Until:', fmtDate(quote.validUntil)],
    ['Sales Rep:', quote.salesRep ?? settings.salesRep.name],
    ['Contact:', settings.salesRep.phone],
  ];

  metaItems.forEach(([label, value], i) => {
    const my = y + i * 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(label, rx - 40, my + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(value, rx, my + 3, { align: 'right' });
  });

  return y + 24;
}

// ─── Client + project info ────────────────────────────────────────────────────
function drawClientAndProject(doc: jsPDF, quote: Quote, y: number): number {
  const BOX_H = 30;
  const COL = (CW - 5) / 2;

  // Client panel
  doc.setFillColor(...PANEL);
  doc.roundedRect(M, y, COL, BOX_H, 2, 2, 'F');

  // Amber label bar
  doc.setFillColor(...AMBER);
  doc.roundedRect(M, y, COL, 6.5, 2, 2, 'F');
  doc.rect(M, y + 3, COL, 3.5, 'F'); // bottom half of top bar flat

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...DARK);
  doc.text('PREPARED FOR', M + 4, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(quote.client.name, M + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  const clientLines: string[] = [];
  if (quote.client.address) clientLines.push(quote.client.address);
  if (quote.client.phone) clientLines.push(quote.client.phone);
  if (quote.client.email) clientLines.push(quote.client.email);
  clientLines.forEach((line, i) => {
    doc.text(line, M + 4, y + 18 + i * 4.5);
  });

  // Project panel
  const PX = M + COL + 5;
  doc.setFillColor(...PANEL);
  doc.roundedRect(PX, y, COL, BOX_H, 2, 2, 'F');

  doc.setFillColor(...DARK2);
  doc.roundedRect(PX, y, COL, 6.5, 2, 2, 'F');
  doc.rect(PX, y + 3, COL, 3.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...WHITE);
  doc.text('PROJECT DETAILS', PX + 4, y + 4.5);

  // Project types
  const typesStr = quote.projectTypes.map(titleCase).join('  ·  ');
  const wrappedTypes = doc.splitTextToSize(typesStr, COL - 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(wrappedTypes, PX + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const siteY = y + 12 + wrappedTypes.length * 4;
  const sqft = quote.siteConditions.roofArea?.toLocaleString() ?? '0';
  doc.text(`${sqft} sq ft  ·  ${titleCase(quote.siteConditions.pitch ?? 'moderate')} pitch  ·  ${titleCase(quote.siteConditions.access ?? 'easy')} access`, PX + 4, siteY);

  if (quote.siteConditions.tearOff) {
    doc.setTextColor(200, 100, 20);
    doc.text('Tear-off required', PX + 4, siteY + 5);
  }

  if (quote.client.projectAddress) {
    doc.setTextColor(...GRAY);
    doc.text(`Project: ${quote.client.projectAddress}`, PX + 4, siteY + (quote.siteConditions.tearOff ? 10 : 5));
  }

  return y + BOX_H + 8;
}

// ─── Line items section ────────────────────────────────────────────────────────
function drawLineItemsSection(doc: jsPDF, quote: Quote, _settings: AppSettings, y: number): number {
  // Section header
  y = drawSectionHeader(doc, 'SCOPE OF WORK', y);

  // Column header row
  const COL_DESC_W = CW * 0.50;
  const COL_QTY_X  = M + COL_DESC_W + 2;
  const COL_UNIT_X = M + CW * 0.70;
  const COL_AMT_X  = M + CW;

  doc.setFillColor(...DARK2);
  doc.rect(M, y, CW, 6.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(170, 170, 185);
  doc.text('DESCRIPTION', M + 3, y + 4.5);
  doc.text('QTY / UNIT', COL_QTY_X, y + 4.5);
  doc.text('UNIT PRICE', COL_UNIT_X, y + 4.5);
  doc.text('AMOUNT', COL_AMT_X, y + 4.5, { align: 'right' });
  y += 6.5;

  // Category color dots
  const CAT_COLORS: Record<string, [number, number, number]> = {
    material: [96, 165, 250],
    labor:    [52, 211, 153],
    addon:    [167, 139, 250],
    pool:     [56, 189, 248],
    misc:     [156, 163, 175],
    discount: [34, 197, 94],
  };

  const ROW_H = 8.5;
  let currentCategory = '';

  for (let i = 0; i < quote.lineItems.length; i++) {
    const item = quote.lineItems[i];

    // Page break if needed
    if (y + ROW_H > CONTENT_BOTTOM) {
      doc.addPage();
      y = 18;
      // Redraw column headers
      doc.setFillColor(...DARK2);
      doc.rect(M, y, CW, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(170, 170, 185);
      doc.text('DESCRIPTION (continued)', M + 3, y + 4.5);
      doc.text('QTY / UNIT', COL_QTY_X, y + 4.5);
      doc.text('UNIT PRICE', COL_UNIT_X, y + 4.5);
      doc.text('AMOUNT', COL_AMT_X, y + 4.5, { align: 'right' });
      y += 6.5;
    }

    // Category divider if group changes
    if (item.category !== currentCategory) {
      currentCategory = item.category;
      doc.setFillColor(235, 235, 242);
      doc.rect(M, y, CW, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...GRAY);
      const catLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
      doc.text(catLabel.toUpperCase(), M + 6, y + 3.5);
      y += 5;
    }

    // Alt row fill
    if (i % 2 === 1) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(M, y, CW, ROW_H, 'F');
    }

    // Category dot
    const dotColor = CAT_COLORS[item.category] ?? [150, 150, 160];
    doc.setFillColor(...dotColor);
    doc.circle(M + 2, y + ROW_H / 2, 1.2, 'F');

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(item.description, M + 5, y + 5.5);

    // Qty / unit
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    if (item.unit !== 'flat') {
      doc.text(`${item.quantity} ${item.unit}`, COL_QTY_X, y + 5.5);
      doc.text(fmtCurrency(item.unitPrice), COL_UNIT_X, y + 5.5);
    } else {
      doc.text('—', COL_QTY_X, y + 5.5);
      doc.text('—', COL_UNIT_X, y + 5.5);
    }

    // Amount
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(fmtCurrency(item.total), COL_AMT_X, y + 5.5, { align: 'right' });

    y += ROW_H;
  }

  // Bottom border under table
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.4);
  doc.line(M, y, M + CW, y);

  return y + 4;
}

// ─── Totals block ─────────────────────────────────────────────────────────────
function drawTotals(doc: jsPDF, quote: Quote, y: number): void {
  const TOTALS_W = 80;
  const TX = M + CW - TOTALS_W;
  const LX = TX + 3;
  const VX = M + CW;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text('Subtotal', LX, y + 5);
  doc.setTextColor(...DARK);
  doc.text(fmtCurrency(quote.subtotal), VX, y + 5, { align: 'right' });
  y += 7;

  // Discount
  if (quote.discountPercent > 0) {
    doc.setTextColor(...GREEN);
    doc.text(`Discount (${quote.discountPercent}%)`, LX, y + 5);
    doc.text(`-${fmtCurrency(quote.discountAmount)}`, VX, y + 5, { align: 'right' });
    y += 7;
  }

  // Tax
  doc.setTextColor(...GRAY);
  doc.text(`Sales Tax (${quote.taxRate}%)`, LX, y + 5);
  doc.setTextColor(...DARK);
  doc.text(fmtCurrency(quote.taxAmount), VX, y + 5, { align: 'right' });
  y += 9;

  // Total — amber band
  doc.setFillColor(...AMBER);
  doc.roundedRect(TX, y, TOTALS_W, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('TOTAL INVESTMENT', LX, y + 7.8);
  doc.text(fmtCurrency(quote.total), VX, y + 7.8, { align: 'right' });
}

// ─── Small header for continuation pages ─────────────────────────────────────
function drawSmallHeader(doc: jsPDF, settings: AppSettings): number {
  const H = 16;
  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_W, H, 'F');
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, 4, H, 'F');
  doc.rect(0, H - 0.6, PAGE_W, 0.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('PATRIOT ROOFING & HOME REPAIRS', M + 3, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 165);
  doc.text(settings.company.phone, PAGE_W - M, 10, { align: 'right' });

  return H + 8;
}

// ─── Notes ────────────────────────────────────────────────────────────────────
function drawNotesSection(doc: jsPDF, quote: Quote, y: number): number {
  if (!quote.notes) return y;

  y = drawSectionHeader(doc, 'PROJECT NOTES', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  const lines = doc.splitTextToSize(quote.notes, CW - 4);
  doc.text(lines, M + 2, y + 1);
  y += lines.length * 5 + 8;

  return y;
}

// ─── Terms ────────────────────────────────────────────────────────────────────
function drawTermsSection(doc: jsPDF, settings: AppSettings, y: number): number {
  y = drawSectionHeader(doc, 'TERMS & CONDITIONS', y);

  const terms = [
    `This estimate is valid for ${settings.pricing.quoteValidDays} days from the date of issue.`,
    'A 50% deposit is required to confirm your project start date. Balance is due upon completion.',
    'Patriot Roofing & Home Repairs provides a workmanship guarantee on all projects.',
    'Manufacturer warranties apply based on selected materials (GAF, Owens Corning, CertainTeed).',
    'Pricing does not include permits, engineering reports, or structural repairs unless specified.',
    'Scope changes after signing may result in a revised estimate and/or change order.',
    'All work performed by our own licensed and insured crew.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  terms.forEach(term => {
    // Page break check
    if (y > CONTENT_BOTTOM) {
      doc.addPage();
      y = 20;
    }
    // Bullet
    doc.setFillColor(...AMBER);
    doc.circle(M + 2, y + 2, 1, 'F');
    const wrapped = doc.splitTextToSize(term, CW - 8);
    doc.text(wrapped, M + 6, y + 3);
    y += wrapped.length * 4.5 + 2;
  });

  return y + 6;
}

// ─── Signature block ─────────────────────────────────────────────────────────
function drawSignatureBlock(doc: jsPDF, quote: Quote, y: number): void {
  if (y > CONTENT_BOTTOM - 50) {
    doc.addPage();
    y = 20;
  }

  y = drawSectionHeader(doc, 'ACCEPTANCE OF ESTIMATE', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const msg =
    'By signing below, you authorize Patriot Roofing & Home Repairs to proceed with the described scope of work ' +
    'and agree to the terms and payment schedule outlined in this estimate.';
  const msgLines = doc.splitTextToSize(msg, CW);
  doc.text(msgLines, M, y);
  y += msgLines.length * 5 + 8;

  // Two signature boxes side by side
  const BOX_W = (CW - 8) / 2;
  const BOX_H = 42;

  // Left box — client
  doc.setFillColor(...PANEL);
  doc.roundedRect(M, y, BOX_W, BOX_H, 2, 2, 'F');
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, BOX_W, BOX_H, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...AMBER);
  doc.text('CLIENT SIGNATURE', M + 4, y + 5);

  // If digital signature captured, embed it; otherwise draw blank signature line
  if (quote.signatureData) {
    doc.addImage(quote.signatureData, 'PNG', M + 4, y + 7, BOX_W - 8, 14);
  }

  // Signature line
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.line(M + 4, y + 22, M + BOX_W - 4, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('Signature', M + 4, y + 26);
  doc.text(`Date: ${fmtShortDate(new Date().toISOString())}`, M + BOX_W - 4, y + 26, { align: 'right' });

  // Client name line
  doc.setLineWidth(0.3);
  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(M + 4, y + 34, M + BOX_W - 4, y + 34);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(quote.client.name || 'Printed Name', M + 4, y + 38);

  // Right box — Patriot rep
  const RX = M + BOX_W + 8;
  doc.setFillColor(...PANEL);
  doc.roundedRect(RX, y, BOX_W, BOX_H, 2, 2, 'F');
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.roundedRect(RX, y, BOX_W, BOX_H, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...AMBER);
  doc.text('PATRIOT ROOFING & HOME REPAIRS', RX + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(quote.salesRep ?? 'Sales Representative', RX + 4, y + 12);

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('Roofing Specialist', RX + 4, y + 18);

  // Rep signature line
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.line(RX + 4, y + 26, RX + BOX_W - 4, y + 26);

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('Authorized Signature', RX + 4, y + 30);

  // Thank you note
  const thankY = y + BOX_H + 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...AMBER);
  doc.text('Thank you for the opportunity to earn your business.', PAGE_W / 2, thankY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('We look forward to protecting your home.', PAGE_W / 2, thankY + 6, { align: 'center' });
}

// ─── Section header helper ────────────────────────────────────────────────────
function drawSectionHeader(doc: jsPDF, label: string, y: number): number {
  doc.setFillColor(...DARK);
  doc.rect(M, y, CW, 7.5, 'F');
  doc.setFillColor(...AMBER);
  doc.rect(M, y, 3.5, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text(label, M + 7, y + 5.2);

  return y + 7.5 + 5;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function drawFooter(doc: jsPDF, settings: AppSettings, page: number, total: number): void {
  const FY = PAGE_H - FOOTER_H;

  // Amber top rule
  doc.setFillColor(...AMBER);
  doc.rect(0, FY, PAGE_W, 0.7, 'F');

  // Dark footer band
  doc.setFillColor(...DARK);
  doc.rect(0, FY + 0.7, PAGE_W, FOOTER_H, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 150);
  doc.text(
    `Patriot Roofing & Home Repairs  ·  Lexington, NC  ·  ${settings.company.phone}  ·  ${settings.company.website}`,
    PAGE_W / 2, FY + 5, { align: 'center' }
  );
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 120);
  doc.text(
    'Licensed & Insured  ·  GAF Certified  ·  Workmanship Guarantee',
    PAGE_W / 2, FY + 9, { align: 'center' }
  );
  doc.text(`Page ${page} of ${total}`, PAGE_W - M, FY + 7, { align: 'right' });
}
