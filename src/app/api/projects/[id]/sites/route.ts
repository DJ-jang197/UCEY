import { z } from "zod";
import { getRequestUser } from "@/lib/auth/user";
import { addSiteToProject } from "@/lib/data/repository";
import { logApiRequest } from "@/lib/http/logging";
import { fail, ok } from "@/lib/http/response";

const attachSiteSchema = z.object({
  siteId: z.string().uuid(),
});

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

  const body = await req.json().catch(() => null);
  const parsed = attachSiteSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_ATTACH_PAYLOAD",
      message: "Attach payload is invalid",
      details: parsed.error.flatten(),
    });
  }

  const { id } = await context.params;
  try {
    logApiRequest("POST", "/api/projects/:id/sites", {
      projectId: id,
      siteId: parsed.data.siteId,
      userId: user.id,
    });
    await addSiteToProject(user.id, id, parsed.data.siteId);
    return ok({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Project not found") {
      return fail(404, { code: "PROJECT_NOT_FOUND", message });
    }
    return fail(500, {
      code: "ATTACH_SITE_FAILED",
      message: "Could not attach site to project",
      details: message,
    });
  }
}
