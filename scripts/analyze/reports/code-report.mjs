/**
 * Generador de reportes de código
 * @module code-report
 */

/**
 * Genera un reporte de análisis de código en formato Markdown
 * @param {Object} results - Resultados del análisis de código
 * @returns {string} Reporte en formato Markdown
 */
export function generateCodeAnalysisReport(results) {
	try {
		let report = `# 📝 Reporte de Análisis de Código

## 📊 Resumen

| Métrica | Puntuación |
|---------|------------|
| Complejidad | ${results.complexityScore}/100 |
| Mantenibilidad | ${results.maintainabilityScore}/100 |
| Documentación | ${results.documentationScore}/100 |
| **Puntuación Global** | **${results.overallScore}/100** |

## 🔍 Detalles del Análisis

### 📈 Métricas de Complejidad

- Promedio de complejidad ciclomática: ${results.metrics.avgCyclomaticComplexity}
- Máxima profundidad de anidación: ${results.metrics.maxNestingDepth}
- Promedio de parámetros por función: ${results.metrics.avgParameters}

### 📚 Documentación

- Ratio de comentarios: ${(results.metrics.commentRatio * 100).toFixed(2)}%
- Funciones documentadas: ${results.metrics.documentedFunctions}/${results.metrics.totalFunctions}
- Clases documentadas: ${results.metrics.documentedClasses}/${results.metrics.totalClasses}

### 🧹 Mantenibilidad

- Promedio de líneas por archivo: ${results.metrics.avgLinesPerFile}
- Archivos con más de 300 líneas: ${results.metrics.largeFiles.length}
- Duplicación de código: ${results.metrics.codeDuplication}%

## ⚠️ Problemas Detectados

${generateIssuesSection(results.issues)}

## 🎯 Recomendaciones

${generateRecommendations(results)}

> Generado automáticamente por el analizador de código
`;

		return report;
	} catch (error) {
		console.error('Error al generar el reporte de código:', error);
		return `# ❌ Error al Generar el Reporte de Código

Se produjo un error al intentar generar el reporte. Por favor, verifica los datos de entrada y vuelve a intentarlo.

Error: ${error.message}`;
	}
}

/**
 * Genera la sección de problemas detectados
 * @param {Object} issues - Problemas detectados
 * @returns {string} Sección en formato Markdown
 */
function generateIssuesSection(issues) {
	if (!issues || Object.keys(issues).length === 0) {
		return '✅ No se detectaron problemas significativos.';
	}

	let section = '';

	if (issues.complexity && issues.complexity.length > 0) {
		section += '\n### 🔄 Complejidad\n\n';
		for (const issue of issues.complexity) {
			section += `- ⚠️ ${issue.file}: ${issue.message}\n`;
		}
	}

	if (issues.maintainability && issues.maintainability.length > 0) {
		section += '\n### 🔧 Mantenibilidad\n\n';
		for (const issue of issues.maintainability) {
			section += `- ⚠️ ${issue.file}: ${issue.message}\n`;
		}
	}

	if (issues.documentation && issues.documentation.length > 0) {
		section += '\n### 📚 Documentación\n\n';
		for (const issue of issues.documentation) {
			section += `- ⚠️ ${issue.file}: ${issue.message}\n`;
		}
	}

	return section;
}

/**
 * Genera recomendaciones basadas en los resultados
 * @param {Object} results - Resultados del análisis
 * @returns {string} Recomendaciones en formato Markdown
 */
function generateRecommendations(results) {
	const recommendations = [];

	// Recomendaciones de complejidad
	if (results.complexityScore < 80) {
		recommendations.push(
			'- 🔄 **Reducir la complejidad**:\n' +
				'  - Refactorizar funciones complejas\n' +
				'  - Reducir la profundidad de anidación\n' +
				'  - Simplificar lógica condicional'
		);
	}

	// Recomendaciones de documentación
	if (results.documentationScore < 80) {
		recommendations.push(
			'- 📚 **Mejorar la documentación**:\n' +
				'  - Documentar funciones y clases principales\n' +
				'  - Agregar comentarios explicativos\n' +
				'  - Mantener la documentación actualizada'
		);
	}

	// Recomendaciones de mantenibilidad
	if (results.maintainabilityScore < 80) {
		recommendations.push(
			'- 🔧 **Mejorar la mantenibilidad**:\n' +
				'  - Dividir archivos grandes\n' +
				'  - Reducir duplicación de código\n' +
				'  - Seguir principios SOLID'
		);
	}

	if (recommendations.length === 0) {
		recommendations.push(
			'- ✨ **¡Excelente trabajo!** El código mantiene un alto nivel de calidad. Continúa con las buenas prácticas actuales.'
		);
	}

	return recommendations.join('\n\n');
}

export default {
	generateCodeAnalysisReport,
};
