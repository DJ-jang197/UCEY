import { NextRequest } from "next/server";
import { getAuth0Client } from '@/lib/auth0';

export async function GET(request: NextRequest) {
  const client = getAuth0Client();
  if (!client) {
    return new Response("Auth0 is not configured properly", { status: 500 });
  }

  const connection = request.nextUrl.searchParams.get("connection");
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";

  return client.startInteractiveLogin({
    returnTo,
    authorizationParameters: connection ? { connection } : undefined,
  });
}
