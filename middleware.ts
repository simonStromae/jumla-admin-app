import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/admin')) {
    const role = (session.user as any)?.role;
    if (role !== 'admin' && role !== 'agent') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
  }
});

export const config = {
  matcher: ['/admin/:path*', '/client/:path*'],
};
