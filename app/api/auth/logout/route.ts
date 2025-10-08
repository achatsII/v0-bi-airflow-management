import { NextRequest, NextResponse } from 'next/server';
import { AUTH_PORTAL_URL, BASE_URL } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const portal = AUTH_PORTAL_URL;
    const redirect_uri = `${BASE_URL}/`;

    const responseObj = NextResponse.json({ 
      redirect_url: `${portal}/logout?redirect_uri=${encodeURIComponent(redirect_uri)}` 
    }, { status: 200 });

    // Clear all auth cookies
    responseObj.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    responseObj.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    responseObj.cookies.set('access_exp', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return responseObj;

  } catch (error: any) {
    console.error('Auth logout error:', error);
    return NextResponse.json({ error: 'Logout exception', detail: error?.message }, { status: 500 });
  }
}
