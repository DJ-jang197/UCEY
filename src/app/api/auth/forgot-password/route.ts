import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;

    if (!auth0Domain || !clientId) {
      console.error('Missing Auth0 environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Call Auth0 Authentication API to send a password reset email
    const auth0Res = await fetch(`${auth0Domain}/dbconnections/change_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        email: email,
        connection: 'Username-Password-Authentication',
      }),
    });

    if (!auth0Res.ok) {
      const errorData = await auth0Res.text();
      console.error('Auth0 password reset error:', errorData);
      return NextResponse.json({ error: 'Failed to send password reset email' }, { status: auth0Res.status });
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent (if account exists)' });
  } catch (error) {
    console.error('Password reset endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
