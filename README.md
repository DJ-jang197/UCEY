# ZonaViva Backend

Backend scaffold for HackCanada 2026.

This branch is focused on:

- geospatial-ready schema and ingestion
- site discovery and detail APIs
- report and score persistence endpoints
- auth-gated save/project endpoints
- demo fallback mode when Supabase is not configured

## Stack

- Next.js 16 App Router
- TypeScript
- Supabase + PostGIS
- Tailwind (included from scaffold; frontend styling is out of scope here)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env:

```bash
cp .env.example .env.local
```

3. Fill Supabase keys in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PROVIDER_TIMEOUT_MS` (optional, defaults to `6000`)

For signed Cloudinary uploads, also set:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

4. Start dev server:

```bash
npm run dev
```

5. Verify health:

```bash
curl http://localhost:3000/api/health
```

## Database Setup

Migration SQL is in:

- `supabase/migrations/20260307090000_init.sql`

Apply migration using Supabase SQL editor or CLI.

Optional commands:

```bash
npm run db:verify
npm run db:seed:demo
npm run ingest:brownfields
```

## Ingestion Notes

Brownfield ingestion expects a CSV at:

- `./data/raw/federal_contaminated_sites.csv`

Override path with:

- `BROWNFIELD_CSV_PATH`

## API Endpoints

- `GET /api/health`
- `GET /api/sites`
- `GET /api/sites/:id`
- `GET /api/sites/top?province=ON&limit=10`
- `GET /api/sites/:id/report`
- `POST /api/sites/:id/report`
- `POST /api/sites/:id/score`
- `GET /api/sites/:id/media`
- `POST /api/sites/:id/save`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:id/sites`
- `POST /api/media/cloudinary/signature`

### Auth behavior in this branch

Protected endpoints currently use request headers:

- `x-user-id`
- `x-user-role` (optional: `planner`, `architect`, `developer`)

If Auth0 env vars are configured, endpoints use the Auth0 session first and auto-provision users into the `users` table on first request.
Header auth remains as a fallback for local integration and teammate testing.

## Deployment Decision

Current decision for speed:

- single Next.js service for API + frontend app shell
- optional separate worker can be introduced later for heavy ingestion jobs
