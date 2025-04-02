/**
 * Script para reemplazar serverLogger por clientLogger en archivos de store
 *
 * Este script reemplaza las importaciones y usos de serverLogger por clientLogger
 * en todos los archivos de store que tienen esta dependencia incorrecta.
 */

const fs = require('fs');
const path = require('path');

// Obtener la lista de archivos desde el directorio store
function findStoreFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findStoreFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Reemplazar serverLogger por clientLogger en un archivo
function replaceServerLoggerInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Reemplazar las importaciones de server-logger por client-logger
  content = content.replace(
    /import\s+\{\s*serverLogger\s*\}\s+from\s+['"]@\/lib\/logger\/server-logger['"]/g,
    "import { clientLogger } from '@/lib/logger/client-logger'"
  );

  content = content.replace(
    /import\s+\{\s*serverLogger\s*\}\s+from\s+['"]\.\.\/(\.\.\/)?lib\/logger\/server-logger['"]/g,
    (match) => {
      // Mantener la misma cantidad de ../ en la importación
      const prefix = match.includes('../..') ? '../../' : '../';
      return `import { clientLogger } from '${prefix}lib/logger/client-logger'`;
    }
  );

  // Reemplazar todos los usos de serverLogger por clientLogger
  content = content.replace(/serverLogger/g, 'clientLogger');

  // Solo escribir si hay cambios
  if (content !== originalContent) {
    console.log(`Actualizando: ${filePath}`);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Ruta al directorio de store
const storePath = path.join(__dirname, '..', 'src', 'store');

// Encontrar todos los archivos .ts y .tsx en el directorio store
console.log('Buscando archivos de store...');
const storeFiles = findStoreFiles(storePath);
console.log(`Encontrados ${storeFiles.length} archivos.`);

// Reemplazar serverLogger en cada archivo
let updatedFiles = 0;
for (const file of storeFiles) {
  const updated = replaceServerLoggerInFile(file);
  if (updated) {
    updatedFiles++;
  }
}

console.log(`Proceso completado. Actualizados ${updatedFiles} archivos.`);