/**
 * Generador de reportes para el análisis del proyecto
 * @module report-generator
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.mjs';
import { generateCodeAnalysisReport } from './reports/code-report.mjs';
import { generateDependenciesReport } from './reports/dependencies-report.mjs';
import { generateImportsReport } from './reports/imports-report.mjs';
import { generateLintingReport } from './reports/linting-report.mjs';
import { generatePerformanceReport } from './reports/performance-report.mjs';
import { generateStructureReport } from './reports/structure-report.mjs';
import { ensureDirectoryExists, writeFile } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verifica si un objeto de resultados es válido para generar un reporte
 * @param {Object} results - Resultados del análisis
 * @returns {boolean} True si los resultados son válidos
 */
function isValidResults(results) {
	return results && typeof results === 'object' && Object.keys(results).length > 0;
}

/**
 * Genera reportes basados en los resultados del análisis
 * @param {Object} analysisResults - Resultados del análisis
 * @param {string} timestamp - Timestamp para los nombres de archivo
 * @returns {Promise<void>}
 */
export async function generateReports(analysisResults, timestamp) {
	try {
		// Verificar que los resultados sean válidos
		if (!analysisResults || typeof analysisResults !== 'object') {
			throw new Error('Los resultados del análisis no son válidos');
		}

		// Crear directorios si no existen
		await ensureDirectoryExists(CONFIG.outputDir);
		await ensureDirectoryExists(CONFIG.docsDir);

		// Generar reportes individuales
		const reports = [];

		// Reporte de estructura
		if (isValidResults(analysisResults.structure)) {
			const structureReport = await generateStructureReport(analysisResults.structure);
			if (structureReport) {
				reports.push({
					name: 'estructura-proyecto',
					content: structureReport,
				});
			}
		}

		// Reporte de dependencias
		if (isValidResults(analysisResults.dependencies)) {
			const dependenciesReport = await generateDependenciesReport(analysisResults.dependencies);
			if (dependenciesReport) {
				reports.push({
					name: 'dependencias',
					content: dependenciesReport,
				});
			}
		}

		// Reporte de imports
		if (isValidResults(analysisResults.imports)) {
			const importsReport = await generateImportsReport(analysisResults.imports);
			if (importsReport) {
				reports.push({
					name: 'imports',
					content: importsReport,
				});
			}
		}

		// Reporte de linting
		if (isValidResults(analysisResults.linting)) {
			const lintingReport = await generateLintingReport(analysisResults.linting);
			if (lintingReport) {
				reports.push({
					name: 'linting',
					content: lintingReport,
				});
			}
		}

		// Reporte de rendimiento
		if (isValidResults(analysisResults.performance)) {
			const performanceReport = await generatePerformanceReport(analysisResults.performance);
			if (performanceReport) {
				reports.push({
					name: 'rendimiento',
					content: performanceReport,
				});
			}
		}

		// Reporte de código
		if (isValidResults(analysisResults.code)) {
			const codeReport = await generateCodeAnalysisReport(analysisResults.code);
			if (codeReport) {
				reports.push({
					name: 'analisis-codigo',
					content: codeReport,
				});
			}
		}

		// Verificar si se generó algún reporte
		if (reports.length === 0) {
			console.warn('No se generaron reportes debido a que no hay resultados válidos');
			return;
		}

		// Escribir reportes
		for (const report of reports) {
			const filePath = path.join(CONFIG.outputDir, `${report.name}-${timestamp}.md`);
			await writeFile(filePath, report.content);
			console.log(`✅ Reporte generado: ${filePath}`);
		}

		// Generar índice
		const indexContent = generateIndexContent(reports, timestamp);
		await writeFile(path.join(CONFIG.docsDir, 'README.md'), indexContent);
		console.log(`✅ Índice de reportes generado`);
	} catch (error) {
		console.error('❌ Error al generar reportes:', error);
		throw error;
	}
}

/**
 * Genera el contenido del índice de reportes
 * @param {Array} reports - Lista de reportes generados
 * @param {string} timestamp - Timestamp de la generación
 * @returns {string} Contenido del índice en formato Markdown
 */
function generateIndexContent(reports, timestamp) {
	const date = new Date().toLocaleString('es-ES', {
		timeZone: 'Europe/Madrid',
		dateStyle: 'full',
		timeStyle: 'long',
	});

	return `# 📊 Reportes de Análisis del Proyecto
> Generado automáticamente el ${date}

## 📑 Índice de Reportes
${reports.map((report) => `- [${report.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}](./${report.name}-${timestamp}.md)`).join('\n')}

## 🔍 Resumen
Este directorio contiene reportes automáticos generados para analizar diferentes aspectos del proyecto.
Los reportes se actualizan cada vez que se ejecuta el script de análisis.

## 🚀 Cómo Actualizar
Para actualizar estos reportes, ejecuta:
\`\`\`bash
npm run analyze
\`\`\`

> _Última actualización: ${date}_
`;
}

export default {
	generateReports,
};
