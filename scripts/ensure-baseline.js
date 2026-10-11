// Marque la migration baseline comme déjà appliquée si _prisma_migrations n'existe pas encore.
// Prisma lève P3005 quand la base n'est pas vide mais n'a pas d'historique de migrations.
// Ce script lance migrate resolve --applied une fois (idempotent : P3008 = déjà fait, OK).
const { execSync } = require('child_process');
const path = require('path');

// Use local binary to avoid npx downloading Prisma 8.x which renamed 'migrate' to 'migration'
const prismaBin = path.join(__dirname, '..', 'node_modules', '.bin', 'prisma');

try {
  execSync(`"${prismaBin}" migrate resolve --applied "20261011000000_init"`, {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  console.log('Baseline migration marquée comme appliquée.');
} catch (e) {
  const output = (e.stdout || '') + (e.stderr || '');
  if (output.includes('P3008') || output.includes('already recorded')) {
    // Déjà fait lors d'un déploiement précédent — pas de souci
    console.log('Baseline déjà enregistrée, on continue.');
  } else {
    process.stderr.write(output);
    process.exit(1);
  }
}
