import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

type CsvRow = Record<string, string>;

const DATA_DIR = path.resolve("data/raw");
const FCSI_DIR = path.join(DATA_DIR, "fcsi");
const SOURCE_FILE = path.join(
  FCSI_DIR,
  "contamination_summary_source_dataAdhyan.csv",
);
const FILTERED_DETAIL_FILE = path.join(FCSI_DIR, "fcsi_contamination_filtered.csv");
const FILTERED_SITE_FILE = path.join(FCSI_DIR, "fcsi_sites_filtered.csv");
const SOIL_TEMPLATE_FILE = path.join(FCSI_DIR, "soil_score_input_template.csv");
const COST_REFERENCE_FILE = path.join(DATA_DIR, "contaminant_cost_reference_2026.csv");
const CITY_RATE_FILE = path.join(DATA_DIR, "city_disposal_rate_reference_2026.csv");
const SOURCE_CATALOG_FILE = path.join(DATA_DIR, "source_catalog.csv");
const FETCH_LOG_FILE = path.join(FCSI_DIR, "source_fetch_log.md");

const ALLOWED_CITIES = new Set(["toronto", "vancouver", "montreal", "montréal", "ottawa"]);
const ALLOWED_PROVINCES = new Set(["on", "ontario", "bc", "british columbia", "qc", "quebec", "québec"]);

type CostBand = {
  contaminantType: string;
  minCost: number | null;
  maxCost: number | null;
  notes: string;
};

const costBands: CostBand[] = [
  {
    contaminantType: "Oil/Petroleum (PHCs)",
    minCost: 180,
    maxCost: 280,
    notes: "Bio-piling or thermal treatment for hydrocarbons.",
  },
  {
    contaminantType: "Industrial Acids/Solvents",
    minCost: 450,
    maxCost: 900,
    notes: "Neutralization or high-temperature incineration.",
  },
  {
    contaminantType: "PFAS",
    minCost: 1200,
    maxCost: null,
    notes: "Strict 2026 regulations and limited facilities.",
  },
  {
    contaminantType: "Asbestos/Lead Paint",
    minCost: 225,
    maxCost: 300,
    notes: "Specialized PPE, disposal, and air monitoring.",
  },
  {
    contaminantType: "Unknown",
    minCost: null,
    maxCost: null,
    notes: "No mapped contaminant cost range.",
  },
];

type CityRate = {
  city: string;
  baseRateCadPerTonne: number | null;
  highRiskRateCadPerTonne: number | null;
  hiddenCost: string;
};

const cityRates: CityRate[] = [
  {
    city: "Toronto",
    baseRateCadPerTonne: 189.86,
    highRiskRateCadPerTonne: null,
    hiddenCost: "3.75% annual fee increase",
  },
  {
    city: "Waterloo",
    baseRateCadPerTonne: 102.0,
    highRiskRateCadPerTonne: 204.0,
    hiddenCost: "Strict in-region only rule",
  },
  {
    city: "Vancouver",
    baseRateCadPerTonne: 160.0,
    highRiskRateCadPerTonne: 310.0,
    hiddenCost: "$70/tonne generator levy",
  },
  {
    city: "Ottawa",
    baseRateCadPerTonne: 150.0,
    highRiskRateCadPerTonne: null,
    hiddenCost: "Provincial guidelines apply",
  },
];

type DetailedRecord = {
  provinceCode: "ON" | "BC" | "QC";
  provinceName: string;
  city: "Toronto" | "Vancouver" | "Montreal" | "Ottawa";
  siteName: string;
  latitude: string;
  longitude: string;
  medium: string;
  contaminationType: string;
  contaminationGroup: string;
  siteCount: number;
  costMinCadPerTonne: number | null;
  costMaxCadPerTonne: number | null;
  costMidCadPerTonne: number | null;
  cityAdjustedMidCadPerTonne: number | null;
};

function ensureDirectories() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(FCSI_DIR, { recursive: true });
}

