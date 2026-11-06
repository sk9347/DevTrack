import { NextResponse, type NextRequest } from 'next/server';

/** Optimistic gate: the API still verifies the token on every call. */
export function middleware(req: NextRequest) {
  const signedIn = req.cookies.has('devtrack_token');
  const onLogin = req.nextUrl.pathname.startsWith('/login');
  if (!signedIn && !onLogin) return NextResponse.redirect(new URL('/login', req.url));
  if (signedIn && onLogin) return NextResponse.redirect(new URL('/dashboard', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next|favicon.ico|icon.svg).*)'] };
