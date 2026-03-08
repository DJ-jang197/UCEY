# UCEY

**Know your ground before you build.**

UCEY is a planner-facing map and dashboard for turning Canadian underused land into housing: brownfields, parking lots, dead malls, and rail corridors. Built for urban planners, architects, and municipal governments. Filter by city and viability, open a site for scores and cost estimates, and generate an AI memo with optional text-to-speech.

---

## What you need to know

**Data**

- **Primary:** Sites stored in Supabase (schema in `supabase/migrations/`). Seed demo sites with `npm run db:seed:demo`.
- **Federal contaminated sites (FCSI):** Optional CSV-based layer. Place the federal contaminated sites CSV at `./data/raw/federal_contaminated_sites.csv` (or set `BROWNFIELD_CSV_PATH`), then run `npm run data:build` and `npm run ingest:brownfields`. The app merges FCSI with DB sites when `/api/sites/fcsi` is available.
- **Demo coverage:** Seed data includes Montreal, Ottawa, Toronto, and Vancouver with brownfield, parking lot, rail corridor, and dead mall examples so the map and reports work out of the box.

**Integrations**

- **AI memos:** Gemini (set `GEMINI_API_KEY` in `.env.local`).
- **Audio reports:** ElevenLabs text-to-speech (set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`). If unset, the report is text-only and the "Generate and play audio" flow is disabled.
- **Auth:** Optional Auth0; header-based `x-user-id` / `x-user-role` remains for local and teammate testing.

---

## Stack

- Next.js 16 (App Router), TypeScript
- Supabase (sites, reports, scores)
- Tailwind CSS, Leaflet for the map
- Google Gemini, ElevenLabs (optional)

---

## Quick start

```bash
cp .env.example .env.local
# Edit .env.local: add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY at minimum.

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Health check: `GET /api/health`.

**Optional:** Apply migrations from `supabase/migrations/`, then:

```bash
npm run db:seed:demo
```

For FCSI brownfield data: run `npm run data:build` and `npm run ingest:brownfields` (see [Data](#data) below).

---

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Required for DB-backed sites and reports. |
| `GEMINI_API_KEY` | AI-generated site memos. |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Text-to-speech for report summaries. |
| `BROWNFIELD_CSV_PATH` | Override path to federal contaminated sites CSV (default: `./data/raw/federal_contaminated_sites.csv`). |
| `ALLOWED_PROVINCES`, `ALLOWED_CITIES` | Ingestion filters (e.g. `ON,BC,QC` and `Toronto,Vancouver,Montreal`). |

---

## Data

- **Seeded sites:** `scripts/seed-demo-sites.ts` upserts from `src/lib/demo/demo-data.ts` into Supabase (sites + scores + reports). Covers four cities and multiple site types.
- **FCSI pipeline:** `scripts/data/build-data-assets.ts` and `scripts/ingest-brownfields.ts` read the federal CSV, filter by province/city, derive scores and cost estimates, and write filtered CSVs and DB rows. Generated artifacts live under `data/raw/` and `data/raw/fcsi/`.
- **APIs:** `GET /api/sites` returns DB sites; `GET /api/sites/fcsi` returns FCSI-derived sites from the built CSVs. The frontend merges both and deduplicates by id.

---

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Service and integration status. |
| `GET /api/sites` | List sites (bbox, city, province, site_type, limit). |
| `GET /api/sites/fcsi` | FCSI-derived sites (when data is built). |
| `GET /api/sites/:id` | Site detail. |
| `GET /api/sites/:id/report` | Stored report; 404 if none. |
| `POST /api/sites/:id/report/generate` | Generate and store report (Gemini + optional ElevenLabs). |
| `POST /api/audio/synthesize` | Body `{ text }`; returns ElevenLabs TTS audio URL. |
| `POST /api/sites/fcsi/report` | Generate report for an FCSI site (no DB site required). |

Auth-gated: save, projects, media (see code for `x-user-id` / Auth0 usage).

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:seed:demo # Seed demo sites into Supabase
npm run ingest:brownfields  # Ingest brownfields from CSV
npm run data:build   # Build FCSI data assets
npm run db:verify    # Verify DB connection and schema
```

---

*UCEY — Planning Homes. HackCanada 2026.*

*Made by Daniel, Adhyan, Yeshi, and Bora.*
