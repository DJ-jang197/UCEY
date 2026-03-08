import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";
import { fail, ok } from "@/lib/http/response";
import type { SiteListItem } from "@/lib/types/site";

const FCSI_CSV = path.join(
  process.cwd(),
  "data",
  "raw",
  "fcsi",
  "fcsi_sites_filtered.csv",
);

function toNumber(value: string | undefined): number | null {
  if (value == null || value === "" || value.toLowerCase() === "unknown") return null;
  const n = Number.parseFloat(value.trim());
  return Number.isFinite(n) ? n : null;
}

function slugId(province: string, city: string, name: string, index: number): string {
  const base = [province, city, name].join("-").replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "");
  return `fcsi-${base.slice(0, 40)}-${index}`;
}

function toInt(value: string | undefined): number {
  if (value == null || value === "") return 0;
  const n = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Estimate site area (m²) from contamination record count (proxy for size/complexity). */
function estimateAreaM2(recordCount: number): number {
  const base = 2000;
  const perRecord = 400;
  const cap = 15000;
  return Math.min(base + perRecord * Math.min(recordCount, 25), cap);
}

/** Estimate tonnes of soil for remediation (area × depth 1.5 m × density 1.5 t/m³). */
function estimateTonnes(areaM2: number): number {
  return Math.round(areaM2 * 1.5 * 1.5);
}

/** Estimate total remediation cost CAD from tonnes × cost per tonne. */
function estimateRemediationCost(tonnes: number, costPerTonneAvg: number | null): number | null {
  const rate = costPerTonneAvg ?? 250;
  const cost = tonnes * rate;
  return Math.round(cost);
}

/** Estimate housing units from buildable area (40% of site, ~100 m² per unit). */
function estimateUnits(areaM2: number): number {
  const buildable = areaM2 * 0.4;
  return Math.min(Math.max(0, Math.floor(buildable / 100)), 200);
}

/** Estimate remediation timeline (months) from record count. */
function estimateTimelineMonths(recordCount: number): number {
  return Math.min(30, Math.round(6 + recordCount * 0.8));
}

/** Derive viability 0–100 from cost band, group count, record count, city. */
function estimateViability(
  hasCostBand: boolean,
  groupCount: number,
  recordCount: number,
  city: string | null,
): number {
  let v = 55;
  if (hasCostBand) v += 15;
  v -= groupCount * 8;
  v -= Math.floor(recordCount / 2);
  const c = (city ?? "").toLowerCase();
  if (c === "toronto" || c === "vancouver") v += 8;
  else if (c === "montreal" || c === "ottawa") v += 5;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Derive soil score 0–100 from contamination complexity. */
function estimateSoilScore(
  hasCostBand: boolean,
  groupCount: number,
  recordCount: number,
): number {
  let s = 50;
  if (hasCostBand) s += 10;
  s -= groupCount * 10;
  s -= Math.floor(recordCount / 2.5);
  return Math.max(0, Math.min(100, Math.round(s)));
}

/** Urban proxy: known city → 55. */
function estimateInfraScore(city: string | null): number | null {
  return city?.trim() ? 55 : null;
}

export async function GET() {
  try {
    if (!fs.existsSync(FCSI_CSV)) {
      return fail(404, {
        code: "FCSI_NOT_FOUND",
        message: "FCSI sites CSV not found. Run npm run data:build to generate it.",
      });
    }

    const text = fs.readFileSync(FCSI_CSV, "utf-8");
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const items: SiteListItem[] = [];
    let index = 0;
    for (const row of rows) {
      const lat = toNumber(row.latitude);
      const lng = toNumber(row.longitude);
      if (lat == null || lng == null) continue;

      const provinceCode = (row.province_code ?? "").trim() || null;
      const provinceName = (row.province_name ?? "").trim() || null;
      const city = (row.city ?? "").trim() || null;
      const name = (row.site_name ?? "Unnamed FCSI site").trim();
      const contaminationGroups = (row.contamination_groups ?? "").trim() || null;
      const contaminationTypes = (row.contamination_types ?? "").trim() || null;
      const contaminationStatus =
        contaminationGroups || contaminationTypes
          ? [contaminationGroups, contaminationTypes].filter(Boolean).join(" · ")
          : null;
      const costMin = toNumber(row.est_cost_min_cad_per_tonne);
      const costMax = toNumber(row.est_cost_max_cad_per_tonne);
      const costAvg = toNumber(row.est_cost_avg_mid_cad_per_tonne);
      const recordCount = toInt(row.contamination_record_count);
      const groupCount = toInt(row.contamination_group_count);
      const hasCostBand = costAvg != null && costAvg > 0;

      const areaM2 = estimateAreaM2(recordCount);
      const tonnes = estimateTonnes(areaM2);
      const remediationCost = estimateRemediationCost(tonnes, costAvg);
      const units = estimateUnits(areaM2);
      const timelineMonths = estimateTimelineMonths(recordCount);
      const viability = estimateViability(hasCostBand, groupCount, recordCount, city);
      const soilScore = estimateSoilScore(hasCostBand, groupCount, recordCount);
      const infraScore = estimateInfraScore(city);

      items.push({
        id: slugId(provinceCode ?? "", city ?? "", name, index),
        name,
        lat,
        lng,
        siteType: "brownfield",
        city,
        province: provinceCode ?? provinceName,
        viabilityScore: viability,
        activityStatus: "inactive",
        contaminationStatus: contaminationStatus || null,
        costPerTonneMin: costMin ?? undefined,
        costPerTonneMax: costMax ?? undefined,
        costPerTonneAvg: costAvg ?? undefined,
        estimatedAreaM2: areaM2,
        estimatedRemediationCost: remediationCost ?? undefined,
        estimatedUnits: units,
        estimatedTimelineMonths: timelineMonths,
        estimatedSoilScore: soilScore,
        estimatedInfraScore: infraScore ?? undefined,
      });
      index += 1;
    }

    return ok({
      items,
      meta: { count: items.length, source: "fcsi" },
    });
  } catch (error) {
    return fail(500, {
      code: "FCSI_FETCH_FAILED",
      message: "Could not load FCSI sites",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
