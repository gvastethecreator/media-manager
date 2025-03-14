#!/usr/bin/env node

/**
 * Script principal para analizar el proyecto
 * @module analyze
 */

import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeCode } from './analyzers/code-analyzer.mjs';
import { analyzeDependencies } from './analyzers/dependencies-analyzer.mjs';
import { analyzeDevelopment } from './analyzers/development-analyzer.mjs';
import { analyzeImports } from './analyzers/imports-analyzer.mjs';
import { analyzeLinting } from './analyzers/linting-analyzer.mjs';
import { analyzePerformance } from './analyzers/performance-analyzer.mjs';
import { analyzeStructure } from './analyzers/structure-analyzer.mjs';
import { CONFIG } from './config.mjs';
import { generateReports } from './report-generator.mjs';
import { ensureDir, getTimestamp } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analiza el proyecto y genera reportes
 * @returns {Promise<void>}
 */
async function runAnalysis() {
	try {
		console.log(chalk.blue('🔍 Iniciando análisis del proyecto...'));

		// Obtener argumentos de línea de comandos
		const args = process.argv.slice(2);
		const onlyFlag = args.find((arg) => arg.startsWith('--only='));
		const onlyValue = onlyFlag ? onlyFlag.split('=')[1] : null;

		// Asegurar que existen los directorios necesarios
		console.log(chalk.blue('📁 Verificando directorios...'));

		// Crear directorios necesarios
		const dirsToCreate = [
			CONFIG.outputDir,
			CONFIG.docsDir,
			CONFIG.srcDir,
			path.join(CONFIG.srcDir, 'app'),
			path.join(CONFIG.srcDir, 'components'),
			path.join(CONFIG.srcDir, 'lib'),
		];

		for (const dir of dirsToCreate) {
			await ensureDir(dir);
			console.log(chalk.green(`✅ Directorio verificado: ${dir}`));
		}

		// Resultados del análisis
		const analysisResults = {};
		const timestamp = getTimestamp();

		// Ejecutar analizadores según los argumentos
		const analyzers = {
			structure: { fn: analyzeStructure, msg: '📂 Analizando estructura del proyecto...' },
			dependencies: { fn: analyzeDependencies, msg: '📦 Analizando dependencias...' },
			imports: { fn: analyzeImports, msg: '🔄 Analizando imports...' },
			linting: { fn: analyzeLinting, msg: '🧹 Analizando linting...' },
			performance: { fn: analyzePerformance, msg: '🚀 Analizando rendimiento...' },
			code: { fn: analyzeCode, msg: '📊 Analizando código...' },
			development: { fn: analyzeDevelopment, msg: '👨‍💻 Analizando entorno de desarrollo...' },
		};

		for (const [key, analyzer] of Object.entries(analyzers)) {
			if (!onlyValue || onlyValue === key) {
				console.log(chalk.blue(analyzer.msg));
				try {
					analysisResults[key] = await analyzer.fn();
				} catch (error) {
					console.error(chalk.red(`❌ Error en ${key}:`), error);
					analysisResults[key] = null;
				}
			}
		}

		// Generar reportes
		await generateReports(analysisResults, timestamp);

		console.log(chalk.green('✅ Análisis completado con éxito!'));
		console.log(chalk.blue(`📝 Los reportes se han generado en:`));
		console.log(chalk.blue(`   - Reportes detallados: ${CONFIG.outputDir}`));
		console.log(chalk.blue(`   - Documentación: ${CONFIG.docsDir}`));
	} catch (error) {
		console.error(chalk.red('❌ Error durante el análisis:'), error);
		process.exit(1);
	}
}

/**
 * Genera recomendaciones de próximos pasos basadas en los resultados
 * @param {Object} performance - Resultados de rendimiento
 * @param {Object} code - Resultados de código
 * @param {Object} dependencies - Resultados de dependencias
 * @returns {string} Lista de próximos pasos
 */
function generateNextSteps(performance, code, dependencies) {
	const steps = [];

	// Priorizar problemas críticos
	if (performance.optimizationScores.overallScore < 70) {
		steps.push('Optimizar el rendimiento de la aplicación, enfocándose en el tamaño del bundle y el tiempo de carga');
	}

	if (dependencies.vulnerabilities > 0) {
		steps.push('Actualizar dependencias con vulnerabilidades conocidas');
	}

	if (code.overallScore < 70) {
		steps.push('Mejorar la calidad del código, reduciendo la complejidad y aumentando la cobertura de pruebas');
	}

	// Agregar recomendaciones generales si no hay problemas críticos
	if (steps.length === 0) {
		steps.push('Mantener el monitoreo regular del rendimiento y la calidad del código');
	}

	return steps.join('\n2. ');
}

// Ejecutar el análisis si se llama directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	runAnalysis();
}

export default {
	runAnalysis,
};
