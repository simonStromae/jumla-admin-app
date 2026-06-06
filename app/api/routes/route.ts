export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const routes = await prisma.route.findMany({ orderBy: { origin: 'asc' } });
  return NextResponse.json(routes.map(r => ({
    id:       r.id,
    code:     `${r.origin} → ${r.destination}`,
    fromIATA: r.origin,
    toIATA:   r.destination,
    label:    r.label ?? `${r.origin} → ${r.destination}`,
    active:   r.active,
  })));
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { origin, destination, label } = await req.json();
  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origine et destination obligatoires' }, { status: 400 });
  }

  const route = await prisma.route.create({
    data: {
      origin:      origin.toUpperCase().trim(),
      destination: destination.toUpperCase().trim(),
      label:       label?.trim() || `${origin.toUpperCase()} → ${destination.toUpperCase()}`,
      active:      true,
    },
  });

  return NextResponse.json({
    id:       route.id,
    code:     `${route.origin} → ${route.destination}`,
    fromIATA: route.origin,
    toIATA:   route.destination,
    label:    route.label ?? `${route.origin} → ${route.destination}`,
    active:   route.active,
  });
}
