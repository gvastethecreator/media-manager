#!/usr/bin/env bun

import chalk from 'chalk';
import { spawn } from 'child_process';
import { copyFileSync, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { cleanOldLogs, generatePostExecutionSummary } from './logging-utils.js';

// Regex extraídos a nivel superior (performance + lint)
const RE_CANNOT_FIND_MODULE = /Cannot find module/;
const RE_CRITICAL_ERRORS = /ENOENT|spawn.*failed|permission denied|command not found|out of memory/i;
const RE_DEP_ERRORS = /MODULE_NOT_FOUND|Error: Cannot resolve module|bun.*ERR/i;

function resolveCommandTypeLower(isLint, isTest) {
	if (isLint) {
		return 'linting';
	}
	if (isTest) {
		return 'testing';
	}
	return 'tolerante';
}

function resolveCommandTypeHeader(isLint, isTest) {
	if (isLint) {
		return 'Linting';
	}
	if (isTest) {
		return 'Testing';
	}
	return 'Normal';
}

const [, , logName, ...commandArgs] = process.argv;

if (!logName || commandArgs.length === 0) {
	console.error('Uso: bun scripts/run-with-log.js <nombre-log> <comando-completo>');
	console.error('');
	console.error('🚀 Script Universal de Logging con Tolerancia Inteligente');
	console.error('');
	console.error('Detección automática de tipos de comando:');
	console.error('  📏 Linting: oxlint, oxfmt, vp check/lint/fmt, eslint, prettier');
	console.error('  🧪 Testing: playwright');
	console.error('  📝 TypeScript: tsc --noEmit');
	console.error('  🏗️  Build: otros comandos (modo estricto)');
	console.error('');
	console.error('Los comandos de linting/testing toleran exit code 1 (issues encontrados)');
	console.error('Los comandos de build requieren exit code 0 (éxito completo)');
	process.exit(1);
}

// Unir todos los argumentos en un comando completo
const fullCommand = commandArgs.join(' ');

// Comandos que pueden devolver exit code 1 pero no son errores críticos
const LINTING_COMMANDS = ['vp check', 'vp lint', 'vp fmt', 'oxlint', 'oxfmt', 'eslint', 'prettier'];

// Comandos de testing que pueden fallar con tests fallidos (no errores críticos)
const TESTING_COMMANDS = ['playwright', 'test'];

const isLintingCommand = LINTING_COMMANDS.some((cmd) => fullCommand.includes(cmd));
const isTestingCommand = TESTING_COMMANDS.some((cmd) => fullCommand.includes(cmd));
const isTolerantCommand = isLintingCommand || isTestingCommand;

const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
	mkdirSync(logsDir, { recursive: true });
}

