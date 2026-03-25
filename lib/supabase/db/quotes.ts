import { createClient } from '../client';
import type { Quote } from '@/types';

function quoteToRow(quote: Quote, orgId: string) {
  return {
    id: quote.id,
    org_id: orgId,
    client: quote.client,
    status: quote.status,
    project_types: quote.projectTypes,
    site_conditions: quote.siteConditions,
    material_selections: quote.materialSelections,
    addon_selections: quote.addonSelections,
    line_items: quote.lineItems,
    subtotal: quote.subtotal,
    discount_percent: quote.discountPercent,
    discount_name: quote.discountName ?? null,
    discount_amount: quote.discountAmount,
    price_override: quote.priceOverride ?? null,
    tax_rate: quote.taxRate,
    tax_amount: quote.taxAmount,
    total: quote.total,
    notes: quote.notes ?? null,
    internal_notes: quote.internalNotes ?? null,
    signature_data: quote.signatureData ?? null,
    signed_at: quote.signedAt ?? null,
    signed_by: quote.signedBy ?? null,
    sales_rep: quote.salesRep ?? null,
    presented_at: quote.presentedAt ?? null,
    valid_until: quote.validUntil,
    created_at: quote.createdAt,
    updated_at: quote.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToQuote(row: any): Quote {
  return {
    id: row.id,
    client: row.client,
    status: row.status,
    projectTypes: row.project_types,
    siteConditions: row.site_conditions,
    materialSelections: row.material_selections,
    addonSelections: row.addon_selections,
    lineItems: row.line_items,
    subtotal: Number(row.subtotal),
    discountPercent: Number(row.discount_percent),
    discountName: row.discount_name ?? undefined,
    discountAmount: Number(row.discount_amount),
    priceOverride: row.price_override != null ? Number(row.price_override) : undefined,
    taxRate: Number(row.tax_rate),
    taxAmount: Number(row.tax_amount),
    total: Number(row.total),
    notes: row.notes ?? undefined,
    internalNotes: row.internal_notes ?? undefined,
    signatureData: row.signature_data ?? undefined,
    signedAt: row.signed_at ?? undefined,
    signedBy: row.signed_by ?? undefined,
    salesRep: row.sales_rep ?? undefined,
    presentedAt: row.presented_at ?? undefined,
    validUntil: row.valid_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchQuotes(orgId: string): Promise<Quote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToQuote);
}

export async function fetchQuoteById(id: string): Promise<Quote | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToQuote(data);
}

export async function upsertQuote(quote: Quote, orgId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('quotes')
    .upsert(quoteToRow(quote, orgId));
  return { error };
}

export async function deleteQuote(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id);
  return { error };
}
