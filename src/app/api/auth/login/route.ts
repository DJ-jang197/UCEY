import { getAuth0Client } from '@/lib/auth0';

export async function GET() {
  const client = getAuth0Client();
  if (!client) {
    return new Response("Auth0 is not configured properly", { status: 500 });
  }
  
  return client.startInteractiveLogin();
}
