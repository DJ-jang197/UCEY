import { type NextRequest } from "next/server";

export type AppRole = "planner" | "architect" | "developer";

export type RequestUser = {
  id: string;
  role: AppRole;
};

function toRole(value: string | null): AppRole {
  if (value === "architect" || value === "developer") {
    return value;
  }
  return "planner";
}

export function getRequestUser(req: NextRequest): RequestUser | null {
  const id = req.headers.get("x-user-id");
  if (!id) {
    return null;
  }

  return {
    id,
    role: toRole(req.headers.get("x-user-role")),
  };
}
