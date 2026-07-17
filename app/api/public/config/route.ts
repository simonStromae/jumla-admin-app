export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

const DEFAULTS: Record<string, string> = {
  payment_email:     'paiement@jumla.cargo',
  company_name:      'Jumla Shipping',
  company_legal:     'Jumla Shipping SARL',
  company_logo:      '',
  company_logo_icon: '',
  logo_size_h:       '36',
  logo_icon_size:    '32',
  landing_content:   '',
};

export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  });

  const m: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) m[r.key] = r.value;

  let landingContent = null;
  if (m.landing_content) {
    try { landingContent = JSON.parse(m.landing_content); } catch {}
  }

  return NextResponse.json({
    paymentEmail:    m.payment_email,
    companyName:     m.company_name,
    companyLegal:    m.company_legal     || m.company_name,
    companyLogo:     m.company_logo      || null,
    companyLogoIcon: m.company_logo_icon || null,
    logoHeight:      parseInt(m.logo_size_h)    || 36,
    logoIconSize:    parseInt(m.logo_icon_size)  || 32,
    landingContent,
  });
}
