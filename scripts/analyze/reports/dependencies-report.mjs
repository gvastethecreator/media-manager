/**
 * Generador de reportes de dependencias
 * @module dependencies-report
 */

import { getScoreEmoji } from '../utils.mjs';

/**
 * Genera un reporte de análisis de dependencias en formato Markdown
 * @param {Object} results - Resultados del análisis de dependencias
 * @returns {string} Reporte en formato Markdown
 */
export function generateDependenciesReport(results) {
	try {
		let report = `# 📦 Reporte de Dependencias

## 📊 Resumen

- **Puntuación de Salud**: ${results.healthScore}/100 ${getScoreEmoji(results.healthScore)}
- **Total de Dependencias**: ${results.dependencies.total}
	- Directas: ${results.dependencies.direct}
	- Desarrollo: ${results.dependencies.dev}
	- Peer: ${results.dependencies.peer}
- **Actualizaciones Pendientes**: ${results.updatesAvailable}
- **Vulnerabilidades**: ${results.vulnerabilities}
- **Problemas de Licencias**: ${results.licenseIssues}

## 🔧 Versiones

- Node.js: ${results.versions.node}
- npm: ${results.versions.npm}

## 🔄 Actualizaciones Disponibles

${generateUpdatesSection(results.updates)}

## 🛡️ Seguridad

${generateSecuritySection(results.security)}

## 📜 Licencias

${generateLicensesSection(results.licenses)}

## 🎯 Recomendaciones

${generateRecommendations(results)}

> Generado automáticamente por el analizador de código
`;

		return report;
	} catch (error) {
		console.error('Error al generar el reporte de dependencias:', error);
		return `# ❌ Error al Generar el Reporte de Dependencias

Se produjo un error al intentar generar el reporte. Por favor, verifica los datos de entrada y vuelve a intentarlo.

Error: ${error.message}`;
	}
}

/**
 * Genera la sección de actualizaciones
 * @param {Object} updates - Información de actualizaciones
 * @returns {string} Sección en formato Markdown
 */
function generateUpdatesSection(updates) {
	if (updates.available.length === 0) {
		return '✅ Todas las dependencias están actualizadas.';
	}

	let section = '';

	if (updates.breaking.length > 0) {
		section += '\n### ⚠️ Cambios Mayores\n\n';
		for (const update of updates.breaking) {
			section += `- **${update.name}**: ${update.current} → ${update.latest} (${update.type})\n`;
		}
	}

	if (updates.recommended.length > 0) {
		section += '\n### 📦 Actualizaciones Recomendadas\n\n';
		for (const update of updates.recommended) {
			section += `- **${update.name}**: ${update.current} → ${update.latest} (${update.type})\n`;
		}
	}

	return section;
}

/**
 * Genera la sección de seguridad
 * @param {Object} security - Información de seguridad
 * @returns {string} Sección en formato Markdown
 */
function generateSecuritySection(security) {
	if (security.total === 0) {
		return '✅ No se encontraron vulnerabilidades.';
	}

	let section = `### 📊 Resumen de Vulnerabilidades

- Total: ${security.total}
- Altas: ${security.high}
- Medias: ${security.medium}
- Bajas: ${security.low}

### �� Detalles

`;

	for (const vuln of security.vulnerabilities) {
		section += `#### ${vuln.severity.toUpperCase()}: ${vuln.name}\n\n`;
		section += `- **Rango Afectado**: ${vuln.range}\n`;
		section += `- **Efectos**: ${vuln.effects.join(', ') || 'Ninguno'}\n`;
		section += `- **Solución**: ${vuln.fixAvailable ? '✅ Disponible' : '❌ No disponible'}\n\n`;
	}

	return section;
}

/**
 * Genera la sección de licencias
 * @param {Object} licenses - Información de licencias
 * @returns {string} Sección en formato Markdown
 */
function generateLicensesSection(licenses) {
	let section = '';

	if (licenses.compatible.length > 0) {
		section += '\n### ✅ Licencias Compatibles\n\n';
		for (const dep of licenses.compatible) {
			section += `- **${dep.name}**: ${dep.license}\n`;
		}
	}

	if (licenses.incompatible.length > 0) {
		section += '\n### ⚠️ Licencias Incompatibles\n\n';
		for (const dep of licenses.incompatible) {
			section += `- **${dep.name}**: ${dep.license}\n`;
		}
	}

	if (licenses.unknown.length > 0) {
		section += '\n### ❓ Licencias Desconocidas\n\n';
		for (const dep of licenses.unknown) {
			section += `- **${dep.name}**: ${dep.license}\n`;
		}
	}

	return section || '✅ Todas las licencias son compatibles.';
}

/**
 * Genera recomendaciones basadas en los resultados
 * @param {Object} results - Resultados del análisis
 * @returns {string} Recomendaciones en formato Markdown
 */
function generateRecommendations(results) {
	const recommendations = [];

	// Recomendaciones de seguridad
	if (results.security.high > 0) {
		recommendations.push(
			'- 🚨 **Actualizar inmediatamente las dependencias con vulnerabilidades altas**:\n' +
				'  - Ejecutar `npm audit fix`\n' +
				'  - Revisar alternativas seguras si no hay fix disponible'
		);
	}

	// Recomendaciones de actualizaciones
	if (results.updates.breaking.length > 0) {
		recommendations.push(
			'- ⚠️ **Planificar actualizaciones mayores**:\n' +
				'  - Revisar cambios breaking\n' +
				'  - Actualizar en fases\n' +
				'  - Mantener pruebas actualizadas'
		);
	}

	// Recomendaciones de licencias
	if (results.licenseIssues > 0) {
		recommendations.push(
			'- 📜 **Resolver problemas de licencias**:\n' +
				'  - Revisar licencias incompatibles\n' +
				'  - Buscar alternativas con licencias compatibles\n' +
				'  - Documentar decisiones de licenciamiento'
		);
	}

	if (recommendations.length === 0) {
		recommendations.push(
			'- ✨ **¡Excelente trabajo!** Las dependencias están bien mantenidas. Continuar con el monitoreo regular.'
		);
	}

	return recommendations.join('\n\n');
}

export default {
	generateDependenciesReport,
};
