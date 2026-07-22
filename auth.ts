import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { authConfig } from './auth.config';

async function logLogin(userId: string | null, email: string, ip: string, ua: string, success: boolean) {
  try {
    let country = '', city = '';
    const cleanIp = ip.replace('::ffff:', '');
    if (cleanIp && cleanIp !== '127.0.0.1' && cleanIp !== '::1') {
      const geo = await fetch(`https://ip-api.com/json/${cleanIp}?fields=country,city`, { signal: AbortSignal.timeout(2000) })
        .then(r => r.json()).catch(() => ({}));
      country = geo.country ?? '';
      city    = geo.city    ?? '';
    }
    const id = crypto.randomUUID();
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO login_logs (id, "userId", email, ip, "userAgent", country, city, success) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      id, userId, email, cleanIp, ua.slice(0, 512), country, city, success,
    );
  } catch { /* non-blocking */ }
}

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
        remember: { label: 'Remember', type: 'text' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const MAX_ATTEMPTS = 5;
        const ip = (request?.headers?.get('x-forwarded-for') ?? request?.headers?.get('x-real-ip') ?? '').split(',')[0].trim();
        const ua = request?.headers?.get('user-agent') ?? '';
        const email = credentials.email as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          logLogin(null, email, ip, ua, false);
          return null;
        }

        if ((user as any).status === 'suspended') {
          logLogin(user.id, email, ip, ua, false);
          throw new Error('suspended');
        }

        const skipVerify = process.env.DISABLE_EMAIL_VERIFICATION === 'true';
        if (!skipVerify && !user.emailVerified) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!valid) {
          const attempts = ((user as any).loginAttempts ?? 0) + 1;
          if (attempts >= MAX_ATTEMPTS) {
            await (prisma.user as any).update({
              where: { id: user.id },
              data: { loginAttempts: attempts, status: 'suspended', lockedAt: new Date() },
            });
            logLogin(user.id, email, ip, ua, false);
            throw new Error('suspended');
          }
          await (prisma.user as any).update({ where: { id: user.id }, data: { loginAttempts: attempts } });
          logLogin(user.id, email, ip, ua, false);
          return null;
        }

        // Increment sessionVersion to invalidate all previous sessions
        const updated = await (prisma.user as any).update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockedAt: null, sessionVersion: { increment: 1 } },
          select: { sessionVersion: true },
        });

        logLogin(user.id, email, ip, ua, true);

        return {
          id:                 user.id,
          email:              user.email,
          name:               user.name,
          role:               user.role,
          permissions:        user.permissions,
          mustChangePassword: (user as any).mustChangePassword ?? false,
          status:             (user as any).status ?? 'active',
          remember:           credentials.remember === 'true',
          sessionVersion:     updated.sessionVersion,
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
        try {
          const fresh = await (prisma.user as any).findUnique({
            where:  { id: token.id as string },
            select: { role: true, permissions: true, status: true, mustChangePassword: true, sessionVersion: true },
          });
          if (!fresh) return null;
          // Session exclusivity: only enforce if DB has the column (sessionVersion is a number)
          if (typeof fresh.sessionVersion === 'number' && typeof token.sessionVersion === 'number') {
            if (fresh.sessionVersion !== token.sessionVersion) return null;
          }
          if (fresh.status === 'suspended') return null;
          token.role               = fresh.role;
          token.permissions        = fresh.permissions;
          token.status             = fresh.status ?? 'active';
          token.mustChangePassword = fresh.mustChangePassword ?? false;
        } catch {
          // Column may not exist yet — fall back to query without sessionVersion
          const fresh = await prisma.user.findUnique({
            where:  { id: token.id as string },
            select: { role: true, permissions: true, status: true, mustChangePassword: true },
          });
          if (!fresh) return null;
          if ((fresh as any).status === 'suspended') return null;
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
