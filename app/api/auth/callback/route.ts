import { NextResponse } from 'next/server';

function homeUrl(request: Request, state: string) {
  const url = new URL('/', request.url);
  url.searchParams.set('auth', state);
  return url;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(homeUrl(request, 'error'));
  }

  if (!code) {
    return NextResponse.redirect(homeUrl(request, 'demo'));
  }

  const tokenUrl = process.env.SECOND_ME_TOKEN_URL;
  const clientId = process.env.NEXT_PUBLIC_SECOND_ME_CLIENT_ID;
  const clientSecret = process.env.SECOND_ME_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_SECOND_ME_REDIRECT_URI;

  if (!tokenUrl || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(homeUrl(request, 'demo'));
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
      return NextResponse.redirect(homeUrl(request, 'error'));
    }

    return NextResponse.redirect(homeUrl(request, 'connected'));
  } catch {
    return NextResponse.redirect(homeUrl(request, 'error'));
  }
}
