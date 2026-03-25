import { createClient } from '../client';
import type { AppSettings } from '@/types';
import { toCamelCase, toSnakeCase } from '../transforms';

export async function fetchSettings(orgId: string): Promise<AppSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error || !data) return null;

  const row = toCamelCase(data as Record<string, unknown>);
  return {
    theme: row.theme as AppSettings['theme'],
    team: row.team as AppSettings['team'],
    company: row.company as AppSettings['company'],
    salesRep: row.salesRep as AppSettings['salesRep'],
    pricing: row.pricing as AppSettings['pricing'],
    financing: row.financing as AppSettings['financing'],
    presentation: row.presentation as AppSettings['presentation'],
    notifications: row.notifications as AppSettings['notifications'],
  };
}

export async function upsertSettings(orgId: string, settings: AppSettings) {
  const supabase = createClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert({
      org_id: orgId,
      theme: settings.theme,
      team: settings.team,
      company: settings.company,
      sales_rep: settings.salesRep,
      pricing: settings.pricing,
      financing: settings.financing,
      presentation: settings.presentation,
      notifications: settings.notifications,
    }, { onConflict: 'org_id' });

  return { error };
}
