"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteDetail, SiteListItem, SiteReport } from "@/lib/types/site";
import Map from "./Map";
import SitePanel from "./SitePanel";
import FilterBar, { FiltersState } from "./FilterBar";

type Center = {
  lat: number;
  lng: number;
  name?: string;
};

const defaultCenter: Center = {
  lat: 43.6532,
  lng: -79.3832,
  name: "Toronto",
};

const CITY_PRESETS: Center[] = [
  { name: "Montreal", lat: 45.5019, lng: -73.5674 },
  { name: "Ottawa", lat: 45.4215, lng: -75.6972 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", lat: 49.2827, lng: -123.1207 },
];

export default function MainMap() {
  const [sites, setSites] = useState<SiteListItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [sitesError, setSitesError] = useState<string | null>(null);

  const [selectedSite, setSelectedSite] = useState<SiteDetail | null>(null);
  const [loadingSiteDetail, setLoadingSiteDetail] = useState(false);

  const [report, setReport] = useState<SiteReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [center, setCenter] = useState<Center>(defaultCenter);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [filters, setFilters] = useState<FiltersState>({
    city: "",
    landType: "all",
    minViability: 0,
    minArea: 0,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.style.setProperty("--background", "#020617");
      root.style.setProperty("--foreground", "#e5e7eb");
    } else {
      root.style.setProperty("--background", "#ffffff");
      root.style.setProperty("--foreground", "#111827");
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      setLoadingSites(true);
      setSitesError(null);
      try {
        const res = await fetch("/api/sites?limit=300");
        if (!res.ok) {
          throw new Error(`Failed to load sites (${res.status})`);
        }
        const json = await res.json();
        const items = Array.isArray(json.items) ? json.items : [];
        if (!cancelled) {
          setSites(items);
          if (items.length === 0) {
            setSitesError("No site data found yet. Seed or ingest data to see markers.");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSitesError(
            error instanceof Error ? error.message : "Unable to load demo sites.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSites(false);
        }
      }
    }

    loadSites();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      if (filters.city && !site.city?.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }

      if (filters.landType !== "all") {
        const type = site.siteType.toLowerCase();
        if (!type.includes(filters.landType)) {
          return false;
        }
      }

      if (filters.minViability > 0) {
        const v = site.viabilityScore ?? 0;
        if (v < filters.minViability) return false;
      }

      // Area filter applies only when we have detail; list items may not include area.
      return true;
    });
  }, [sites, filters]);

  const handleCityPresetClick = (city: Center) => {
    setCenter(city);
    if (city.name) {
      setFilters((prev) => ({ ...prev, city: city.name ?? "" }));
    }
  };

  const handleFiltersChange = (next: FiltersState) => {
    setFilters(next);
  };

  const handleSiteSelect = async (siteId: string) => {
    setIsPanelOpen(true);
    setLoadingSiteDetail(true);
    setReport(null);
    setReportError(null);

    try {
      const res = await fetch(`/api/sites/${siteId}`);
      if (!res.ok) {
        throw new Error(`Failed to load site (${res.status})`);
      }
      const json = (await res.json()) as SiteDetail;
      setSelectedSite(json);
      if (json.lat && json.lng) {
        setCenter({ lat: json.lat, lng: json.lng, name: json.city ?? undefined });
      }
    } catch {
      setSelectedSite(null);
    } finally {
      setLoadingSiteDetail(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedSite) return;
    setLoadingReport(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/sites/${selectedSite.id}/report`);
      if (!res.ok) {
        if (res.status === 404) {
          setReportError("No report exists for this site yet.");
          return;
        }
        throw new Error(`Failed to load report (${res.status})`);
      }
      const json = (await res.json()) as SiteReport;
      setReport(json);
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "Unable to load report for this site.",
      );
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className={`map-shell ${isPanelOpen ? "panel-open" : ""}`}>
      <div
        className={`absolute inset-x-0 top-0 z-20 flex justify-center pt-10 pointer-events-none transition-all duration-300 ${
          isPanelOpen ? "pr-[440px]" : ""
        }`}
      >
        <div className="flex w-full max-w-4xl flex-col items-center gap-4 px-4 pointer-events-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-gradient-to-r from-emerald-50/70 via-sky-50/70 to-indigo-50/70 px-6 py-5 shadow-xl border border-slate-200/70 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h1 className="flex-1 text-center text-3xl font-semibold tracking-tight text-slate-900">
                ReZone — Canadian infill explorer
              </h1>
              <button
                type="button"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="rounded-full border border-emerald-300 bg-white/80 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:bg-emerald-50"
              >
                {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
              </button>
            </div>
            <p className="mt-2 text-center text-sm text-slate-600">
              Scan underused land across Canada, filter by viability, and open a site panel for
              scores, cost estimates, AI memo, and audio.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {CITY_PRESETS.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleCityPresetClick(city)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition transform hover:-translate-y-0.5 hover:shadow ${
                    filters.city.toLowerCase() === city.name?.toLowerCase()
                      ? "bg-emerald-500 text-white"
                      : "bg-white/80 text-slate-800 border border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full max-w-3xl flex justify-center">
            <FilterBar filters={filters} onChange={handleFiltersChange} />
          </div>
        </div>
      </div>

      <Map
        sites={filteredSites}
        loading={loadingSites}
        error={sitesError}
        center={center}
        onSiteSelect={handleSiteSelect}
        selectedSiteId={selectedSite?.id ?? null}
      />

      <SitePanel
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        site={selectedSite}
        loadingSite={loadingSiteDetail}
        report={report}
        loadingReport={loadingReport}
        reportError={reportError}
        onGenerateReport={handleGenerateReport}
      />
    </div>
  );
}
