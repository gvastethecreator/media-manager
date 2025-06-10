#!/usr/bin/env node

/**
 * 🔧 Script mejorado para analizar errores de TypeScript
 * 📊 Analiza tsc-log.txt y genera estadísticas completas
 */

const fs = require('fs');

console.log('🚀 ANALIZADOR MEJORADO DE ERRORES TYPESCRIPT');
console.log('============================================\n');

try {
    // 📖 Leer archivo de errores
    const content = fs.readFileSync('tsc-log.txt', 'utf8');
    const lines = content.split('\n');

    console.log(`📁 Archivo leído: ${lines.length} líneas\n`);

    // 🔍 Encontrar todas las líneas de error
    const errorLines = lines.filter(line => line.includes('error TS'));
    console.log(`🎯 Líneas con errores: ${errorLines.length}\n`);

    // 📊 Parsear errores usando regex más simple
    const errors = [];

    for (const line of errorLines) {
        // Regex más flexible para capturar errores
        const match = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/);

        if (match) {
            errors.push({
                file: match[1].trim(),
                line: Number.parseInt(match[2], 10),
                column: Number.parseInt(match[3], 10),
                code: match[4],
                message: match[5].trim(),
                fullLine: line
            });
        }
    }

    console.log(`✅ Errores parseados exitosamente: ${errors.length}\n`);

    // 📈 Análisis por tipo de error
    const errorTypes = {};
    errors.forEach(error => {
        errorTypes[error.code] = (errorTypes[error.code] || 0) + 1;
    });

    console.log('📋 TOP 10 TIPOS DE ERRORES:');
    console.log('===========================');
    Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([code, count]) => {
            const percentage = ((count / errors.length) * 100).toFixed(1);
            console.log(`${code}: ${count} errores (${percentage}%)`);
        });

    // 📂 Análisis por archivo
    const fileErrors = {};
    errors.forEach(error => {
        fileErrors[error.file] = (fileErrors[error.file] || 0) + 1;
    });

    console.log('\n📂 TOP 15 ARCHIVOS MÁS PROBLEMÁTICOS:');
    console.log('====================================');
    const topFiles = Object.entries(fileErrors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    topFiles.forEach(([file, count]) => {
        const percentage = ((count / errors.length) * 100).toFixed(1);
        console.log(`${file}: ${count} errores (${percentage}%)`);
    });

    // 🎯 Archivos en .next vs src
    const nextErrors = errors.filter(e => e.file.includes('.next')).length;
    const srcErrors = errors.filter(e => e.file.includes('src')).length;
    const otherErrors = errors.length - nextErrors - srcErrors;

    console.log('\n🎯 DISTRIBUCIÓN POR DIRECTORIO:');
    console.log('===============================');
    console.log(`📁 .next/: ${nextErrors} errores (${((nextErrors / errors.length) * 100).toFixed(1)}%)`);
    console.log(`📁 src/: ${srcErrors} errores (${((srcErrors / errors.length) * 100).toFixed(1)}%)`);
    console.log(`📁 otros: ${otherErrors} errores (${((otherErrors / errors.length) * 100).toFixed(1)}%)`);

    // 📋 Generar reporte detallado
    const report = `# 📊 Análisis Completo de Errores TypeScript

**Fecha:** ${new Date().toLocaleString('es-ES')}
**Total de errores:** ${errors.length}

## 📈 Errores por Tipo (Top 20)

| Código | Cantidad | Porcentaje | Descripción |
|--------|----------|------------|-------------|
${Object.entries(errorTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([code, count]) => {
        const percentage = ((count / errors.length) * 100).toFixed(1);
        const description = getErrorDescription(code);
        return `| ${code} | ${count} | ${percentage}% | ${description} |`;
    })
    .join('\n')}

## 📂 Archivos Más Problemáticos (Top 20)

| Archivo | Errores | Porcentaje |
|---------|---------|------------|
${topFiles.concat(Object.entries(fileErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(15, 20))
    .map(([file, count]) => {
        const percentage = ((count / errors.length) * 100).toFixed(1);
        return `| ${file} | ${count} | ${percentage}% |`;
    })
    .join('\n')}

## 🎯 Distribución por Directorio

- **📁 .next/**: ${nextErrors} errores (${((nextErrors / errors.length) * 100).toFixed(1)}%)
- **📁 src/**: ${srcErrors} errores (${((srcErrors / errors.length) * 100).toFixed(1)}%)
- **📁 otros**: ${otherErrors} errores (${((otherErrors / errors.length) * 100).toFixed(1)}%)

## 🔧 Plan de Corrección Prioritario

### 🔴 PRIORIDAD ALTA - Errores críticos
${getPriorityErrors(errorTypes, errors, 'high')}

### 🟡 PRIORIDAD MEDIA - Errores importantes
${getPriorityErrors(errorTypes, errors, 'medium')}

### 🟢 PRIORIDAD BAJA - Errores menores
${getPriorityErrors(errorTypes, errors, 'low')}

## 📝 Ejemplos de Errores Más Comunes

${Object.entries(errorTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => {
        const examples = errors.filter(e => e.code === code).slice(0, 3);
        return `### ${code} (${count} errores)

${examples.map(error => `- \`${error.file}:${error.line}\` - ${error.message.substring(0, 120)}...`).join('\n')}`;
    })
    .join('\n\n')}

---
*Generado automáticamente el ${new Date().toLocaleString('es-ES')}*
`;

    fs.writeFileSync('typescript-errors-complete-analysis.md', report);
    console.log('\n📋 Reporte completo generado: typescript-errors-complete-analysis.md');

    // 🎯 Recomendaciones específicas
    console.log('\n🎯 RECOMENDACIONES ESPECÍFICAS:');
    console.log('==============================');

    if (nextErrors > srcErrors) {
        console.log('🔸 La mayoría de errores están en archivos generados (.next/)');
        console.log('  → Esto indica problemas en las rutas API de Next.js');
        console.log('  → Priorizar corrección de archivos fuente en src/app/api/');
    }

    const topErrorCode = Object.entries(errorTypes).sort((a, b) => b[1] - a[1])[0];
    console.log(`🔸 Error más común: ${topErrorCode[0]} (${topErrorCode[1]} ocurrencias)`);
    console.log(`  → ${getErrorDescription(topErrorCode[0])}`);
    console.log(`  → ${getFixSuggestion(topErrorCode[0])}`);

    console.log('\n✨ ¡Análisis completado exitosamente!');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

// 📖 Descripción de errores TypeScript
function getErrorDescription(code) {
    const descriptions = {
        'TS2344': 'Tipo no satisface restricción genérica',
        'TS2322': 'Tipo no asignable a tipo esperado',
        'TS2345': 'Argumento no asignable al parámetro',
        'TS2339': 'Propiedad no existe en el tipo',
        'TS2304': 'No se puede encontrar el nombre',
        'TS2307': 'No se puede encontrar el módulo',
        'TS2571': 'Objeto posiblemente null',
        'TS2531': 'Objeto posiblemente null o undefined',
        'TS2740': 'Tipo carece de propiedades requeridas',
        'TS2741': 'Tipo literal carece de propiedades',
        'TS2305': 'No se puede encontrar el nombre'
    };
    return descriptions[code] || 'Error de TypeScript';
}

// 🔧 Sugerencias de corrección
function getFixSuggestion(code) {
    const suggestions = {
        'TS2344': 'Revisar restricciones genéricas y tipos de parámetros',
        'TS2322': 'Verificar compatibilidad de tipos y conversiones',
        'TS2345': 'Corregir tipos de argumentos en llamadas a funciones',
        'TS2339': 'Añadir propiedades faltantes o corregir nombres',
        'TS2304': 'Añadir imports o declaraciones de tipos',
        'TS2307': 'Verificar rutas de módulos e instalaciones',
        'TS2571': 'Añadir verificaciones de null o non-null assertions',
        'TS2531': 'Usar optional chaining o verificaciones de null/undefined',
        'TS2740': 'Completar propiedades requeridas en objetos',
        'TS2741': 'Añadir todas las propiedades necesarias'
    };
    return suggestions[code] || 'Revisar documentación de TypeScript';
}

// 📊 Obtener errores por prioridad
function getPriorityErrors(errorTypes, errors, priority) {
    const priorities = {
        high: ['TS2344', 'TS2322', 'TS2345', 'TS2304', 'TS2307'],
        medium: ['TS2339', 'TS2740', 'TS2741', 'TS2305'],
        low: ['TS2571', 'TS2531', 'TS2538', 'TS2769']
    };

    const priorityCodes = priorities[priority] || [];
    const priorityErrors = priorityCodes.filter(code => errorTypes[code]);

    if (priorityErrors.length === 0) {
        return 'No hay errores en esta categoría.';
    }

    return priorityErrors
        .map(code => `- **${code}**: ${errorTypes[code]} errores - ${getErrorDescription(code)}`)
        .join('\n');
}