try {
	await cleanOldLogs();
} catch (error) {
	console.warn(
		chalk.yellow(`⚠️  No se pudieron rotar logs antiguos: ${error instanceof Error ? error.message : String(error)}`)
	);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFileName = `${logName}_${timestamp}.log`;
const logFilePath = join(logsDir, logFileName);

console.log(chalk.cyan(`🚀 Ejecutando: ${chalk.bold(fullCommand)}`));
console.log(chalk.gray(`📄 Logs en: ${logFilePath}`));
if (isTolerantCommand) {
	const tipo = resolveCommandTypeLower(isLintingCommand, isTestingCommand);
	console.log(chalk.blue(`🔍 Comando de ${tipo} detectado - tolerando códigos de salida no-cero`));
}
console.log(chalk.yellow('📺 Salida en tiempo real:'));
console.log(chalk.gray('═'.repeat(50)));

const logStream = createWriteStream(logFilePath);
const logHeader = [
	`Comando: ${fullCommand}`,
	`Fecha: ${new Date().toISOString()}`,
	`Directorio: ${process.cwd()}`,
	`Modo tolerante: ${isTolerantCommand ? 'SÍ' : 'NO'}`,
	`Tipo: ${resolveCommandTypeHeader(isLintingCommand, isTestingCommand)}`,
	'===============================================',
	'',
].join('\n');

logStream.write(logHeader);

// Ejecutar el comando completo a través del shell
const isWindows = process.platform === 'win32';

const child = spawn(isWindows ? 'cmd.exe' : 'sh', isWindows ? ['/c', fullCommand] : ['-c', fullCommand], {
	stdio: ['inherit', 'pipe', 'pipe'],
});

let missingDep = false;
let hasRealErrors = false;

// Función para determinar el color y emoji según el tipo de línea
function isSuccessLine(line) {
	return line.includes('✓') || line.includes('success') || line.includes('Fixed');
}
function isWarningLine(line) {
	return line.includes('warning') || line.includes('warn');
}
function isToolInfo(line) {
	return line.includes('lint/') || line.includes('test ') || line.includes('spec ');
}
function isErrorToken(line) {
	return line.includes('error') || line.includes('✘') || line.includes('failed');
}
function getLineStyle(line, isError) {
	if (isSuccessLine(line)) {
		return { color: chalk.green, emoji: '✅' };
	}
	if (isWarningLine(line)) {
		return { color: chalk.yellow, emoji: '⚠️ ' };
	}
	if (isToolInfo(line)) {
		return { color: chalk.cyan, emoji: '🔍' };
	}
	if (isErrorToken(line)) {
		const treatAsError = hasRealErrors || !isTolerantCommand;
		return treatAsError ? { color: chalk.red, emoji: '❌' } : { color: chalk.cyan, emoji: '🔍' };
	}
	if (isError) {
		if (hasRealErrors) {
			return { color: chalk.redBright, emoji: '🔴' };
		}
		if (isTolerantCommand) {
			return { color: chalk.cyan, emoji: '🔍' };
		}
	}
	return { color: chalk.white, emoji: '📋' };
}

// Función para procesar y mostrar la salida con colores
function processOutput(data, isError = false) {
	const text = data.toString();
	const lines = text.split('\n').filter((line) => line.trim());

	if (RE_CANNOT_FIND_MODULE.test(text)) {
		missingDep = true;
		hasRealErrors = true;
	}

	if (RE_CRITICAL_ERRORS.test(text)) {
		hasRealErrors = true;
	}

	if (RE_DEP_ERRORS.test(text)) {
		hasRealErrors = true;
	}

	for (const line of lines) {
		const { color, emoji } = getLineStyle(line, isError, hasRealErrors, isTolerantCommand);
		console.log(color(`${emoji} ${line}`));
	}
}

// Capturar y mostrar stdout
child.stdout.on('data', (data) => {
	logStream.write(data);
	processOutput(data, false);
});

// Capturar y mostrar stderr
child.stderr.on('data', (data) => {
	logStream.write(data);
	processOutput(data, true);
});

child.on('error', (error) => {
	const errorMsg = `❌ Error al iniciar el proceso: ${error.message}`;
	console.error(chalk.red.bold(errorMsg));
	logStream.write(`\n--- ERROR DE SPAWN ---\n${error.stack}`);
	process.exit(1);
});

function logTolerantOutcome(exitCode) {
	const tipo = resolveCommandTypeHeader(isLintingCommand, isTestingCommand);
	console.log(chalk.yellow.bold(`⚠️  ${tipo} completado con issues encontrados (Exit code: ${exitCode})`));
	console.log(chalk.cyan(`🔍 Esto es normal para herramientas de ${tipo.toLowerCase()} cuando encuentran problemas`));
	generatePostExecutionSummary(logFilePath, fullCommand);
	console.log(chalk.gray(`📄 Log completo guardado en: ${logFilePath}`));
	console.log(chalk.green('✅ Script completado exitosamente'));
	process.exit(0);
}

child.on('close', (code) => {
	logStream.end();

	console.log(chalk.gray('═'.repeat(50)));

	if (code === 0) {
		console.log(chalk.green.bold('✅ Comando ejecutado exitosamente'));

		// Generar resumen automático de errores si es una herramienta de linting/checking
		if (isLintingCommand || isTestingCommand) {
			generatePostExecutionSummary(logFilePath, fullCommand);
		}

		console.log(chalk.gray(`📄 Log completo guardado en: ${logFilePath}`));
	} else if (isTolerantCommand && !hasRealErrors) {
		logTolerantOutcome(code);
	} else {
		console.error(chalk.red.bold(`❌ Error al ejecutar comando (Exit code: ${code})`));
		const errorFilePath = logFilePath.replace('.log', '_error.log');
		try {
			copyFileSync(logFilePath, errorFilePath);
			console.log(chalk.yellow(`📄 Detalles del error en: ${chalk.underline(errorFilePath)}`));

			// Generar resumen automático de errores incluso en caso de error
			if (isLintingCommand || isTestingCommand) {
				generatePostExecutionSummary(errorFilePath, fullCommand);
			}
		} catch (copyError) {
			console.error(chalk.red.bold(`Error al copiar el archivo de log: ${copyError.message}`));
		}
		if (missingDep) {
			console.log(chalk.yellow('🛈 Parece que faltan dependencias. Ejecuta "bun install" e intenta de nuevo.'));
		}
		process.exit(code);
	}
});
