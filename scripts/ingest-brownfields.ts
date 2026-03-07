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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

async function main() {
  const rows = readCsvRows(csvPath);
  let skipped = 0;
  let prepared = 0;
  const now = new Date().toISOString();

  const payload = rows
    .map((row, index) => {
      const lat = toNumber(first(row, ["latitude", "Latitude", "lat", "LAT"]));
      const lng = toNumber(
        first(row, ["longitude", "Longitude", "lon", "lng", "LONG"]),
      );

      if (lat === null || lng === null) {
        skipped += 1;
        return null;
      }

      const name =
        first(row, ["site_name", "Site Name", "name", "Name"]) ??
        `Brownfield Site ${index + 1}`;
      const siteId =
        first(row, ["site_id", "Site ID", "id", "ID", "record_id"]) ??
        `${lat}:${lng}:${name}`;

      prepared += 1;
      return {
        name,
        slug: slugify(`${name}-${siteId}`),
        source: sourceName,
        source_id: siteId,
        site_type: "brownfield",
        status: "active",
        city: first(row, ["city", "City", "municipality", "Municipality"]),
        province: first(row, ["province", "Province", "prov", "Prov"]),
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
        raw_metadata: row,
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
      `Rows skipped (invalid coordinates): ${skipped}`,
      `Rows upserted: ${payload.length}`,
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
