import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id                 = user.id;
        token.role               = (user as any).role;
        token.permissions        = (user as any).permissions;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
        token.status             = (user as any).status ?? 'active';
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id                          = token.id as string;
        (session.user as any).role               = token.role;
        (session.user as any).permissions        = token.permissions;
        (session.user as any).mustChangePassword = token.mustChangePassword ?? false;
        (session.user as any).status             = token.status ?? 'active';
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
