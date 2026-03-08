import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { fail, ok } from "@/lib/http/response";
import type { SiteListItem } from "@/lib/types/site";

const NON_BROWFIELD_CSV = path.join(
  process.cwd(),
  "data",
  "raw",
  "non_brownfield",
  "non_brownfield_sites_filtered.csv",
);

const querySchema = z.object({
  city: z.string().optional(),
  province: z.string().optional(),
  site_type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(10000).default(2000),
});

function toNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(req: Request) {
  try {
    if (!fs.existsSync(NON_BROWFIELD_CSV)) {
      return fail(404, {
        code: "NON_BROWFIELD_NOT_FOUND",
        message:
          "Non-brownfield sites CSV not found. Run npm run data:integrate:non-brownfield.",
      });
    }

    const url = new URL(req.url);
    const parsedQuery = querySchema.safeParse({
      city: url.searchParams.get("city") ?? undefined,
      province: url.searchParams.get("province") ?? undefined,
      site_type: url.searchParams.get("site_type") ?? undefined,
      limit: url.searchParams.get("limit") ?? 2000,
    });

    if (!parsedQuery.success) {
      return fail(400, {
        code: "INVALID_QUERY",
        message: "Query validation failed",
        details: parsedQuery.error.flatten(),
      });
    }

    const rows = parse(fs.readFileSync(NON_BROWFIELD_CSV, "utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const { city, province, site_type: siteType, limit } = parsedQuery.data;

    const items: SiteListItem[] = rows
      .filter((row) => {
        if (city && (row.city ?? "").toLowerCase() !== city.toLowerCase()) return false;
        if (province && (row.province_code ?? "").toLowerCase() !== province.toLowerCase()) {
          return false;
        }
        if (siteType && (row.site_type ?? "").toLowerCase() !== siteType.toLowerCase()) {
          return false;
        }
        return true;
      })
      .slice(0, limit)
      .map((row) => ({
        id: row.site_id ?? "",
        name: row.site_name ?? "Unnamed site",
        lat: toNumber(row.latitude) ?? 0,
        lng: toNumber(row.longitude) ?? 0,
        siteType: row.site_type ?? "unknown",
        city: row.city ?? null,
        province: row.province_code ?? row.province_name ?? null,
        viabilityScore: toNumber(row.viability_score),
        formerUse: row.former_use ?? null,
        contaminationStatus: row.contamination_level ?? null,
        estimatedAreaM2: toNumber(row.area_sqm),
        estimatedRemediationCost: toNumber(row.estimated_remediation_cad),
        estimatedUnits: toInt(row.estimated_units),
        estimatedTimelineMonths: null,
        estimatedSoilScore: toNumber(row.soil_suitability),
        estimatedInfraScore: toNumber(row.infrastructure_readiness),
      }));

    return ok({
      items,
      meta: {
        count: items.length,
        source: "non_brownfield",
      },
    });
  } catch (error) {
    return fail(500, {
      code: "NON_BROWFIELD_FETCH_FAILED",
      message: "Could not load non-brownfield sites",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
