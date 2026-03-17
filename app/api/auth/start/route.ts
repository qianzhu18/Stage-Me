import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

function homeUrl(request: Request, state: string) {
  const url = new URL('/', request.url);
  url.searchParams.set('auth', state);
  return url;
}

export async function GET(request: Request) {
  const authUrl = process.env.NEXT_PUBLIC_SECOND_ME_AUTH_URL;
  const clientId = process.env.NEXT_PUBLIC_SECOND_ME_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SECOND_ME_REDIRECT_URI;

  if (!authUrl || !clientId || !redirectUri) {
    return NextResponse.redirect(homeUrl(request, 'demo'));
  }

  const url = new URL(authUrl);
  const state = crypto.randomUUID();
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url);
  response.cookies.set('stage_me_oauth_state', state, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/'
  });

  return response;
}
