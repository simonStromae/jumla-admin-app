import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.role        = (user as any).role;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id                   = token.id as string;
        (session.user as any).role        = token.role;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
