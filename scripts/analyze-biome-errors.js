#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para analizar el log de BIOME y contar errores por archivo
function analyzeBiomeLog(logPath) {
	if (!fs.existsSync(logPath)) {
		console.error(`Log file not found: ${logPath}`);
		process.exit(1);
	}

	const logContent = fs.readFileSync(logPath, 'utf8');
	const lines = logContent.split('\n');

	const errorsByFile = new Map();
	const errorTypes = new Map();

	// Regex para detectar líneas de error de BIOME
	const errorRegex = /^(src\\[^:]+\.tsx?):(\d+):(\d+)\s+lint\/([^\s]+)\s+(FIXABLE\s+)?━+/;

	lines.forEach((line, _index) => {
		const match = line.match(errorRegex);
		if (match) {
			const [, filePath, lineNum, colNum, errorType, fixable] = match;
			const normalizedPath = filePath.replace(/\\/g, '/');

			// Contar errores por archivo
			if (!errorsByFile.has(normalizedPath)) {
				errorsByFile.set(normalizedPath, {
					count: 0,
					errors: [],
					fixableCount: 0,
				});
			}

			const fileData = errorsByFile.get(normalizedPath);
			fileData.count++;
			if (fixable?.includes('FIXABLE')) {
				fileData.fixableCount++;
			}

			fileData.errors.push({
				line: Number.parseInt(lineNum),
				column: Number.parseInt(colNum),
				type: errorType,
				fixable: !!fixable,
			});

			// Contar tipos de error
			if (!errorTypes.has(errorType)) {
				errorTypes.set(errorType, 0);
			}
			errorTypes.set(errorType, errorTypes.get(errorType) + 1);
		}
	});

	return { errorsByFile, errorTypes };
}

// Función para mostrar el resumen
function displaySummary(errorsByFile, errorTypes) {
	console.log('\n=== ANÁLISIS DE ERRORES DE BIOME ===\n');

	// Ordenar archivos por número de errores (descendente)
	const sortedFiles = Array.from(errorsByFile.entries()).sort((a, b) => b[1].count - a[1].count);

	console.log('📊 ARCHIVOS CON MÁS ERRORES (Top 20):');
	console.log('='.repeat(60));

	sortedFiles.slice(0, 20).forEach(([file, data], index) => {
		const priority = index < 5 ? '🔴 ALTA' : index < 10 ? '🟡 MEDIA' : '🟢 BAJA';
		console.log(`${(index + 1).toString().padStart(2)}. ${priority} | ${file}`);
		console.log(`    Errores: ${data.count} (${data.fixableCount} fixables)`);

		// Mostrar tipos de error más comunes en este archivo
		const errorTypesInFile = new Map();
		for (const error of data.errors) {
			errorTypesInFile.set(error.type, (errorTypesInFile.get(error.type) || 0) + 1);
		}

		const topErrors = Array.from(errorTypesInFile.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3);

		console.log(`    Top errores: ${topErrors.map(([type, count]) => `${type}(${count})`).join(', ')}`);
		console.log('');
	});

	console.log('\n📈 TIPOS DE ERROR MÁS COMUNES:');
	console.log('='.repeat(40));

	const sortedErrorTypes = Array.from(errorTypes.entries()).sort((a, b) => b[1] - a[1]);

	sortedErrorTypes.slice(0, 10).forEach(([type, count], index) => {
		console.log(`${(index + 1).toString().padStart(2)}. ${type}: ${count} ocurrencias`);
	});

	console.log('\n📋 RESUMEN GENERAL:');
	console.log('='.repeat(30));
	console.log(`Total de archivos con errores: ${errorsByFile.size}`);
	console.log(`Total de errores: ${Array.from(errorsByFile.values()).reduce((sum, data) => sum + data.count, 0)}`);
	console.log(
		`Total de errores fixables: ${Array.from(errorsByFile.values()).reduce((sum, data) => sum + data.fixableCount, 0)}`
	);

	return sortedFiles;
}

// Función principal
function main() {
	const logsDir = path.join(__dirname, '..', 'logs');

	// Buscar el log más reciente de biome-fix
	const logFiles = fs
		.readdirSync(logsDir)
		.filter((file) => file.startsWith('biome-fix_') && file.endsWith('.log'))
		.sort()
		.reverse();

	if (logFiles.length === 0) {
		console.error('No se encontraron logs de biome-fix');
		process.exit(1);
	}

	const latestLog = path.join(logsDir, logFiles[0]);
	console.log(`Analizando: ${logFiles[0]}`);

	const { errorsByFile, errorTypes } = analyzeBiomeLog(latestLog);
	const sortedFiles = displaySummary(errorsByFile, errorTypes);

	// Generar archivo de prioridades
	const priorityFile = path.join(__dirname, '..', 'biome-fix-priorities.json');
	const priorityData = {
		timestamp: new Date().toISOString(),
		logFile: logFiles[0],
		totalFiles: errorsByFile.size,
		totalErrors: Array.from(errorsByFile.values()).reduce((sum, data) => sum + data.count, 0),
		priorities: sortedFiles.map(([file, data], index) => ({
			priority: index + 1,
			file,
			errorCount: data.count,
			fixableCount: data.fixableCount,
			errors: data.errors,
		})),
	};

	fs.writeFileSync(priorityFile, JSON.stringify(priorityData, null, 2));
	console.log('\n✅ Archivo de prioridades generado: biome-fix-priorities.json');
}

// Ejecutar directamente
main();

export { analyzeBiomeLog, displaySummary };
