/**
 * Generador de reportes para el análisis de linting
 * @module linting-report
 */

import { simplifyPath } from '../utils.mjs';

/**
 * Genera un reporte de análisis de linting
 * @param {Object} linting - Resultados del análisis de linting
 * @returns {Promise<string>} Contenido del reporte en formato Markdown
 */
export async function generateLintingReport(linting) {
	// Verificar si tenemos datos de linting
	if (!linting || Object.keys(linting).length === 0) {
		return `# 🔍 Análisis de Linting
> No se pudieron obtener datos de linting

## ⚠️ **Estado de la Configuración**
ESLint no está configurado correctamente en el proyecto o hubo un error al ejecutarlo.

## 💡 **Recomendaciones**
1. Verificar la instalación de ESLint: \`npm install eslint --save-dev\`
2. Crear una configuración de ESLint: \`npx eslint --init\`
3. Ejecutar el linting manualmente: \`npx eslint src\`

> _Última actualización: ${new Date().toLocaleString()}_`;
	}

	// Adaptar la estructura de datos para el formato esperado
	const eslintErrors = linting.eslint?.errors || [];
	const eslintWarnings = linting.eslint?.warnings || [];
	const typescriptErrors = linting.typescript?.errors || [];
	const typescriptWarnings = linting.typescript?.warnings || [];

	const formatIssueList = (issues) => {
		if (!issues.length) return '_✅ No se encontraron problemas en esta categoría_';

		return issues
			.map(
				(issue) =>
					`- **${simplifyPath(issue.file)}** _(${issue.line}:${issue.column})_
  - Mensaje: ${issue.message}
  - Regla: \`${issue.ruleId || issue.code || 'unknown'}\``
			)
			.join('\n\n');
	};

	// Recopilar todos los archivos con problemas
	const allIssues = [...eslintErrors, ...eslintWarnings, ...typescriptErrors, ...typescriptWarnings];
	const problemFiles = {};

	for (const issue of allIssues) {
		if (!issue.file) continue;
		const simplifiedPath = simplifyPath(issue.file);
		problemFiles[simplifiedPath] = (problemFiles[simplifiedPath] || 0) + 1;
	}

	const topProblemFiles = Object.entries(problemFiles)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5);

	const totalIssues = allIssues.length;
	const eslintStatus = linting.eslint?.summary?.configurationStatus || 'unknown';

	return `# 🔍 Análisis de Linting
> Total de problemas encontrados: **${totalIssues}**

## 📊 **Resumen de Issues**

| Categoría | Cantidad | Severidad | Estado |
| :--- | :---: | :---: | :---: |
| Errores de ESLint | ${eslintErrors.length} | Alta | ${eslintErrors.length ? '⚠️' : '✅'} |
| Advertencias de ESLint | ${eslintWarnings.length} | Media | ${eslintWarnings.length ? '⚡' : '✅'} |
| Errores de TypeScript | ${typescriptErrors.length} | Alta | ${typescriptErrors.length ? '⚠️' : '✅'} |
| Advertencias de TypeScript | ${typescriptWarnings.length} | Baja | ${typescriptWarnings.length ? '🗑️' : '✅'} |

## 📁 **Top ${topProblemFiles.length} Archivos Problemáticos**

${
	topProblemFiles.length > 0
		? `| Archivo | Issues | Severidad | Estado |
| :--- | :---: | :---: | :---: |
${topProblemFiles
	.map(([file, count]) => {
		const severity = count > 5 ? 'Alta' : count > 2 ? 'Media' : 'Baja';
		const icon = count > 5 ? '⚠️' : count > 2 ? '⚡' : '⚙️';
		return `| ${file} | ${count} | ${severity} | ${icon} |`;
	})
	.join('\n')}`
		: '_No se encontraron archivos con problemas_'
}

## 💡 **Recomendaciones**
1. **ESLint**: _${
		eslintStatus !== 'success'
			? `Configurar ESLint correctamente (estado actual: ${eslintStatus})`
			: eslintErrors.length
				? `Resolver ${eslintErrors.length} errores de ESLint`
				: 'No hay errores de ESLint ✅'
	}_
2. **TypeScript**: _${
		typescriptErrors.length
			? `Resolver ${typescriptErrors.length} errores de TypeScript`
			: 'No hay errores de TypeScript ✅'
	}_
3. **Advertencias**: _${
		eslintWarnings.length + typescriptWarnings.length
			? `Revisar ${eslintWarnings.length + typescriptWarnings.length} advertencias`
			: 'No hay advertencias pendientes ✅'
	}_

## 🔍 **Detalles de Issues**

### 🚨 **Errores de ESLint**
> Problemas que deben corregirse inmediatamente
${formatIssueList(eslintErrors)}

### ⚡ **Advertencias de ESLint**
> Issues que podrían causar problemas
${formatIssueList(eslintWarnings)}

### 🔴 **Errores de TypeScript**
> Errores de tipado que deben corregirse
${formatIssueList(typescriptErrors)}

### 🟠 **Advertencias de TypeScript**
> Advertencias de tipado que deberían revisarse
${formatIssueList(typescriptWarnings)}

## 🛠️ **Comandos Útiles**
\`\`\`bash
# Corregir problemas automáticamente
npm run lint:fix

# Verificar problemas sin corregir
npm run lint

# Verificar un archivo específico
npm run lint path/to/file.tsx
\`\`\`

> _Última actualización: ${new Date().toLocaleString()}_`;
}

export default {
	generateLintingReport,
};
