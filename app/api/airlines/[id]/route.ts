export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, iata, country, logoUrl, active } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  const airline = await prisma.airline.update({
    where: { id: params.id },
    data: {
      name: name.trim(),
      iata: iata?.trim() || null,
      country: country?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
      ...(active !== undefined ? { active: Boolean(active) } : {}),
    },
  });

  return NextResponse.json({ ok: true, airline });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const legsCount = await prisma.campaignLeg.count({ where: { airlineId: params.id } });
  if (legsCount > 0) {
    return NextResponse.json(
      { error: `Cette compagnie est utilisée dans ${legsCount} cargaison(s). Retirez-la d'abord.` },
      { status: 400 },
    );
  }

  await prisma.airline.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
