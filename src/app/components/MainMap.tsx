"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SiteDetail, SiteListItem, SiteReport } from "@/lib/types/site";
import MapView from "./Map";
import SitePanel from "./SitePanel";
import FilterBar, { FiltersState } from "./FilterBar";
import LoadingScreen from "./LoadingScreen";

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

/** Geographic center of Canada; used for "All cities" view at zoom 4. */
const ALL_CITIES_CENTER: Center = { lat: 56, lng: -96 };

const CITY_PRESETS: Center[] = [
  { name: "Montreal", lat: 45.5019, lng: -73.5674 },
  { name: "Ottawa", lat: 45.4215, lng: -75.6972 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", lat: 49.2827, lng: -123.1207 },
];

const LOADING_SCREEN_MIN_MS = 800;

export default function MainMap() {
  const [sites, setSites] = useState<SiteListItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

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

  // Per-session client-side cache so we don't call Gemini twice for the same site.
  const reportCacheRef = useRef<Map<string, SiteReport>>(new Map());

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("transition", "background-color 0.3s ease, color 0.3s ease");
    const saved = localStorage.getItem("rezone-theme") as "light" | "dark" | null;
    const resolved = saved === "dark" || saved === "light" ? saved : "light";
    setTheme(resolved);
    root.classList.toggle("dark", resolved === "dark");
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("transition", "background-color 0.3s ease, color 0.3s ease");
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("rezone-theme", theme);
    } catch (_) {}
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      setLoadingSites(true);
      setSitesError(null);
      try {
        const [sitesRes, fcsiRes] = await Promise.all([
          fetch("/api/sites?limit=300"),
          fetch("/api/sites/fcsi").catch(() => null),
        ]);

        const mainJson = sitesRes.ok ? await sitesRes.json() : { items: [] };
        const mainItems = Array.isArray(mainJson.items) ? mainJson.items : [];

        let fcsiItems: typeof mainItems = [];
        if (fcsiRes?.ok) {
          const fcsiJson = await fcsiRes.json();
          fcsiItems = Array.isArray(fcsiJson.items) ? fcsiJson.items : [];
        }

        const merged = [...mainItems];
        const mainIds = new Set(mainItems.map((s: { id: string }) => s.id));
        for (const site of fcsiItems) {
          if (!mainIds.has(site.id)) {
            mainIds.add(site.id);
            merged.push(site);
          }
        }

        if (!cancelled) {
          setSites(merged);
          if (merged.length === 0) {
            setSitesError("No site data found. Seed data or run data:build for FCSI.");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSitesError(
            error instanceof Error ? error.message : "Unable to load sites.",
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

  useEffect(() => {
    if (!loadingSites && showLoadingScreen) {
      const t = setTimeout(() => setShowLoadingScreen(false), LOADING_SCREEN_MIN_MS);
      return () => clearTimeout(t);
    }
  }, [loadingSites, showLoadingScreen]);

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

  const handleShowAllCities = () => {
    setCenter(ALL_CITIES_CENTER);
    setFilters((prev) => ({ ...prev, city: "" }));
  };

  const isAllCitiesView = !filters.city;

  const handleFiltersChange = (next: FiltersState) => {
    setFilters(next);
  };

  const handleSiteSelect = async (siteId: string) => {
    setIsPanelOpen(true);
    setLoadingSiteDetail(true);
    setReport(null);
    setReportError(null);

    const listItem = sites.find((s) => s.id === siteId);

    function applyMinimalFromListItem(item: SiteListItem) {
      const minimal: SiteDetail = {
        ...item,
        contaminationStatus: item.contaminationStatus ?? null,
        formerUse: null,
        areaM2: item.estimatedAreaM2 ?? null,
        scores: {
          viability: item.viabilityScore ?? null,
          soil: item.estimatedSoilScore ?? null,
          infrastructure: item.estimatedInfraScore ?? null,
        },
        estimates: {
          units: item.estimatedUnits ?? null,
          remediationCost: item.estimatedRemediationCost ?? null,
          timelineMonths: item.estimatedTimelineMonths ?? null,
          costPerTonneMin: item.costPerTonneMin ?? null,
          costPerTonneMax: item.costPerTonneMax ?? null,
          costPerTonneAvg: item.costPerTonneAvg ?? null,
        },
      };
      setSelectedSite(minimal);
      if (item.lat && item.lng) {
        setCenter({ lat: item.lat, lng: item.lng, name: item.city ?? undefined });
      }
    }

    try {
      const res = await fetch(`/api/sites/${siteId}`);
      if (!res.ok) {
        if (listItem) {
          applyMinimalFromListItem(listItem);
        } else {
          setSelectedSite(null);
        }
        return;
      }
      const json = (await res.json()) as SiteDetail;
      setSelectedSite(json);
      if (json.lat && json.lng) {
        setCenter({ lat: json.lat, lng: json.lng, name: json.city ?? undefined });
      }
    } catch {
      if (listItem) {
        applyMinimalFromListItem(listItem);
      } else {
        setSelectedSite(null);
      }
    } finally {
      setLoadingSiteDetail(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedSite) return;

    // If we've already generated a report for this site in this session, reuse it.
    const cached = reportCacheRef.current.get(selectedSite.id);
    if (cached) {
      setReport(cached);
      return;
    }

    setLoadingReport(true);
    setReportError(null);
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        selectedSite.id,
      );

      if (isUuid) {
        // DB-backed site: first try to load an existing report from Supabase.
        let res = await fetch(`/api/sites/${selectedSite.id}/report`);
        if (res.status === 404) {
          const generateRes = await fetch(
            `/api/sites/${selectedSite.id}/report/generate`,
            { method: "POST" },
          );
          if (!generateRes.ok) {
            throw new Error(`Failed to generate report (${generateRes.status})`);
          }
          const generated = (await generateRes.json()) as SiteReport;
          reportCacheRef.current.set(selectedSite.id, generated);
          setReport(generated);
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load report (${res.status})`);
        }
        const existing = (await res.json()) as SiteReport;
        reportCacheRef.current.set(selectedSite.id, existing);
        setReport(existing);
      } else {
        // FCSI-only site: generate a transient report via Gemini, no DB.
        const generateRes = await fetch("/api/sites/fcsi/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedSite.id, site: selectedSite }),
        });
        if (!generateRes.ok) {
          throw new Error(`Failed to generate report (${generateRes.status})`);
        }
        const generated = (await generateRes.json()) as SiteReport;
        reportCacheRef.current.set(selectedSite.id, generated);
        setReport(generated);
      }
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
      <LoadingScreen visible={showLoadingScreen} />
      <div
        className={`absolute inset-x-0 top-0 z-20 flex justify-center pt-10 pointer-events-none transition-all duration-300 ${
          isPanelOpen ? "pr-[440px]" : ""
        }`}
      >
        <div className="flex w-full max-w-4xl flex-col items-center gap-4 px-4 pointer-events-auto">
          <div
            className="w-full max-w-3xl rounded-2xl px-6 py-5 shadow-xl border border-[var(--divider)] backdrop-blur-sm transition-colors duration-300 ease-out"
            style={{
              background: `linear-gradient(135deg, var(--bg-input) 0%, var(--bg-main) 50% 100%)`,
              boxShadow: "0 0 80px var(--glow-tr), 0 0 40px var(--glow-bl)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h1 className="flex-1 text-center text-3xl font-semibold tracking-tight text-[var(--text-heading)]">
                ReZone — Planning Homes
              </h1>
              <button
                type="button"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="rounded-full border border-[var(--border-button)] bg-[var(--bg-input)] px-3 py-1.5 text-sm font-medium text-[var(--text-heading)] shadow-sm transition-colors hover:bg-[var(--text-muted)] hover:text-[var(--text-heading)]"
              >
                {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
              </button>
            </div>
            <p className="mt-2 text-center text-sm text-[var(--text-description)]">
              Scan underused land across Canada, filter by viability, and open a site panel for
              scores, cost estimates, AI memo, and audio.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleShowAllCities}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition transform hover:-translate-y-0.5 hover:shadow ${
                  isAllCitiesView
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-main)] hover:bg-[var(--accent-hover)]"
                    : "border-[var(--border-button)] bg-[var(--bg-input)] text-[var(--text-feature)] hover:border-[var(--accent)]"
                }`}
              >
                All cities
              </button>
              {CITY_PRESETS.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleCityPresetClick(city)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--text-feature)] transition transform hover:-translate-y-0.5 hover:shadow ${
                    !isAllCitiesView && filters.city.toLowerCase() === city.name?.toLowerCase()
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-main)] hover:bg-[var(--accent-hover)]"
                      : "border-[var(--border-button)] bg-[var(--bg-input)] hover:border-[var(--accent)]"
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full max-w-3xl flex justify-center">
            <FilterBar filters={filters} onChange={handleFiltersChange} theme={theme} />
          </div>
        </div>
      </div>

      <MapView
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
        theme={theme}
      />
    </div>
  );
}
