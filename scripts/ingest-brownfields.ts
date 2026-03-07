import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const sourceName =
  process.env.BROWNFIELD_SOURCE_NAME ?? "federal_contaminated_sites_inventory";
const csvPath =
  process.env.BROWNFIELD_CSV_PATH ?? "./data/raw/federal_contaminated_sites.csv";
const allowedCities = new Set(
  (process.env.ALLOWED_CITIES ?? "Toronto,Vancouver,Montreal")
    .split(",")
    .map((value) => value.trim().toLowerCase()),
);
const allowedProvinceCodes = new Set(
  (process.env.ALLOWED_PROVINCES ?? "ON,BC,QC")
    .split(",")
    .map((value) => value.trim().toUpperCase()),
);

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type CsvRow = Record<string, string>;

function readCsvRows(filePath: string): CsvRow[] {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV not found at ${absolutePath}`);
  }
  const raw = fs.readFileSync(absolutePath, "utf-8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as CsvRow[];
}

function first(row: CsvRow, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProvinceCode(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "on" || normalized === "ontario") return "ON";
  if (
    normalized === "bc" ||
    normalized === "british columbia" ||
    normalized === "colombie-britannique"
  ) {
    return "BC";
  }
  if (normalized === "qc" || normalized === "quebec" || normalized === "québec") {
    return "QC";
  }
  return value.trim().toUpperCase();
}

function normalizeCity(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "toronto") return "Toronto";
  if (normalized === "vancouver") return "Vancouver";
  if (normalized === "montreal" || normalized === "montréal") return "Montreal";
  return value.trim();
}

function toFraction(value: number | null): number | null {
  if (value === null) return null;
  if (value > 1) return Math.max(0, Math.min(1, value / 100));
  return Math.max(0, Math.min(1, value));
}

function computeSoilScore(row: CsvRow) {
  const sandScore = toFraction(
    toNumber(first(row, ["sand_score", "Sand Score", "sand", "sand_pct"])),
  );
  const clayScore = toFraction(
    toNumber(first(row, ["clay_score", "Clay Score", "clay", "clay_pct"])),
  );
  const drainageScore = toFraction(
    toNumber(
      first(row, [
        "drainage_score",
        "Drainage Score",
        "drainage",
        "drainage_pct",
      ]),
    ),
  );
  const organicScore = toFraction(
    toNumber(
      first(row, [
        "organic_score",
        "Organic Score",
        "organic_matter",
        "organic_pct",
      ]),
    ),
  );

  if (
    sandScore === null ||
    clayScore === null ||
    drainageScore === null ||
    organicScore === null
  ) {
    return null;
  }

  const score =
    sandScore * 0.3 +
    clayScore * 0.25 +
    drainageScore * 0.25 +
    organicScore * 0.2;
  return Math.round(score * 10000) / 100;
}

function inferContaminantType(row: CsvRow) {
  const text = [
    first(row, ["contaminant_type", "Contaminant Type", "contaminant"]),
    first(row, ["contamination_status", "Contamination Status", "status"]),
    first(row, ["former_use", "Former Use", "land_use"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("pfas") || text.includes("forever chemical")) return "PFAS";
  if (text.includes("acid") || text.includes("solvent")) return "Industrial Acids/Solvents";
  if (text.includes("asbestos") || text.includes("lead")) return "Asbestos/Lead Paint";
  if (text.includes("oil") || text.includes("petroleum") || text.includes("phc")) {
    return "Oil/Petroleum (PHCs)";
  }
  return "Unknown";
}

function estimateRemediationCostPerTonne(contaminantType: string, city: string | null) {
  const contaminantRateByType: Record<string, number> = {
    "Oil/Petroleum (PHCs)": 230,
    "Industrial Acids/Solvents": 675,
    PFAS: 1200,
    "Asbestos/Lead Paint": 262.5,
  };

  const cityBaseRate: Record<string, number> = {
    Toronto: 189.86,
    Vancouver: 160,
  };

  const base = contaminantRateByType[contaminantType] ?? (city ? cityBaseRate[city] : null);
  if (base === null || base === undefined) {
    return null;
  }

  if (city === "Toronto") {
    return Math.round(base * 1.0375 * 100) / 100;
  }
  if (city === "Vancouver") {
    return Math.round((base + 70) * 100) / 100;
  }
  return Math.round(base * 100) / 100;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

async function main() {
  const rows = readCsvRows(csvPath);
  let skippedMissingCoordinates = 0;
  let skippedOutsideFilter = 0;
  let prepared = 0;
  const now = new Date().toISOString();

  const payload = rows
    .map((row, index) => {
      const lat = toNumber(first(row, ["latitude", "Latitude", "lat", "LAT"]));
      const lng = toNumber(
        first(row, ["longitude", "Longitude", "lon", "lng", "LONG"]),
      );

      if (lat === null || lng === null) {
        skippedMissingCoordinates += 1;
        return null;
      }

      const city = normalizeCity(
        first(row, ["city", "City", "municipality", "Municipality"]),
      );
      const provinceCode = normalizeProvinceCode(
        first(row, ["province", "Province", "prov", "Prov"]),
      );
      if (
        !city ||
        !provinceCode ||
        !allowedCities.has(city.toLowerCase()) ||
        !allowedProvinceCodes.has(provinceCode)
      ) {
        skippedOutsideFilter += 1;
        return null;
      }

      const name =
        first(row, ["site_name", "Site Name", "name", "Name"]) ??
        `Brownfield Site ${index + 1}`;
      const siteId =
        first(row, ["site_id", "Site ID", "id", "ID", "record_id"]) ??
        `${lat}:${lng}:${name}`;
      const soilFinalPercentage = computeSoilScore(row);
      const contaminantType = inferContaminantType(row);
      const remediationCostPerTonne = estimateRemediationCostPerTonne(
        contaminantType,
        city,
      );

      prepared += 1;
      return {
        name,
        slug: slugify(`${name}-${siteId}`),
        source: sourceName,
        source_id: siteId,
        site_type: "brownfield",
        status: "active",
        city,
        province: provinceCode,
        country: "CA",
        address: first(row, ["address", "Address"]),
        postal_code: first(row, ["postal_code", "Postal Code", "postcode"]),
        lat,
        lng,
        area_m2: toNumber(first(row, ["area_m2", "Area m2", "area"])),
        contamination_status: first(row, [
          "contamination_status",
          "Contamination Status",
          "status",
        ]),
        former_use: first(row, ["former_use", "Former Use", "land_use"]),
        viability_score: soilFinalPercentage,
        raw_metadata: {
          ...row,
          filter_applied: {
            provinces: Array.from(allowedProvinceCodes),
            cities: Array.from(allowedCities),
          },
          soil_formula: "(sand*0.30)+(clay*0.25)+(drainage*0.25)+(organic*0.20)",
          soil_final_percentage: soilFinalPercentage,
          inferred_contaminant_type: contaminantType,
          remediation_cost_per_tonne_estimate: remediationCostPerTonne,
        },
        updated_at: now,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (payload.length === 0) {
    throw new Error("No rows were prepared for upsert.");
  }

  const batchSize = 250;
  for (let i = 0; i < payload.length; i += batchSize) {
    const batch = payload.slice(i, i + batchSize);
    const { error } = await supabase
      .from("sites")
      .upsert(batch, { onConflict: "source,source_id" });
    if (error) {
      throw new Error(
        `Upsert failed for batch ${i / batchSize + 1}: ${error.message}`,
      );
    }
  }

  console.log(
    [
      `Ingestion complete.`,
      `Source: ${sourceName}`,
      `CSV: ${path.resolve(csvPath)}`,
      `Rows read: ${rows.length}`,
      `Rows prepared: ${prepared}`,
      `Rows skipped (invalid coordinates): ${skippedMissingCoordinates}`,
      `Rows skipped (outside city/province filter): ${skippedOutsideFilter}`,
      `Rows upserted: ${payload.length}`,
      `Filter provinces: ${Array.from(allowedProvinceCodes).join(", ")}`,
      `Filter cities: ${Array.from(allowedCities).join(", ")}`,
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
