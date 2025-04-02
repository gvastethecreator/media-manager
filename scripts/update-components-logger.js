/**
 * Script para reemplazar serverLogger por clientLogger en componentes del cliente
 *
 * Este script reemplaza las importaciones y usos de serverLogger por clientLogger
 * en archivos de componentes del lado del cliente.
 */

const fs = require('fs');
const path = require('path');

// Obtener la lista de archivos desde el directorio de componentes
function findComponentFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findComponentFiles(filePath, fileList);
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.includes('.server.') &&    // Excluir archivos de servidor
      !file.includes('server-action')  // Excluir server actions
    ) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Verifica si el archivo es un client component
function isClientComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Si contiene 'use client', es definitivamente un client component
    if (content.includes('use client')) {
      return true;
    }

    // Si contiene 'use server', es un server component/action
    if (content.includes('use server')) {
      return false;
    }

    // Verificar si importa hooks de React o si es un archivo .tsx
    const hasReactHooks = /import\s+\{[^}]*use[A-Z][^}]*\}\s+from\s+['"]react['"]/g.test(content);
    const isReactComponent = /\bfunction\s+\w+\s*\([^)]*\)\s*\{.*\breturn\s+<.*>/gs.test(content);

    return hasReactHooks || isReactComponent || filePath.endsWith('.tsx');
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error);
    return false;
  }
}

// Reemplazar serverLogger por clientLogger en un archivo
function replaceServerLoggerInFile(filePath) {
  try {
    // Solo procesar client components
    if (!isClientComponent(filePath)) {
      return false;
    }

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
  } catch (error) {
    console.error(`Error procesando archivo ${filePath}:`, error);
    return false;
  }
}

// Ruta al directorio de componentes
const componentsPath = path.join(__dirname, '..', 'src', 'components');

// Encontrar todos los archivos .ts y .tsx en el directorio de componentes
console.log('Buscando archivos de componentes...');
const componentFiles = findComponentFiles(componentsPath);
console.log(`Encontrados ${componentFiles.length} archivos.`);

// Reemplazar serverLogger en cada archivo
let updatedFiles = 0;
for (const file of componentFiles) {
  const updated = replaceServerLoggerInFile(file);
  if (updated) {
    updatedFiles++;
  }
}

console.log(`Proceso completado. Actualizados ${updatedFiles} archivos.`);