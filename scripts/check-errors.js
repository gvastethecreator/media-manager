#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import chalk from 'chalk';
import { join } from 'path';
import { parseLogFile, detectToolFromFileName, displaySimpleErrorSummary } from './error-parser.js';

const LOGS_DIR = join(process.cwd(), 'logs');
const [, , ...args] = process.argv;

// Parser de argumentos simple
const options = {
	tool: 'all',
	days: 1,
	help: false,
};

for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (arg === '--tool' || arg === '-t') {
		options.tool = args[i + 1] || 'all';
		i++;
	} else if (arg === '--days' || arg === '-d') {
		options.days = Number.parseInt(args[i + 1], 10) || 1;
		i++;
	} else if (arg === '--help' || arg === '-h') {
		options.help = true;
	}
}

function showHelp() {
	console.log(
		chalk.cyan(`
🔍 Revisor de Errores de Logs (Node.js)

${chalk.bold('Uso:')}
  bun scripts/check-errors.js [opciones]

${chalk.bold('Opciones:')}
  ${chalk.green('--tool, -t')} <nombre>   - Filtra por herramienta (eslint, biome, tsc, all). Por defecto: 'all'.
  ${chalk.green('--days, -d')} <días>     - Días hacia atrás para buscar. Por defecto: 1.
  ${chalk.green('--help, -h')}            - Mostrar esta ayuda.

${chalk.bold('Ejemplos:')}
  bun scripts/check-errors.js
  bun scripts/check-errors.js --tool eslint
  bun scripts/check-errors.js -t biome -d 7
`)
	);
}

async function filterRelevantFiles(files, options) {
	const now = new Date();
	const cutoff = now.setDate(now.getDate() - options.days);
	const pattern = options.tool === 'all' ? '.log' : `${options.tool}`;

	const relevantFiles = files.filter((f) => f.includes(pattern));

	if (relevantFiles.length === 0) {
		console.log(chalk.green(`✅ No se encontraron logs para '${options.tool}' en el período especificado.`));
		return null;
	}

	return { relevantFiles, cutoff };
}

async function extractErrorsFromFile(file, cutoff) {
	const filePath = join(LOGS_DIR, file);
	const stats = await stat(filePath);

	if (stats.mtime.getTime() < cutoff) return null;

	// Usar el nuevo parser para obtener un resumen estructurado
	const toolHint = detectToolFromFileName(file);
	const summary = parseLogFile(filePath, toolHint);

	return summary;
}

function displayResults(allSummaries, totalFiles) {
	if (totalFiles === 0) {
		console.log(chalk.green('✅ ¡No se encontraron archivos con errores!'));
		return;
	}

	let totalErrors = 0;
	let totalAffectedFiles = new Set();

	console.log(chalk.cyan.bold('\n📊 RESUMEN CONSOLIDADO DE ERRORES'));
	console.log(chalk.gray('═'.repeat(50)));

	for (const [toolName, summaries] of allSummaries.entries()) {
		let toolErrors = 0;
		let toolFilesSet = new Set();

		console.log(chalk.yellow.bold(`\n🔧 ${toolName.toUpperCase()}:`));

		for (const summary of summaries) {
			if (summary.stats.totalErrors > 0) {
				toolErrors += summary.stats.totalErrors;

				// Agregar archivos al set para evitar duplicados
				for (const file of summary.stats.filesWithErrors) {
					toolFilesSet.add(file);
					totalAffectedFiles.add(file);
				}
			}
		}

		if (toolErrors > 0) {
			console.log(chalk.red(`  ❌ Errores: ${toolErrors}`));
			console.log(chalk.blue(`  📁 Archivos únicos: ${toolFilesSet.size}`));

			// Mostrar archivos únicos ordenados por número de errores
			const fileErrorCounts = new Map();
			for (const summary of summaries) {
				for (const [file, errors] of summary.stats.fileErrors) {
					fileErrorCounts.set(file, (fileErrorCounts.get(file) || 0) + errors.length);
				}
			}

			const sortedFiles = Array.from(fileErrorCounts.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 3);

			for (const [file, errorCount] of sortedFiles) {
				console.log(chalk.cyan(`    ${file} (${errorCount} errores)`));
			}

			if (toolFilesSet.size > 3) {
				console.log(chalk.dim(`    ... y ${toolFilesSet.size - 3} archivos más`));
			}
		}

		totalErrors += toolErrors;

		if (toolErrors === 0) {
			console.log(chalk.green('  ✅ Sin errores'));
		}
	}

	console.log(chalk.gray('═'.repeat(50)));
	console.log(chalk.red.bold(`📊 TOTAL GENERAL:`));
	console.log(chalk.red(`  ❌ Total de errores: ${totalErrors}`));
	console.log(chalk.blue(`  📁 Total de archivos únicos afectados: ${totalAffectedFiles.size}`));
}

function showSuggestedCommands(allSummaries) {
	console.log(chalk.cyan('\n💡 Comandos sugeridos para corregir:'));

	if (allSummaries.has('eslint') || allSummaries.has('eslint-fix')) {
		console.log(chalk.yellow('  bun lint:fix'));
	}
	if (allSummaries.has('biome') || allSummaries.has('biome-check') || allSummaries.has('biome-fix')) {
		console.log(chalk.yellow('  bun biome:fix'));
	}
	if (allSummaries.has('tsc')) {
		console.log(chalk.dim('  # Los errores de TypeScript requieren corrección manual.'));
	}

	console.log(chalk.gray('\n📋 Para ver detalles completos de un log específico:'));
	console.log(chalk.dim('  bun scripts/error-parser.js <ruta-del-log>'));
}

async function checkErrors() {
	if (options.help) {
		showHelp();
		return;
	}

	console.log(
		chalk.cyan(`🔍 Analizando logs de ${chalk.bold(options.tool)} de los últimos ${chalk.bold(options.days)} día(s)...`)
	);

	try {
		const files = await readdir(LOGS_DIR);
		const fileData = await filterRelevantFiles(files, options);

		if (!fileData) return;

		const { relevantFiles, cutoff } = fileData;
		const allSummaries = new Map();
		let totalFilesWithErrors = 0;

		for (const file of relevantFiles) {
			const summary = await extractErrorsFromFile(file, cutoff);

			if (summary && summary.stats.totalErrors > 0) {
				const toolName = file.split('_')[0];
				if (!allSummaries.has(toolName)) {
					allSummaries.set(toolName, []);
				}
				allSummaries.get(toolName).push(summary);
				totalFilesWithErrors++;
			}
		}

		displayResults(allSummaries, totalFilesWithErrors);
		if (totalFilesWithErrors > 0) {
			showSuggestedCommands(allSummaries);
		}
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log(chalk.yellow('📄 No hay logs para analizar.'));
		} else {
			console.error(chalk.red('❌ Error al revisar logs:'), error);
		}
	}
}

checkErrors().catch(console.error);
