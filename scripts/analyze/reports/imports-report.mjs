/**
 * Generador de reportes de importaciones
 * @module imports-report
 */

import { simplifyPath } from '../utils.mjs';

/**
 * Genera un reporte de análisis de importaciones en formato Markdown
 * @param {Object} results - Resultados del análisis de importaciones
 * @returns {string} Reporte en formato Markdown
 */
export function generateImportsReport(results) {
	try {
		// Validar resultados
		if (!results) {
			return `# ❌ Error al Generar el Reporte de Importaciones

No se proporcionaron resultados para generar el reporte.`;
		}

		// Asegurar valores por defecto
		const {
			totalFiles = 0,
			totalImports = 0,
			uniqueImports = 0,
			circularDependencies = [],
			unusedImports = [],
			commonImports = [],
			dependencyMap = {},
		} = results;

		let report = `# 🔍 Reporte de Importaciones

## 📊 Resumen

- **Total de Archivos**: ${totalFiles}
- **Total de Importaciones**: ${totalImports}
- **Importaciones Únicas**: ${uniqueImports}
- **Importaciones Circulares**: ${circularDependencies.length}
- **Importaciones No Utilizadas**: ${unusedImports.length}

## 🔄 Dependencias Circulares

${generateCircularDependenciesSection(circularDependencies)}

## ⚠️ Importaciones No Utilizadas

${generateUnusedImportsSection(unusedImports)}

## 📦 Importaciones más Comunes

${generateCommonImportsSection(commonImports)}

## 🗺️ Mapa de Dependencias

${generateDependencyMapSection(dependencyMap)}

## 🎯 Recomendaciones

${generateRecommendations({ totalImports, uniqueImports, circularDependencies, unusedImports })}

> Generado automáticamente por el analizador de código
`;

		return report;
	} catch (error) {
		console.error('Error al generar el reporte de importaciones:', error);
		return `# ❌ Error al Generar el Reporte de Importaciones

Se produjo un error al intentar generar el reporte. Por favor, verifica los datos de entrada y vuelve a intentarlo.

Error: ${error.message}`;
	}
}

/**
 * Genera la sección de dependencias circulares
 * @param {Array} circularDeps - Lista de dependencias circulares
 * @returns {string} Sección en formato Markdown
 */
function generateCircularDependenciesSection(circularDeps) {
	if (circularDeps.length === 0) {
		return '✅ No se encontraron dependencias circulares.';
	}

	let section = '### ⚠️ Ciclos Detectados\n\n';

	for (const cycle of circularDeps) {
		section += '```mermaid\ngraph LR\n';
		for (let i = 0; i < cycle.length; i++) {
			const current = simplifyPath(cycle[i]);
			const next = simplifyPath(cycle[(i + 1) % cycle.length]);
			section += `  ${current.replace(/[^a-zA-Z0-9]/g, '_')}["${current}"] --> ${next.replace(/[^a-zA-Z0-9]/g, '_')}["${next}"]\n`;
		}
		section += '```\n\n';
	}

	return section;
}

/**
 * Genera la sección de importaciones no utilizadas
 * @param {Array} unusedImports - Lista de importaciones no utilizadas
 * @returns {string} Sección en formato Markdown
 */
function generateUnusedImportsSection(unusedImports) {
	if (unusedImports.length === 0) {
		return '✅ No se encontraron importaciones sin usar.';
	}

	let section = '';

	// Agrupar por archivo
	const byFile = {};
	for (const imp of unusedImports) {
		if (!byFile[imp.file]) {
			byFile[imp.file] = [];
		}
		byFile[imp.file].push(imp.import);
	}

	for (const [file, imports] of Object.entries(byFile)) {
		section += `### 📄 ${simplifyPath(file)}\n\n`;
		for (const imp of imports) {
			section += `- \`${imp}\`\n`;
		}
		section += '\n';
	}

	return section;
}

/**
 * Genera la sección de importaciones comunes
 * @param {Array} commonImports - Lista de importaciones más comunes
 * @returns {string} Sección en formato Markdown
 */
function generateCommonImportsSection(commonImports) {
	if (!commonImports || commonImports.length === 0) {
		return '❌ No se encontraron datos de importaciones comunes.';
	}

	let section = '| Módulo | Veces Importado | Archivos |\n|---------|-----------------|----------|\n';

	for (const imp of commonImports) {
		section += `| \`${imp.module}\` | ${imp.count} | ${imp.files.length} |\n`;
	}

	return section;
}

/**
 * Genera la sección del mapa de dependencias
 * @param {Object} dependencyMap - Mapa de dependencias
 * @returns {string} Sección en formato Markdown
 */
function generateDependencyMapSection(dependencyMap) {
	if (!dependencyMap || Object.keys(dependencyMap).length === 0) {
		return '❌ No se encontraron datos para el mapa de dependencias.';
	}

	let section = '```mermaid\ngraph TD\n';

	// Limitar a las dependencias más significativas para no sobrecargar el gráfico
	const significantDeps = Object.entries(dependencyMap)
		.filter(([, deps]) => deps.length > 2)
		.slice(0, 10);

	for (const [file, deps] of significantDeps) {
		const fileId = simplifyPath(file).replace(/[^a-zA-Z0-9]/g, '_');
		for (const dep of deps) {
			const depId = simplifyPath(dep).replace(/[^a-zA-Z0-9]/g, '_');
			section += `  ${fileId}["${simplifyPath(file)}"] --> ${depId}["${simplifyPath(dep)}"]\n`;
		}
	}

	section += '```';

	return section;
}

/**
 * Genera recomendaciones basadas en los resultados
 * @param {Object} results - Resultados del análisis
 * @returns {string} Recomendaciones en formato Markdown
 */
function generateRecommendations(results) {
	const recommendations = [];

	// Recomendaciones para dependencias circulares
	if (results.circularDependencies.length > 0) {
		recommendations.push(
			'- 🔄 **Resolver dependencias circulares**:\n' +
				'  - Extraer lógica común a módulos separados\n' +
				'  - Considerar el uso de inyección de dependencias\n' +
				'  - Reestructurar la arquitectura del código'
		);
	}

	// Recomendaciones para importaciones no utilizadas
	if (results.unusedImports.length > 0) {
		recommendations.push(
			'- 🧹 **Limpiar importaciones no utilizadas**:\n' +
				'  - Eliminar importaciones muertas\n' +
				'  - Configurar ESLint para detectar automáticamente\n' +
				'  - Revisar y actualizar las dependencias del proyecto'
		);
	}

	// Recomendaciones para optimización
	const importRatio = results.uniqueImports / results.totalImports;
	if (importRatio < 0.5) {
		recommendations.push(
			'- 📦 **Optimizar importaciones**:\n' +
				'  - Consolidar importaciones comunes\n' +
				'  - Utilizar importaciones específicas\n' +
				'  - Implementar lazy loading donde sea posible'
		);
	}

	if (recommendations.length === 0) {
		recommendations.push(
			'- ✨ **¡Buen trabajo!** La estructura de importaciones está bien organizada. Mantener las buenas prácticas actuales.'
		);
	}

	return recommendations.join('\n\n');
}

export default {
	generateImportsReport,
};
