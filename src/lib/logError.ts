import { prisma } from './prisma';

export async function logError(opts: {
  route: string;
  method?: string;
  status?: number;
  message: string;
  stack?: string;
  userId?: string;
}) {
  try {
    await prisma.errorLog.create({
      data: {
        route:   opts.route,
        method:  opts.method  ?? 'GET',
        status:  opts.status  ?? 500,
        message: opts.message.slice(0, 2000),
        stack:   opts.stack   ? opts.stack.slice(0, 4000) : undefined,
        userId:  opts.userId,
      },
    });
  } catch {
    // Never let logging break the app
  }
}

// Wraps a Next.js route handler; catches unhandled throws and logs them.
// Usage: export const GET = withErrorLog('/api/my-route', async (req) => { ... })
export function withErrorLog<T extends (...args: any[]) => Promise<any>>(
  route: string,
  handler: T,
  method = 'GET'
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (e: any) {
      await logError({ route, method, status: 500, message: e?.message ?? String(e), stack: e?.stack });
      const { NextResponse } = await import('next/server');
      return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
  }) as T;
}
