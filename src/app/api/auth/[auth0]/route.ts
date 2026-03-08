import { getAuth0Client } from '@/lib/auth0';

const client = getAuth0Client();

// Only export the handler if the client is available (i.e. env vars are present)
export const GET = client ? client.middleware.bind(client) : async () => new Response("Auth0 not configured", { status: 500 });
