import { z } from "zod";
import { getRequestUser } from "@/lib/auth/user";
import { createProject, listProjects } from "@/lib/data/repository";
import { logApiRequest } from "@/lib/http/logging";
import { fail, ok } from "@/lib/http/response";

const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
});

export async function GET(req: Request) {
  const user = getRequestUser(req);
  if (!user) {
    return fail(401, {
      code: "UNAUTHORIZED",
      message: "x-user-id header is required for this endpoint",
    });
  }

  try {
    logApiRequest("GET", "/api/projects", { userId: user.id });
    const projects = await listProjects(user.id);
    return ok({ items: projects, meta: { count: projects.length } });
  } catch (error) {
    return fail(500, {
      code: "PROJECTS_FETCH_FAILED",
      message: "Could not load projects",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(req: Request) {
  const user = getRequestUser(req);
  if (!user) {
    return fail(401, {
      code: "UNAUTHORIZED",
      message: "x-user-id header is required for this endpoint",
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_PROJECT_PAYLOAD",
      message: "Project payload is invalid",
      details: parsed.error.flatten(),
    });
  }

  try {
    logApiRequest("POST", "/api/projects", { userId: user.id, name: parsed.data.name });
    const project = await createProject(
      user.id,
      parsed.data.name,
      parsed.data.description ?? null,
    );
    return ok(project, { status: 201 });
  } catch (error) {
    return fail(500, {
      code: "PROJECT_CREATE_FAILED",
      message: "Could not create project",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
