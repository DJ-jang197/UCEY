import { fail, ok } from "@/lib/http/response";
import { logApiRequest } from "@/lib/http/logging";
import { getSiteById, getSiteReport, upsertSiteReport } from "@/lib/data/repository";
import { generateSiteReport } from "@/lib/ai/gemini";
import { synthesizeReportAudio } from "@/lib/ai/elevenlabs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: Context) {
  const { id } = await context.params;
  logApiRequest("POST", "/api/sites/:id/report/generate", { id });

  try {
    const site = await getSiteById(id);
    if (!site) {
      return fail(404, {
        code: "SITE_NOT_FOUND",
        message: "Site not found",
      });
    }

    const { summary, rawJson } = await generateSiteReport(site);

    let audioUrl: string | null = null;
    try {
      audioUrl = await synthesizeReportAudio(summary, id);
    } catch {
      audioUrl = null;
    }

    await upsertSiteReport(id, {
      provider: "gemini-2.0-flash",
      status: "ready",
      summary,
      audioUrl,
      imageUrls: [],
      rawJson,
    });

    const report = await getSiteReport(id);
    return ok(report);
  } catch (error) {
    return fail(500, {
      code: "REPORT_GENERATION_FAILED",
      message: "Could not generate site report",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

