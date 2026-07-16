export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'company_favicon' } });
    const dataUrl = row?.value as string | undefined;

    if (!dataUrl || !dataUrl.startsWith('data:')) {
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
