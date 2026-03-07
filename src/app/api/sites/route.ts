import { z } from "zod";
import { listSites } from "@/lib/data/repository";
import { logApiRequest } from "@/lib/http/logging";
import { fail, ok } from "@/lib/http/response";

const querySchema = z.object({
  bbox: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  site_type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    bbox: url.searchParams.get("bbox") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    province: url.searchParams.get("province") ?? undefined,
    site_type: url.searchParams.get("site_type") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_QUERY",
      message: "Query validation failed",
      details: parsed.error.flatten(),
    });
  }

  try {
    logApiRequest("GET", "/api/sites", parsed.data);
    const result = await listSites({
      bbox: parsed.data.bbox,
      city: parsed.data.city,
      province: parsed.data.province,
      siteType: parsed.data.site_type,
      limit: parsed.data.limit,
    });
    return ok(result);
  } catch (error) {
    return fail(500, {
      code: "SITES_FETCH_FAILED",
      message: "Could not load sites",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
