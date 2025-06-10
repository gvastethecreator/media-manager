#!/usr/bin/env node

/**
 * 🔧 Script para corregir exports faltantes en archivos index.ts
 * Analiza los errores TS2339 y corrige automáticamente las exportaciones
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando corrección automática de exports...\n');

// Leer el archivo de log de errores
const logPath = 'tsc-log.txt';
const logContent = fs.readFileSync(logPath, 'utf8');

// Extraer errores TS2339 de archivos index.ts
const ts2339Errors = logContent
  .split('\n')
  .filter(line => line.includes('error TS2339') && line.includes('/index.ts'))
  .map(line => {
    const match = line.match(/^(.+?):\s*error TS2339: Property '([^']+)' does not exist on type/);
    if (match) {
      const [, filePath, missingProperty] = match;
      return {
        file: filePath.replace(/\(\d+,\d+\)$/, ''), // Remover números de línea
        missingProperty
      };
    }
    return null;
  })
  .filter(Boolean);

console.log(`📊 Encontrados ${ts2339Errors.length} errores TS2339 en archivos index.ts\n`);

// Agrupar por archivo
const errorsByFile = {};
ts2339Errors.forEach(error => {
  if (!errorsByFile[error.file]) {
    errorsByFile[error.file] = [];
  }
  errorsByFile[error.file].push(error.missingProperty);
});

// Corregir cada archivo
Object.entries(errorsByFile).forEach(([filePath, missingProperties]) => {
  console.log(`🔍 Analizando: ${filePath}`);
  console.log(`   Propiedades faltantes: ${missingProperties.join(', ')}`);

  try {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`   ❌ Archivo no encontrado: ${fullPath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;

    // Buscar el archivo de acciones importado
    const importMatch = content.match(/import \* as (\w+) from ['"]([^'"]+)['"];/);
    if (!importMatch) {
      console.log(`   ❌ No se encontró import pattern`);
      return;
    }

    const [, importAlias, importPath] = importMatch;
    const actualActionsPath = path.resolve(path.dirname(fullPath), importPath + '.ts');

    if (!fs.existsSync(actualActionsPath)) {
      console.log(`   ❌ Archivo de acciones no encontrado: ${actualActionsPath}`);
      return;
    }

    // Leer el archivo de acciones para ver qué funciones realmente existen
    const actionsContent = fs.readFileSync(actualActionsPath, 'utf8');
    const realExports = actionsContent
      .split('\n')
      .filter(line => line.includes('export') && (line.includes('function') || line.includes('interface') || line.includes('type')))
      .map(line => {
        const functionMatch = line.match(/export (?:async )?function (\w+)/);
        const typeMatch = line.match(/export (?:interface|type) (\w+)/);
        return functionMatch?.[1] || typeMatch?.[1];
      })
      .filter(Boolean);

    console.log(`   📋 Exports reales encontrados: ${realExports.join(', ')}`);

    // Comentar las líneas problemáticas
    missingProperties.forEach(prop => {
      const regex = new RegExp(`^(export const ${prop} = ${importAlias}\\.${prop};)$`, 'm');
      if (content.match(regex)) {
        content = content.replace(regex, `// ❌ DISABLED: $1 // Función no existe en ${importPath}`);
        hasChanges = true;
        console.log(`   🔧 Comentada línea: export const ${prop}`);
      }
    });

    // Guardar cambios si los hubo
    if (hasChanges) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`   ✅ Archivo actualizado`);
    } else {
      console.log(`   ℹ️  No se requirieron cambios`);
    }

  } catch (error) {
    console.log(`   ❌ Error procesando archivo: ${error.message}`);
  }

  console.log('');
});

console.log('🎉 Corrección automática completada!\n');
console.log('💡 Ejecuta "pnpm tsc --noEmit" para verificar la reducción de errores.');
