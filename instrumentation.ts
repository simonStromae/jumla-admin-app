export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { autoMigrate } = await import('./src/lib/auto-migrate');
      await autoMigrate();
      console.log('[startup] DB migration completed');
    } catch (e) {
      console.error('[startup] DB migration error:', e);
    }
  }
}
