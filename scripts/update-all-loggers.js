/**
 * Script para reemplazar serverLogger por clientLogger en todo el proyecto
 *
 * Este script analiza archivos en todo el proyecto y determina si deben usar
 * serverLogger o clientLogger según su naturaleza (client o server component).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directorios a procesar
const DIRS = [
  'src/components',
  'src/store',
  'src/hooks',
  'src/utils',
  'src/context'
];

// Función para encontrar todos los archivos TypeScript/TSX en un directorio
function findTsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Determina si un archivo debe usar clientLogger o serverLogger
function shouldUseClientLogger(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Marcar explícitamente como server
  if (content.includes('use server')) {
    return false;
  }

  // Marcar explícitamente como client
  if (content.includes('use client')) {
    return true;
  }

  // Archivos en ciertos directorios siempre son client-side
  if (
    filePath.includes('/src/store/') ||
    filePath.includes('/src/hooks/') ||
    filePath.includes('/src/context/')
  ) {
    return true;
  }

  // Verificar si es un componente React (contiene JSX)
  if (filePath.endsWith('.tsx') && !filePath.includes('.server.tsx')) {
    // Si tiene import de react hooks, es client component
    const hasReactHooks = /import\s+\{[^}]*use[A-Z][^}]*\}\s+from\s+['"]react['"]/g.test(content);
    // Si tiene JSX, probable es client component
    const hasJSX = content.includes('return (') && (content.includes('<') && content.includes('/>') || content.includes('</'));

    if (hasReactHooks || hasJSX) {
      return true;
    }
  }

  // Por defecto, server-side en caso de duda
  return false;
}

// Reemplaza las importaciones y usos de logger en un archivo
function replaceLoggerInFile(filePath) {
  // Verificar si el archivo usa serverLogger
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('serverLogger')) {
    return false;
  }

  // Determinar qué logger debe usar
  const useClient = shouldUseClientLogger(filePath);

  if (!useClient) {
    console.log(`Manteniendo serverLogger en: ${filePath}`);
    return false;
  }

  console.log(`Cambiando a clientLogger en: ${filePath}`);

  // Reemplazar el código
  let updatedContent = content;

  // Reemplazar importaciones
  updatedContent = updatedContent.replace(
    /import\s+\{\s*serverLogger\s*\}\s+from\s+['"]@\/lib\/logger\/server-logger['"]/g,
    "import { clientLogger } from '@/lib/logger/client-logger'"
  );

  // También manejar importaciones relativas
  updatedContent = updatedContent.replace(
    /import\s+\{\s*serverLogger\s*\}\s+from\s+['"]\.\.\/(\.\.\/)?lib\/logger\/server-logger['"]/g,
    (match) => {
      const prefix = match.includes('../..') ? '../../' : '../';
      return `import { clientLogger } from '${prefix}lib/logger/client-logger'`;
    }
  );

  // Reemplazar referencias
  updatedContent = updatedContent.replace(/serverLogger/g, 'clientLogger');

  // Escribir el archivo actualizado
  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    return true;
  }

  return false;
}

// Función principal
function main() {
  let totalFiles = 0;
  let updatedFiles = 0;

  // Procesar cada directorio
  for (const dir of DIRS) {
    const dirPath = path.join(__dirname, '..', dir);
    const files = findTsFiles(dirPath);

    totalFiles += files.length;

    for (const file of files) {
      const updated = replaceLoggerInFile(file);
      if (updated) {
        updatedFiles++;
      }
    }
  }

  console.log(`Procesamiento completo. Se actualizaron ${updatedFiles} de ${totalFiles} archivos.`);
}

// Ejecutar
main();