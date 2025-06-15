/**
 * Script mejorado para resetear la base de datos
 * Incluye mejor manejo de errores y más información de depuración
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// Función para mostrar mensajes con colores
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // cyan
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    reset: '\x1b[0m', // reset
  };

  const prefix = {
    info: '📝 ',
    success: '✅ ',
    warning: '⚠️ ',
    error: '❌ ',
  };

  console.log(`${colors[type]}${prefix[type]}${message}${colors.reset}`);
}

// Función para ejecutar comandos con mejor manejo de errores
function runCommand(command, args = []) {
  log(`Ejecutando: ${command} ${args.join(' ')}`, 'info');

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true
  });

  if (result.error) {
    log(`Error al ejecutar el comando: ${result.error.message}`, 'error');
    return false;
  }

  if (result.status !== 0) {
    log(`El comando falló con código de salida: ${result.status}`, 'error');
    return false;
  }

  return true;
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    log(`Error al verificar si existe el archivo ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

// Función para eliminar un archivo si existe
function deleteFileIfExists(filePath) {
  if (fileExists(filePath)) {
    try {
      fs.unlinkSync(filePath);
      log(`Archivo eliminado: ${filePath}`, 'success');
      return true;
    } catch (error) {
      log(`Error al eliminar el archivo ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  log(`El archivo no existe, no es necesario eliminarlo: ${filePath}`, 'info');
  return true;
}

// Función para eliminar un directorio si existe
function deleteDirIfExists(dirPath) {
  if (fileExists(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      log(`Directorio eliminado: ${dirPath}`, 'success');
      return true;
    } catch (error) {
      log(`Error al eliminar el directorio ${dirPath}: ${error.message}`, 'error');
      return false;
    }
  }

  log(`El directorio no existe, no es necesario eliminarlo: ${dirPath}`, 'info');
  return true;
}

// Función para asegurar que existe el archivo .env con DATABASE_URL
function ensureEnvFile() {
  const rootDir = path.resolve(__dirname, '../..');
  const envPath = path.join(rootDir, '.env');

  if (!fileExists(envPath)) {
    log('Creando archivo .env...', 'info');
    try {
      fs.writeFileSync(envPath, 'DATABASE_URL="file:./prisma/dev.db"\n');
      log('Archivo .env creado correctamente', 'success');
    } catch (error) {
      log(`Error al crear el archivo .env: ${error.message}`, 'error');
      return false;
    }
  } else {
    log('El archivo .env ya existe', 'info');

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('DATABASE_URL=')) {
        log('Añadiendo DATABASE_URL al archivo .env...', 'info');
        fs.appendFileSync(envPath, '\nDATABASE_URL="file:./prisma/dev.db"\n');
        log('DATABASE_URL añadido al archivo .env', 'success');
      } else {
        log('DATABASE_URL ya existe en el archivo .env', 'info');
      }
    } catch (error) {
      log(`Error al leer/modificar el archivo .env: ${error.message}`, 'error');
      return false;
    }
  }

  return true;
}

// Función principal para resetear la base de datos
async function resetDatabase() {
  log('Iniciando reset de la base de datos...', 'info');

  const rootDir = path.resolve(__dirname, '../..');

  // Paso 1: Asegurar que existe el archivo .env con DATABASE_URL
  if (!ensureEnvFile()) {
    return false;
  }

  // Paso 2: Eliminar la base de datos si existe
  const dbPath = path.join(rootDir, 'prisma', 'dev.db');
  if (!deleteFileIfExists(dbPath)) {
    return false;
  }

  // Paso 3: Eliminar el directorio de migraciones si existe
  const migrationsPath = path.join(rootDir, 'prisma', 'migrations');
  if (!deleteDirIfExists(migrationsPath)) {
    return false;
  }

  // Paso 4: Eliminar archivos temporales de Prisma si existen
  const prismaClientPath = path.join(rootDir, 'node_modules', '.prisma');
  deleteDirIfExists(prismaClientPath);

  // Paso 5: Generar cliente Prisma
  log('Generando cliente Prisma...', 'info');
  if (!runCommand('npx', ['prisma', 'generate'])) {
    log('Falló la generación del cliente Prisma, pero intentaremos continuar...', 'warning');
  } else {
    log('Cliente Prisma generado correctamente', 'success');
  }

  // Paso 6: Usar db push para crear la base de datos según el esquema
  log('Sincronizando esquema con la base de datos...', 'info');
  if (!runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss'])) {
    log('Falló la sincronización del esquema con la base de datos', 'error');
    return false;
  }
  log('Esquema sincronizado correctamente', 'success');

  // Paso 7: Ejecutar seed para poblar la base de datos
  log('Ejecutando seed para poblar la base de datos...', 'info');
  if (!runCommand('npx', ['prisma', 'db', 'seed'])) {
    log('Falló la ejecución del seed', 'error');
    return false;
  }
  log('Seed ejecutado correctamente', 'success');

  log('Reset de la base de datos completado con éxito', 'success');
  return true;
}

// Ejecutar la función principal
resetDatabase().then(success => {
  if (!success) {
    log('El proceso de reset falló', 'error');
    process.exit(1);
  }
});