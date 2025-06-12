/**
 * 🚀 Script maestro para la corrección masiva de errores TypeScript
 *
 * Este script coordina la ejecución de los scripts de corrección:
 * 1. Genera los tipos canónicos para todas las entidades
 * 2. Corrige los transformadores
 * 3. Corrige las acciones del servidor
 * 4. Ejecuta TypeScript para verificar el progreso
 *
 * Uso: node enhanced-master-fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 📁 Configuración
const LOGS_DIR = path.join(__dirname, 'logs');
const SUMMARY_FILE = path.join(LOGS_DIR, 'fix-summary.md');
const TSC_OUTPUT_FILE = path.join(__dirname, 'tsc-progress.txt');
const START_TIME = new Date();

// 📊 Estadísticas generales
const stats = {
	typesGenerated: 0,
	transformersFixed: 0,
	actionsFixed: 0,
	totalFixed: 0,
	initialErrors: 0,
	finalErrors: 0,
	errorChange: 0,
	timeElapsed: 0,
};

// Asegurar que existe el directorio de logs
if (!fs.existsSync(LOGS_DIR)) {
	fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * 📊 Cuenta los errores actuales de TypeScript
 */
function countTypeScriptErrors() {
	try {
		console.log('📝 Ejecutando TypeScript para contar errores...');

		// Ejecutar tsc y guardar salida
		try {
			execSync('tsc --noEmit', { stdio: 'pipe' });
			// Si no hay error, significa 0 errores
			fs.writeFileSync(TSC_OUTPUT_FILE, 'No errors found.\n');
			return 0;
		} catch (error) {
			// Guardar la salida para análisis
			fs.writeFileSync(TSC_OUTPUT_FILE, error.stdout.toString());

			// Contar los errores
			const output = error.stdout.toString();
			const errorMatch = output.match(/Found (\d+) errors? in \d+ files?/);
			if (errorMatch) {
				return Number.parseInt(errorMatch[1], 10);
			}

			// Si no podemos extraer el número, estimamos contando líneas con "error TS"
			const lines = output.split('\n');
			const errorLines = lines.filter((line) => line.includes('error TS'));
			return errorLines.length;
		}
	} catch (error) {
		console.error('❌ Error ejecutando TypeScript:', error);
		return -1;
	}
}

/**
 * 📝 Analiza los errores de TypeScript para generar un informe
 */
function analyzeTypeScriptErrors() {
	try {
		console.log('🔍 Analizando errores de TypeScript...');

		const output = fs.readFileSync(TSC_OUTPUT_FILE, 'utf8');
		const lines = output.split('\n');

		// Contadores
		const errorsByFile = {};
		const errorsByType = {};

		// Analizar cada línea
		lines.forEach((line) => {
			// Buscar patrón de error: archivo(línea,columna): error TS1234: mensaje
			const errorMatch = line.match(/([^(]+)\((\d+),(\d+)\):\s+error\s+TS(\d+):\s+(.+)/);
			if (errorMatch) {
				const [_, file, line, col, code, message] = errorMatch;

				// Contar por archivo
				errorsByFile[file] = (errorsByFile[file] || 0) + 1;

				// Contar por tipo de error
				errorsByType[code] = errorsByType[code] || { count: 0, message, code };
				errorsByType[code].count++;
			}
		});

		// Generar informe
		let report = '## Análisis de errores TypeScript\n\n';

		// Top archivos con más errores
		report += '### Archivos con más errores\n\n';
		report += '| Archivo | Errores |\n';
		report += '|---------|--------:|\n';

		Object.entries(errorsByFile)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 15)
			.forEach(([file, count]) => {
				report += `| ${file} | ${count} |\n`;
			});

		// Top tipos de error
		report += '\n### Tipos de error más comunes\n\n';
		report += '| Código | Ocurrencias | Descripción |\n';
		report += '|--------|------------:|-------------|\n';

		Object.values(errorsByType)
			.sort((a, b) => b.count - a.count)
			.slice(0, 15)
			.forEach(({ code, count, message }) => {
				report += `| TS${code} | ${count} | ${message} |\n`;
			});

		return report;
	} catch (error) {
		console.error('❌ Error analizando errores TypeScript:', error);
		return '## Error analizando los errores TypeScript\n\n' + error.message;
	}
}

/**
 * ⏱️ Formatea la duración en formato legible
 */
function formatDuration(ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	} else {
		return `${seconds}s`;
	}
}

/**
 * 🔄 Ejecuta un comando y espera confirmación del usuario para continuar
 */
async function runWithConfirmation(command, description) {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		console.log(`\n🔶 A punto de ejecutar: ${description}`);
		rl.question('¿Confirmas que quieres continuar? (s/n): ', (answer) => {
			rl.close();

			if (answer.toLowerCase() === 's') {
				console.log(`\n🚀 Ejecutando: ${command}\n`);
				try {
					execSync(command, { stdio: 'inherit' });
					console.log(`\n✅ Comando completado exitosamente`);
					resolve(true);
				} catch (error) {
					console.error(`\n❌ Error ejecutando el comando:`, error);
					resolve(false);
				}
			} else {
				console.log('\n❌ Operación cancelada por el usuario');
				resolve(false);
			}
		});
	});
}

