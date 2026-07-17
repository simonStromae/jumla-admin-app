import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as any)?.role as string | undefined;

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/admin')) {
    if (role !== 'admin' && role !== 'agent') {
      const dest = role === 'driver' ? '/livreur/dashboard' : '/client/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }
  }

  if (pathname.startsWith('/livreur')) {
    // admin can access livreur for testing; drivers are the primary audience
    if (role !== 'driver' && role !== 'admin') {
      const dest = role === 'agent' ? '/admin/dashboard' : '/client/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }
  }

  if (pathname.startsWith('/client')) {
    if (role === 'driver') return NextResponse.redirect(new URL('/livreur/dashboard', req.url));
    if (role === 'admin' || role === 'agent') return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }
});

export const config = {
  matcher: ['/admin/:path*', '/client/:path*', '/livreur/:path*'],
};
