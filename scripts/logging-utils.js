#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { readdir, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';
import { detectToolFromFileName, displaySimpleErrorSummary, generateLogSummary, parseLogFile } from './error-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const LOGS_DIR = join(ROOT_DIR, 'logs');

// Asegurar que la carpeta de logs existe
if (!existsSync(LOGS_DIR)) {
	mkdirSync(LOGS_DIR, { recursive: true });
}

// Función para ejecutar comando y guardar logs
export function executeWithLogging(command, logFileName, options = {}) {
	const { logFile, errorFile } = buildLogPaths(logFileName);
	announceExecution(command, logFile);
	try {
		const output = runCommand(command, options);
		persistOutput(logFile, command, output);
		postSuccessActions(command, logFile);
		summarizeOutput(output);
		return { success: true, logFile, output };
	} catch (error) {
		handleExecutionError({ command, error, errorFile });
		if (isLintingTool(command) && (error.stdout || error.stderr)) {
			generatePostExecutionSummary(errorFile, command);
		}
		logErrorSummary(error);
		return { success: false, errorFile, error };
	}
}

// --- Helpers extracción ---
function buildLogPaths(logFileName) {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	return {
		logFile: join(LOGS_DIR, `${logFileName}_${timestamp}.log`),
		errorFile: join(LOGS_DIR, `${logFileName}_${timestamp}_error.log`),
	};
}
function announceExecution(command, logFile) {
	console.log(`🚀 Ejecutando: ${command}`);
	console.log(`📄 Logs en: ${logFile}`);
}
function runCommand(command, options) {
	return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
}
function persistOutput(logFile, command, output) {
	writeFileSync(logFile, `Comando: ${command}\nFecha: ${new Date().toISOString()}\n\n${output}`);
}
function postSuccessActions(command, logFile) {
	console.log('✅ Comando ejecutado exitosamente');
	if (isLintingTool(command)) {
		generatePostExecutionSummary(logFile, command);
	}
}
function summarizeOutput(output) {
	if (!output) {
		return;
	}
	const lines = output.split('\n').filter((l) => l.trim());
	if (lines.length === 0) {
		return;
	}
	if (lines.length > 5) {
		console.log('\n📊 Resumen (primeras 5 líneas):');
		for (const line of lines.slice(0, 5)) {
			console.log(`  ${line}`);
		}
		console.log(`  ... y ${lines.length - 5} líneas más`);
	} else {
		console.log('\n📊 Salida completa:');
		for (const line of lines) {
			console.log(`  ${line}`);
		}
	}
}
function handleExecutionError({ command, error, errorFile }) {
	const errorContent = `Comando: ${command}\nFecha: ${new Date().toISOString()}\n\nError:\n${error.message}\n\nSalida stderr:\n${error.stderr || ''}\n\nSalida stdout:\n${error.stdout || ''}`;
	writeFileSync(errorFile, errorContent);
	console.error('❌ Error al ejecutar comando');
	console.error(`📄 Detalles del error en: ${errorFile}`);
}
function logErrorSummary(error) {
	if (!(error.stdout || error.stderr)) {
		return;
	}
	const errorLines = (error.stdout || error.stderr).split('\n').filter((l) => l.trim());
	if (errorLines.length === 0) {
		return;
	}
	console.error('\n📊 Primeros errores encontrados:');
	for (const line of errorLines.slice(0, 3)) {
		console.error(`  ${line}`);
	}
}

// Función para categorizar líneas por tipo
function categorizeByType(line, lowerLine, categories) {
	if (lowerLine.includes('error') || lowerLine.includes('✘')) {
		categories.errors.push(line);
	} else if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
		categories.warnings.push(line);
	} else if (lowerLine.includes('info')) {
		categories.info.push(line);
	}
}

// Función para categorizar líneas por herramienta
function categorizeByTool(line, lowerLine, categories) {
	if (line.includes('.ts') || line.includes('.tsx') || lowerLine.includes('typescript')) {
		categories.typescript.push(line);
	} else if (lowerLine.includes('eslint')) {
		categories.eslint.push(line);
	} else if (lowerLine.includes('oxlint') || lowerLine.includes('oxfmt') || lowerLine.includes('vite+')) {
		categories.oxc.push(line);
	} else if (line.trim()) {
		categories.other.push(line);
	}
}

// Función para parsear logs por categorías
export function parseLogsByCategory(logFile) {
	if (!existsSync(logFile)) {
		console.error(`❌ Archivo de log no encontrado: ${logFile}`);
		return null;
	}

	const content = readFileSync(logFile, 'utf8');
	const categories = {
		errors: [],
		warnings: [],
		info: [],
		typescript: [],
		eslint: [],
		oxc: [],
		other: [],
	};

	const lines = content.split('\n');

	for (const line of lines) {
		const lowerLine = line.toLowerCase();
		categorizeByType(line, lowerLine, categories);
		categorizeByTool(line, lowerLine, categories);
	}

	return categories;
}

// Función para mostrar resumen de logs usando el nuevo parser
export function showLogSummary(logFile) {
	console.log(`\n📄 Analizando: ${logFile}`);

	const toolHint = detectToolFromFileName(logFile);
	const summary = parseLogFile(logFile, toolHint);

	if (summary) {
		displaySimpleErrorSummary(summary);
		return summary.stats;
	}
	console.log('❌ No se pudo analizar el archivo de log');
	return null;
}