/**
 * 🚀 Función principal
 */
async function main() {
	console.log('🚀 Iniciando corrección masiva de errores TypeScript');
	console.log('====================================================');

	// Crear archivo de resumen
	fs.writeFileSync(
		SUMMARY_FILE,
		`# Resumen de corrección de errores TypeScript\n\nIniciado: ${START_TIME.toISOString()}\n\n`
	);

	try {
		// Paso 0: Contar errores iniciales
		console.log('\n📊 Contando errores TypeScript iniciales...');
		stats.initialErrors = countTypeScriptErrors();
		console.log(`📈 Errores iniciales: ${stats.initialErrors}`);

		// Análisis inicial
		const initialAnalysis = analyzeTypeScriptErrors();
		fs.appendFileSync(
			SUMMARY_FILE,
			`## Estado inicial\n\nErrores detectados: ${stats.initialErrors}\n\n${initialAnalysis}\n\n`
		);

		// Paso 1: Generar tipos canónicos
		console.log('\n📝 PASO 1: Generando tipos canónicos para todas las entidades');
		if (await runWithConfirmation('node enhanced-generate-types.js', 'Generación de tipos canónicos')) {
			const typesResult = require('./enhanced-generate-types.js');
			stats.typesGenerated = typesResult.filesCreated || 0;
		}
		// Paso 2: Corregir transformadores
		console.log('\n🔧 PASO 2: Corrigiendo errores en transformadores');
		if (await runWithConfirmation('node enhanced-fix-transformers.js', 'Corrección de transformadores')) {
			try {
				// Limpiar caché de módulos para asegurar ejecución limpia
				delete require.cache[require.resolve('./enhanced-fix-transformers.js')];
				const transformersResult = require('./enhanced-fix-transformers.js');
				stats.transformersFixed = transformersResult.filesModified || 0;
			} catch (error) {
				console.error('\n❌ Error al cargar resultados del script de transformadores:', error);
			}
		}

		// Verificar progreso después de transformadores
		console.log('\n📊 Verificando progreso después de corregir transformadores...');
		const errorsAfterTransformers = countTypeScriptErrors();
		console.log(`📈 Errores después de transformadores: ${errorsAfterTransformers}`);
		const transformerProgress = stats.initialErrors - errorsAfterTransformers;
		console.log(`🔄 Progreso: ${transformerProgress} errores corregidos`);

		// Paso 3: Corregir server actions
		console.log('\n🔧 PASO 3: Corrigiendo errores en server actions');
		if (await runWithConfirmation('node enhanced-fix-actions.js', 'Corrección de server actions')) {
			try {
				// Limpiar caché de módulos para asegurar ejecución limpia
				delete require.cache[require.resolve('./enhanced-fix-actions.js')];
				const actionsResult = require('./enhanced-fix-actions.js');
				stats.actionsFixed = actionsResult.filesModified || 0;
			} catch (error) {
				console.error('\n❌ Error al cargar resultados del script de server actions:', error);
			}
		}

		// Verificar progreso final
		console.log('\n📊 Verificando errores finales...');
		stats.finalErrors = countTypeScriptErrors();
		stats.errorChange = stats.initialErrors - stats.finalErrors;
		stats.totalFixed = stats.transformersFixed + stats.actionsFixed;
		stats.timeElapsed = new Date() - START_TIME;

		console.log(
			`📈 Errores finales: ${stats.finalErrors} (${stats.errorChange > 0 ? '-' : '+'}${Math.abs(stats.errorChange)})`
		);

		// Análisis final
		const finalAnalysis = analyzeTypeScriptErrors();

		// Generar resumen final
		const summary = `
## Resumen de operaciones

- ⏱️ Tiempo total: ${formatDuration(stats.timeElapsed)}
- 📈 Errores iniciales: ${stats.initialErrors}
- 📉 Errores finales: ${stats.finalErrors}
- 🔄 Diferencia: ${stats.errorChange > 0 ? '-' : '+'}${Math.abs(stats.errorChange)} errores

## Detalles por operación

- 📝 Tipos canónicos generados: ${stats.typesGenerated}
- 🔧 Transformadores corregidos: ${stats.transformersFixed}
- 🔧 Server actions corregidos: ${stats.actionsFixed}
- 📊 Total de archivos modificados: ${stats.totalFixed}

${finalAnalysis}

## Próximos pasos

1. Ejecutar de nuevo el script para corregir los errores restantes
2. Revisar manualmente los archivos con más errores
3. Verificar que la funcionalidad se mantiene intacta

Finalizado: ${new Date().toISOString()}
`;

		fs.appendFileSync(SUMMARY_FILE, summary);
		console.log('\n✅ Proceso completado. Resumen guardado en:', SUMMARY_FILE);

		return stats;
	} catch (error) {
		console.error('\n❌ Error general:', error);
		fs.appendFileSync(SUMMARY_FILE, `\n## ERROR FATAL\n\n${error.stack}\n`);

		stats.timeElapsed = new Date() - START_TIME;
		return stats;
	}
}

// Ejecutar si se llama directamente
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { main, countTypeScriptErrors, analyzeTypeScriptErrors };
