import { NextRequest, NextResponse } from "next/server";

function shouldClearCookie(name: string) {
  return (
    name === "zv_session" ||
    name === "__session" ||
    name === "appSession" ||
    name.startsWith("__session.") ||
    name.startsWith("appSession.") ||
    name.startsWith("__txn_")
  );
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  for (const cookie of request.cookies.getAll()) {
    if (shouldClearCookie(cookie.name)) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
