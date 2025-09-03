/**
 * Script para migrar console.* directos al sistema de logging estructurado
 *
 * Este script busca todos los usos de console.log, console.warn, console.error
 * en el código fuente y proporciona un reporte de dónde se pueden migrar
 * al sistema de ServerLogger.
 */

import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

// Configuración
const SRC_DIR = path.join(process.cwd(), 'src');
const PATTERNS = {
	typescript: '**/*.{ts,tsx}',
	javascript: '**/*.{js,jsx}',
};

// Regex para encontrar console.*
const CONSOLE_REGEX = /console\.(log|info|warn|error|debug)\s*\(/g;

// Contadores
let totalFiles = 0;
let filesWithConsole = 0;
let totalConsoleStatements = 0;

// Reporte
const report = {
	files: [],
	summary: {
		totalFiles: 0,
		filesWithConsole: 0,
		totalStatements: 0,
		byType: {
			log: 0,
			info: 0,
			warn: 0,
			error: 0,
			debug: 0,
		},
	},
};

/**
 * Analiza un archivo en busca de console.* statements
 */
function analyzeFile(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		const matches = [];
		// Iterar con matchAll para evitar asignación en la condición del bucle
		for (const match of content.matchAll(CONSOLE_REGEX)) {
			const lineNumber = content.substring(0, match.index).split('\n').length;
			const line = content.split('\n')[lineNumber - 1].trim();

			matches.push({
				type: match[1],
				lineNumber,
				line,
				suggestion: getSuggestion(match[1], line),
			});

			totalConsoleStatements++;
			report.summary.byType[match[1]]++;
		}

		if (matches.length > 0) {
			filesWithConsole++;
			report.files.push({
				path: filePath.replace(process.cwd(), '.'),
				matches,
			});
		}

		totalFiles++;
	} catch (error) {
		console.error(`❌ Error leyendo ${filePath}:`, error.message);
	}
}

/**
 * Genera sugerencia de migración
 */
function getSuggestion(consoleType, line) {
	const cleanLine = line.replace(/console\.(log|info|warn|error|debug)\s*\(/, '').slice(0, -1);

	// Detectar contexto (servidor vs cliente)
	const isServerFile = line.includes('server') || line.includes('api') || line.includes('middleware');
	const loggerType = isServerFile ? 'serverLogger' : 'clientLogger';

	// Mapeo de tipos
	const typeMapping = {
		log: 'info',
		info: 'info',
		warn: 'warn',
		error: 'error',
		debug: 'debug',
	};

	const newType = typeMapping[consoleType] || 'info';

	return {
		import: isServerFile
			? `import { serverLogger } from '@/lib/logger';`
			: `import { clientLogger } from '@/lib/logger';`,
		replacement: `${loggerType}.${newType}(${cleanLine});`,
		context: isServerFile ? 'server' : 'client',
	};
}

/**
 * Función principal
 */
async function main() {
	console.log('🔍 Buscando archivos TypeScript y JavaScript...');

	// Buscar archivos
	const files = await glob(PATTERNS.typescript, {
		cwd: SRC_DIR,
		ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.d.ts'],
	});

	console.log(`📁 Encontrados ${files.length} archivos para analizar`);
	console.log('🔍 Analizando console.* statements...\n');

	// Analizar cada archivo
	for (const file of files) {
		const fullPath = path.join(SRC_DIR, file);
		analyzeFile(fullPath);
	}

	// Completar reporte
	report.summary.totalFiles = totalFiles;
	report.summary.filesWithConsole = filesWithConsole;
	report.summary.totalStatements = totalConsoleStatements;

	// Mostrar reporte
	displayReport();

	// Guardar reporte detallado
	saveDetailedReport();
}

/**
 * Muestra el reporte en consola
 */
function displayReport() {
	console.log('📊 REPORTE DE MIGRACIÓN DE CONSOLE LOGGING\n');
	console.log('═'.repeat(60));
	console.log('📈 RESUMEN:');
	console.log(`   Total archivos analizados: ${report.summary.totalFiles}`);
	console.log(`   Archivos con console.*: ${report.summary.filesWithConsole}`);
	console.log(`   Total statements: ${report.summary.totalStatements}\n`);

	console.log('📊 POR TIPO:');
	for (const [type, count] of Object.entries(report.summary.byType)) {
		if (count > 0) {
			console.log(`   console.${type}: ${count}`);
		}
	}
	console.log('');

	console.log('🏆 ARCHIVOS MÁS CRÍTICOS:');
	const sortedFiles = report.files.sort((a, b) => b.matches.length - a.matches.length).slice(0, 10);

	for (const file of sortedFiles) {
		console.log(`   ${file.path} (${file.matches.length} statements)`);
	}

	if (report.files.length > 10) {
		console.log(`   ... y ${report.files.length - 10} archivos más`);
	}

	console.log('\n💡 RECOMENDACIONES:');
	console.log('   1. Migrar console.error a serverLogger.error o clientLogger.error');
	console.log('   2. Migrar console.warn a serverLogger.warn o clientLogger.warn');
	console.log('   3. Migrar console.log a serverLogger.info o clientLogger.info');
	console.log('   4. Usar contextos específicos: logger.withContext("ComponentName")');
	console.log('   5. Revisar el reporte detallado: logs/console-migration-report.json');
}

/**
 * Guarda reporte detallado
 */
function saveDetailedReport() {
	const logsDir = path.join(process.cwd(), 'logs');
	if (!fs.existsSync(logsDir)) {
		fs.mkdirSync(logsDir, { recursive: true });
	}

	const reportPath = path.join(logsDir, 'console-migration-report.json');
	fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

	console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);
}

// Ejecutar
main().catch(console.error);
