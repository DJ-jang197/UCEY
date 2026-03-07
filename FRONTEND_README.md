## ReZone Frontend (HC\_FrontEnd)

**ReZone** is a planner- and architect-facing interface for identifying underused Canadian land (brownfields, parking lots, dead malls, rail corridors) and exploring their conversion into housing.  
This README describes the **frontend** implemented on the `HC_FrontEnd` branch.

### Stack

- **Next.js App Router** (`src/app`)
- **TypeScript**
- **Tailwind CSS v4** (utility classes from scaffold)
- **Custom CSS** in `src/app/globals.css` (panel, badges, skeleton, pulse, audio, Places input)
- **Google Maps JavaScript API + Places** for the interactive basemap, city search, and nearby transit enrichment
- **Recharts** for cost / capacity bar charts
- **Auth0 + Supabase** session and data are consumed via existing backend API routes

### Key Screens

- **`/` – Map view**
  - Full-screen dark Google map of Canada
  - Colored dot markers per site type (brownfield, parking lot, rail corridor, dead mall)
  - Pulse animation for top-viability sites (`.marker-pulse`)
  - **Google Places city autocomplete** search bar (restricted to Canada)
  - Filter bar (city, land type, min viability, min site size)
  - Slide-in **site detail panel** (scores, estimates, AI memo, audio)

- **`/dashboard` – Planner dashboard**
  - Project folders loaded from `/api/projects`
  - Saved / bookmarked sites (resolved from `siteIds` and `/api/sites/:id`)
  - Google Places Nearby Search to show nearest transit + neighborhood labels
  - Placeholder PDF export buttons for per-site reports

### Environment & API Keys

- **Google Maps + Places**
  - The Places script is loaded in the root layout via:
    - `https://maps.googleapis.com/maps/api/js?key=...&libraries=places`
  - Autocomplete and Places services are used on the client only.

- **Backend APIs**
  - All data comes from existing routes, e.g.:
    - `GET /api/sites/top`
    - `GET /api/sites/:id`
    - `GET /api/sites/:id/report`
    - `GET /api/projects`

### Development

1. Install dependencies (requires Node + npm):

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Auth0 keys if you want real sessions

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Visit:

   - `http://localhost:3000/` for the map
   - `http://localhost:3000/dashboard` for the planner dashboard

### Structure (frontend-relevant files)

- `src/app/page.tsx` – main map shell
- `src/app/dashboard/page.tsx` – dashboard entry
- `src/app/components/MainMap.tsx` – orchestrates map, filters, panel
- `src/app/components/Map.tsx` – Google Maps wrapper + markers
- `src/app/components/PlacesSearch.tsx` – Google Places city autocomplete
- `src/app/components/FilterBar.tsx` – map filters
- `src/app/components/SitePanel.tsx` – slide-in detail panel
- `src/app/components/SiteCard.tsx` – summary of scores & badges
- `src/app/components/CostChart.tsx` – Recharts bar chart
- `src/app/components/ReportDisplay.tsx` – Gemini memo display (uses `/api/sites/:id/report`)
- `src/app/components/AudioPlayer.tsx` – ElevenLabs audio player UI
- `src/app/components/Dashboard.tsx` – saved sites + project folders
- `src/app/globals.css` – global theme + panel, skeleton, pulse, audio, Places styles

### Notes

- Existing backend files and API logic remain untouched; the frontend only consumes them.
- `todo.md` at the repo root tracks remaining frontend polish and integration tasks.

