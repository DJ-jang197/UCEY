import type { RequestUser } from "@/lib/auth/user";
import { getEnv } from "@/lib/config/env";
import { getDemoStore } from "@/lib/demo/state";
import { withTimeout } from "@/lib/http/timeout";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ReportStatus,
  SiteDetail,
  SiteEstimate,
  SiteListItem,
  SiteMedia,
  SiteReport,
  SiteScore,
  UserProject,
} from "@/lib/types/site";

export type ListSitesParams = {
  bbox?: string;
  city?: string;
  province?: string;
  siteType?: string;
  limit?: number;
};

export type UpsertScoreInput = {
  provider: string;
  status: ReportStatus;
  viabilityScore: number | null;
  soilScore: number | null;
  infrastructureScore: number | null;
  housingUnitsEst: number | null;
  remediationCostEst: number | null;
  timelineMonthsEst: number | null;
  summary: string | null;
  rawJson: Record<string, unknown> | null;
};

export type UpsertReportInput = {
  provider: string;
  status: ReportStatus;
  summary: string;
  audioUrl: string | null;
  imageUrls: string[];
  rawJson: Record<string, unknown> | null;
};

const TOP_SITES_CACHE_TTL_MS = 90_000;

type TopSitesCache = {
  expiresAt: number;
  byKey: Map<string, SiteListItem[]>;
};

declare global {
  var __rezoneTopSitesCache: TopSitesCache | undefined;
}

function getTopSitesCache(): TopSitesCache {
  if (!globalThis.__rezoneTopSitesCache) {
    globalThis.__rezoneTopSitesCache = {
      expiresAt: 0,
      byKey: new Map<string, SiteListItem[]>(),
    };
  }
  return globalThis.__rezoneTopSitesCache;
}

function getTimeoutMs() {
  const timeoutMs = getEnv().providerTimeoutMs;
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 6000;
}

async function resolveDatabaseUserId(user: RequestUser): Promise<string> {
  const db = getSupabaseServerClient();
  if (!db) return user.id;

  const now = new Date().toISOString();
  const { data, error } = await withTimeout(
    db
      .from("users")
      .upsert(
        {
          auth0_sub: user.id,
          email: user.email,
          role: user.role,
          updated_at: now,
        },
        { onConflict: "auth0_sub" },
      )
      .select("id")
      .single(),
    getTimeoutMs(),
    "user provisioning query",
  );

  if (error) {
    throw new Error(`Failed to provision user: ${error.message}`);
  }

  return String(data.id);
}

