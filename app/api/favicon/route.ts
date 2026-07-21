export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    // Cascade: company_favicon → company_logo_icon → company_logo
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['company_favicon', 'company_logo_icon', 'company_logo'] } },
    });
    const byKey = Object.fromEntries(rows.map(r => [r.key, r.value]));

    const dataUrl =
      (byKey['company_favicon']    && byKey['company_favicon'].startsWith('data:')    ? byKey['company_favicon']    : null) ??
      (byKey['company_logo_icon']  && byKey['company_logo_icon'].startsWith('data:')  ? byKey['company_logo_icon']  : null) ??
      (byKey['company_logo']       && byKey['company_logo'].startsWith('data:')       ? byKey['company_logo']       : null);

    if (!dataUrl) {
      return new NextResponse(null, { status: 204 });
    }

    // Parse "data:<mime>;base64,<data>"
    const [meta, b64] = dataUrl.split(',');
    const mime = meta.replace('data:', '').replace(';base64', '');
    const buffer = Buffer.from(b64, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime || 'image/png',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
