export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? 50);

  const logs = await prisma.whatsappLog.findMany({
    orderBy: { sentAt: 'desc' },
    take:    limit,
  });

  return NextResponse.json(logs);
}
