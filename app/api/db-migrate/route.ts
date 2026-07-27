export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { autoMigrate } from '@/src/lib/auto-migrate';

// Safe incremental migration — adds missing columns/tables only.
// Never truncates or deletes data.
// Migrations now also run automatically at startup via instrumentation.ts.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await autoMigrate();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
