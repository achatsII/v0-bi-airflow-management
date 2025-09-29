import { NextRequest, NextResponse } from 'next/server';
import cookie from 'cookie';

export async function POST(request: NextRequest) {
  try {
    const { code, code_verifier, redirect_uri, app_identifier } = await request.json();
    
    if (!code || !code_verifier || !redirect_uri || !app_identifier) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const GATEWAY_BASE = process.env.GATEWAY_BASE!;
    console.log('🔗 Using gateway URL:', GATEWAY_BASE);
    
    const response = await fetch(`${GATEWAY_BASE}/api/v1/auth/token/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier, redirect_uri, app_identifier }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: "exchange_failed", detail: text }, { status: 400 });
    }

    const data = await response.json(); // { access_token, refresh_token, expires_in, token_type }

    const now = Math.floor(Date.now() / 1000);
    const accessExp = now + Math.max(60, Number(data.expires_in || 3600) - 30);

    const responseObj = NextResponse.json({ ok: true }, { status: 200 });

    // Set httpOnly cookies
    responseObj.cookies.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: data.expires_in || 3600,
    });

    responseObj.cookies.set('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    responseObj.cookies.set('access_exp', String(accessExp), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return responseObj;

  } catch (error: any) {
    console.error('Auth exchange error:', error);
    return NextResponse.json({ error: "exchange_exception", detail: error?.message }, { status: 500 });
  }
}
