import { z } from "zod";
import { fail, ok } from "@/lib/http/response";
import { logApiRequest } from "@/lib/http/logging";
import { generateSiteReport } from "@/lib/ai/gemini";
import { synthesizeReportAudio } from "@/lib/ai/elevenlabs";
import type { SiteDetail, SiteReport } from "@/lib/types/site";

const transientReportInputSchema = z.object({
  id: z.string().min(1),
  site: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    siteType: z.string().min(1),
    city: z.string().nullable(),
    province: z.string().nullable(),
    contaminationStatus: z.string().nullable().optional(),
    formerUse: z.string().nullable().optional(),
    areaM2: z.number().nullable().optional(),
    viabilityScore: z.number().nullable().optional(),
    scores: z.object({
      viability: z.number().nullable().optional(),
      soil: z.number().nullable().optional(),
      infrastructure: z.number().nullable().optional(),
    }),
    estimates: z.object({
      units: z.number().nullable().optional(),
      remediationCost: z.number().nullable().optional(),
      timelineMonths: z.number().nullable().optional(),
      costPerTonneMin: z.number().nullable().optional(),
      costPerTonneMax: z.number().nullable().optional(),
      costPerTonneAvg: z.number().nullable().optional(),
    }),
  }),
});

// Simple in-memory cache for the current server process.
const transientReportCache = new Map<string, SiteReport>();

export async function POST(req: Request) {
  logApiRequest("POST", "/api/sites/fcsi/report");

  const body = await req.json().catch(() => null);
  const parsed = transientReportInputSchema.safeParse(body);

  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_TRANSIENT_REPORT_INPUT",
      message: "Invalid transient site report payload",
      details: parsed.error.flatten(),
    });
  }

  const { id, site } = parsed.data;

  if (transientReportCache.has(id)) {
    return ok(transientReportCache.get(id));
  }

  try {
    const detail: SiteDetail = {
      // Fill required SiteDetail fields from the payload.
      ...site,
      contaminationStatus: site.contaminationStatus ?? null,
      formerUse: site.formerUse ?? null,
      areaM2: site.areaM2 ?? null,
      city: site.city ?? null,
      province: site.province ?? null,
      lat: 0,
      lng: 0,
      // Defaults for list-only properties we don't need for Gemini.
      estimatedAreaM2: site.areaM2 ?? null,
      estimatedRemediationCost: site.estimates.remediationCost ?? null,
      estimatedUnits: site.estimates.units ?? null,
      estimatedTimelineMonths: site.estimates.timelineMonths ?? null,
      estimatedSoilScore: site.scores.soil ?? null,
      estimatedInfraScore: site.scores.infrastructure ?? null,
    } as SiteDetail;

    const { summary, rawJson } = await generateSiteReport(detail);
    let audioUrl: string | null = null;
    try {
      audioUrl = await synthesizeReportAudio(summary, id);
    } catch {
      audioUrl = null;
    }

    const report: SiteReport = {
      siteId: id,
      status: "ready",
      summary,
      audioUrl,
      imageUrls: [],
      rawJson,
    };

    transientReportCache.set(id, report);
    return ok(report);
  } catch (error) {
    return fail(500, {
      code: "TRANSIENT_REPORT_GENERATION_FAILED",
      message: "Could not generate site report",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
