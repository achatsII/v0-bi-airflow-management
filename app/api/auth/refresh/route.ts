import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const refresh_token = request.cookies.get('refresh_token')?.value;
    
    if (!refresh_token) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const GATEWAY_BASE = API_BASE_URL.replace('/api/v1', '');
    
    const response = await fetch(`${GATEWAY_BASE}/api/v1/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    const data = await response.json();

    const responseObj = NextResponse.json({ ok: true }, { status: 200 });

    responseObj.cookies.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: data.expires_in || 3600,
    });

    return responseObj;

  } catch (error: any) {
    console.error('Auth refresh error:', error);
    return NextResponse.json({ error: 'Refresh exception', detail: error?.message }, { status: 500 });
  }
}
