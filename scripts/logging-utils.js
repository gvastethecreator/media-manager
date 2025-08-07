#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { readdir, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';

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
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const logFile = join(LOGS_DIR, `${logFileName}_${timestamp}.log`);
	const errorFile = join(LOGS_DIR, `${logFileName}_${timestamp}_error.log`);

	console.log(`🚀 Ejecutando: ${command}`);
	console.log(`📄 Logs en: ${logFile}`);

	try {
		// Ejecutar comando y capturar salida
		const output = execSync(command, {
			encoding: 'utf8',
			stdio: 'pipe',
			...options,
		});

		// Guardar logs exitosos
		writeFileSync(logFile, `Comando: ${command}\nFecha: ${new Date().toISOString()}\n\n${output}`);

		// Mostrar resumen en consola
		console.log('✅ Comando ejecutado exitosamente');

		// Si hay salida, mostrar primeras líneas
		if (output) {
			const lines = output.split('\n').filter((l) => l.trim());
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

		return { success: true, logFile, output };
	} catch (error) {
		// Guardar logs de error
		const errorContent = `Comando: ${command}\nFecha: ${new Date().toISOString()}\n\nError:\n${error.message}\n\nSalida stderr:\n${error.stderr || ''}\n\nSalida stdout:\n${error.stdout || ''}`;
		writeFileSync(errorFile, errorContent);

		console.error('❌ Error al ejecutar comando');
		console.error(`📄 Detalles del error en: ${errorFile}`);

		// Mostrar resumen del error
		if (error.stdout || error.stderr) {
			const errorLines = (error.stdout || error.stderr).split('\n').filter((l) => l.trim());
			if (errorLines.length > 0) {
				console.error('\n📊 Primeros errores encontrados:');
				for (const line of errorLines.slice(0, 3)) {
					console.error(`  ${line}`);
				}
			}
		}

		return { success: false, errorFile, error };
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
	} else if (lowerLine.includes('biome')) {
		categories.biome.push(line);
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
		biome: [],
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

// Función para mostrar resumen de logs
export function showLogSummary(logFile) {
	const categories = parseLogsByCategory(logFile);
	if (!categories) return;

	console.log('\n📊 Resumen del log:');
	console.log(`  ❌ Errores: ${categories.errors.length}`);
	console.log(`  ⚠️  Warnings: ${categories.warnings.length}`);
	console.log(`  ℹ️  Info: ${categories.info.length}`);

	if (categories.errors.length > 0) {
		console.log('\n❌ Primeros errores:');
		for (const error of categories.errors.slice(0, 3)) {
			console.log(`  ${error.trim()}`);
		}
	}

	if (categories.warnings.length > 0) {
		console.log('\n⚠️  Primeros warnings:');
		for (const warning of categories.warnings.slice(0, 3)) {
			console.log(`  ${warning.trim()}`);
		}
	}
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
	for (const file of files) {
		const isError = file.name.includes('_error');
		const icon = isError ? '❌' : '✅';
		console.log(`  ${index + 1}. ${icon} ${file.name} (${new Date(file.stats.mtime).toLocaleString()})`);
	}

	return files;
}

// Función para limpiar logs antiguos
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
			listRecentLogs(args[0] ? Number.parseInt(args[0]) : 10);
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
			cleanOldLogs(args[0] ? Number.parseInt(args[0]) : 7);
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
