export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['contact_whatsapp', 'contact_email', 'company_name'] } },
  }).catch(() => []);

  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;

  return NextResponse.json({
    whatsapp:    m.contact_whatsapp ?? process.env.CONTACT_WHATSAPP ?? '',
    email:       m.contact_email   ?? '',
    companyName: m.company_name    ?? 'Jumla Shipping',
  });
}
