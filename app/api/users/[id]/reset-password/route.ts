export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

function generateTempPassword(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Jumla#${num}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('agents');
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, phone: true, role: true },
  });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const tempPassword = generateTempPassword();
  const tempHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: params.id },
    data:  { passwordHash: tempHash, mustChangePassword: true, status: 'active', loginAttempts: 0, lockedAt: null } as any,
  });

  return NextResponse.json({ ok: true, tempPassword });
}
