import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { demoReports, demoSites } from "../src/lib/demo/demo-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const now = new Date().toISOString();

  const siteRows = demoSites.map((site, index) => ({
    id: site.id,
    name: site.name,
    slug: site.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    source: "demo_seed",
    source_id: `demo-${index + 1}`,
    site_type: site.siteType,
    status: "active",
    city: site.city,
    province: site.province,
    country: "CA",
    lat: site.lat,
    lng: site.lng,
    area_m2: site.areaM2,
    contamination_status: site.contaminationStatus,
    former_use: site.formerUse,
    viability_score: site.viabilityScore,
    raw_metadata: {},
    updated_at: now,
  }));

  const { error: siteError } = await supabase
    .from("sites")
    .upsert(siteRows, { onConflict: "id" });

  if (siteError) {
    throw new Error(`Failed to seed sites: ${siteError.message}`);
  }

  const scoreRows = demoSites.map((site) => ({
    site_id: site.id,
    provider: "demo_seed",
    status: "ready",
    viability_score: site.scores.viability,
    soil_score: site.scores.soil,
    infrastructure_score: site.scores.infrastructure,
    housing_units_est: site.estimates.units,
    remediation_cost_est: site.estimates.remediationCost,
    timeline_months_est: site.estimates.timelineMonths,
    summary: "Seeded score row for demo readiness.",
    raw_json: {},
    updated_at: now,
  }));

  const { error: scoreError } = await supabase
    .from("site_scores")
    .upsert(scoreRows, { onConflict: "site_id,provider" });
  if (scoreError) {
    throw new Error(`Failed to seed score rows: ${scoreError.message}`);
  }

  const reportRows = demoReports.map((report) => ({
    site_id: report.siteId,
    provider: "demo_seed",
    status: report.status,
    summary: report.summary,
    audio_url: report.audioUrl,
    structured_report: {
      imageUrls: report.imageUrls,
      ...(report.rawJson ?? {}),
    },
    updated_at: now,
  }));

  if (reportRows.length > 0) {
    const { error: reportError } = await supabase
      .from("site_reports")
      .upsert(reportRows, { onConflict: "site_id,provider" });
    if (reportError) {
      throw new Error(`Failed to seed reports: ${reportError.message}`);
    }
  }

  console.log(
    `Seed completed. Upserted ${siteRows.length} sites, inserted ${scoreRows.length} scores, inserted ${reportRows.length} reports.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
