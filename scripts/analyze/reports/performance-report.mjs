/**
 * Generador de reportes de rendimiento
 * @module performance-report
 */

import { formatBytes } from '../utils.mjs';

/**
 * Genera un reporte de rendimiento en formato Markdown
 * @param {Object} results - Resultados del análisis de rendimiento
 * @returns {string} Reporte en formato Markdown
 */
export function generatePerformanceReport(results) {
	try {
		let report = `# 📊 Reporte de Rendimiento

## 📈 Resumen de Puntuaciones

| Categoría | Puntuación |
|-----------|------------|
| Optimización del Bundle | ${results.optimizationScores.bundleOptimization}/100 |
| Optimización de Recursos | ${results.optimizationScores.resourceOptimization}/100 |
| Optimización del Renderizado | ${results.optimizationScores.renderOptimization}/100 |
| **Puntuación Global** | **${results.optimizationScores.overallScore}/100** |

## 📦 Análisis del Bundle

- Tamaño Total: ${formatBytes(results.bundleAnalysis.totalSize)}
- Scripts Diferidos: ${results.bundleAnalysis.deferredScripts}
- Scripts Asíncronos: ${results.bundleAnalysis.asyncScripts}
${results.bundleAnalysis.unusedCode > 0 ? `- Código no utilizado: ${formatBytes(results.bundleAnalysis.unusedCode)}` : ''}

## 🎯 Métricas de Renderizado

| Métrica | Valor |
|---------|-------|
| First Contentful Paint (est.) | ${results.renderMetrics.estimatedFCP}ms |
| Time to Interactive (est.) | ${results.renderMetrics.estimatedTTI}ms |
| Total Blocking Time (est.) | ${results.renderMetrics.estimatedTBT}ms |
| Layout Shifts | ${results.renderMetrics.layoutShifts} |

## 📊 Métricas de Recursos

- Archivos JavaScript: ${results.resourceMetrics.jsCount}
- Archivos CSS: ${results.resourceMetrics.cssCount}
- Imágenes: ${results.resourceMetrics.imageCount}
- Fuentes: ${results.resourceMetrics.fontCount}
- Tamaño Total de Recursos: ${formatBytes(results.resourceMetrics.totalResourceSize)}

## ⚡ Optimizaciones de Next.js

${generateNextjsOptimizationsSection(results.nextjsSpecific)}

## 🚀 Recomendaciones de Optimización

${generateOptimizationRecommendations(results)}
`;

		return report;
	} catch (error) {
		console.error('Error al generar el reporte de rendimiento:', error);
		return `# ❌ Error al Generar el Reporte de Rendimiento

Se produjo un error al intentar generar el reporte. Por favor, verifica los datos de entrada y vuelve a intentarlo.

Error: ${error.message}`;
	}
}

/**
 * Genera la sección de optimizaciones de Next.js
 * @param {Object} nextjsSpecific - Datos específicos de Next.js
 * @returns {string} Sección en formato Markdown
 */
function generateNextjsOptimizationsSection(nextjsSpecific) {
	const features = [
		['Server Components', nextjsSpecific.serverComponents],
		['Optimización de Imágenes', nextjsSpecific.imageOptimization],
		['Optimización de Fuentes', nextjsSpecific.fontOptimization],
		['Generación Estática', nextjsSpecific.staticGeneration],
		['ISR', nextjsSpecific.incrementalStaticRegeneration],
	];

	return features.map(([feature, enabled]) => `- ${enabled ? '✅' : '❌'} ${feature}`).join('\n');
}

/**
 * Genera recomendaciones de optimización basadas en los resultados
 * @param {Object} results - Resultados del análisis
 * @returns {string} Recomendaciones en formato Markdown
 */
function generateOptimizationRecommendations(results) {
	const recommendations = [];

	// Recomendaciones basadas en el tamaño del bundle
	if (results.bundleAnalysis.totalSize > 1000000) {
		recommendations.push(
			'- 📦 **Reducir el tamaño del bundle**:\n' +
				'  - Implementar code splitting con `React.lazy()`\n' +
				'  - Optimizar las importaciones\n' +
				'  - Considerar el uso de tree shaking'
		);
	}

	// Recomendaciones basadas en métricas de recursos
	if (results.resourceMetrics.jsCount > 30) {
		recommendations.push(
			'- 🔍 **Optimizar la cantidad de archivos JavaScript**:\n' +
				'  - Consolidar componentes pequeños\n' +
				'  - Utilizar bundling eficiente'
		);
	}

	// Recomendaciones de Next.js
	if (!results.nextjsSpecific.serverComponents) {
		recommendations.push(
			'- ⚡ **Adoptar Server Components**:\n' +
				'  - Migrar componentes estáticos a Server Components\n' +
				'  - Utilizar patrones de composición servidor/cliente'
		);
	}

	if (!results.nextjsSpecific.imageOptimization) {
		recommendations.push(
			'- 🖼️ **Habilitar optimización de imágenes**:\n' +
				'  - Usar el componente `next/image`\n' +
				'  - Configurar dominios permitidos en `next.config.js`'
		);
	}

	// Recomendaciones de renderizado
	if (results.renderMetrics.estimatedTBT > 300) {
		recommendations.push(
			'- ⚡ **Mejorar el tiempo de bloqueo total**:\n' +
				'  - Optimizar operaciones costosas\n' +
				'  - Considerar el uso de Web Workers\n' +
				'  - Implementar virtualización para listas largas'
		);
	}

	if (recommendations.length === 0) {
		recommendations.push(
			'- ✨ **¡Excelente trabajo!** Tu aplicación está bien optimizada. Continúa monitoreando el rendimiento regularmente.'
		);
	}

	return recommendations.join('\n\n');
}

export default {
	generatePerformanceReport,
};
