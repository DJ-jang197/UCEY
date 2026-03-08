import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;

    if (!issuerBaseUrl || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Auth0 is not configured for email/password login." },
        { status: 500 },
      );
    }

    const response = await fetch(`${issuerBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        realm: 'Username-Password-Authentication',
        username: email,
        password,
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid profile email'
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        return NextResponse.json({ error: data.error_description || 'Invalid credentials or Password grant is not enabled' }, { status: response.status });
    }

    const token = typeof data.access_token === "string" ? data.access_token : null;
    if (!token) {
      return NextResponse.json(
        { error: "Auth provider did not return an access token." },
        { status: 502 },
      );
    }

    const res = NextResponse.json({ success: true, redirectTo: "/" });
    res.cookies.set('zv_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: typeof data.expires_in === "number" ? data.expires_in : 60 * 60 * 8,
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
