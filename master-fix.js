/**
 * 🔧 Script maestro para la corrección de errores de TypeScript
 *
 * Este script coordina la ejecución de todos los scripts de corrección:
 * - generate-canonical-types.js: Genera tipos canónicos
 * - simple-fix-transformers.js: Corrige transformadores
 * - fix-components-stores.js: Corrige componentes y stores
 * - simple-fix-actions.js: Corrige server actions
 *
 * Uso: node master-fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 📁 Configuración
const LOGS_DIR = path.join(__dirname, 'logs');
const SUMMARY_FILE = path.join(LOGS_DIR, 'fix-summary.md');
const START_TIME = new Date();

// 📊 Estadísticas generales
const stats = {
	typesGenerated: 0,
	transformersFixed: 0,
	componentsFixed: 0,
	storesFixed: 0,
	actionsFixed: 0,
	totalFixed: 0,
	errors: 0,
};

/**
 * 🚀 Ejecuta un script y captura su salida
 * @param {string} scriptName - Nombre del script a ejecutar
 * @param {string} logFile - Archivo donde guardar el log
 * @return {string} Salida del script
 */
function runScript(scriptName, logFile = null) {
	console.log(`\n🚀 Ejecutando: ${scriptName}...\n`);

	try {
		// Ejecutar script y capturar salida
		const output = execSync(`node ${path.join(__dirname, scriptName)}`, { encoding: 'utf8' });

		// Si se especificó un archivo de log, guardar salida
		if (logFile) {
			fs.writeFileSync(path.join(LOGS_DIR, logFile), output, 'utf8');
		}

		console.log(`✅ ${scriptName} completado`);
		return output;
	} catch (err) {
		console.error(`❌ Error ejecutando ${scriptName}:`, err.message);
		stats.errors++;
		return err.message;
	}
}

/**
 * 📝 Extrae estadísticas de la salida de un script
 * @param {string} output - Salida del script
 * @param {string} pattern - Patrón para buscar estadísticas
 * @return {number} Valor numérico extraído
 */
function extractStats(output, pattern) {
	const match = output.match(new RegExp(pattern + '\\s*(\\d+)'));
	return match ? Number.parseInt(match[1], 10) : 0;
}

/**
 * 📝 Genera un resumen de las correcciones
 */
function generateSummary() {
	const endTime = new Date();
	const duration = (endTime - START_TIME) / 1000; // En segundos

	const summary = `# 📊 Resumen de Corrección de Errores TypeScript

**Fecha:** ${endTime.toLocaleString('es-ES')}
**Duración:** ${Math.floor(duration / 60)} minutos ${Math.round(duration % 60)} segundos

## Resultados

- ✨ **Tipos Canónicos Generados:** ${stats.typesGenerated}
- 🔄 **Transformadores Corregidos:** ${stats.transformersFixed}
- 🧩 **Componentes Corregidos:** ${stats.componentsFixed} 
- 🗃️ **Stores Corregidos:** ${stats.storesFixed}
- ⚡ **Server Actions Corregidas:** ${stats.actionsFixed}

**Total de archivos corregidos:** ${stats.totalFixed}
**Errores encontrados durante el proceso:** ${stats.errors}

## Próximos Pasos

1. Ejecutar \`pnpm tsc --noEmit\` para verificar errores restantes
2. Corregir errores restantes manualmente si es necesario
3. Ejecutar pruebas para asegurar que todo funcione correctamente
4. Actualizar documentación si es necesario

## Archivos de Log

Los logs detallados de cada script están disponibles en la carpeta \`logs/\`.
`;

	// Guardar resumen
	fs.writeFileSync(SUMMARY_FILE, summary, 'utf8');
	console.log(`📝 Resumen guardado en ${SUMMARY_FILE}`);
}

/**
 * 🚀 Función principal
 */
function main() {
	console.log('🔧 Iniciando corrección automática de errores TypeScript...');
	console.log(`📅 Fecha: ${START_TIME.toLocaleString('es-ES')}`);

	// Crear directorio de logs si no existe
	if (!fs.existsSync(LOGS_DIR)) {
		fs.mkdirSync(LOGS_DIR, { recursive: true });
	}

	try {
		// 1. Generar tipos canónicos
		const typesOutput = runScript('generate-canonical-types.js', 'types-log.txt');
		stats.typesGenerated = extractStats(typesOutput, 'Tipos generados:');

		// 2. Corregir transformadores
		const transformersOutput = runScript('simple-fix-transformers.js', 'transformers-log.txt');
		stats.transformersFixed = extractStats(transformersOutput, 'Archivos modificados:');

		// 3. Corregir componentes y stores
		const componentsOutput = runScript('fix-components-stores.js', 'components-stores-log.txt');
		stats.componentsFixed = extractStats(componentsOutput, 'Archivos modificados:');

		// 4. Corregir server actions
		const actionsOutput = runScript('simple-fix-actions.js', 'actions-log.txt');
		stats.actionsFixed = extractStats(actionsOutput, 'Archivos modificados:');

		// Calcular total
		stats.totalFixed = stats.typesGenerated + stats.transformersFixed + stats.componentsFixed + stats.actionsFixed;

		// Generar resumen
		generateSummary();

		console.log(`
✅ ¡Proceso completado!

📊 Resumen:
- Tipos generados: ${stats.typesGenerated}
- Transformadores corregidos: ${stats.transformersFixed}
- Componentes/Stores corregidos: ${stats.componentsFixed}
- Server Actions corregidas: ${stats.actionsFixed}
- Total archivos corregidos: ${stats.totalFixed}
- Errores encontrados: ${stats.errors}

📝 Revise el archivo ${SUMMARY_FILE} para más detalles.
`);
	} catch (err) {
		console.error('❌ Error general:', err);
	}
}

// Ejecutar función principal
main();
