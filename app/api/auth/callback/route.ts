import { NextResponse } from 'next/server';

function homeUrl(request: Request, state: string) {
  const url = new URL('/', request.url);
  url.searchParams.set('auth', state);
  return url;
}

function readCookie(cookieHeader: string | null, key: string) {
  if (!cookieHeader) {
    return '';
  }

  const parts = cookieHeader.split(';').map((part) => part.trim());
  const entry = parts.find((part) => part.startsWith(`${key}=`));
  return entry ? decodeURIComponent(entry.slice(key.length + 1)) : '';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  const expectedState = readCookie(request.headers.get('cookie'), 'stage_me_oauth_state');

  if (error) {
    const response = NextResponse.redirect(homeUrl(request, 'error'));
    response.cookies.delete('stage_me_oauth_state');
    return response;
  }

  if (!state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(homeUrl(request, 'error'));
    response.cookies.delete('stage_me_oauth_state');
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(homeUrl(request, 'demo'));
    response.cookies.delete('stage_me_oauth_state');
    return response;
  }

  const tokenUrl = process.env.SECOND_ME_TOKEN_URL;
  const clientId = process.env.NEXT_PUBLIC_SECOND_ME_CLIENT_ID;
  const clientSecret = process.env.SECOND_ME_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_SECOND_ME_REDIRECT_URI;

  if (!tokenUrl || !clientId || !clientSecret || !redirectUri) {
    const response = NextResponse.redirect(homeUrl(request, 'demo'));
    response.cookies.delete('stage_me_oauth_state');
    return response;
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const errorResponse = NextResponse.redirect(homeUrl(request, 'error'));
      errorResponse.cookies.delete('stage_me_oauth_state');
      return errorResponse;
    }

    const successResponse = NextResponse.redirect(homeUrl(request, 'connected'));
    successResponse.cookies.delete('stage_me_oauth_state');
    return successResponse;
  } catch {
    const errorResponse = NextResponse.redirect(homeUrl(request, 'error'));
    errorResponse.cookies.delete('stage_me_oauth_state');
    return errorResponse;
  }
}
