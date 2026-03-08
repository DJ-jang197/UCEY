import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

type CsvRow = Record<string, string>;

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "data", "raw");
const FCSI_DIR = path.join(DATA_DIR, "fcsi");
const NON_BROWFIELD_DIR = path.join(DATA_DIR, "non_brownfield");
const NEW_DATA_DIR = path.join(PROJECT_ROOT, "new_data");

const INPUT_SITE_FILE = path.join(NEW_DATA_DIR, "non_brownfield_sites_filtered.csv");
const INPUT_CITY_SUMMARY_FILE = path.join(NEW_DATA_DIR, "non_brownfield_city_summary.csv");

const OUTPUT_SITE_FILE = path.join(
  NON_BROWFIELD_DIR,
  "non_brownfield_sites_filtered.csv",
);
const OUTPUT_CITY_SUMMARY_FILE = path.join(
  NON_BROWFIELD_DIR,
  "non_brownfield_city_summary.csv",
);
const NORMALIZED_FILE = path.join(DATA_DIR, "all_candidate_sites_normalized.csv");
const SOURCE_CATALOG_FILE = path.join(DATA_DIR, "source_catalog.csv");
const FCSI_SITE_FILE = path.join(FCSI_DIR, "fcsi_sites_filtered.csv");

function readCsv(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV not found: ${filePath}`);
  }

  return parse(fs.readFileSync(filePath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as CsvRow[];
}

function writeCsv(
  filePath: string,
  rows: Array<Record<string, string | number | null>>,
  headers: string[],
) {
  const lines = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => quote(row[header] ?? null));
    lines.push(values.join(","));
  }

  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function quote(value: string | number | null) {
  if (value === null) return "";
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function toNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(NON_BROWFIELD_DIR, { recursive: true });
}

function copyRawInputs() {
  fs.copyFileSync(INPUT_SITE_FILE, OUTPUT_SITE_FILE);
  fs.copyFileSync(INPUT_CITY_SUMMARY_FILE, OUTPUT_CITY_SUMMARY_FILE);
}

function mergeSourceCatalog() {
  const existingRows = fs.existsSync(SOURCE_CATALOG_FILE)
    ? readCsv(SOURCE_CATALOG_FILE)
    : [];

  const additions: CsvRow[] = [
    {
      category: "Land Use",
      name: "OpenStreetMap Overpass Non-Brownfield Candidate Export",
      url: "https://overpass-turbo.eu",
    },
    {
      category: "Land Use",
      name: "Derived Candidate Summary for Parking Lots, Dead Malls, and Rail Corridors",
      url: "https://overpass-turbo.eu",
    },
  ];

  const seen = new Set(existingRows.map((row) => `${row.category}|${row.name}|${row.url}`));
  const merged = [...existingRows];
  for (const row of additions) {
    const key = `${row.category}|${row.name}|${row.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(row);
    }
  }

  writeCsv(
    SOURCE_CATALOG_FILE,
    merged.map((row) => ({
      category: row.category ?? "",
      name: row.name ?? "",
      url: row.url ?? "",
    })),
    ["category", "name", "url"],
  );
}

function buildNormalizedDataset() {
  const normalizedRows: Array<Record<string, string | number | null>> = [];

  if (fs.existsSync(FCSI_SITE_FILE)) {
    const fcsiRows = readCsv(FCSI_SITE_FILE);
    for (const row of fcsiRows) {
      normalizedRows.push({
        source_dataset: "fcsi_sites_filtered",
        source_category: "brownfield",
        source_site_id: [
          row.province_code ?? "",
          row.city ?? "",
          row.site_name ?? "",
          row.latitude ?? "",
          row.longitude ?? "",
        ].join("|"),
        province_code: row.province_code ?? null,
        province_name: row.province_name ?? null,
        city: row.city ?? null,
        site_name: row.site_name ?? null,
        site_type: "brownfield",
        latitude: toNumber(row.latitude),
        longitude: toNumber(row.longitude),
        area_sqm: null,
        former_use: null,
        contamination_level: null,
        soil_suitability: null,
        transit_distance_m: null,
        infrastructure_readiness: null,
        activity_status: null,
        viability_score: null,
        estimated_units: null,
        estimated_remediation_cad: null,
        recommended_form: null,
        contamination_group_count: toInt(row.contamination_group_count),
        contamination_groups: row.contamination_groups ?? null,
        contamination_types: row.contamination_types ?? null,
        contamination_record_count: toInt(row.contamination_record_count),
        est_cost_min_cad_per_tonne: toNumber(row.est_cost_min_cad_per_tonne),
        est_cost_max_cad_per_tonne: toNumber(row.est_cost_max_cad_per_tonne),
        est_cost_avg_mid_cad_per_tonne: toNumber(row.est_cost_avg_mid_cad_per_tonne),
      });
    }
  }

  const nonBrownfieldRows = readCsv(OUTPUT_SITE_FILE);
  for (const row of nonBrownfieldRows) {
    normalizedRows.push({
      source_dataset: "non_brownfield_sites_filtered",
      source_category: "infill_candidate",
      source_site_id: row.site_id ?? null,
      province_code: row.province_code ?? null,
      province_name: row.province_name ?? null,
      city: row.city ?? null,
      site_name: row.site_name ?? null,
      site_type: row.site_type ?? null,
      latitude: toNumber(row.latitude),
      longitude: toNumber(row.longitude),
      area_sqm: toNumber(row.area_sqm),
      former_use: row.former_use ?? null,
      contamination_level: row.contamination_level ?? null,
      soil_suitability: toNumber(row.soil_suitability),
      transit_distance_m: toNumber(row.transit_distance_m),
      infrastructure_readiness: toNumber(row.infrastructure_readiness),
      activity_status: row.activity_status ?? null,
      viability_score: toNumber(row.viability_score),
      estimated_units: toInt(row.estimated_units),
      estimated_remediation_cad: toNumber(row.estimated_remediation_cad),
      recommended_form: row.recommended_form ?? null,
      contamination_group_count: null,
      contamination_groups: null,
      contamination_types: null,
      contamination_record_count: null,
      est_cost_min_cad_per_tonne: null,
      est_cost_max_cad_per_tonne: null,
      est_cost_avg_mid_cad_per_tonne: null,
    });
  }

  writeCsv(NORMALIZED_FILE, normalizedRows, [
    "source_dataset",
    "source_category",
    "source_site_id",
    "province_code",
    "province_name",
    "city",
    "site_name",
    "site_type",
    "latitude",
    "longitude",
    "area_sqm",
    "former_use",
    "contamination_level",
    "soil_suitability",
    "transit_distance_m",
    "infrastructure_readiness",
    "activity_status",
    "viability_score",
    "estimated_units",
    "estimated_remediation_cad",
    "recommended_form",
    "contamination_group_count",
    "contamination_groups",
    "contamination_types",
    "contamination_record_count",
    "est_cost_min_cad_per_tonne",
    "est_cost_max_cad_per_tonne",
    "est_cost_avg_mid_cad_per_tonne",
  ]);
}

function main() {
  ensureDirs();
  copyRawInputs();
  mergeSourceCatalog();
  buildNormalizedDataset();

  console.log(
    [
      "Integrated non-brownfield raw datasets.",
      `Copied site file: ${OUTPUT_SITE_FILE}`,
      `Copied city summary: ${OUTPUT_CITY_SUMMARY_FILE}`,
      `Normalized combined file: ${NORMALIZED_FILE}`,
      `Updated source catalog: ${SOURCE_CATALOG_FILE}`,
    ].join("\n"),
  );
}

main();
