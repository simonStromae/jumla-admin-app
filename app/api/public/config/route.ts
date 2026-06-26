export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

const DEFAULTS: Record<string, string> = {
  payment_email: 'paiement@jumla.cargo',
  company_name:  'Jumla Shipping',
  company_logo:  '',
};

export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  });
  const m: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) m[r.key] = r.value;

  return NextResponse.json({
    paymentEmail: m.payment_email,
    companyName:  m.company_name,
    companyLogo:  m.company_logo || null,
  });
}
