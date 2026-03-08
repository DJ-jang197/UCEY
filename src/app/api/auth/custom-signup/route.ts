import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/dbconnections/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        email,
        password,
        connection: 'Username-Password-Authentication',
        user_metadata: { name }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        // Auth0 can return various structures
        const errorDetail = data.description || data.error_description || (typeof data.error === 'string' ? data.error : data.message) || 'Signup failed';
        // Ensure what we return is a string to avoid React rendering bugs
        const errorString = typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : String(errorDetail);
        return NextResponse.json({ error: errorString }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
