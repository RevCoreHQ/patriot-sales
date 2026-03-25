import { createClient } from '../client';
import type { Project } from '@/types';

function projectToRow(project: Project, orgId: string) {
  return {
    id: project.id,
    org_id: orgId,
    quote_id: project.quoteId,
    client_name: project.clientName,
    project_types: project.projectTypes,
    total_value: project.totalValue,
    phase: project.phase,
    start_date: project.startDate ?? null,
    estimated_completion: project.estimatedCompletion ?? null,
    actual_completion: project.actualCompletion ?? null,
    cash_collected: project.cashCollected,
    payments: project.payments,
    updates: project.updates,
    todos: project.todos,
    closeout_checklist: project.closeoutChecklist,
    photos: project.photos,
    ghl_contact_id: project.ghlContactId ?? null,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(row: any): Project {
  return {
    id: row.id,
    quoteId: row.quote_id,
    clientName: row.client_name,
    projectTypes: row.project_types,
    totalValue: Number(row.total_value),
    phase: row.phase,
    startDate: row.start_date ?? undefined,
    estimatedCompletion: row.estimated_completion ?? undefined,
    actualCompletion: row.actual_completion ?? undefined,
    cashCollected: Number(row.cash_collected),
    payments: row.payments ?? [],
    updates: row.updates ?? [],
    todos: row.todos ?? [],
    closeoutChecklist: row.closeout_checklist ?? [],
    photos: row.photos ?? [],
    ghlContactId: row.ghl_contact_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchProjects(orgId: string): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToProject);
}

export async function upsertProject(project: Project, orgId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .upsert(projectToRow(project, orgId));
  return { error };
}

export async function deleteProject(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  return { error };
}
