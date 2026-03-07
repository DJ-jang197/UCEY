create extension if not exists pgcrypto;
create extension if not exists postgis;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth0_sub text unique,
  email text,
  role text not null default 'planner' check (role in ('planner', 'architect', 'developer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  source text not null,
  source_id text,
  site_type text not null,
  status text not null default 'active',
  city text,
  province text,
  country text not null default 'CA',
  address text,
  postal_code text,
  lat double precision not null,
  lng double precision not null,
  geom geometry(Point, 4326) generated always as (st_setsrid(st_makepoint(lng, lat), 4326)) stored,
  area_m2 numeric,
  contamination_status text,
  former_use text,
  zoning_code text,
  asking_price numeric,
  assessed_land_value numeric,
  viability_score numeric,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create table if not exists site_scores (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  provider text not null default 'manual',
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  viability_score numeric,
  soil_score numeric,
  infrastructure_score numeric,
  housing_units_est integer,
  remediation_cost_est numeric,
  timeline_months_est integer,
  summary text,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, provider)
);

create table if not exists site_reports (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  provider text not null default 'gemini-2.0-flash',
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  summary text not null default '',
  structured_report jsonb not null default '{}'::jsonb,
  audio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, provider)
);

create table if not exists site_media (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'audio', 'render', 'ar')),
  provider text not null default 'cloudinary',
  url text not null,
  public_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, site_id)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_sites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, site_id)
);

create index if not exists idx_sites_geom on sites using gist (geom);
create index if not exists idx_sites_city on sites (city);
create index if not exists idx_sites_province on sites (province);
create index if not exists idx_sites_type on sites (site_type);
create index if not exists idx_sites_viability on sites (viability_score);
create index if not exists idx_scores_site on site_scores (site_id);
create index if not exists idx_reports_site on site_reports (site_id);
create index if not exists idx_projects_user on projects (user_id);
create index if not exists idx_saved_sites_user on saved_sites (user_id);

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at before update on users
for each row execute function set_updated_at();

drop trigger if exists sites_set_updated_at on sites;
create trigger sites_set_updated_at before update on sites
for each row execute function set_updated_at();

drop trigger if exists site_scores_set_updated_at on site_scores;
create trigger site_scores_set_updated_at before update on site_scores
for each row execute function set_updated_at();

drop trigger if exists site_reports_set_updated_at on site_reports;
create trigger site_reports_set_updated_at before update on site_reports
for each row execute function set_updated_at();

drop trigger if exists site_media_set_updated_at on site_media;
create trigger site_media_set_updated_at before update on site_media
for each row execute function set_updated_at();

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at before update on projects
for each row execute function set_updated_at();
