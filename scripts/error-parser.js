#!/usr/bin/env node

/**
 * Parser inteligente de errores para logs de Biome y TypeScript
 * Genera resúmenes simples y útiles con el formato solicitado
 */

import chalk from 'chalk';
import { readFileSync } from 'node:fs';

// Expresiones regulares globales para mejor rendimiento
// Regex ANSI simplificada para eliminar secuencias de escape
// Regex mínima para secuencias ESC[...m
// Eliminamos secuencias ANSI básicas construyendo regex por partes para evitar control char literal
const ANSI_ESC = '\\u001B[';
const ANSI_REGEX = new RegExp(`${ANSI_ESC}[0-9;]*[A-Za-z]`, 'g');
const FORMAT_REGEX = /\[(?:7|0|9\d)m/g;
const TSC_ERROR_REGEX = /([^:\s]+\.tsx?):\s*(\d+):\s*(\d+)\s*-\s*error\s*(?:TS(\d+))?\s*[:\s]*(.+)/i;
const BIOME_ERROR_REGEX = /([^:\s]+\.[jt]sx?):(\d+):(\d+)\s+(\w+\/[\w/]+)/;
const BIOME_NEXT_LINE_REGEX = /^[^:\s]+\.[jt]sx?:\d+:\d+/;
const CONFIG_ERROR_REGEX = /Failed to resolve.*?from\s+(\w+)/;

/**
 * Estructura para un error parseado
 */
class ParsedError {
	constructor(file, line, column, code, message, tool, severity = 'error') {
		this.file = file;
		this.line = line;
		this.column = column;
		this.code = code;
		this.message = message;
		this.tool = tool;
		this.severity = severity; // 'error' | 'warning'
	}

	toString() {
		return `${this.file}:${this.line}:${this.column} - ${this.code}: ${this.message}`;
	}
}

/**
 * Función auxiliar para limpiar códigos ANSI y otros caracteres de escape
 */
function cleanAnsiCodes(text) {
	try {
		return text.replace(ANSI_REGEX, '').replace(FORMAT_REGEX, '').trim();
	} catch {
		return text.trim();
	}
}

/**
 * Parser para errores de TypeScript (tsc)
 */
export function parseTscErrors(content) {
	const errors = [];
	const lines = content.split('\n');

	for (const line of lines) {
		// Limpiar códigos ANSI primero
		const cleanLine = cleanAnsiCodes(line);

		// Formato típico de TSC: src/file.ts:123:45 - error TS2345: Message
		const tscMatch = cleanLine.match(TSC_ERROR_REGEX);

		if (tscMatch) {
			const [, file, lineNum, column, errorCode, message] = tscMatch;

			if (file && lineNum && message) {
				const sev = 'error';
				errors.push(
					new ParsedError(
						file.trim(),
						lineNum,
						column || '0',
						errorCode ? `TS${errorCode}` : 'TSError',
						cleanAnsiCodes(message).trim(),
						'tsc',
						sev
					)
				);
			}
		}
	}

	return errors;
}

/**
 * Parser para errores de Biome
 */
function deriveBiomeMessage(rule, lines, index) {
	let message = rule;
	const nextLine = lines[index + 1];
	if (nextLine && !nextLine.match(BIOME_NEXT_LINE_REGEX)) {
		message = nextLine.trim() || rule;
	}
	return cleanAnsiCodes(message);
}

function severityFromRule(rule) {
	return rule.includes('/no-') || rule.includes('/no') ? 'error' : 'warning';
}

export function parseBiomeErrors(content) {
	const errors = [];
	const lines = content.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const biomeMatch = line.match(BIOME_ERROR_REGEX);
		if (biomeMatch) {
			const [, file, lineNum, column, rule] = biomeMatch;
			const cleanMessage = deriveBiomeMessage(rule, lines, i);
			errors.push(new ParsedError(file, lineNum, column, rule, cleanMessage, 'biome', severityFromRule(rule)));
		}
		if (line.includes('Failed to resolve') || line.includes('Could not resolve')) {
			const configMatch = line.match(CONFIG_ERROR_REGEX);
			if (configMatch) {
				errors.push(new ParsedError('biome.json', '1', '1', 'ConfigError', cleanAnsiCodes(line), 'biome', 'error'));
			}
		}
	}
	return errors;
}

/**
 * Parser principal que detecta automáticamente el tipo de herramienta
 */
export function parseErrors(content, toolHint = null) {
	const errors = [];
	let detectedTool = toolHint;

	// Si no se especifica herramienta, detectar automáticamente
	if (!detectedTool) {
		if (content.includes('error TS') || content.includes('bunx tsc')) {
			detectedTool = 'tsc';
		} else if (content.includes('lint/') || content.includes('bunx biome')) {
			detectedTool = 'biome';
		}
	}

	switch (detectedTool) {
		case 'tsc': {
			errors.push(...parseTscErrors(content));
			break;
		}
		case 'biome': {
			errors.push(...parseBiomeErrors(content));
			break;
		}
		default: {
			// Intentar ambos parsers
			errors.push(...parseTscErrors(content));
			errors.push(...parseBiomeErrors(content));
			break;
		}
	}

	return errors;
}

/**
 * Genera estadísticas de errores
 */
