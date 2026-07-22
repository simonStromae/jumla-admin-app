import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = params;
  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  await (prisma.user as any).update({
    where: { id },
    data: {
      passwordHash:       hash,
      status:             'active',
      loginAttempts:      0,
      lockedAt:           null,
      mustChangePassword: true,
    },
  });

  return NextResponse.json({ tempPassword });
}
