# Backend TODO

Purpose: this is the working document for the backend role on the HackCanada project. It is written so a teammate or another agent can pick up implementation without needing prior chat context.

## Mission

Backend owns the parts that unblock everyone else first:

- database and geospatial model
- ingestion of real site data
- stable APIs for map and site detail views
- auth and user-scoped persistence
- storage for scores, reports, and media references
- demo reliability through caching, seed data, and fallbacks

Non-goals for the first pass:

- pixel-perfect dashboard behavior
- perfect ETL architecture
- blockchain work
- deep Backboard.io integration
- generalized admin tools

## Working assumptions

- Frontend will use `Next.js`.
- Database will be `Supabase` with `PostGIS`.
- Map layer needs fast read APIs and lightweight payloads.
- The demo must not depend on slow live external calls.
- Sponsor visibility matters, but only after the core path works.

If any of those assumptions change, update this file before building further.

## Definition of done for backend MVP

Backend MVP is done when all of the following are true:

- `GET /api/health` returns success in local and deployed environments.
- `GET /api/sites` returns real rows from the database with map-safe payloads.
- `GET /api/sites/:id` returns a detailed site record.
- at least 5 demo sites are seeded and fully usable
- Data/AI can write scores and report outputs back into storage
- authenticated users can save sites and create project folders
- the demo still works if Gemini, ElevenLabs, or SoilGrids is temporarily unavailable

## Priority order

Do these in order unless a blocking dependency forces a change:

1. Project bootstrap and environment contract
2. Supabase schema and PostGIS enablement
3. Brownfield ingestion MVP
4. Read APIs for map and site detail
5. Auth0 integration and user roles
6. Write path for scores and reports
7. Cloudinary asset storage references
8. Demo seeds, caching, and fallback behavior

## Phase 0: Project bootstrap

### TODO

- [ ] Create `Next.js` app with API route support
- [ ] Add `TypeScript`, `Tailwind`, and env loading
- [ ] Add package scripts for `dev`, `build`, `lint`, and `db`
- [ ] Create `.env.example`
- [ ] Create a short `README.md` with local setup
- [ ] Decide whether deployment is direct from app repo or split app plus worker

### Deliverables

- runnable local app
- versioned env contract
- one-command local startup

### Requires from other roles

- Frontend: confirm `Next.js` App Router vs Pages Router
- PM/Pitch: confirm official project name to use in env names, Auth0 app name, and deployment labels

### Blockers if missing

- If router choice is unknown, backend can still start with route handlers, but frontend integration may need renaming later.

## Phase 1: Database and geospatial schema

### TODO

- [ ] Create Supabase project
- [ ] Enable `postgis`
- [ ] Add migrations folder
- [ ] Create core tables:
  - [ ] `sites`
  - [ ] `site_scores`
  - [ ] `site_reports`
  - [ ] `users`
  - [ ] `saved_sites`
  - [ ] `projects`
  - [ ] `project_sites`
  - [ ] `site_media`
- [ ] Add indexes:
  - [ ] spatial index on `sites.geom`
  - [ ] index on `city`
  - [ ] index on `province`
  - [ ] index on `site_type`
  - [ ] index on `viability_score` or equivalent materialized field if used
- [ ] Decide whether parcel geometry is stored now or deferred
- [ ] Add audit columns: `created_at`, `updated_at`, `source`, `source_id`

### Suggested `sites` fields

- `id`
- `name`
- `slug`
- `source`
- `source_id`
- `site_type`
- `status`
- `city`
- `province`
- `country`
- `address`
- `postal_code`
- `lat`
- `lng`
- `geom`
- `area_m2`
- `contamination_status`
- `former_use`
- `zoning_code`
- `asking_price`
- `assessed_land_value`
- `raw_metadata`

### Deliverables

- repeatable migration setup
- documented schema
- sample query proving geospatial reads work

### Requires from other roles

- Data/AI: confirm which score outputs must be persisted and whether they need versioning
- Frontend: confirm which site fields must exist in the first site detail panel

### Blockers if missing

- If frontend has no panel field list yet, use the suggested fields above and treat the API response as provisional v1.

## Phase 2: Real data ingestion

### TODO

