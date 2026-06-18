export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

function parseAddressesObj(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (Array.isArray(raw)) return { saved: raw }; // backward-compat: old array format
  return (raw as Record<string, unknown>);
}

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, city: true, country: true, addresses: true },
  });
  const addr = parseAddressesObj(user?.addresses);
  return NextResponse.json({
    id:              user?.id,
    name:            user?.name,
    email:           user?.email,
    phone:           user?.phone,
    city:            user?.city,
    country:         user?.country,
    savedAddresses:   Array.isArray(addr.saved)       ? addr.saved       : [],
    savedRecipients:  Array.isArray(addr.recipients)  ? addr.recipients  : [],
  });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as any).id;
  const { name, phone, city, savedAddresses, savedRecipients } = await req.json();

  const data: Record<string, unknown> = {};
  if (name  !== undefined) data.name  = name?.trim();
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (city  !== undefined) data.city  = city?.trim()  || null;

  if (savedAddresses !== undefined || savedRecipients !== undefined) {
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { addresses: true } });
    const prev = parseAddressesObj(existing?.addresses);
    data.addresses = {
      ...prev,
      ...(savedAddresses  !== undefined && { saved:      savedAddresses }),
      ...(savedRecipients !== undefined && { recipients: savedRecipients }),
    };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, phone: true, city: true, addresses: true },
  });
  const addr = parseAddressesObj(user.addresses);
  return NextResponse.json({
    id:             user.id,
    name:           user.name,
    email:          user.email,
    phone:          user.phone,
    city:           user.city,
    savedAddresses:  Array.isArray(addr.saved)      ? addr.saved      : [],
    savedRecipients: Array.isArray(addr.recipients) ? addr.recipients : [],
  });
}