function parseBbox(value?: string) {
  if (!value) return null;
  const parts = value.split(",").map((part) => Number.parseFloat(part.trim()));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [minLng, minLat, maxLng, maxLat] = parts;
  return { minLng, minLat, maxLng, maxLat };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeActivityStatus(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (
    normalized.includes("inactive") ||
    normalized.includes("vacant") ||
    normalized.includes("closed") ||
    normalized.includes("abandoned")
  ) {
    return "inactive";
  }
  if (normalized.includes("active")) {
    return "active";
  }
  return normalized;
}

function toSiteListItem(row: Record<string, unknown>): SiteListItem {
  return {
    id: String(row.id),
    name: String(row.name ?? "Unnamed site"),
    lat: toNumber(row.lat) ?? 0,
    lng: toNumber(row.lng) ?? 0,
    siteType: String(row.site_type ?? row.siteType ?? "unknown"),
    city: row.city ? String(row.city) : null,
    province: row.province ? String(row.province) : null,
    viabilityScore: toNumber(row.viability_score ?? row.viabilityScore),
    activityStatus: normalizeActivityStatus(row.activity_status ?? row.status),
  };
}

function toSiteScore(row: Record<string, unknown> | null): SiteScore {
  if (!row) {
    return { viability: null, soil: null, infrastructure: null };
  }
  return {
    viability: toNumber(row.viability_score),
    soil: toNumber(row.soil_score),
    infrastructure: toNumber(row.infrastructure_score),
  };
}

function toSiteEstimate(row: Record<string, unknown> | null): SiteEstimate {
  if (!row) {
    return { units: null, remediationCost: null, timelineMonths: null };
  }
  return {
    units: toNumber(row.housing_units_est),
    remediationCost: toNumber(row.remediation_cost_est),
    timelineMonths: toNumber(row.timeline_months_est),
  };
}

export async function listSites(params: ListSitesParams) {
  const db = getSupabaseServerClient();
  if (!db) {
    const bbox = parseBbox(params.bbox);
    const store = getDemoStore();
    let data = Array.from(store.sites.values()).map((site) => ({
      id: site.id,
      name: site.name,
      lat: site.lat,
      lng: site.lng,
      siteType: site.siteType,
      city: site.city,
      province: site.province,
      viabilityScore: site.viabilityScore,
      activityStatus: site.activityStatus ?? null,
    }));

    if (params.city) {
      data = data.filter((site) => site.city === params.city);
    }
    if (params.province) {
      data = data.filter((site) => site.province === params.province);
    }
    if (params.siteType) {
      data = data.filter((site) => site.siteType === params.siteType);
    }
    if (bbox) {
      data = data.filter(
        (site) =>
          site.lng >= bbox.minLng &&
          site.lng <= bbox.maxLng &&
          site.lat >= bbox.minLat &&
          site.lat <= bbox.maxLat,
      );
    }

    const limited = data.slice(0, params.limit ?? 300);
    return { items: limited, meta: { count: limited.length, source: "demo" } };
  }

  const bbox = parseBbox(params.bbox);
  let query = db
    .from("sites")
    .select("id,name,lat,lng,site_type,city,province,viability_score,status")
    .limit(params.limit ?? 300);

  if (params.city) query = query.eq("city", params.city);
  if (params.province) query = query.eq("province", params.province);
  if (params.siteType) query = query.eq("site_type", params.siteType);
  if (bbox) {
    query = query
      .gte("lng", bbox.minLng)
      .lte("lng", bbox.maxLng)
      .gte("lat", bbox.minLat)
      .lte("lat", bbox.maxLat);
  }

  const { data, error } = await withTimeout(
    query,
    getTimeoutMs(),
    "list sites query",
  );
  if (error) throw new Error(`Failed to list sites: ${error.message}`);

  const items = (data ?? []).map((row) => toSiteListItem(row));
  return { items, meta: { count: items.length, source: "supabase" } };
}

export async function getSiteById(id: string): Promise<SiteDetail | null> {
  const db = getSupabaseServerClient();
  if (!db) {
    const store = getDemoStore();
    return store.sites.get(id) ?? null;
  }

  const siteResponse = await withTimeout(
    db
      .from("sites")
      .select(
        "id,name,lat,lng,site_type,city,province,status,contamination_status,former_use,area_m2,viability_score",
      )
      .eq("id", id)
      .maybeSingle(),
    getTimeoutMs(),
    "site detail query",
  );

  if (siteResponse.error) {
    throw new Error(`Failed to load site detail: ${siteResponse.error.message}`);
  }
  if (!siteResponse.data) {
    return null;
  }

  const scoreResponse = await withTimeout(
    db
      .from("site_scores")
      .select(
        "viability_score,soil_score,infrastructure_score,housing_units_est,remediation_cost_est,timeline_months_est",
      )
      .eq("site_id", id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getTimeoutMs(),
    "site score query",
  );

  if (scoreResponse.error) {
    throw new Error(`Failed to load score: ${scoreResponse.error.message}`);
  }

  const detail: SiteDetail = {
    ...toSiteListItem(siteResponse.data),
    contaminationStatus: siteResponse.data.contamination_status
      ? String(siteResponse.data.contamination_status)
      : null,
    formerUse: siteResponse.data.former_use
      ? String(siteResponse.data.former_use)
      : null,
    areaM2: toNumber(siteResponse.data.area_m2),
    scores: toSiteScore(scoreResponse.data),
    estimates: toSiteEstimate(scoreResponse.data),
  };

  if (detail.scores.viability === null && detail.viabilityScore !== null) {
    detail.scores.viability = detail.viabilityScore;
  }

  return detail;
}

export async function getTopSites(
  province = "ON",
  limit = 10,
): Promise<SiteListItem[]> {
  const cacheKey = `${province}:${limit}`;
  const cache = getTopSitesCache();
  if (cache.expiresAt > Date.now()) {
    const hit = cache.byKey.get(cacheKey);
    if (hit) {
      return hit;
    }
  }

  const db = getSupabaseServerClient();
  if (!db) {
    const store = getDemoStore();
    const demoItems = Array.from(store.sites.values())
      .filter((site) => site.province === province)
      .sort((a, b) => (b.viabilityScore ?? 0) - (a.viabilityScore ?? 0))
      .slice(0, limit)
      .map((site) => ({
        id: site.id,
        name: site.name,
        lat: site.lat,
        lng: site.lng,
        siteType: site.siteType,
        city: site.city,
        province: site.province,
        viabilityScore: site.viabilityScore,
        activityStatus: site.activityStatus ?? null,
      }));
    cache.byKey.set(cacheKey, demoItems);
    cache.expiresAt = Date.now() + TOP_SITES_CACHE_TTL_MS;
    return demoItems;
  }

  const { data, error } = await withTimeout(
    db
      .from("sites")
      .select("id,name,lat,lng,site_type,city,province,viability_score,status")
      .eq("province", province)
      .order("viability_score", { ascending: false, nullsFirst: false })
      .limit(limit),
    getTimeoutMs(),
    "top sites query",
  );

  if (error) throw new Error(`Failed to load top sites: ${error.message}`);
  const items = (data ?? []).map((row) => toSiteListItem(row));
  cache.byKey.set(cacheKey, items);
  cache.expiresAt = Date.now() + TOP_SITES_CACHE_TTL_MS;
  return items;
}

/** Supabase site_reports.site_id is UUID (FK to sites.id). FCSI ids are "fcsi-..." so query would fail. */
function isLikelyUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

export async function getSiteReport(siteId: string): Promise<SiteReport | null> {
  const db = getSupabaseServerClient();
  if (!db) {
    const store = getDemoStore();
    return store.reports.get(siteId) ?? null;
  }

  if (!isLikelyUuid(siteId)) {
    return null;
  }

  const { data, error } = await withTimeout(
    db
      .from("site_reports")
      .select("site_id,status,summary,audio_url,structured_report")
      .eq("site_id", siteId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getTimeoutMs(),
    "site report query",
  );

  if (error) throw new Error(`Failed to load site report: ${error.message}`);
  if (!data) return null;

  const structured = (data.structured_report ?? {}) as Record<string, unknown>;
  const imageUrls = Array.isArray(structured.imageUrls)
    ? structured.imageUrls.filter((value): value is string => typeof value === "string")
    : [];

  return {
    siteId: String(data.site_id),
    status: (data.status as ReportStatus) ?? "pending",
    summary: String(data.summary ?? ""),
    audioUrl: data.audio_url ? String(data.audio_url) : null,
    imageUrls,
    rawJson: structured,
  };
}

export async function upsertSiteScore(siteId: string, input: UpsertScoreInput) {
  const db = getSupabaseServerClient();
  if (!db) {
    const store = getDemoStore();
    const current = store.sites.get(siteId);
    if (current) {
      current.scores = {
        viability: input.viabilityScore,
        soil: input.soilScore,
        infrastructure: input.infrastructureScore,
      };
      current.viabilityScore = input.viabilityScore;
      current.estimates = {
        units: input.housingUnitsEst,
        remediationCost: input.remediationCostEst,
        timelineMonths: input.timelineMonthsEst,
      };
      store.sites.set(siteId, current);
    }
    return;
  }

  const now = new Date().toISOString();
  const payload = {
    site_id: siteId,
    provider: input.provider,
    status: input.status,
    viability_score: input.viabilityScore,
    soil_score: input.soilScore,
    infrastructure_score: input.infrastructureScore,
    housing_units_est: input.housingUnitsEst,
    remediation_cost_est: input.remediationCostEst,
    timeline_months_est: input.timelineMonthsEst,
    summary: input.summary,
    raw_json: input.rawJson ?? {},
    updated_at: now,
  };

  const { error } = await withTimeout(
    db.from("site_scores").upsert(payload, { onConflict: "site_id,provider" }),
    getTimeoutMs(),
    "score upsert query",
  );
  if (error) throw new Error(`Failed to upsert score: ${error.message}`);

  if (input.viabilityScore !== null) {
    const { error: siteError } = await withTimeout(
      db
        .from("sites")
        .update({ viability_score: input.viabilityScore, updated_at: now })
        .eq("id", siteId),
      getTimeoutMs(),
      "site viability update query",
    );

    if (siteError) {
      throw new Error(`Failed to update viability score on site: ${siteError.message}`);
    }
  }
}

export async function upsertSiteReport(siteId: string, input: UpsertReportInput) {
  const db = getSupabaseServerClient();
  if (!db) {
    const store = getDemoStore();
    store.reports.set(siteId, {
      siteId,
      status: input.status,
      summary: input.summary,
      audioUrl: input.audioUrl,
      imageUrls: input.imageUrls,
      rawJson: input.rawJson,
    });
    return;
  }

  const payload = {
    site_id: siteId,
    provider: input.provider,
    status: input.status,
    summary: input.summary,
    audio_url: input.audioUrl,
    structured_report: {
      imageUrls: input.imageUrls,
      ...(input.rawJson ?? {}),
    },
    updated_at: new Date().toISOString(),
  };

  const { error } = await withTimeout(
    db.from("site_reports").upsert(payload, { onConflict: "site_id,provider" }),
    getTimeoutMs(),
    "report upsert query",
  );
  if (error) throw new Error(`Failed to upsert report: ${error.message}`);
}

export async function saveSiteForUser(user: RequestUser, siteId: string) {
  const db = getSupabaseServerClient();
  if (!db) {
    const store = getDemoStore();
    const saved = store.savedSitesByUser.get(user.id) ?? new Set<string>();
    saved.add(siteId);
    store.savedSitesByUser.set(user.id, saved);
    return;
  }

  const userId = await resolveDatabaseUserId(user);

  const { error } = await withTimeout(
    db.from("saved_sites").upsert(
      {
        user_id: userId,
        site_id: siteId,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,site_id" },
    ),
    getTimeoutMs(),
    "save site query",
  );

  if (error) throw new Error(`Failed to save site: ${error.message}`);
}

export async function listProjects(user: RequestUser): Promise<UserProject[]> {
  const db = getSupabaseServerClient();
  if (!db) {
    const store = getDemoStore();
    return store.projectsByUser.get(user.id) ?? [];
  }

  const userId = await resolveDatabaseUserId(user);

  const { data: projects, error: projectError } = await withTimeout(
    db
      .from("projects")
      .select("id,user_id,name,description,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    getTimeoutMs(),
    "list projects query",
  );

  if (projectError) throw new Error(`Failed to list projects: ${projectError.message}`);
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((project) => project.id);
  const { data: links, error: linkError } = await withTimeout(
    db.from("project_sites").select("project_id,site_id").in("project_id", projectIds),
    getTimeoutMs(),
    "project sites query",
  );

  if (linkError) throw new Error(`Failed to list project sites: ${linkError.message}`);

  const siteIdsByProject = new Map<string, string[]>();
  for (const link of links ?? []) {
    const projectSiteIds = siteIdsByProject.get(link.project_id) ?? [];
    projectSiteIds.push(link.site_id);
    siteIdsByProject.set(link.project_id, projectSiteIds);
  }

  return projects.map((project) => ({
    id: String(project.id),
    userId: String(project.user_id),
    name: String(project.name),
    description: project.description ? String(project.description) : null,
    siteIds: siteIdsByProject.get(project.id) ?? [],
    createdAt: String(project.created_at),
    updatedAt: String(project.updated_at),
  }));
}

export async function createProject(
  user: RequestUser,
  name: string,
  description: string | null,
): Promise<UserProject> {
  const db = getSupabaseServerClient();
  const now = new Date().toISOString();

  if (!db) {
    const store = getDemoStore();
    const project: UserProject = {
      id: crypto.randomUUID(),
      userId: user.id,
      name,
      description,
      siteIds: [],
      createdAt: now,
      updatedAt: now,
    };
    const projects = store.projectsByUser.get(user.id) ?? [];
    projects.unshift(project);
    store.projectsByUser.set(user.id, projects);
    return project;
  }

  const userId = await resolveDatabaseUserId(user);

  const { data, error } = await withTimeout(
    db
      .from("projects")
      .insert({
        user_id: userId,
        name,
        description,
        created_at: now,
        updated_at: now,
      })
      .select("id,user_id,name,description,created_at,updated_at")
      .single(),
    getTimeoutMs(),
    "create project query",
  );

  if (error) throw new Error(`Failed to create project: ${error.message}`);

  return {
    id: String(data.id),
    userId: String(data.user_id),
    name: String(data.name),
    description: data.description ? String(data.description) : null,
    siteIds: [],
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

export async function addSiteToProject(
  user: RequestUser,
  projectId: string,
  siteId: string,
) {
  const db = getSupabaseServerClient();
  if (!db) {
    const store = getDemoStore();
    const projects = store.projectsByUser.get(user.id) ?? [];
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (!project.siteIds.includes(siteId)) {
      project.siteIds.push(siteId);
      project.updatedAt = new Date().toISOString();
    }
    return;
  }

  const userId = await resolveDatabaseUserId(user);

  const ownerCheck = await withTimeout(
    db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle(),
    getTimeoutMs(),
    "project owner check query",
  );

  if (ownerCheck.error) {
    throw new Error(`Failed to verify project owner: ${ownerCheck.error.message}`);
  }
  if (!ownerCheck.data) {
    throw new Error("Project not found");
  }

  const { error } = await withTimeout(
    db.from("project_sites").upsert(
      {
        project_id: projectId,
        site_id: siteId,
        created_at: new Date().toISOString(),
      },
      { onConflict: "project_id,site_id" },
    ),
    getTimeoutMs(),
    "project site upsert query",
  );

  if (error) throw new Error(`Failed to attach site to project: ${error.message}`);
}

export async function getSiteMedia(siteId: string): Promise<SiteMedia[]> {
  const db = getSupabaseServerClient();
  if (!db) {
    const report = await getSiteReport(siteId);
    if (!report) return [];

    const items: SiteMedia[] = [];
    if (report.audioUrl) {
      items.push({
        id: `${siteId}:audio`,
        siteId,
        mediaType: "audio",
        provider: "unknown",
        url: report.audioUrl,
        publicId: null,
        metadata: null,
        createdAt: null,
      });
    }

    report.imageUrls.forEach((imageUrl, index) => {
      items.push({
        id: `${siteId}:image:${index}`,
        siteId,
        mediaType: "image",
        provider: "unknown",
        url: imageUrl,
        publicId: null,
        metadata: null,
        createdAt: null,
      });
    });
    return items;
  }

  const { data, error } = await withTimeout(
    db
      .from("site_media")
      .select("id,site_id,media_type,provider,url,public_id,metadata,created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false }),
    getTimeoutMs(),
    "site media query",
  );

  if (error) throw new Error(`Failed to fetch site media: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    siteId: String(row.site_id),
    mediaType: String(row.media_type) as SiteMedia["mediaType"],
    provider: String(row.provider ?? "cloudinary"),
    url: String(row.url),
    publicId: row.public_id ? String(row.public_id) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  }));
}
