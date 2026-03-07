import { getSiteMedia } from "@/lib/data/repository";
import { logApiRequest } from "@/lib/http/logging";
import { fail, ok } from "@/lib/http/response";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;
  logApiRequest("GET", "/api/sites/:id/media", { id });

  try {
    const items = await getSiteMedia(id);
    return ok({ items, meta: { count: items.length } });
  } catch (error) {
    return fail(500, {
      code: "SITE_MEDIA_FETCH_FAILED",
      message: "Could not load site media",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
