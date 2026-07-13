import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId:     process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;
        if ((user as any).status === 'suspended' && user.role !== 'client') return null;
        const skipVerify = process.env.DISABLE_EMAIL_VERIFICATION === 'true';
        if (!skipVerify && !user.emailVerified) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id:                user.id,
          email:             user.email,
          name:              user.name,
          role:              user.role,
          permissions:       user.permissions,
          mustChangePassword: (user as any).mustChangePassword ?? false,
          status:            (user as any).status ?? 'active',
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      // Credentials flow: handled entirely in authorize()
      if (account?.provider === 'credentials') return true;
      // OAuth flow: ensure user exists in DB
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (!existing) {
        const tempHash = await bcrypt.hash(Math.random().toString(36).slice(2, 10), 10);
        await prisma.user.create({
          data: {
            email:         user.email,
            name:          user.name ?? user.email.split('@')[0],
            passwordHash:  tempHash,
            role:          'client',
            emailVerified: true,
          },
        });
      }
      return true;
    },

    // Override jwt to also handle OAuth users (load role/status from DB)
    async jwt({ token, user, account, trigger, session }) {
      if (user && account?.provider === 'credentials') {
        token.id                 = user.id;
        token.role               = (user as any).role;
        token.permissions        = (user as any).permissions;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
        token.status             = (user as any).status ?? 'active';
      }

      if (user && account && account.provider !== 'credentials') {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (dbUser) {
          token.id                 = dbUser.id;
          token.role               = dbUser.role;
          token.permissions        = dbUser.permissions;
          token.mustChangePassword = (dbUser as any).mustChangePassword ?? false;
          token.status             = (dbUser as any).status ?? 'active';
        }
      }

      // Subsequent calls (no fresh user object) — always re-fetch from DB so that
      // permission/role/status changes made by an admin take effect immediately,
      // without requiring the target user to log out and back in.
      if (!user && token.id) {
        const fresh = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { role: true, permissions: true, status: true, mustChangePassword: true },
        });
        if (fresh) {
          token.role               = fresh.role;
          token.permissions        = fresh.permissions;
          token.status             = (fresh as any).status ?? 'active';
          token.mustChangePassword = (fresh as any).mustChangePassword ?? false;
        }
      }

      if (trigger === 'update' && session) {
        if (session.mustChangePassword !== undefined) token.mustChangePassword = session.mustChangePassword;
        if (session.status             !== undefined) token.status             = session.status;
      }
      return token;
    },
  },
});