function readRows(filePath: string): CsvRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required source CSV not found: ${filePath}`);
  }
  const text = fs.readFileSync(filePath, "utf-8");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as CsvRow[];
}

function normalizeProvince(raw: string) {
  const value = raw.trim().toLowerCase();
  if (value === "on" || value === "ontario") return { code: "ON" as const, name: "Ontario" };
  if (
    value === "bc" ||
    value === "british columbia" ||
    value === "colombie-britannique"
  ) {
    return { code: "BC" as const, name: "British Columbia" };
  }
  return { code: "QC" as const, name: "Quebec" };
}

function normalizeCity(raw: string): "Toronto" | "Vancouver" | "Montreal" | "Ottawa" | null {
  const value = raw.trim().toLowerCase();
  if (value === "toronto") return "Toronto";
  if (value === "vancouver") return "Vancouver";
  if (value === "montreal" || value === "montréal") return "Montreal";
  if (value === "ottawa") return "Ottawa";
  return null;
}

function classifyContaminant(raw: string): string {
  const value = raw.toLowerCase();
  if (value.includes("pfas") || value.includes("forever")) return "PFAS";
  if (value.includes("asbestos") || value.includes("lead")) return "Asbestos/Lead Paint";
  if (
    value.includes("acid") ||
    value.includes("solvent") ||
    value.includes("halogenated")
  ) {
    return "Industrial Acids/Solvents";
  }
  if (
    value.includes("phc") ||
    value.includes("petroleum") ||
    value.includes("oil") ||
    value.includes("btex") ||
    value.includes("pah")
  ) {
    return "Oil/Petroleum (PHCs)";
  }
  return "Unknown";
}

function getCostBand(group: string): CostBand {
  return costBands.find((item) => item.contaminantType === group) ?? costBands[4];
}

function midpoint(minCost: number | null, maxCost: number | null): number | null {
  if (minCost === null && maxCost === null) return null;
  if (minCost !== null && maxCost !== null) return Math.round(((minCost + maxCost) / 2) * 100) / 100;
  return minCost;
}

function cityAdjust(city: string, mid: number | null): number | null {
  if (mid === null) return null;
  if (city === "Toronto") return Math.round(mid * 1.0375 * 100) / 100;
  if (city === "Vancouver") return Math.round((mid + 70) * 100) / 100;
  if (city === "Ottawa") return Math.round(mid * 1.02 * 100) / 100;
  return Math.round(mid * 100) / 100;
}

function quote(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function toCsv(rows: Array<Record<string, string | number | null>>, headers: string[]) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((header) => quote(row[header] ?? null));
    lines.push(values.join(","));
  }
  return `${lines.join("\n")}\n`;
}

function writeReferenceFiles() {
  const contaminantRows = costBands.map((item) => ({
    contaminant_type: item.contaminantType,
    min_cost_cad_per_tonne: item.minCost,
    max_cost_cad_per_tonne: item.maxCost,
    notes: item.notes,
  }));
  fs.writeFileSync(
    COST_REFERENCE_FILE,
    toCsv(contaminantRows, [
      "contaminant_type",
      "min_cost_cad_per_tonne",
      "max_cost_cad_per_tonne",
      "notes",
    ]),
  );

  const cityRows = cityRates.map((item) => ({
    city: item.city,
    base_rate_cad_per_tonne: item.baseRateCadPerTonne,
    high_risk_rate_cad_per_tonne: item.highRiskRateCadPerTonne,
    hidden_cost: item.hiddenCost,
  }));
  fs.writeFileSync(
    CITY_RATE_FILE,
    toCsv(cityRows, [
      "city",
      "base_rate_cad_per_tonne",
      "high_risk_rate_cad_per_tonne",
      "hidden_cost",
    ]),
  );
}

function writeSourceCatalog() {
  const rows = [
    { category: "Contaminated Sites", name: "Federal Contaminated Sites Inventory", url: "https://open.canada.ca/data/en/dataset/1d42f7b9-1549-40aa-8ac6-0e0302ff2902" },
    { category: "Land Use", name: "OpenStreetMap Overpass", url: "https://overpass-turbo.eu" },
    { category: "Land Use", name: "OpenStreetMap Overpass Non-Brownfield Candidate Export", url: "https://overpass-turbo.eu" },
    { category: "Land Use", name: "Derived Candidate Summary for Parking Lots, Dead Malls, and Rail Corridors", url: "https://overpass-turbo.eu" },
    { category: "Land Use", name: "Toronto Zoning", url: "https://open.toronto.ca/dataset/zoning-by-law/" },
    { category: "Land Use", name: "Vancouver Open Data", url: "https://opendata.vancouver.ca/pages/home/" },
    { category: "Land Use", name: "Montreal Open Data", url: "https://donnees.montreal.ca" },
    { category: "Transit", name: "TTC GTFS", url: "https://open.toronto.ca/dataset/ttc-routes-and-schedules/" },
    { category: "Transit", name: "TransLink GTFS", url: "https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs" },
    { category: "Transit", name: "STM Developers", url: "https://www.stm.info/en/about/developers" },
    { category: "Transit", name: "OC Transpo Developers", url: "https://www.octranspo.com/en/plan-your-trip/travel-tools/developers" },
    { category: "Housing", name: "CMHC Data", url: "https://www.cmhc-schl.gc.ca/en/data-and-research" },
    { category: "Housing", name: "Statistics Canada Census", url: "https://www12.statcan.gc.ca/census-recensement/index-eng.cfm" },
    { category: "Housing", name: "MPAC Data", url: "https://www.mpac.ca/en/OurData" },
    { category: "Housing", name: "BC Assessment", url: "https://info.bcassessment.ca" },
    { category: "Environment", name: "Copernicus Sentinel-2", url: "https://browser.dataspace.copernicus.eu" },
    { category: "Environment", name: "Google Earth Engine", url: "https://earthengine.google.com" },
    { category: "Environment", name: "ECCC Open Data", url: "https://open.canada.ca/en/open-data" },
    { category: "Soil", name: "CanSIS NSDB", url: "https://sis.agr.gc.ca/cansis/nsdb/index.html" },
  ];
  fs.writeFileSync(SOURCE_CATALOG_FILE, toCsv(rows, ["category", "name", "url"]));
}

function writeFetchLog() {
  const log = [
    "# Source Fetch Log",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "- `fcsi-rscf.zip` direct download from TBS endpoint returned host firewall rejection in this environment.",
    "- Used `dataAdhyan` contamination summary as source input for filtered city/province datasets.",
    "- Kept official source references in `data/raw/source_catalog.csv` for reproducible refresh in unrestricted network environments.",
    "",
  ].join("\n");
  fs.writeFileSync(FETCH_LOG_FILE, log);
}

function main() {
  ensureDirectories();
  writeReferenceFiles();
  writeSourceCatalog();
  writeFetchLog();

  const rows = readRows(SOURCE_FILE);
  const filtered: DetailedRecord[] = [];

  for (const row of rows) {
    const rawProvince = (row.Province ?? "").trim();
    const rawCity = (row.Municipality ?? "").trim();
    if (!rawProvince || !rawCity) continue;
    if (!ALLOWED_PROVINCES.has(rawProvince.toLowerCase())) continue;
    if (!ALLOWED_CITIES.has(rawCity.toLowerCase())) continue;

    const city = normalizeCity(rawCity);
    if (!city) continue;

    const { code: provinceCode, name: provinceName } = normalizeProvince(rawProvince);
    const contaminationType = (row.Contamination_Type ?? "").trim();
    const contaminationGroup = classifyContaminant(contaminationType);
    const band = getCostBand(contaminationGroup);
    const mid = midpoint(band.minCost, band.maxCost);
    const cityAdjustedMid = cityAdjust(city, mid);

    filtered.push({
      provinceCode,
      provinceName,
      city,
      siteName: (row.Site_Name ?? "").trim(),
      latitude: (row.Latitude ?? "").trim(),
      longitude: (row.Longitude ?? "").trim(),
      medium: (row.Medium ?? "").trim(),
      contaminationType,
      contaminationGroup,
      siteCount: Number.parseInt((row.Site_Count ?? "1").trim(), 10) || 1,
      costMinCadPerTonne: band.minCost,
      costMaxCadPerTonne: band.maxCost,
      costMidCadPerTonne: mid,
      cityAdjustedMidCadPerTonne: cityAdjustedMid,
    });
  }

  const detailRows = filtered.map((record) => ({
    province_code: record.provinceCode,
    province_name: record.provinceName,
    city: record.city,
    site_name: record.siteName,
    latitude: record.latitude,
    longitude: record.longitude,
    medium: record.medium,
    contamination_type: record.contaminationType,
    contamination_group: record.contaminationGroup,
    site_count: record.siteCount,
    cost_min_cad_per_tonne: record.costMinCadPerTonne,
    cost_max_cad_per_tonne: record.costMaxCadPerTonne,
    cost_mid_cad_per_tonne: record.costMidCadPerTonne,
    city_adjusted_mid_cad_per_tonne: record.cityAdjustedMidCadPerTonne,
  }));
  fs.writeFileSync(
    FILTERED_DETAIL_FILE,
    toCsv(detailRows, [
      "province_code",
      "province_name",
      "city",
      "site_name",
      "latitude",
      "longitude",
      "medium",
      "contamination_type",
      "contamination_group",
      "site_count",
      "cost_min_cad_per_tonne",
      "cost_max_cad_per_tonne",
      "cost_mid_cad_per_tonne",
      "city_adjusted_mid_cad_per_tonne",
    ]),
  );

  const siteMap = new Map<string, {
    provinceCode: string;
    provinceName: string;
    city: string;
    siteName: string;
    latitude: string;
    longitude: string;
    contaminationGroups: Set<string>;
    contaminationTypes: Set<string>;
    recordCount: number;
    minCost: number | null;
    maxCost: number | null;
    avgMidAccumulator: number;
    avgMidCount: number;
  }>();

  for (const record of filtered) {
    const key = [
      record.provinceCode,
      record.city,
      record.siteName,
      record.latitude,
      record.longitude,
    ].join("|");
    const existing = siteMap.get(key);
    if (!existing) {
      siteMap.set(key, {
        provinceCode: record.provinceCode,
        provinceName: record.provinceName,
        city: record.city,
        siteName: record.siteName,
        latitude: record.latitude,
        longitude: record.longitude,
        contaminationGroups: new Set([record.contaminationGroup]),
        contaminationTypes: new Set([record.contaminationType]),
        recordCount: record.siteCount,
        minCost: record.costMinCadPerTonne,
        maxCost: record.costMaxCadPerTonne,
        avgMidAccumulator: record.cityAdjustedMidCadPerTonne ?? 0,
        avgMidCount: record.cityAdjustedMidCadPerTonne !== null ? 1 : 0,
      });
      continue;
    }

    existing.contaminationGroups.add(record.contaminationGroup);
    existing.contaminationTypes.add(record.contaminationType);
    existing.recordCount += record.siteCount;
    if (record.costMinCadPerTonne !== null) {
      existing.minCost =
        existing.minCost === null
          ? record.costMinCadPerTonne
          : Math.min(existing.minCost, record.costMinCadPerTonne);
    }
    if (record.costMaxCadPerTonne !== null) {
      existing.maxCost =
        existing.maxCost === null
          ? record.costMaxCadPerTonne
          : Math.max(existing.maxCost, record.costMaxCadPerTonne);
    }
    if (record.cityAdjustedMidCadPerTonne !== null) {
      existing.avgMidAccumulator += record.cityAdjustedMidCadPerTonne;
      existing.avgMidCount += 1;
    }
  }

  const siteRows = Array.from(siteMap.values()).map((site) => ({
    province_code: site.provinceCode,
    province_name: site.provinceName,
    city: site.city,
    site_name: site.siteName,
    latitude: site.latitude,
    longitude: site.longitude,
    contamination_group_count: site.contaminationGroups.size,
    contamination_groups: Array.from(site.contaminationGroups).join(" | "),
    contamination_types: Array.from(site.contaminationTypes).join(" | "),
    contamination_record_count: site.recordCount,
    est_cost_min_cad_per_tonne: site.minCost,
    est_cost_max_cad_per_tonne: site.maxCost,
    est_cost_avg_mid_cad_per_tonne:
      site.avgMidCount > 0
        ? Math.round((site.avgMidAccumulator / site.avgMidCount) * 100) / 100
        : null,
  }));
  fs.writeFileSync(
    FILTERED_SITE_FILE,
    toCsv(siteRows, [
      "province_code",
      "province_name",
      "city",
      "site_name",
      "latitude",
      "longitude",
      "contamination_group_count",
      "contamination_groups",
      "contamination_types",
      "contamination_record_count",
      "est_cost_min_cad_per_tonne",
      "est_cost_max_cad_per_tonne",
      "est_cost_avg_mid_cad_per_tonne",
    ]),
  );

  const soilRows = siteRows.map((site) => ({
    province_code: site.province_code,
    city: site.city,
    site_name: site.site_name,
    latitude: site.latitude,
    longitude: site.longitude,
    sand_score: null,
    clay_score: null,
    drainage_score: null,
    organic_score: null,
    score_formula: "(sand*0.30)+(clay*0.25)+(drainage*0.25)+(organic*0.20)",
    final_percentage: null,
  }));
  fs.writeFileSync(
    SOIL_TEMPLATE_FILE,
    toCsv(soilRows, [
      "province_code",
      "city",
      "site_name",
      "latitude",
      "longitude",
      "sand_score",
      "clay_score",
      "drainage_score",
      "organic_score",
      "score_formula",
      "final_percentage",
    ]),
  );

  console.log(
    [
      "Data assets generated.",
      `Input rows: ${rows.length}`,
      `Filtered detail rows: ${detailRows.length}`,
      `Filtered site rows: ${siteRows.length}`,
      `Detail CSV: ${FILTERED_DETAIL_FILE}`,
      `Site CSV: ${FILTERED_SITE_FILE}`,
      `Soil template CSV: ${SOIL_TEMPLATE_FILE}`,
      `Cost reference CSV: ${COST_REFERENCE_FILE}`,
      `City rate CSV: ${CITY_RATE_FILE}`,
      `Source catalog CSV: ${SOURCE_CATALOG_FILE}`,
    ].join("\n"),
  );
}

main();
