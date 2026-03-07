import { fail, ok } from "@/lib/http/response";
import { logApiRequest } from "@/lib/http/logging";
import { getSiteById } from "@/lib/data/repository";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;
  logApiRequest("GET", "/api/sites/:id", { id });

  try {
    const site = await getSiteById(id);
    if (!site) {
      return fail(404, { code: "SITE_NOT_FOUND", message: "Site not found" });
    }
    return ok(site);
  } catch (error) {
    return fail(500, {
      code: "SITE_FETCH_FAILED",
      message: "Could not load site detail",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
