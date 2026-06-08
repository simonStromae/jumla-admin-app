import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/admin')) {
    const role = token.role as string;
    if (role !== 'admin' && role !== 'agent') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
  }
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*'],
};