- [ ] Identify first ingest source: Federal Contaminated Sites Inventory
- [ ] Build one repeatable ingestion script
- [ ] Normalize source data into canonical `sites` records
- [ ] Store unparsed source payload in `raw_metadata`
- [ ] Seed at least 5 known demo sites manually if source data is messy
- [ ] Add import logging
- [ ] Add dedupe rule based on `source + source_id` or location tolerance
- [ ] Confirm whether OSM-derived land types land in `sites` or a separate overlay table

### Deliverables

- database contains real site records
- import can be rerun safely
- at least one province or city is queryable end to end

### Requires from other roles

- Data/GIS: confirm whether parking lots, rail corridors, golf courses, and dead malls should be merged into one table or exposed as separate overlays
- PM/Pitch: identify 5 to 10 specific cities or sites needed for the live demo so ingestion can prioritize them

### Blockers if missing

- If overlay strategy is unknown, ingest brownfields into `sites` and defer non-brownfield overlays into `site_overlays` later.

## Phase 3: Read APIs for the app

### TODO

- [ ] Implement `GET /api/health`
- [ ] Implement `GET /api/sites`
- [ ] Implement `GET /api/sites/:id`
- [ ] Implement `GET /api/sites/top`
- [ ] Add query params to `GET /api/sites`:
  - [ ] `bbox`
  - [ ] `city`
  - [ ] `province`
  - [ ] `site_type`
  - [ ] `limit`
- [ ] Return lightweight list payloads for map markers
- [ ] Return richer detail payload for one site
- [ ] Add API error format and status code conventions
- [ ] Add simple request logging

### Deliverables

- frontend can render map markers from live data
- frontend can open a detail panel for a selected site
- top-sites endpoint can power the demo ranking list

### Requires from other roles

- Frontend: confirm exact filter controls they will expose on day 1
- Frontend: confirm whether site detail uses camelCase or snake_case response keys
- PM/Pitch: confirm whether `Top 10 in Ontario` is the official leaderboard shown in demo

### Blockers if missing

- If casing is unknown, use camelCase in API responses and keep database snake_case internally.

## Phase 4: Auth0 and user-scoped data

### TODO

- [ ] Create Auth0 tenant/app
- [ ] Configure callback URLs for local and deployed environments
- [ ] Implement login and session validation
- [ ] Map roles:
  - [ ] `planner`
  - [ ] `architect`
  - [ ] `developer`
- [ ] Add user provisioning on first login
- [ ] Implement `POST /api/sites/:id/save`
- [ ] Implement `GET /api/projects`
- [ ] Implement `POST /api/projects`
- [ ] Implement `POST /api/projects/:id/sites`
- [ ] Add row-level protection or service-side checks

### Deliverables

- authenticated saves work
- dashboard project folders are stored per user
- role value is available to frontend and API

### Requires from other roles

- Frontend: define login entry points and whether public browsing is allowed without auth
- PM/Pitch: confirm which roles must be visible in the demo and whether each needs a distinct UI

### Blockers if missing

- If public vs private browsing is undecided, default to public map reads and authenticated saves.

## Phase 5: Scores, reports, and analysis storage

### TODO

- [ ] Add write endpoint for computed scores
- [ ] Add write endpoint for generated reports
- [ ] Persist status values: `pending`, `ready`, `failed`
- [ ] Store provider metadata and timestamps
- [ ] Decide whether scores live in `site_scores` only or are denormalized into `sites`
- [ ] Add fetch endpoint for report reads
- [ ] Add retry-safe update semantics

### Candidate endpoints

- [ ] `POST /api/sites/:id/score`
- [ ] `POST /api/sites/:id/report`
- [ ] `GET /api/sites/:id/report`

### Deliverables

- Data/AI can persist outputs without touching frontend code
- frontend can display the latest report and score state

### Requires from other roles

- Data/AI: define exact request body for score submission
- Data/AI: define report structure from Gemini output
- Frontend: define fields needed in the site detail view when a report is ready, pending, or failed

### Blockers if missing

- If score schema is unknown, store raw payloads in JSON with a minimal typed wrapper:
  - `siteId`
  - `status`
  - `provider`
  - `summary`
  - `rawJson`

## Phase 6: Media and file references

### TODO

- [ ] Integrate Cloudinary config
- [ ] Store audio asset URLs from ElevenLabs output
- [ ] Store generated image and render URLs
- [ ] Add `site_media` lookup by site
- [ ] Decide whether uploads are direct from frontend or proxied through backend

