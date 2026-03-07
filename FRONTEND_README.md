# 🍁 ReZone

> **Canada doesn't have a land shortage. It has a land visibility shortage.**

ReZone is a web platform built at **HackCanada 2026** that identifies underused Canadian land — brownfields, parking lots, dead malls, and decommissioned rail corridors — and simulates their conversion into housing. Built for urban planners, architects, and municipal governments.

---

## 🏠 The Problem

Canada needs **3.5 million homes by 2030**. Meanwhile, over **30,000 abandoned and underused sites** sit inside existing cities, already connected to roads, water, and transit infrastructure. These sites go undeveloped not because they're unusable — but because no one has made it easy to assess, compare, and act on them.

ReZone connects the dots.

---

## 💡 What It Does

- **Discovers** underused land across Canada from public data sources — brownfields, surface parking lots, dying malls, decommissioned rail corridors, and golf courses
- **Analyzes** each site's soil composition, contamination risk, and infrastructure readiness
- **Simulates** how many housing units could be built, at what cost, and on what timeline
- **Generates** AI-powered plain-English site reports with voice narration — ready to share with stakeholders
- **Visualizes** proposed housing in 3D and AR directly on the site

---

## 🧱 Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| Next.js (App Router) | Framework |
| TypeScript | Type safety |
| Tailwind CSS v4 + Custom CSS | Styling |
| Google Maps JS API + Places | Interactive map, city search, transit enrichment |
| Recharts | Cost comparison charts |
| Three.js / A-Frame | 3D building simulation + WebAR |

### Backend & Infrastructure
| Tool | Purpose |
|---|---|
| Supabase + PostGIS | Database + geospatial queries |
| Vultr | Cloud hosting + data pipeline compute |
| Tailscale | Secure team networking during build |
| Node.js | API routes + data ingestion |

### AI & Media
| Tool | Purpose |
|---|---|
| Gemini (`gemini-2.0-flash`) | Site analysis + housing report generation |
| ElevenLabs | Voice narration of AI-generated site reports |
| Cloudinary | Image, audio, and AR render storage + optimization |
| Backboard.io | Persistent AI memory per planner + per-site RAG knowledge base |

### Auth
| Tool | Purpose |
|---|---|
| Auth0 | Authentication + role-based access (Planner / Architect / Developer) |

### Data Sources (All Free & Public)
| Source | Data |
|---|---|
| Federal Contaminated Sites Inventory | Brownfield locations across Canada |
| OpenStreetMap Overpass API | Parking lots, rail corridors, golf courses, dead malls |
| StatCan Open DB of Infrastructure | Railway and building data |
| SoilGrids REST API | Soil composition per coordinate (clay, pH, bearing capacity) |
| CanSIS / Agriculture Canada | Canadian-specific soil classification |
| Google Earth Engine (Sentinel-2) | Satellite vegetation stress + surface anomaly detection |
| Municipal Open Data Portals | Zoning rules + assessed land values (Toronto, Vancouver, Calgary) |

---

## 🗺️ Key Features

### Interactive Land Map
Color-coded markers across Canada by site type and viability score. Filter by city, land type, contamination level, and site size. Pulse animation on highest-viability sites.

### Soil & Environmental Analysis
Every site is cross-referenced with SoilGrids API data (clay content, pH, bearing capacity) and a contamination inference engine that estimates risk from the site's land use history. Sentinel-2 satellite imagery flags surface anomalies.

### Housing Simulation Engine
Calculates buildable housing units from lot size and local zoning density. Generates low / mid / high-rise layout options. Estimates remediation cost, construction cost, and timeline from site to shovel-ready.

### AI Site Reports (Gemini + ElevenLabs)
One click generates a plain-English planner memo covering soil suitability, contamination risk, infrastructure readiness, housing potential, and cost comparison. Reports are narrated aloud via ElevenLabs voice synthesis.

### 3D + AR Visualization
Three.js renders proposed buildings directly on the map parcel. A-Frame WebAR lets planners point their phone camera at a real parking lot or brownfield and see the proposed development overlaid in real space.

### Planner Dashboard
Auth0-authenticated workspace with saved sites, custom project folders, role-based views, and PDF report export. Backboard.io persists AI memory per planner across sessions — the platform learns your preferences over time.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/your-team/rezone
cd rezone
npm install
```

### Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyCF0w2ff41nWt4F0YCNBJmdtKrjLSX62PY
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
CLOUDINARY_URL=
BACKBOARD_API_KEY=
```

### Run

```bash
npm run dev
```

Visit:
- `http://localhost:3000` — Map view
- `http://localhost:3000/dashboard` — Planner dashboard

---

## 📁 Project Structure

```
src/
  app/
    page.tsx                  ← Map view entry
    dashboard/page.tsx        ← Planner dashboard entry
    components/
      MainMap.tsx             ← Map orchestrator
      Map.tsx                 ← Google Maps wrapper + markers
      PlacesSearch.tsx        ← City autocomplete (Canada only)
      FilterBar.tsx           ← Land type, viability, size filters
      SitePanel.tsx           ← Slide-in site detail panel
      SiteCard.tsx            ← Scores, badges, soil summary
      CostChart.tsx           ← Recharts cost comparison
      ReportDisplay.tsx       ← Gemini AI memo display
      AudioPlayer.tsx         ← ElevenLabs voice narration player
      Dashboard.tsx           ← Saved sites + project folders
    globals.css               ← Custom CSS (panel, badges, skeleton, pulse, audio)
    api/
      sites/
        top/route.ts          ← Top viability sites
        [id]/route.ts         ← Site detail
        [id]/report/route.ts  ← Gemini report + ElevenLabs audio
      projects/route.ts       ← Planner project folders
```

---

## 👥 Team

| Role | Owns |
|---|---|
| Backend & Infrastructure | Supabase, Auth0, Vultr, Tailscale, API routes |
| Data & AI | OSM ingestion, SoilGrids, Gemini, ElevenLabs, Backboard |
| Frontend & Map | Google Maps, components, dashboard, Recharts |
| 3D / AR & Pitch | Three.js, A-Frame WebAR, Cloudinary, demo video, pitch deck |

---

## 🏆 HackCanada 2026

**Theme:** Solving Problems in Canada
**Track:** Housing & Urban Infrastructure

> *"30,000 sites. 3.5M homes needed. We connect the dots."*