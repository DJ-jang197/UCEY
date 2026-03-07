import { getRequestUser } from "@/lib/auth/user";
import { saveSiteForUser } from "@/lib/data/repository";
import { logApiRequest } from "@/lib/http/logging";
import { fail, ok } from "@/lib/http/response";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: Context) {
  const user = getRequestUser(req);
  if (!user) {
    return fail(401, {
      code: "UNAUTHORIZED",
      message: "x-user-id header is required for this endpoint",
    });
  }

  const { id } = await context.params;

  try {
    logApiRequest("POST", "/api/sites/:id/save", { id, userId: user.id });
    await saveSiteForUser(user.id, id);
    return ok({ ok: true });
  } catch (error) {
    return fail(500, {
      code: "SAVE_SITE_FAILED",
      message: "Could not save site",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
