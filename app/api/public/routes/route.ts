export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  const routes = await prisma.route.findMany({
    where: { active: true },
    orderBy: { origin: 'asc' },
  });

  return NextResponse.json(routes.map(r => ({
    id:          r.id,
    origin:      r.origin,
    destination: r.destination,
    label:       r.label ?? `${r.origin} → ${r.destination}`,
    code:        `${r.origin} → ${r.destination}`,
  })));
}
