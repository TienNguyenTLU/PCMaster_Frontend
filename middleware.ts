import { NextResponse } from 'next/server';

/**
 * Middleware is intentionally minimal.
 *
 * Token is stored only in localStorage (client-side), so the middleware
 * cannot read it. Auth state is managed entirely by the Zustand store on
 * the client.
 *
 * The only SSR-level protection we keep here is redirecting already-
 * authenticated users away from auth pages — but since we have no cookie
 * to read, that redirect is also handled client-side (in the login/register
 * page components themselves via useAuthStore).
 *
 * When dashboard protection is re-enabled, switch to HttpOnly cookie storage
 * and decode the JWT here to check the role.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Only run on routes that actually need middleware processing.
  // Exclude static assets to keep the edge runtime fast.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
