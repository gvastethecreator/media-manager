/**
 * Analizador de rendimiento
 * @module performance-analyzer
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config.mjs';
import { getAllFiles } from '../utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analiza el rendimiento del proyecto
 * @returns {Promise<Object>} Resultados del análisis
 */
export async function analyzePerformance() {
	try {
		const projectRoot = path.resolve(__dirname, '../../../');
		const srcDir = CONFIG.srcDir;

		// Estructura base del resultado
		const performanceResults = {
			bundleAnalysis: {
				totalSize: 0,
				unusedCode: 0,
				deferredScripts: 0,
				asyncScripts: 0,
				chunks: [],
			},
			renderMetrics: {
				estimatedFCP: 0,
				estimatedTTI: 0,
				estimatedTBT: 0,
				layoutShifts: 0,
			},
			resourceMetrics: {
				jsCount: 0,
				cssCount: 0,
				imageCount: 0,
				fontCount: 0,
				totalResourceSize: 0,
			},
			optimizationScores: {
				bundleOptimization: 0,
				resourceOptimization: 0,
				renderOptimization: 0,
				overallScore: 0,
			},
			nextjsSpecific: {
				serverComponents: false,
				imageOptimization: false,
				fontOptimization: false,
				staticGeneration: false,
				incrementalStaticRegeneration: false,
			},
		};

		// Obtener todos los archivos
		const allFiles = await getAllFiles(srcDir);

		// Analizar archivos JavaScript/TypeScript
		const jsFiles = allFiles.filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));
		let totalJsSize = 0;

		for (const file of jsFiles) {
			const content = await fs.readFile(file, 'utf-8');
			const size = Buffer.byteLength(content, 'utf-8');
			totalJsSize += size;

			// Detectar scripts diferidos/asíncronos
			if (content.includes('React.lazy') || content.includes('import(')) {
				performanceResults.bundleAnalysis.deferredScripts++;
			}
			if (content.includes('async function') || content.includes('async ()')) {
				performanceResults.bundleAnalysis.asyncScripts++;
			}

			// Detectar Server Components
			if (content.includes('use server') || content.includes('use client')) {
				performanceResults.nextjsSpecific.serverComponents = true;
			}
		}

		// Actualizar métricas de recursos
		performanceResults.bundleAnalysis.totalSize = totalJsSize;
		performanceResults.resourceMetrics.jsCount = jsFiles.length;
		performanceResults.resourceMetrics.totalResourceSize = totalJsSize;

		// Analizar archivos CSS
		const cssFiles = allFiles.filter((file) => /\.css$/.test(file));
		let totalCssSize = 0;

		for (const file of cssFiles) {
			const content = await fs.readFile(file, 'utf-8');
			totalCssSize += Buffer.byteLength(content, 'utf-8');
		}

		performanceResults.resourceMetrics.cssCount = cssFiles.length;
		performanceResults.resourceMetrics.totalResourceSize += totalCssSize;

		// Detectar optimizaciones de Next.js
		const nextConfigPath = path.join(projectRoot, 'next.config.js');
		try {
			const nextConfigContent = await fs.readFile(nextConfigPath, 'utf-8');
			performanceResults.nextjsSpecific.imageOptimization = nextConfigContent.includes('images');
			performanceResults.nextjsSpecific.fontOptimization = nextConfigContent.includes('optimizeFonts');
		} catch (error) {
			// Config file not found
		}

		// Calcular puntuaciones de optimización
		const bundleScore = calculateBundleScore(performanceResults.bundleAnalysis);
		const resourceScore = calculateResourceScore(performanceResults.resourceMetrics);
		const renderScore = 70; // Valor por defecto, se necesitaría análisis en tiempo real

		performanceResults.optimizationScores = {
			bundleOptimization: bundleScore,
			resourceOptimization: resourceScore,
			renderOptimization: renderScore,
			overallScore: Math.round((bundleScore + resourceScore + renderScore) / 3),
		};

		return performanceResults;
	} catch (error) {
		console.error('Error al analizar el rendimiento:', error);
		// Devolver estructura base con valores por defecto
		return {
			bundleAnalysis: {
				totalSize: 0,
				unusedCode: 0,
				deferredScripts: 0,
				asyncScripts: 0,
				chunks: [],
			},
			renderMetrics: {
				estimatedFCP: 0,
				estimatedTTI: 0,
				estimatedTBT: 0,
				layoutShifts: 0,
			},
			resourceMetrics: {
				jsCount: 0,
				cssCount: 0,
				imageCount: 0,
				fontCount: 0,
				totalResourceSize: 0,
			},
			optimizationScores: {
				bundleOptimization: 0,
				resourceOptimization: 0,
				renderOptimization: 0,
				overallScore: 0,
			},
			nextjsSpecific: {
				serverComponents: false,
				imageOptimization: false,
				fontOptimization: false,
				staticGeneration: false,
				incrementalStaticRegeneration: false,
			},
		};
	}
}

/**
 * Calcula la puntuación de optimización del bundle
 * @param {Object} bundleAnalysis - Análisis del bundle
 * @returns {number} Puntuación de 0 a 100
 */
function calculateBundleScore(bundleAnalysis) {
	let score = 100;

	// Penalizar por tamaño grande
	if (bundleAnalysis.totalSize > 1000000) {
		// 1MB
		score -= 20;
	} else if (bundleAnalysis.totalSize > 500000) {
		// 500KB
		score -= 10;
	}

	// Bonificar por scripts diferidos/asíncronos
	if (bundleAnalysis.deferredScripts > 0) score += 10;
	if (bundleAnalysis.asyncScripts > 0) score += 10;

	return Math.max(0, Math.min(100, score));
}

/**
 * Calcula la puntuación de optimización de recursos
 * @param {Object} resourceMetrics - Métricas de recursos
 * @returns {number} Puntuación de 0 a 100
 */
function calculateResourceScore(resourceMetrics) {
	let score = 100;

	// Penalizar por muchos archivos
	const totalFiles = resourceMetrics.jsCount + resourceMetrics.cssCount;
	if (totalFiles > 50) {
		score -= 20;
	} else if (totalFiles > 30) {
		score -= 10;
	}

	// Penalizar por tamaño total grande
	if (resourceMetrics.totalResourceSize > 2000000) {
		// 2MB
		score -= 20;
	} else if (resourceMetrics.totalResourceSize > 1000000) {
		// 1MB
		score -= 10;
	}

	return Math.max(0, Math.min(100, score));
}

export default {
	analyzePerformance,
};
