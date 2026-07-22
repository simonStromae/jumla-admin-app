import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days max; actual expiry controlled by token
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id                 = user.id;
        token.role               = (user as any).role;
        token.permissions        = (user as any).permissions;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
        token.status             = (user as any).status ?? 'active';
        // Set token expiry: 2h without remember me, 30 days with
        const remember = (user as any).remember === true;
        token.exp = Math.floor(Date.now() / 1000) + (remember ? 30 * 24 * 3600 : 2 * 3600);
      }
      if (trigger === 'update' && session) {
        if (session.mustChangePassword !== undefined) token.mustChangePassword = session.mustChangePassword;
        if (session.status             !== undefined) token.status             = session.status;
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
