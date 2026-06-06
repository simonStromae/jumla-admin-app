import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const routes = await prisma.route.findMany({ where: { active: true }, orderBy: { origin: 'asc' } });
  return NextResponse.json(routes.map(r => ({
    id:          r.id,
    code:        `${r.origin} → ${r.destination}`,
    fromIATA:    r.origin,
    toIATA:      r.destination,
    label:       r.label ?? `${r.origin} → ${r.destination}`,
    active:      r.active,
  })));
}