export function generateErrorStats(errors) {
	const fileErrors = new Map();
	const totalErrors = errors.length;

	// Agrupar errores por archivo
	for (const error of errors) {
		if (!fileErrors.has(error.file)) {
			fileErrors.set(error.file, []);
		}
		fileErrors.get(error.file).push(error);
	}

	const affectedFiles = fileErrors.size;
	const filesWithErrors = Array.from(fileErrors.keys()).sort();

	return {
		totalErrors,
		affectedFiles,
		filesWithErrors,
		fileErrors,
	};
}

/**
 * Genera el resumen general en el formato solicitado:
 * - Resultado general al principio
 * - Lista completa de archivos afectados con líneas
 * - Lista detallada por archivo
 */
export function generateSimpleErrorSummary(errors) {
	const stats = generateErrorStats(errors);

	if (stats.totalErrors === 0) {
		return {
			header: ['✅ No se encontraron errores'],
			fileList: [],
			detailedList: [],
			stats: {
				totalErrors: 0,
				affectedFiles: 0,
				filesWithErrors: [],
				fileErrors: new Map(),
			},
		};
	}

	// Header con totales (resultado general)
	const header = [
		'📊 RESUMEN DE ERRORES',
		`Total de archivos con errores: ${stats.affectedFiles}`,
		`Cantidad total de errores: ${stats.totalErrors}`,
		'',
		'📁 ARCHIVOS AFECTADOS:',
	];

	// Lista de archivos afectados con sus líneas
	const fileList = [];
	for (const [file, fileErrors] of stats.fileErrors) {
		const lines = [...new Set(fileErrors.map((e) => e.line))]
			.sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
			.join(', ');
		fileList.push(`  ${file} (líneas: ${lines})`);
	}

	// Lista detallada por archivo
	const detailedList = ['', '📋 DETALLE POR ARCHIVO:'];
	for (const [file, fileErrors] of stats.fileErrors) {
		detailedList.push('');
		detailedList.push(file);

		// Agrupar errores por línea para evitar duplicados
		const lineErrors = new Map();
		for (const error of fileErrors) {
			const key = `${error.line}:${error.code}`;
			if (!lineErrors.has(key)) {
				lineErrors.set(key, error);
			}
		}

		// Ordenar por número de línea
		const sortedErrors = Array.from(lineErrors.values()).sort(
			(a, b) => Number.parseInt(a.line, 10) - Number.parseInt(b.line, 10)
		);

		for (const error of sortedErrors) {
			detailedList.push(`  - línea ${error.line} : ${error.code}`);
		}
	}

	return {
		header,
		fileList,
		detailedList,
		stats,
	};
}

/**
 * Parsea un archivo de log y genera el resumen simple
 */
export function parseLogFile(filePath, toolHint = null) {
	try {
		const content = readFileSync(filePath, 'utf-8');
		const errors = parseErrors(content, toolHint);
		return generateSimpleErrorSummary(errors);
	} catch (error) {
		console.error(chalk.red(`❌ Error al leer archivo ${filePath}:`, error.message));
		return null;
	}
}

/**
 * Detecta el tipo de herramienta desde el nombre del archivo
 */
export function detectToolFromFileName(fileName) {
	if (fileName.includes('tsc_')) {
		return 'tsc';
	}
	if (fileName.includes('biome_') || fileName.includes('biome-')) {
		return 'biome';
	}
	return null;
}

/**
 * Formatea y muestra el resumen simple
 */
function logHeaderLines(lines) {
	for (const line of lines) {
		if (line.startsWith('✅')) {
			console.log(chalk.green(line));
		} else if (line.startsWith('📊')) {
			console.log(chalk.cyan.bold(line));
		} else if (line.startsWith('📁')) {
			console.log(chalk.yellow.bold(line));
		} else {
			console.log(line);
		}
	}
}

function logFileList(lines) {
	for (const line of lines) {
		console.log(chalk.blue(line));
	}
}

function logDetails(lines) {
	for (const line of lines) {
		if (line.startsWith('📋')) {
			console.log(chalk.yellow.bold(line));
		} else if (line.startsWith('  - línea')) {
			console.log(chalk.red(line));
		} else if (line.trim() && !line.startsWith(' ')) {
			console.log(chalk.cyan.bold(line));
		} else {
			console.log(line);
		}
	}
}

export function displaySimpleErrorSummary(summary) {
	if (!summary) {
		return;
	}
	logHeaderLines(summary.header);
	logFileList(summary.fileList);
	logDetails(summary.detailedList);
}

/**
 * Genera el formato de texto plano para escribir en archivos de log
 */
export function generateLogSummary(summary) {
	if (!summary) {
		return '';
	}

	const lines = [];

	// Header
	lines.push(...summary.header);

	// Lista de archivos
	lines.push(...summary.fileList);

	// Detalle
	lines.push(...summary.detailedList);

	return lines.join('\n');
}

// Si se ejecuta directamente como script de prueba
if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1].endsWith('error-parser-new.js')) {
	const [, , filePath] = process.argv;

	if (!filePath) {
		console.log('Uso: node error-parser-new.js <ruta-al-log>');
		process.exit(1);
	}

	console.log(`🔍 Analizando archivo: ${filePath}`);

	const toolHint = detectToolFromFileName(filePath);
	console.log(`🛠️ Herramienta detectada: ${toolHint || 'desconocida'}`);

	const summary = parseLogFile(filePath, toolHint);

	if (summary) {
		displaySimpleErrorSummary(summary);
	} else {
		console.log('❌ No se pudo generar el resumen');
	}
}
