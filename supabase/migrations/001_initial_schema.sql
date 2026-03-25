-- ============================================================================
-- Patriot Sales — Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 0. Extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. Organizations
-- ============================================================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 2. Profiles (extends auth.users)
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid not null references organizations on delete cascade,
  name text not null,
  pin text not null, -- 4-digit PIN for quick iPad login
  role text not null default 'sales' check (role in ('admin', 'sales', 'production')),
  created_at timestamptz not null default now()
);

create index idx_profiles_org on profiles(org_id);

-- ============================================================================
-- 3. App Settings (singleton per org)
-- ============================================================================
create table app_settings (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null unique references organizations on delete cascade,
  theme text not null default 'light',
  team jsonb not null default '[]'::jsonb,
  company jsonb not null default '{}'::jsonb,
  sales_rep jsonb not null default '{}'::jsonb,
  pricing jsonb not null default '{}'::jsonb,
  financing jsonb not null default '[]'::jsonb,
  presentation jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 4. Quotes
-- ============================================================================
create table quotes (
  id text primary key,
  org_id uuid not null references organizations on delete cascade,
  client jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'presented', 'accepted', 'lost', 'expired')),
  project_types jsonb not null default '[]'::jsonb,
  site_conditions jsonb not null default '{}'::jsonb,
  material_selections jsonb not null default '[]'::jsonb,
  addon_selections jsonb not null default '[]'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  discount_percent numeric not null default 0,
  discount_name text,
  discount_amount numeric not null default 0,
  price_override numeric,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,
  total numeric not null default 0,
  notes text,
  internal_notes text,
  signature_data text,
  signed_at timestamptz,
  signed_by text,
  sales_rep text,
  presented_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quotes_org on quotes(org_id);
create index idx_quotes_status on quotes(org_id, status);

-- ============================================================================
-- 5. Projects
-- ============================================================================
create table projects (
  id text primary key,
  org_id uuid not null references organizations on delete cascade,
  quote_id text references quotes(id) on delete set null,
  client_name text not null,
  project_types jsonb not null default '[]'::jsonb,
  total_value numeric not null default 0,
  phase text not null default 'design-review'
    check (phase in ('design-review', 'permitting', 'site-prep', 'installation', 'finishing', 'delivered')),
  start_date timestamptz,
  estimated_completion timestamptz,
  actual_completion timestamptz,
  cash_collected numeric not null default 0,
  payments jsonb not null default '[]'::jsonb,
  updates jsonb not null default '[]'::jsonb,
  todos jsonb not null default '[]'::jsonb,
  closeout_checklist jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  ghl_contact_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_org on projects(org_id);
create index idx_projects_phase on projects(org_id, phase);

-- ============================================================================
-- 6. Project Photos (metadata — actual files in Storage bucket)
-- ============================================================================
create table project_photos (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  org_id uuid not null references organizations on delete cascade,
  phase text not null check (phase in ('before', 'during', 'after')),
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index idx_project_photos_project on project_photos(project_id);

-- ============================================================================
-- 7. Helper: get current user's org_id (for RLS)
-- ============================================================================
create or replace function get_user_org_id()
returns uuid
language sql
security definer
stable
as $$
  select org_id from profiles where id = auth.uid()
$$;

-- ============================================================================
-- 8. Auto-update updated_at trigger
-- ============================================================================
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_quotes_updated_at before update on quotes
  for each row execute function update_updated_at();
create trigger trg_projects_updated_at before update on projects
  for each row execute function update_updated_at();
create trigger trg_settings_updated_at before update on app_settings
  for each row execute function update_updated_at();

-- ============================================================================
-- 9. Row Level Security
-- ============================================================================

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table app_settings enable row level security;
alter table quotes enable row level security;
alter table projects enable row level security;
alter table project_photos enable row level security;

-- Organizations: members can read their own org
create policy "org_read" on organizations for select using (id = get_user_org_id());

-- Profiles: members can read/write profiles in their org
create policy "profiles_all" on profiles for all using (org_id = get_user_org_id());

-- Settings: org members have full access
create policy "settings_all" on app_settings for all using (org_id = get_user_org_id());

-- Quotes: org members have full access
create policy "quotes_all" on quotes for all using (org_id = get_user_org_id());
-- Public read for client-facing quote view (/q/[id])
create policy "quotes_public_read" on quotes for select using (true);

-- Projects: org members have full access
create policy "projects_all" on projects for all using (org_id = get_user_org_id());

-- Project Photos: org members have full access
create policy "photos_all" on project_photos for all using (org_id = get_user_org_id());

-- ============================================================================
-- 10. Storage Bucket for project photos
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', false)
on conflict (id) do nothing;

-- Storage policies: org members can CRUD their own files
create policy "photos_upload" on storage.objects for insert
  with check (bucket_id = 'project-photos' and (storage.foldername(name))[1] = get_user_org_id()::text);

create policy "photos_read" on storage.objects for select
  using (bucket_id = 'project-photos' and (storage.foldername(name))[1] = get_user_org_id()::text);

create policy "photos_delete" on storage.objects for delete
  using (bucket_id = 'project-photos' and (storage.foldername(name))[1] = get_user_org_id()::text);

-- ============================================================================
-- SEED DATA — Run after creating your first auth user
-- ============================================================================
-- Replace the UUIDs below with your actual values:
--
-- 1. Create org:
--    INSERT INTO organizations (id, name) VALUES ('YOUR_ORG_UUID', 'Patriot Roofing');
--
-- 2. Create auth user via Supabase Dashboard (Authentication → Users → Add User)
--    Use email/password. Note the user's UUID.
--
-- 3. Create profile:
--    INSERT INTO profiles (id, org_id, name, pin, role)
--    VALUES ('AUTH_USER_UUID', 'YOUR_ORG_UUID', 'Admin', '1234', 'admin');
--
-- 4. Create initial settings:
--    INSERT INTO app_settings (org_id) VALUES ('YOUR_ORG_UUID');
