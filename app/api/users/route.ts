import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, email, phone, city, role, permissions } = await req.json();
  if (!name || !email) return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 });

  const tempHash = await bcrypt.hash(Math.random().toString(36).slice(2, 10), 10);

  const user = await prisma.user.create({
    data: {
      name, email,
      phone:        phone  || null,
      city:         city   || null,
      role:         (role  || 'agent') as any,
      permissions:  permissions || {},
      passwordHash: tempHash,
      emailVerified: true,
    },
  });

  return NextResponse.json({ ok: true, id: user.id });
}
