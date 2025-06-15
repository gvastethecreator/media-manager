/**
 * Script para abrir Prisma Studio
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Función para mostrar mensajes con colores
function log(message, color = colors.blue) {
  console.log(`${color}${message}${colors.reset}`);
}

// Verificar que existe la base de datos
const rootDir = path.resolve(__dirname, '../..');
const dbPath = path.join(rootDir, 'prisma', 'dev.db');

if (!fs.existsSync(dbPath)) {
  log('⚠️ La base de datos no existe. Debes ejecutar primero:', colors.yellow);
  log('   pnpm run db:full-reset', colors.yellow);
  process.exit(1);
}

// Abrir Prisma Studio
log('🚀 Abriendo Prisma Studio...', colors.green);
log('📊 Podrás explorar y editar los datos de la base de datos', colors.cyan);
log('🔗 URL: http://localhost:5555', colors.magenta);
log('⌨️ Presiona Ctrl+C para cerrar Prisma Studio', colors.yellow);

try {
  execSync('npx prisma studio', { stdio: 'inherit' });
} catch (error) {
  if (error.signal === 'SIGINT') {
    log('\n👋 Prisma Studio cerrado correctamente', colors.green);
  } else {
    log(`\n❌ Error al ejecutar Prisma Studio: ${error.message}`, colors.red);
    process.exit(1);
  }
}