### Deliverables

- report audio and site imagery can be attached to a site
- frontend has stable URLs to render

### Requires from other roles

- Frontend: confirm direct-upload vs signed-upload flow
- 3D/AR: define file types and expected outputs for renders or previews
- Data/AI: confirm whether report audio is generated synchronously or as a background step

### Blockers if missing

- If upload flow is unknown, backend should store URL references only and defer upload orchestration.

## Phase 7: Demo reliability and fallback path

### TODO

- [ ] Pre-seed 5 to 10 polished demo sites
- [ ] Precompute or cache top site rankings
- [ ] Add fallback JSON for report and score payloads
- [ ] Make sure no critical demo screen depends on a live external API call
- [ ] Add timeout handling around third-party providers
- [ ] Add a simple admin or script path to refresh demo data

### Deliverables

- demo can survive provider outages or latency spikes
- presentation path is deterministic

### Requires from other roles

- PM/Pitch: provide the final demo flow and site order
- Frontend: identify which screens must work offline or with cached content

### Blockers if missing

- If no final demo flow exists, optimize for the map, site detail, report, and top-sites screens only.

## API contract draft

These can be used until the frontend team asks for changes.

### `GET /api/sites`

```json
{
  "items": [
    {
      "id": "site_123",
      "name": "Hamilton Industrial Parcel",
      "lat": 43.2557,
      "lng": -79.8711,
      "siteType": "brownfield",
      "city": "Hamilton",
      "province": "ON",
      "viabilityScore": 78
    }
  ],
  "meta": {
    "count": 1
  }
}
```

### `GET /api/sites/:id`

```json
{
  "id": "site_123",
  "name": "Hamilton Industrial Parcel",
  "siteType": "brownfield",
  "city": "Hamilton",
  "province": "ON",
  "coordinates": {
    "lat": 43.2557,
    "lng": -79.8711
  },
  "areaM2": 24000,
  "contaminationStatus": "moderate",
  "formerUse": "industrial",
  "scores": {
    "viability": 78,
    "soil": 64,
    "infrastructure": 82
  },
  "estimates": {
    "units": 180,
    "remediationCost": 2100000,
    "timelineMonths": 20
  }
}
```

### `GET /api/sites/:id/report`

```json
{
  "siteId": "site_123",
  "status": "ready",
  "summary": "Viable mid-rise redevelopment candidate.",
  "audioUrl": "https://example.com/report.mp3",
  "imageUrls": [
    "https://example.com/render-1.jpg"
  ]
}
```

## Open questions for other roles

These are the unknowns that should be answered early. Until then, backend should use the default noted here.

1. Frontend router choice
Default: Next.js App Router

2. API response casing
Default: camelCase

3. Public access policy
Default: public read, auth required for saves and projects

4. Site detail field list
Default: use the fields in the Phase 1 schema section

5. Leaderboard definition
Default: `Top 10 highest viability sites in Ontario`

6. Upload path
Default: backend stores media URLs only; upload mechanism can be added later

7. Overlay storage model
Default: brownfields in `sites`, other land categories in a future overlay table

8. Score payload format
Default: typed summary fields plus raw JSON blob

## Cut order if time slips

Cut these first:

1. Tailscale setup
2. Vultr complexity beyond one working deploy
3. advanced role logic
4. background job infrastructure
5. full Cloudinary upload flow
6. nonessential overlay datasets
7. Solana
8. Backboard.io

Do not cut:

1. schema and migrations
2. real site ingestion
3. map list API
4. site detail API
5. auth for saves
6. demo seed data

## First executable task list

If a new agent starts backend from zero, this is the immediate build order:

1. scaffold Next.js app
2. create `.env.example`
3. set up Supabase and enable PostGIS
4. write initial migration for core tables
5. add one ingestion script for brownfield data
6. seed 5 demo sites
7. implement `GET /api/health`
8. implement `GET /api/sites`
9. implement `GET /api/sites/:id`
10. implement `GET /api/sites/top`
11. integrate Auth0
12. implement save and project endpoints
13. add score/report write and read endpoints
14. add demo fallback data and timeouts

## Update protocol

When backend work starts, keep this file current:

- mark completed items with `[x]`
- add newly discovered blockers under the relevant phase
- when another role must provide something, record it under `Requires from other roles`
- if an assumption becomes wrong, update `Working assumptions`

