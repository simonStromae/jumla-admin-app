export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const airlines = await prisma.airline.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { legs: true } } },
  });

  return NextResponse.json(airlines);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, iata, country, logoUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  const airline = await prisma.airline.create({
    data: { name: name.trim(), iata: iata?.trim() || null, country: country?.trim() || null, logoUrl: logoUrl?.trim() || null },
  });

  return NextResponse.json({ ok: true, airline });
}
