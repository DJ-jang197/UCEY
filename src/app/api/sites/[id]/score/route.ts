import { z } from "zod";
import { logApiRequest } from "@/lib/http/logging";
import { fail, ok } from "@/lib/http/response";
import { upsertSiteScore } from "@/lib/data/repository";

const scoreSchema = z.object({
  provider: z.string().default("manual"),
  status: z.enum(["pending", "ready", "failed"]).default("ready"),
  viabilityScore: z.number().min(0).max(100).nullable().default(null),
  soilScore: z.number().min(0).max(100).nullable().default(null),
  infrastructureScore: z.number().min(0).max(100).nullable().default(null),
  housingUnitsEst: z.number().int().min(0).nullable().default(null),
  remediationCostEst: z.number().min(0).nullable().default(null),
  timelineMonthsEst: z.number().int().min(0).nullable().default(null),
  summary: z.string().nullable().default(null),
  rawJson: z.record(z.string(), z.unknown()).nullable().default(null),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: Context) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = scoreSchema.safeParse(body);

  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_SCORE_PAYLOAD",
      message: "Score payload is invalid",
      details: parsed.error.flatten(),
    });
  }

  try {
    logApiRequest("POST", "/api/sites/:id/score", {
      id,
      status: parsed.data.status,
      provider: parsed.data.provider,
    });
    await upsertSiteScore(id, parsed.data);
    return ok({ ok: true });
  } catch (error) {
    return fail(500, {
      code: "SCORE_UPSERT_FAILED",
      message: "Could not persist site score",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
