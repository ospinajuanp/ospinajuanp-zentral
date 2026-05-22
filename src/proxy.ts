import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';

const publicExact = ['/'];
const publicPrefixes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/session',
  '/api/auth/gmail/callback',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicExact.includes(pathname) || publicPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('zentral_session')?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    const payload = await verifyJwt(token);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub ?? '');
    requestHeaders.set('x-user-role', payload.role ?? '');
    requestHeaders.set('x-workspace-id', payload.workspaceId ?? '');

    if (pathname.startsWith('/admin') && payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    const response = redirectToLogin(request);
    response.cookies.delete('zentral_session');
    return response;
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
