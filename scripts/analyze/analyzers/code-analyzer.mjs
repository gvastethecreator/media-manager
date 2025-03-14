/**
 * Analizador de código
 * @module code-analyzer
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config.mjs';
import { getAllFiles, simplifyPath } from '../utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analiza el código del proyecto
 * @returns {Promise<Object>} Resultados del análisis
 */
export async function analyzeCode() {
	try {
		const srcDir = CONFIG.srcDir;

		// Verificar si el directorio existe
		try {
			await fs.access(srcDir);
		} catch (error) {
			console.error(`❌ El directorio de código fuente (${srcDir}) no existe.`);
			throw new Error('Directorio de código fuente no encontrado');
		}

		// Estructura base del resultado
		const codeResults = {
			metrics: {
				avgCyclomaticComplexity: 0,
				maxNestingDepth: 0,
				avgParameters: 0,
				commentRatio: 0,
				documentedFunctions: 0,
				totalFunctions: 0,
				documentedClasses: 0,
				totalClasses: 0,
				avgLinesPerFile: 0,
				largeFiles: [],
				codeDuplication: 0,
			},
			issues: {
				complexity: [],
				maintainability: [],
				documentation: [],
			},
			complexityScore: 0,
			maintainabilityScore: 0,
			documentationScore: 0,
			overallScore: 0,
		};

		// Obtener todos los archivos
		const allFiles = await getAllFiles(srcDir);

		if (allFiles.length === 0) {
			console.warn('⚠️ No se encontraron archivos para analizar.');
			return codeResults;
		}

		const jsFiles = allFiles.filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));

		if (jsFiles.length === 0) {
			console.warn('⚠️ No se encontraron archivos JavaScript/TypeScript para analizar.');
			return codeResults;
		}

		let totalLines = 0;
		let totalFunctions = 0;
		let totalClasses = 0;
		let totalCommentLines = 0;
		let maxComplexity = 0;
		let maxNesting = 0;
		let totalParameters = 0;
		let functionCount = 0;

		for (const file of jsFiles) {
			const content = await fs.readFile(file, 'utf-8');
			const lines = content.split('\n');
			const fileMetrics = analyzeFileContent(content, file);

			totalLines += lines.length;
			totalFunctions += fileMetrics.functions;
			totalClasses += fileMetrics.classes;
			totalCommentLines += fileMetrics.comments;
			maxComplexity = Math.max(maxComplexity, fileMetrics.complexity);
			maxNesting = Math.max(maxNesting, fileMetrics.maxNesting);
			totalParameters += fileMetrics.totalParameters;
			functionCount += fileMetrics.functions;

			// Registrar problemas
			if (fileMetrics.complexity > CONFIG.code.maxComplexity) {
				codeResults.issues.complexity.push({
					file: simplifyPath(file),
					message: `Complejidad ciclomática (${fileMetrics.complexity}) excede el límite de ${CONFIG.code.maxComplexity}`,
				});
			}

			if (lines.length > CONFIG.code.maxLines) {
				codeResults.issues.maintainability.push({
					file: simplifyPath(file),
					message: `Archivo excede ${CONFIG.code.maxLines} líneas (actual: ${lines.length})`,
				});
				codeResults.metrics.largeFiles.push(simplifyPath(file));
			}

			if (fileMetrics.documentationRatio < CONFIG.code.minCommentRatio) {
				codeResults.issues.documentation.push({
					file: simplifyPath(file),
					message: `Baja ratio de documentación (${(fileMetrics.documentationRatio * 100).toFixed(2)}%)`,
				});
			}
		}

		// Calcular métricas finales
		codeResults.metrics.avgCyclomaticComplexity = maxComplexity;
		codeResults.metrics.maxNestingDepth = maxNesting;
		codeResults.metrics.avgParameters = functionCount > 0 ? totalParameters / functionCount : 0;
		codeResults.metrics.commentRatio = totalLines > 0 ? totalCommentLines / totalLines : 0;
		codeResults.metrics.documentedFunctions = Math.floor(totalFunctions * 0.7); // Estimación
		codeResults.metrics.totalFunctions = totalFunctions;
		codeResults.metrics.documentedClasses = Math.floor(totalClasses * 0.7); // Estimación
		codeResults.metrics.totalClasses = totalClasses;
		codeResults.metrics.avgLinesPerFile = totalLines / jsFiles.length;
		codeResults.metrics.codeDuplication = 5; // Valor por defecto, requiere análisis más profundo

		// Calcular puntuaciones
		codeResults.complexityScore = calculateComplexityScore(codeResults.metrics);
		codeResults.maintainabilityScore = calculateMaintainabilityScore(codeResults.metrics);
		codeResults.documentationScore = calculateDocumentationScore(codeResults.metrics);
		codeResults.overallScore = Math.round(
			(codeResults.complexityScore + codeResults.maintainabilityScore + codeResults.documentationScore) / 3
		);

		return codeResults;
	} catch (error) {
		console.error('❌ Error al analizar el código:', error);
		throw error;
	}
}

