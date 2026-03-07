import { z } from "zod";
import { fail, ok } from "@/lib/http/response";
import { getTopSites } from "@/lib/data/repository";
import { logApiRequest } from "@/lib/http/logging";

const querySchema = z.object({
  province: z.string().default("ON"),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    province: url.searchParams.get("province") ?? "ON",
    limit: url.searchParams.get("limit") ?? 10,
  });

  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_QUERY",
      message: "Top sites query is invalid",
      details: parsed.error.flatten(),
    });
  }

  try {
    logApiRequest("GET", "/api/sites/top", parsed.data);
    const items = await getTopSites(parsed.data.province, parsed.data.limit);
    return ok({
      items,
      meta: { province: parsed.data.province, count: items.length },
    });
  } catch (error) {
    return fail(500, {
      code: "TOP_SITES_FETCH_FAILED",
      message: "Could not load top sites",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
