import { NextResponse } from 'next/server';
import { requireOnlyAdmin } from '@/src/lib/api-auth';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireOnlyAdmin();
  if (error) return error;

  try {
    const errors = await prisma.errorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(errors);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function DELETE() {
  const { error } = await requireOnlyAdmin();
  if (error) return error;

  try {
    await prisma.errorLog.deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