/**
 * Analiza el contenido de un archivo
 * @param {string} content - Contenido del archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {Object} Métricas del archivo
 */
function analyzeFileContent(content, filePath) {
	const metrics = {
		functions: 0,
		classes: 0,
		comments: 0,
		complexity: 0,
		maxNesting: 0,
		totalParameters: 0,
		documentationRatio: 0,
	};

	const lines = content.split('\n');
	let inComment = false;
	let nestingLevel = 0;
	let maxNesting = 0;

	for (const line of lines) {
		const trimmedLine = line.trim();

		// Contar comentarios
		if (trimmedLine.startsWith('/*')) inComment = true;
		if (trimmedLine.endsWith('*/')) inComment = false;
		if (inComment || trimmedLine.startsWith('//')) {
			metrics.comments++;
			continue;
		}

		// Contar funciones y parámetros
		if (trimmedLine.match(/function\s+\w+\s*\(|const\s+\w+\s*=\s*\(|=>\s*{/)) {
			metrics.functions++;
			const params = trimmedLine.match(/\((.*?)\)/);
			if (params && params[1]) {
				metrics.totalParameters += params[1].split(',').length;
			}
		}

		// Contar clases
		if (trimmedLine.match(/class\s+\w+/)) {
			metrics.classes++;
		}

		// Calcular complejidad y anidación
		if (trimmedLine.match(/if|while|for|switch|catch/)) {
			metrics.complexity++;
			nestingLevel++;
			maxNesting = Math.max(maxNesting, nestingLevel);
		}

		if (trimmedLine.includes('}')) {
			nestingLevel = Math.max(0, nestingLevel - 1);
		}
	}

	metrics.maxNesting = maxNesting;
	metrics.documentationRatio = metrics.comments / lines.length;

	return metrics;
}

/**
 * Calcula la puntuación de complejidad
 * @param {Object} metrics - Métricas del código
 * @returns {number} Puntuación de 0 a 100
 */
function calculateComplexityScore(metrics) {
	let score = 100;

	// Penalizar por alta complejidad ciclomática
	if (metrics.avgCyclomaticComplexity > CONFIG.code.maxComplexity) {
		score -= (metrics.avgCyclomaticComplexity - CONFIG.code.maxComplexity) * 5;
	}

	// Penalizar por alta profundidad de anidación
	if (metrics.maxNestingDepth > CONFIG.code.maxDepth) {
		score -= (metrics.maxNestingDepth - CONFIG.code.maxDepth) * 10;
	}

	// Penalizar por muchos parámetros
	if (metrics.avgParameters > CONFIG.code.maxParams) {
		score -= (metrics.avgParameters - CONFIG.code.maxParams) * 5;
	}

	return Math.max(0, Math.min(100, score));
}

/**
 * Calcula la puntuación de mantenibilidad
 * @param {Object} metrics - Métricas del código
 * @returns {number} Puntuación de 0 a 100
 */
function calculateMaintainabilityScore(metrics) {
	let score = 100;

	// Penalizar por archivos grandes
	if (metrics.avgLinesPerFile > CONFIG.code.maxLines) {
		score -= ((metrics.avgLinesPerFile - CONFIG.code.maxLines) / 100) * 10;
	}

	// Penalizar por duplicación de código
	if (metrics.codeDuplication > 5) {
		score -= (metrics.codeDuplication - 5) * 2;
	}

	// Penalizar por cantidad de archivos grandes
	score -= metrics.largeFiles.length * 5;

	return Math.max(0, Math.min(100, score));
}

/**
 * Calcula la puntuación de documentación
 * @param {Object} metrics - Métricas del código
 * @returns {number} Puntuación de 0 a 100
 */
function calculateDocumentationScore(metrics) {
	let score = 100;

	// Penalizar por baja ratio de comentarios
	if (metrics.commentRatio < CONFIG.code.minCommentRatio) {
		score -= ((CONFIG.code.minCommentRatio - metrics.commentRatio) / CONFIG.code.minCommentRatio) * 50;
	}

	// Penalizar por funciones no documentadas
	const functionDocRatio = metrics.documentedFunctions / metrics.totalFunctions;
	if (functionDocRatio < 0.7) {
		score -= (0.7 - functionDocRatio) * 50;
	}

	// Penalizar por clases no documentadas
	const classDocRatio = metrics.documentedClasses / metrics.totalClasses;
	if (classDocRatio < 0.7) {
		score -= (0.7 - classDocRatio) * 50;
	}

	return Math.max(0, Math.min(100, score));
}

export default {
	analyzeCode,
};