// Función para listar logs recientes
export function listRecentLogs(limit = 10) {
	if (!existsSync(LOGS_DIR)) {
		console.log('📄 No hay logs disponibles aún');
		return [];
	}

	const files = readdirSync(LOGS_DIR)
		.filter((f) => f.endsWith('.log'))
		.map((f) => ({
			name: f,
			path: join(LOGS_DIR, f),
			stats: statSync(join(LOGS_DIR, f)),
		}))
		.sort((a, b) => b.stats.mtime - a.stats.mtime)
		.slice(0, limit);

	console.log(`\n📄 Últimos ${limit} logs:`);
	let counter = 1;
	for (const file of files) {
		const isError = file.name.includes('_error');
		const icon = isError ? '❌' : '✅';
		console.log(`  ${counter}. ${icon} ${file.name} (${new Date(file.stats.mtime).toLocaleString()})`);
		counter++;
	}

	return files;
}

// Función para generar resumen automático al finalizar el comando
/**
 * Genera el resumen de errores al final de la ejecución y lo agrega al principio del log
 */
export function generatePostExecutionSummary(logFile, command, exitCode = null) {
	console.log(`\n${'═'.repeat(60)}`);
	console.log('📊 RESUMEN AUTOMÁTICO DE ERRORES');
	console.log('═'.repeat(60));

	const toolHint = detectToolFromFileName(logFile) || detectToolFromCommand(command);
	const summary = parseLogFile(logFile, toolHint);

	if (summary?.stats && summary.stats.totalErrors > 0) {
		// Mostrar el resumen completo en consola
		displaySimpleErrorSummary(summary);

		// Ahora agregar el resumen al principio del archivo de log
		try {
			const originalContent = readFileSync(logFile, 'utf-8');
			const summaryText = generateLogSummary(summary);

			// Crear el nuevo contenido con el resumen al principio
			const newContent = [
				summaryText,
				'',
				'═'.repeat(80),
				'📄 LOG ORIGINAL:',
				'═'.repeat(80),
				'',
				originalContent,
			].join('\n');

			// Escribir el archivo actualizado
			writeFileSync(logFile, newContent);

			console.log(`\n✅ Resumen agregado al principio del archivo: ${logFile}`);
		} catch (error) {
			console.error(`❌ Error al actualizar el archivo de log: ${error.message}`);
		}

		return summary.stats;
	}
	if (exitCode !== null && exitCode !== 0) {
		console.log(`\n❌ El comando finalizó con exit code ${exitCode}; el parser no clasificó detalles adicionales.`);
		return null;
	}
	console.log('\n✅ No se encontraron errores categorizados en el log');
	return null;
}

// Función auxiliar para detectar si es una herramienta de linting/checking
function isLintingTool(command) {
	return (
		command.includes('vp check') ||
		command.includes('vp lint') ||
		command.includes('vp fmt') ||
		command.includes('oxlint') ||
		command.includes('oxfmt') ||
		command.includes('eslint') ||
		command.includes('tsc') ||
		command.includes('prettier')
	);
}

// Función auxiliar para detectar herramienta desde el comando
function detectToolFromCommand(command) {
	if (command.includes('tsc') || command.includes('typescript')) {
		return 'tsc';
	}
	if (command.includes('vp check') || command.includes('vp lint') || command.includes('vp fmt')) {
		return 'vite-plus';
	}
	if (command.includes('oxlint') || command.includes('oxfmt')) {
		return 'oxc';
	}
	if (command.includes('eslint')) {
		return 'eslint';
	}
	return null;
}
export async function cleanOldLogs(days = 7) {
	try {
		const files = await readdir(LOGS_DIR);
		const now = Date.now();

		await Promise.all(
			files.map(async (file) => {
				const filePath = join(LOGS_DIR, file);
				const stats = await stat(filePath);

				// Calcular diferencia en días
				const diffDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

				if (diffDays > days) {
					// Eliminar archivo si es más antiguo que el límite
					await rm(filePath);
					console.log(`🗑️ Log eliminado: ${file} (antiguo ${Math.floor(diffDays)} días)`);
				}
			})
		);
	} catch (error) {
		console.error('❌ Error al limpiar logs antiguos:', error);
	}
}

// Si se ejecuta directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const [, , action, ...args] = process.argv;

	switch (action) {
		case 'list':
			listRecentLogs(args[0] ? Number.parseInt(args[0], 10) : 10);
			break;
		case 'parse':
			if (!args[0]) {
				console.error('❌ Por favor proporciona un archivo de log');
				process.exit(1);
			}
			showLogSummary(args[0]);
			break;
		case 'exec':
			if (!(args[0] && args[1])) {
				console.error('❌ Uso: node logging-utils.js exec <nombre-log> <comando>');
				process.exit(1);
			}
			executeWithLogging(args.slice(1).join(' '), args[0]);
			break;
		case 'clean':
			cleanOldLogs(args[0] ? Number.parseInt(args[0], 10) : 7);
			break;
		default:
			console.log(`
📄 Utilidad de Logging

Uso:
  node scripts/logging-utils.js list [cantidad]      - Listar logs recientes
  node scripts/logging-utils.js parse <archivo>      - Parsear y mostrar resumen de un log
  node scripts/logging-utils.js exec <nombre> <cmd>  - Ejecutar comando con logging
  node scripts/logging-utils.js clean [días]         - Limpiar logs antiguos (más de [días] días)
      `);
	}
}
