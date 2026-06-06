import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const roleParam = searchParams.get('role');

  const where: any = roleParam
    ? { role: roleParam }
    : { role: { in: ['admin', 'agent'] } };

  const users = await prisma.user.findMany({
    where,
    include: {
      _count: { select: { campaigns: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users.map((u, i) => ({
    id:          u.id,
    name:        u.name,
    email:       u.email,
    role:        u.role,
    city:        u.city ?? '—',
    country:     u.country,
    permissions: u.permissions,
    campaigns:   u._count.campaigns,
    parcels:     0,
    collected:   0,
    createdAt:   u.createdAt,
    initials:    u.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    color:       (i % 8) + 1,
    lastLogin:   new Date(u.createdAt).toLocaleDateString('fr-FR'),
  })));
}
