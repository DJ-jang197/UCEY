import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { hasAuth0Env } from "@/lib/config/env";

let client: Auth0Client | null | undefined;

export function getAuth0Client(): Auth0Client | null {
  if (client !== undefined) {
    return client;
  }

  if (!hasAuth0Env()) {
    client = null;
    return client;
  }

  client = new Auth0Client({
    authorizationParameters: {
      scope: 'openid profile email'
    }
  });
  return client;
}
