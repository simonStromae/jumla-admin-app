import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [campaigns, clients, verifyPending, unpaidPayments] = await Promise.all([
      prisma.campaign.count(),
      prisma.user.count({ where: { role: 'client' } }),
      prisma.campaign.count({ where: { status: { in: ['exp', 'tra', 'apd', 'dou', 'lib', 'ard'] } } }),
      prisma.payment.count({ where: { status: 'pending' } }),
    ]);
    return NextResponse.json({ campaigns, clients, verifyPending, unpaidPayments });
  } catch {
    return NextResponse.json({ campaigns: 0, clients: 0, verifyPending: 0, unpaidPayments: 0 });
  }
}
