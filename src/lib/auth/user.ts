import { getAuth0Client } from "@/lib/auth0";

export type AppRole = "planner" | "architect" | "developer";

export type RequestUser = {
  id: string;
  role: AppRole;
  email: string | null;
  source: "auth0" | "header";
};

function toRole(value: string | null): AppRole {
  if (value === "architect" || value === "developer") {
    return value;
  }
  return "planner";
}

type RequestLike = {
  headers: Pick<Headers, "get">;
};

function getRoleFromSessionUser(user: Record<string, unknown>, fallback: AppRole) {
  const scopedRole = user["https://zonaviva.app/role"];
  if (typeof scopedRole === "string") {
    return toRole(scopedRole);
  }
  const role = user.role;
  if (typeof role === "string") {
    return toRole(role);
  }
  return fallback;
}

export async function getRequestUser(req: RequestLike): Promise<RequestUser | null> {
  const fallbackRole = toRole(req.headers.get("x-user-role"));

  const auth0 = getAuth0Client();
  if (auth0) {
    const session = await auth0.getSession();
    const sessionUser = session?.user as Record<string, unknown> | undefined;
    const sessionSub = sessionUser?.sub;

    if (sessionUser && typeof sessionSub === "string" && sessionSub.length > 0) {
      return {
        id: sessionSub,
        role: getRoleFromSessionUser(sessionUser, fallbackRole),
        email: typeof sessionUser.email === "string" ? sessionUser.email : null,
        source: "auth0",
      };
    }
  }

  const id = req.headers.get("x-user-id");
  if (!id) {
    return null;
  }

  return {
    id,
    role: fallbackRole,
    email: req.headers.get("x-user-email"),
    source: "header",
  };
}
