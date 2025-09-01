/**
 * Script para limpiar y consolidar logs duplicados
 *
 * Este script:
 * 1. Limpia logs antiguos (más de X días)
 * 2. Analiza logs duplicados en el log actual
 * 3. Optimiza el tamaño de logs
 */

import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const MAX_LOG_AGE_DAYS = 7; // Mantener logs por 7 días
const MAX_LOG_SIZE_MB = 50; // Rotar logs que excedan 50MB

/**
 * Limpia logs antiguos
 */
function cleanOldLogs() {
	console.log('🧹 Limpiando logs antiguos...');

	if (!fs.existsSync(LOGS_DIR)) {
		console.log('📁 Directorio de logs no existe');
		return;
	}

	const files = fs.readdirSync(LOGS_DIR);
	const now = new Date();
	let cleanedCount = 0;

	for (const file of files) {
		if (!file.endsWith('.log')) continue;

		const filePath = path.join(LOGS_DIR, file);
		const stats = fs.statSync(filePath);
		const ageInDays = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

		if (ageInDays > MAX_LOG_AGE_DAYS) {
			console.log(`🗑️  Eliminando log antiguo: ${file} (${Math.floor(ageInDays)} días)`);
			fs.unlinkSync(filePath);
			cleanedCount++;
		}
	}

	console.log(`✅ ${cleanedCount} logs antiguos eliminados`);
}

/**
 * Analiza duplicación en logs actuales
 */
function analyzeLogDuplication() {
	console.log('🔍 Analizando duplicación en logs...');

	const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith('.log'));

	for (const file of files.slice(0, 3)) {
		// Solo los 3 más recientes
		console.log(`\n📄 Analizando: ${file}`);

		const filePath = path.join(LOGS_DIR, file);
		const content = fs.readFileSync(filePath, 'utf8');
		const lines = content.split('\n').filter((line) => line.trim());

		// Contar líneas duplicadas
		const lineCount = new Map();
		for (const line of lines) {
			// Extraer el mensaje sin timestamp para detectar duplicados
			const messageOnly = line.replace(/^\[.*?\] \[.*?\] /, '');
			lineCount.set(messageOnly, (lineCount.get(messageOnly) || 0) + 1);
		}

		// Encontrar duplicados
		const duplicates = Array.from(lineCount.entries())
			.filter(([_, count]) => count > 1)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);

		if (duplicates.length > 0) {
			console.log('   🔄 Mensajes duplicados encontrados:');
			for (const [message, count] of duplicates) {
				const truncated = message.length > 60 ? `${message.substring(0, 60)}...` : message;
				console.log(`      ${count}x: ${truncated}`);
			}
		} else {
			console.log('   ✅ No se encontraron duplicados significativos');
		}

		// Estadísticas del archivo
		const fileSizeMB = fs.statSync(filePath).size / (1024 * 1024);
		console.log(`   📊 Tamaño: ${fileSizeMB.toFixed(2)}MB, Líneas: ${lines.length}`);

		if (fileSizeMB > MAX_LOG_SIZE_MB) {
			console.log(`   ⚠️  Archivo excede ${MAX_LOG_SIZE_MB}MB, considerar rotación`);
		}
	}
}

/**
 * Genera estadísticas de logging
 */
function generateLogStats() {
	console.log('\n📊 Generando estadísticas de logging...');

	const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith('.log'));
	let totalSize = 0;
	let totalLines = 0;

	const stats = {
		files: files.length,
		totalSizeMB: 0,
		totalLines: 0,
		avgLinesPerFile: 0,
		byLogLevel: {
			INFO: 0,
			WARN: 0,
			ERROR: 0,
			DEBUG: 0,
		},
	};

	for (const file of files) {
		const filePath = path.join(LOGS_DIR, file);
		const size = fs.statSync(filePath).size;
		totalSize += size;

		if (size < 10 * 1024 * 1024) {
			// Solo procesar archivos menores a 10MB
			const content = fs.readFileSync(filePath, 'utf8');
			const lines = content.split('\n').filter((line) => line.trim());
			totalLines += lines.length;

			// Contar por nivel
			for (const line of lines) {
				if (line.includes('[INFO]')) stats.byLogLevel.INFO++;
				else if (line.includes('[WARN]')) stats.byLogLevel.WARN++;
				else if (line.includes('[ERROR]')) stats.byLogLevel.ERROR++;
				else if (line.includes('[DEBUG]')) stats.byLogLevel.DEBUG++;
			}
		}
	}

	stats.totalSizeMB = totalSize / (1024 * 1024);
	stats.totalLines = totalLines;
	stats.avgLinesPerFile = Math.round(totalLines / files.length);

	console.log('┌─────────────────────────────────┐');
	console.log('│       ESTADÍSTICAS DE LOGS      │');
	console.log('├─────────────────────────────────┤');
	console.log(`│ Archivos: ${stats.files.toString().padStart(19)} │`);
	console.log(`│ Tamaño total: ${stats.totalSizeMB.toFixed(2).padStart(13)} MB │`);
	console.log(`│ Líneas totales: ${stats.totalLines.toString().padStart(11)} │`);
	console.log(`│ Promedio/archivo: ${stats.avgLinesPerFile.toString().padStart(9)} │`);
	console.log('├─────────────────────────────────┤');
	console.log('│        POR NIVEL                │');
	console.log(`│ INFO: ${stats.byLogLevel.INFO.toString().padStart(21)} │`);
	console.log(`│ WARN: ${stats.byLogLevel.WARN.toString().padStart(21)} │`);
	console.log(`│ ERROR: ${stats.byLogLevel.ERROR.toString().padStart(20)} │`);
	console.log(`│ DEBUG: ${stats.byLogLevel.DEBUG.toString().padStart(20)} │`);
	console.log('└─────────────────────────────────┘');
}

/**
 * Función principal
 */
async function main() {
	console.log('🔧 Iniciando limpieza y análisis de logs...\n');

	try {
		cleanOldLogs();
		analyzeLogDuplication();
		generateLogStats();

		console.log('\n✅ Análisis completado');
	} catch (error) {
		console.error('❌ Error durante el análisis:', error.message);
		process.exit(1);
	}
}

// Ejecutar
main();
