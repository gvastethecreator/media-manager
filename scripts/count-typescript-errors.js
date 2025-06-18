/**
 * @file Script para contar errores de TypeScript
 *
 * Este script ejecuta el compilador de TypeScript y cuenta el número de errores
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📊 Contando errores de TypeScript...');

try {
  // Ejecutar el compilador de TypeScript y redirigir la salida a un archivo temporal
  execSync('npx tsc --noEmit > typescript-errors.log 2>&1', { stdio: 'inherit' });

  // Leer el archivo de errores y contar las líneas
  const errorOutput = fs.readFileSync('typescript-errors.log', 'utf8');
  const lines = errorOutput.split('\n');

  // Buscar la línea que contiene el resumen de errores (ej: "Found 3233 errors in 544 files.")
  const errorSummary = lines.find(line => line.match(/Found \d+ errors? in \d+ files?/));

  if (errorSummary) {
    const [_, errorCount, fileCount] = errorSummary.match(/Found (\d+) errors? in (\d+) files?/);
    console.log(`📈 Resumen: ${errorCount} errores en ${fileCount} archivos`);
  } else {
    console.log('✅ No se encontraron errores');
  }

  // Limpiar
  fs.unlinkSync('typescript-errors.log');
} catch (error) {
  console.error('❌ Error al ejecutar TypeScript:', error.message);
}