#!/usr/bin/env node

/**
 * 🔧 Script simple para analizar errores de TypeScript
 * 📊 Analiza tsc-log.txt y genera estadísticas útiles
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 ANALIZADOR DE ERRORES TYPESCRIPT');
console.log('===================================\n');

try {
    // 📖 Leer archivo de errores
    const content = fs.readFileSync('tsc-log.txt', 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    console.log(`📁 Archivo leído: ${lines.length} líneas\n`);

    // 🔍 Parsear errores
    const errors = [];
    let currentError = null;    for (const line of lines) {
        // Detectar línea de error: archivo(línea,columna): error TS####: mensaje
        const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/);

        if (errorMatch) {
            if (currentError) {
                errors.push(currentError);
            }

            currentError = {
                file: errorMatch[1].trim(),
                line: parseInt(errorMatch[2]),
                column: parseInt(errorMatch[3]),
                code: errorMatch[4],
                message: errorMatch[5].trim(),
                fullMessage: line
            };
        } else if (currentError && line.trim() && !line.match(/^\s*$/)) {
            // Líneas adicionales del mensaje (saltar líneas vacías)
            if (line.trim().length > 0) {
                currentError.message += ' ' + line.trim();
                currentError.fullMessage += '\n' + line;
            }
        } else if (!currentError && line.trim() && line.includes('error TS')) {
            // Intentar con formato alternativo
            const altMatch = line.match(/(.+?):\s*error\s+(TS\d+):\s*(.+)/);
            if (altMatch) {
                const fileLineMatch = altMatch[1].match(/^(.+?)\((\d+),(\d+)\)$/);
                if (fileLineMatch) {
                    currentError = {
                        file: fileLineMatch[1].trim(),
                        line: parseInt(fileLineMatch[2]),
                        column: parseInt(fileLineMatch[3]),
                        code: altMatch[2],
                        message: altMatch[3].trim(),
                        fullMessage: line
                    };
                }
            }
        }
    }

    if (currentError) {
        errors.push(currentError);
    }

    console.log(`📊 Total de errores encontrados: ${errors.length}\n`);

    // 📈 Estadísticas por tipo de error
    const errorTypes = {};
    errors.forEach(error => {
        errorTypes[error.code] = (errorTypes[error.code] || 0) + 1;
    });

    console.log('📋 ERRORES POR TIPO:');
    console.log('==================');
    Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([code, count]) => {
            console.log(`${code}: ${count} errores`);
        });

    // 📂 Estadísticas por archivo
    const fileErrors = {};
    errors.forEach(error => {
        fileErrors[error.file] = (fileErrors[error.file] || 0) + 1;
    });

    console.log('\n📂 ARCHIVOS MÁS PROBLEMÁTICOS:');
    console.log('==============================');
    Object.entries(fileErrors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([file, count]) => {
            console.log(`${file}: ${count} errores`);
        });

    // 🎯 Mostrar algunos errores específicos para análisis
    console.log('\n🎯 EJEMPLOS DE ERRORES MÁS COMUNES:');
    console.log('==================================');

    // Agrupar por tipos más comunes
    const commonTypes = Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    commonTypes.forEach(([code, count]) => {
        console.log(`\n${code} (${count} errores):`);
        const exampleErrors = errors.filter(e => e.code === code).slice(0, 3);
        exampleErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.file}:${error.line} - ${error.message.substring(0, 100)}...`);
        });
    });

    // 💾 Generar reporte en markdown
    const report = `# 📊 Análisis de Errores TypeScript

**Fecha:** ${new Date().toLocaleString('es-ES')}
**Total de errores:** ${errors.length}

## 📈 Errores por Tipo

| Código | Cantidad | Descripción |
|--------|----------|-------------|
${Object.entries(errorTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => `| ${code} | ${count} | Error de TypeScript |`)
    .join('\n')}

## 📂 Archivos Más Problemáticos

| Archivo | Errores |
|---------|---------|
${Object.entries(fileErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([file, count]) => `| ${file} | ${count} |`)
    .join('\n')}

## 🎯 Errores Prioritarios

Los errores más comunes que deberían corregirse primero:

${commonTypes.map(([code, count]) => {
    const examples = errors.filter(e => e.code === code).slice(0, 3);
    return `### ${code} (${count} errores)

${examples.map(error => `- \`${error.file}:${error.line}\` - ${error.message.substring(0, 100)}...`).join('\n')}`;
}).join('\n\n')}

---
*Generado automáticamente el ${new Date().toLocaleString('es-ES')}*
`;

    fs.writeFileSync('typescript-errors-analysis.md', report);
    console.log('\n📋 Reporte generado: typescript-errors-analysis.md');

    // 🔧 Sugerencias de corrección
    console.log('\n🔧 PLAN DE CORRECCIÓN SUGERIDO:');
    console.log('===============================');

    const priority = [
        { codes: ['TS2345', 'TS2322'], desc: 'Errores de tipos - Alta prioridad', level: '🔴' },
        { codes: ['TS2339', 'TS2304'], desc: 'Errores de propiedades/nombres - Media prioridad', level: '🟡' },
        { codes: ['TS2571', 'TS2531'], desc: 'Errores de null/undefined - Media prioridad', level: '🟡' },
        { codes: ['TS2740', 'TS2741'], desc: 'Propiedades faltantes - Baja prioridad', level: '🟢' }
    ];

    priority.forEach(({ codes, desc, level }) => {
        const count = codes.reduce((sum, code) => sum + (errorTypes[code] || 0), 0);
        if (count > 0) {
            console.log(`${level} ${desc}: ${count} errores`);
        }
    });

    console.log('\n✨ ¡Análisis completado!');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
