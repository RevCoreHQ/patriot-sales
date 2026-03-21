import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { Quote, AppSettings } from '@/types';

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildEmailHtml(quote: Quote, settings: AppSettings): string {
  const lineItemsHtml = quote.lineItems.map(item => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1e1e26;color:#e5e5e5;font-size:13px">${item.description}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1e1e26;color:#6b7280;font-size:12px;text-align:right">${item.unit !== 'flat' ? `${item.quantity} ${item.unit}` : '—'}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1e1e26;color:#ffffff;font-size:13px;text-align:right;font-weight:600">${fmtCurrency(item.total)}</td>
    </tr>
  `).join('');

  const projectTypes = quote.projectTypes
    .map(pt => `<span style="background:#1e1e28;color:#d1d5db;padding:4px 12px;border-radius:20px;font-size:12px;margin-right:6px;display:inline-block;margin-bottom:6px;text-transform:capitalize">${pt.replace(/-/g, ' ')}</span>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08080f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:40px 20px">

    <!-- Header -->
    <div style="background:#0d0d15;border-radius:16px;overflow:hidden;margin-bottom:16px;border:1px solid #1e1e2a">
      <div style="background:linear-gradient(135deg,#fb8e28,#e67a1f);padding:28px 32px;position:relative">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;color:rgba(0,0,0,0.5);text-transform:uppercase;margin-bottom:4px">Patriot Roofing & Home Repairs</div>
        <div style="font-size:24px;font-weight:800;color:#000;line-height:1.2">Your Custom Estimate</div>
        <div style="font-size:13px;color:rgba(0,0,0,0.55);margin-top:4px">${settings.company.tagline}</div>
      </div>
      <div style="padding:24px 32px">
        <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px">${quote.client.name}</div>
        <div style="font-size:13px;color:#6b7280">Valid until ${fmtDate(quote.validUntil)}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:2px">Prepared by ${quote.salesRep ?? settings.salesRep.name} · ${settings.salesRep.phone}</div>
      </div>
    </div>

    <!-- Project scope -->
    <div style="background:#0d0d15;border:1px solid #1e1e2a;border-radius:12px;padding:20px 24px;margin-bottom:12px">
      <div style="font-size:10px;font-weight:700;color:#fb8e28;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">Project Scope</div>
      <div>${projectTypes}</div>
      <div style="color:#6b7280;font-size:12px;margin-top:6px">
        ${quote.siteConditions.roofArea?.toLocaleString()} sq ft
        ${quote.siteConditions.tearOff ? ' · Tear-off included' : ''}
      </div>
    </div>

    <!-- Line items -->
    <div style="background:#0d0d15;border:1px solid #1e1e2a;border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div style="padding:14px 16px;border-bottom:1px solid #1e1e26">
        <div style="font-size:10px;font-weight:700;color:#fb8e28;text-transform:uppercase;letter-spacing:0.1em">Scope of Work</div>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#111118">
            <th style="padding:8px 16px;text-align:left;font-size:10px;color:#4b5563;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Description</th>
            <th style="padding:8px 16px;text-align:right;font-size:10px;color:#4b5563;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Qty</th>
            <th style="padding:8px 16px;text-align:right;font-size:10px;color:#4b5563;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Amount</th>
          </tr>
        </thead>
        <tbody>${lineItemsHtml}</tbody>
      </table>
      <div style="padding:16px;border-top:1px solid #1e1e26">
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#6b7280">
          <span>Subtotal</span><span style="color:#e5e5e5">${fmtCurrency(quote.subtotal)}</span>
        </div>
        ${quote.discountPercent > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#34d399"><span>Discount (${quote.discountPercent}%)</span><span>-${fmtCurrency(quote.discountAmount)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#6b7280">
          <span>Tax (${quote.taxRate}%)</span><span style="color:#e5e5e5">${fmtCurrency(quote.taxAmount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0 4px;border-top:1px solid #252530;margin-top:8px">
          <span style="font-size:15px;font-weight:700;color:#fff">Total Investment</span>
          <span style="font-size:22px;font-weight:800;color:#fb8e28">${fmtCurrency(quote.total)}</span>
        </div>
      </div>
    </div>

    ${quote.notes ? `
    <!-- Notes -->
    <div style="background:#0d0d15;border:1px solid #1e1e2a;border-radius:12px;padding:20px 24px;margin-bottom:12px">
      <div style="font-size:10px;font-weight:700;color:#fb8e28;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Project Notes</div>
      <p style="color:#d1d5db;font-size:13px;line-height:1.7;margin:0">${quote.notes}</p>
    </div>` : ''}

    <!-- Financing callout -->
    <div style="background:linear-gradient(135deg,rgba(251,142,40,0.1),rgba(251,142,40,0.04));border:1px solid rgba(251,142,40,0.25);border-radius:12px;padding:20px 24px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:700;color:#fb8e28;margin-bottom:4px">Flexible Financing Available</div>
      <div style="font-size:12px;color:#9ca3af;line-height:1.6">Finance your project through our partner Lyon Financial — competitive rates, no home equity required. Ask your sales rep for personalized financing options.</div>
    </div>

    <!-- PDF note -->
    <div style="background:#0d0d15;border:1px solid #1e1e2a;border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:4px">📄 Estimate Attached</div>
      <div style="font-size:12px;color:#6b7280">A full PDF copy of this estimate is attached to this email for your records.</div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:0 0 8px;color:#4b5563;font-size:12px;line-height:2">
      <div style="color:#fb8e28;font-weight:700;font-size:14px;margin-bottom:4px">${settings.company.name}</div>
      <div>${settings.company.phone} · ${settings.company.email}</div>
      <div>${settings.company.address}</div>
      <div style="margin-top:8px;font-size:11px;color:#374151">Licensed & Insured · GAF Certified · Workmanship Guarantee</div>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { quote, settings, pdfBase64 } = await req.json() as {
      quote: Quote;
      settings: AppSettings;
      pdfBase64?: string;
    };

    if (!quote.client.email) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 });
    }

    const html = buildEmailHtml(quote, settings);
    const clientSlug = quote.client.name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');

    const emailPayload: Parameters<typeof resend.emails.send>[0] = {
      from: `${settings.company.name} <quotes@patriotroofingandhomerepair.com>`,
      to: [quote.client.email],
      subject: `Your Estimate from ${settings.company.name} — ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(quote.total)}`,
      html,
    };

    if (pdfBase64) {
      emailPayload.attachments = [
        {
          filename: `Patriot-Estimate-${clientSlug}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
        },
      ];
    }

    const { data, error } = await resend.emails.send(emailPayload);
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('send-quote error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
