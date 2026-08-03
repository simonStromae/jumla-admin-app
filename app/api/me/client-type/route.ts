export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

const VALID_TYPES = ['standard', 'commercial', 'partenaire'];

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { clientType, companyName, billingAddress } = body;

  if (!VALID_TYPES.includes(clientType)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }

  const userId = (session!.user as any).id;
  await (prisma.user.update as any)({
    where: { id: userId },
    data:  {
      clientType,
      clientTypeChosen: true,
      companyName:      companyName   ?? null,
      billingAddress:   billingAddress ?? null,
    },
  });

  return NextResponse.json({ ok: true, clientType });
}
