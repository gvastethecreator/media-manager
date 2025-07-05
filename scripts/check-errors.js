#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import chalk from 'chalk';
import { join } from 'path';

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

	if (stats.mtime.getTime() < cutoff) return [];

	const content = await readFile(filePath, 'utf-8');
	const lines = content.split('\n');

	const errorRegex = /error|failed|✘|exception/i;
	return lines.filter((line) => errorRegex.test(line) && !line.includes('0 errors'));
}

function displayResults(allErrors, totalErrors) {
	if (totalErrors === 0) {
		console.log(chalk.green('✅ ¡No se encontraron errores!'));
		return;
	}

	console.log(chalk.red(`\n❌ Total de errores encontrados: ${totalErrors}`));

	for (const [toolName, errors] of allErrors.entries()) {
		console.log(chalk.yellow(`\n🔧 ${toolName} (${errors.length} errores):`));
		const uniqueErrors = [...new Set(errors)];
		uniqueErrors.slice(0, 5).forEach((error, i) => {
			console.log(chalk.redBright(`  ${i + 1}: ${error.trim()}`));
		});
		if (uniqueErrors.length > 5) {
			console.log(chalk.dim(`  ... y ${uniqueErrors.length - 5} errores únicos más.`));
		}
	}
}

function showSuggestedCommands(allErrors) {
	console.log(chalk.cyan('\n💡 Comandos sugeridos para corregir:'));
	if (allErrors.has('eslint') || allErrors.has('eslint-fix')) {
		console.log(chalk.yellow('  bun lint:fix'));
	}
	if (allErrors.has('biome') || allErrors.has('biome-check') || allErrors.has('biome-fix')) {
		console.log(chalk.yellow('  bun check:fix'));
	}
	if (allErrors.has('tsc')) {
		console.log(chalk.dim('  # Los errores de TypeScript requieren corrección manual.'));
	}
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
		const allErrors = new Map();
		let totalErrors = 0;

		for (const file of relevantFiles) {
			const fileErrors = await extractErrorsFromFile(file, cutoff);

			if (fileErrors.length > 0) {
				const toolName = file.split('_')[0];
				if (!allErrors.has(toolName)) {
					allErrors.set(toolName, []);
				}
				allErrors.get(toolName).push(...fileErrors);
				totalErrors += fileErrors.length;
			}
		}

		displayResults(allErrors, totalErrors);
		if (totalErrors > 0) {
			showSuggestedCommands(allErrors);
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
