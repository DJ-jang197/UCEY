import { z } from "zod";
import { logApiRequest } from "@/lib/http/logging";
import { fail, ok } from "@/lib/http/response";
import { getSiteReport, upsertSiteReport } from "@/lib/data/repository";

const reportSchema = z.object({
  provider: z.string().default("gemini-2.0-flash"),
  status: z.enum(["pending", "ready", "failed"]),
  summary: z.string().min(1),
  audioUrl: z.string().url().nullable().default(null),
  imageUrls: z.array(z.string().url()).default([]),
  rawJson: z.record(z.string(), z.unknown()).nullable().default(null),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;
  logApiRequest("GET", "/api/sites/:id/report", { id });
  try {
    const report = await getSiteReport(id);
    if (!report) {
      return fail(404, {
        code: "REPORT_NOT_FOUND",
        message: "No report exists for this site",
      });
    }
    return ok(report);
  } catch (error) {
    return fail(500, {
      code: "REPORT_FETCH_FAILED",
      message: "Could not load site report",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(req: Request, context: Context) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_REPORT_PAYLOAD",
      message: "Report payload is invalid",
      details: parsed.error.flatten(),
    });
  }

  try {
    logApiRequest("POST", "/api/sites/:id/report", {
      id,
      status: parsed.data.status,
      provider: parsed.data.provider,
    });
    await upsertSiteReport(id, parsed.data);
    return ok({ ok: true });
  } catch (error) {
    return fail(500, {
      code: "REPORT_UPSERT_FAILED",
      message: "Could not persist site report",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
