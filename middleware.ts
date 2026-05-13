import { type NextRequest, NextResponse } from 'next/server';

function getRoleFromUser(request: NextRequest): 'ADMIN' | 'CUSTOMER' | null {
  try {
    const userCookie = request.cookies.get('user')?.value;
    if (!userCookie) return null;
    const user = JSON.parse(decodeURIComponent(userCookie));
    return user?.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register') ||
    pathname === '/auth';

  // Already authenticated → skip auth pages, route by role
  if (isAuthPage && token) {
    const role = getRoleFromUser(request);
    const dest = role === 'ADMIN' ? '/dashboard' : '/home';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Dashboard is ADMIN-only (Temporarily disabled for UI review)
  /*
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    const role = getRoleFromUser(request);
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
