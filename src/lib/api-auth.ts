import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }
  const role = (session.user as any).role;
  if (role !== 'admin' && role !== 'agent') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }
  return { session };
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }
  return { session };
}

export async function requirePermission(permKey: string) {
  const { error, session } = await requireAdmin();
  if (error) return { error };
  const role = (session!.user as any).role;
  if (role === 'admin') return { session };
  const perms = (session!.user as any).permissions ?? {};
  if (!perms[permKey]) {
    return { error: NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 }) };
  }
  return { session };
}

export function mapCampaignStatus(s: string): string {
  return s === 'in_transit' ? 'in-transit' : s;
}

export function toPrismaStatus(s: string): string {
  return s === 'in-transit' ? 'in_transit' : s;
}
