"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteDetail, UserProject } from "@/lib/types/site";

type ProjectsResponse = {
  items: UserProject[];
  meta: { count: number };
};

type DashboardSite = SiteDetail & {
  nearestTransit?: string;
  neighborhood?: string;
};

export default function Dashboard() {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [sites, setSites] = useState<Record<string, DashboardSite>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/projects", {
          headers: {
            "x-user-id": "demo-planner",
            "x-user-role": "planner",
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load projects (${res.status})`);
        }
        const json = (await res.json()) as ProjectsResponse;
        if (!cancelled) {
          setProjects(json.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load planner projects. Ensure backend auth headers are configured.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSitesForProjects() {
      const siteIds = new Set<string>();
      projects.forEach((project) => {
        project.siteIds.forEach((id) => siteIds.add(id));
      });

      const entries: [string, DashboardSite][] = [];

      for (const id of siteIds) {
        try {
          const res = await fetch(`/api/sites/${id}`);
          if (!res.ok) continue;
          const detail = (await res.json()) as SiteDetail;

          const enriched = await enrichSiteWithPlaces(detail);
          entries.push([id, enriched]);
        } catch {
          // ignore individual failures
        }
      }

      if (!cancelled && entries.length > 0) {
        setSites((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      }
    }

    if (projects.length > 0) {
      loadSitesForProjects();
    }

    return () => {
      cancelled = true;
    };
  }, [projects]);

  const allSites = useMemo(() => Object.values(sites), [sites]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 text-sm text-zinc-100">
      <header className="flex flex-col gap-2 border-b border-zinc-800 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">
              Planner dashboard
            </h1>
            <p className="text-xs text-zinc-400">
              Saved sites, project folders, and role-aware context for{" "}
              <span className="font-medium text-emerald-400">planners</span>,{" "}
              <span className="font-medium text-emerald-400">architects</span>, and{" "}
              <span className="font-medium text-emerald-400">developers</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="rounded-full border border-zinc-700 px-2 py-1">
              Role: planner
            </span>
          </div>
        </div>
      </header>

      {loading && (
        <div className="space-y-2">
          <div className="skeleton w-32" />
          <div className="space-y-1.5">
            <div className="skeleton w-full" />
            <div className="skeleton w-5/6" />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/70 p-3 text-xs text-red-100">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-[2fr,3fr]">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-50">
                Project folders
              </h2>
              <button
                type="button"
                className="rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
              >
                + New project
              </button>
            </div>

            {projects.length === 0 ? (
              <p className="text-xs text-zinc-400">
                No projects yet. Use the API from the backend README to seed demo projects
                or create them from the map once your teammate wires up the save
                endpoint.
              </p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-zinc-50">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-zinc-400">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {project.siteIds.length} sites
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mt-1 rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
                    >
                      Export project as PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-50">
                Saved / bookmarked sites
              </h2>
              <span className="text-[11px] text-zinc-400">
                {allSites.length} enriched with nearby transit
              </span>
            </div>

            {allSites.length === 0 ? (
              <p className="text-xs text-zinc-400">
                Once sites are saved from the map, they will appear here with
                neighborhood context, nearest transit, and a one-click PDF export of the
                memo.
              </p>
            ) : (
              <div className="space-y-3">
                {allSites.map((site) => (
                  <div
                    key={site.id}
                    className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-zinc-50">
                          {site.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {[site.city, site.province].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
                      >
                        PDF export
                      </button>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      <p>
                        Neighborhood:{" "}
                        <span className="text-zinc-200">
                          {site.neighborhood ?? "Loading…"}
                        </span>
                      </p>
                      <p>
                        Nearest transit:{" "}
                        <span className="text-zinc-200">
                          {site.nearestTransit ?? "Loading…"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

async function enrichSiteWithPlaces(site: SiteDetail): Promise<DashboardSite> {
  if (!window.google?.maps?.places) {
    return site;
  }

  const service = new window.google.maps.places.PlacesService(
    document.createElement("div"),
  );

  const location = { lat: site.lat, lng: site.lng };

  const transitPromise = new Promise<string | undefined>((resolve) => {
    service.nearbySearch(
      {
        location,
        radius: 500,
        type: "transit_station",
      },
      (results) => {
        const nearestTransit = results?.[0]?.name ?? undefined;
        resolve(nearestTransit);
      },
    );
  });

  const neighborhoodPromise = new Promise<string | undefined>((resolve) => {
    const geocoder = new window.google!.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status !== "OK" || !results || results.length === 0) {
        resolve(undefined);
        return;
      }
      const neighborhoodResult =
        results.find((r) =>
          r.types.includes("neighborhood"),
        ) ?? results[0];
      resolve(neighborhoodResult.formatted_address);
    });
  });

  const [nearestTransit, neighborhood] = await Promise.all([
    transitPromise,
    neighborhoodPromise,
  ]);

  return {
    ...site,
    nearestTransit,
    neighborhood,
  };
}

