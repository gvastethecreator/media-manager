#!/usr/bin/env node

/**
 * Script de Auditoría Automatizada de Vistas usando Playwright MCP
 *
 * Este script utiliza las herramientas MCP de Playwright disponibles en el entorno
 * para auditar sistemáticamente todas las vistas del Sistema de Gestión de Imágenes.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Configuración de vistas para auditar
const VISTAS_AUDIT = {
	principales: [
		// Dashboard y configuración
		{ id: 'dashboard', nombre: 'Dashboard', categoria: 'Principal' },
		{ id: 'settings', nombre: 'Configuración', categoria: 'Principal' },
		{ id: 'development', nombre: 'Desarrollo', categoria: 'Principal' },

		// Carpetas y archivos
		{ id: 'folders', nombre: 'Explorar Carpetas', categoria: 'Carpetas' },
		{ id: 'files', nombre: 'Todos los Archivos', categoria: 'Archivos' },
		{ id: 'all-images', nombre: 'Imágenes', categoria: 'Archivos' },
		{ id: 'videos', nombre: 'Videos', categoria: 'Archivos' },
		{ id: 'audios', nombre: 'Audio', categoria: 'Archivos' },
		{ id: 'documents', nombre: 'Documentos', categoria: 'Archivos' },
		{ id: 'json-files', nombre: 'JSON', categoria: 'Archivos' },
		{ id: 'workflows', nombre: 'Workflows', categoria: 'Archivos' },
		{ id: 'file-3ds', nombre: '3D', categoria: 'Archivos' },

		// Librería
		{ id: 'favorites', nombre: 'Favoritos', categoria: 'Librería' },
		{ id: 'albums', nombre: 'Álbumes', categoria: 'Librería' },
		{ id: 'collections', nombre: 'Colecciones', categoria: 'Librería' },
		{ id: 'groups', nombre: 'Grupos', categoria: 'Librería' },
		{ id: 'tags', nombre: 'Etiquetas', categoria: 'Librería' },
		{ id: 'prompts', nombre: 'Prompts', categoria: 'Librería' },

		// Worldbuilding
		{ id: 'characters', nombre: 'Personajes', categoria: 'Worldbuilding' },
		{ id: 'places', nombre: 'Lugares', categoria: 'Worldbuilding' },
		{ id: 'world-items', nombre: 'Objetos del Mundo', categoria: 'Worldbuilding' },
		{ id: 'concepts', nombre: 'Conceptos', categoria: 'Worldbuilding' },
		{ id: 'wildcards', nombre: 'Comodines', categoria: 'Worldbuilding' },

		// Gestión
		{ id: 'notes', nombre: 'Notas', categoria: 'Gestión' },
		{ id: 'properties', nombre: 'Propiedades', categoria: 'Gestión' },

		// Utilidades
		{ id: 'search', nombre: 'Búsqueda', categoria: 'Utilidades' },
		{ id: 'entity-cards', nombre: 'Tarjetas de Entidad', categoria: 'Utilidades' },
	],
	contenido: [
		{ id: 'folder-content', nombre: 'Contenido de Carpeta', categoria: 'Contenido' },
		{ id: 'document-content', nombre: 'Contenido de Documento', categoria: 'Contenido' },
		{ id: 'audio-content', nombre: 'Contenido de Audio', categoria: 'Contenido' },
		{ id: 'json-file-content', nombre: 'Contenido de JSON', categoria: 'Contenido' },
		{ id: 'workflow-content', nombre: 'Contenido de Workflow', categoria: 'Contenido' },
		{ id: 'file-3d-content', nombre: 'Contenido de 3D', categoria: 'Contenido' },
	],
};

// URLs de prueba para diferentes viewports
const VIEWPORTS = [
	{ name: 'desktop', width: 1920, height: 1080 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'mobile', width: 375, height: 812 },
];

const BASE_URL = 'http://localhost:5173';

/**
 * Configurar directorios de salida
 */
function setupOutputDirs() {
	const baseDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'audit-results');
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const outputDir = join(baseDir, `audit-${timestamp}`);

	if (!existsSync(baseDir)) {
		mkdirSync(baseDir, { recursive: true });
	}
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	// Crear subdirectorios
	for (const subdir of ['screenshots', 'snapshots', 'reports']) {
		const path = join(outputDir, subdir);
		if (!existsSync(path)) {
			mkdirSync(path, { recursive: true });
		}
	}

	return outputDir;
}

/**
 * Generar reporte de auditoría en formato JSON
 */
function generateAuditReport(results, outputDir) {
	const report = {
		timestamp: new Date().toISOString(),
		summary: {
			totalViews: results.length,
			successfulAudits: results.filter((r) => r.status === 'success').length,
			failedAudits: results.filter((r) => r.status === 'error').length,
			totalScreenshots: results.reduce((acc, r) => acc + (r.screenshots ? r.screenshots.length : 0), 0),
		},
		results,
	};

	const reportPath = join(outputDir, 'reports', 'audit-report.json');
	writeFileSync(reportPath, JSON.stringify(report, null, 2));

	// Generar reporte HTML simple
	const htmlReport = generateHTMLReport(report);
	writeFileSync(join(outputDir, 'reports', 'audit-report.html'), htmlReport);

	return reportPath;
}

/**
 * Generar reporte HTML
 */
function generateHTMLReport(report) {
	return `
<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Auditoría de Vistas - Sistema de Gestión de Imágenes</title>
	<style>
		body { font-family: Arial, sans-serif; margin: 20px; }
		.summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
		.view-result { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
		.success { border-color: #4CAF50; background: #f9fff9; }
		.error { border-color: #f44336; background: #fff9f9; }
		.screenshots img { max-width: 200px; margin: 5px; border: 1px solid #ddd; }
		.timestamp { color: #666; font-size: 0.9em; }
	</style>
</head>
<body>
	<h1>🔍 Auditoría de Vistas - Sistema de Gestión de Imágenes</h1>

	<div class="summary">
		<h2>📊 Resumen</h2>
		<p><strong>Fecha:</strong> ${new Date(report.timestamp).toLocaleString('es-ES')}</p>
		<p><strong>Total de vistas:</strong> ${report.summary.totalViews}</p>
		<p><strong>Auditorías exitosas:</strong> ${report.summary.successfulAudits}</p>
		<p><strong>Auditorías fallidas:</strong> ${report.summary.failedAudits}</p>
		<p><strong>Screenshots capturados:</strong> ${report.summary.totalScreenshots}</p>
	</div>

	<h2>📋 Resultados Detallados</h2>
	${report.results
		.map(
			(result) => `
		<div class="view-result ${result.status}">
			<h3>${result.view.nombre} (${result.view.id})</h3>
			<p><strong>Categoría:</strong> ${result.view.categoria}</p>
			<p><strong>Estado:</strong> ${result.status === 'success' ? '✅ Exitoso' : '❌ Error'}</p>
			${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
			<p class="timestamp"><strong>Duración:</strong> ${result.duration}ms</p>
			${
				result.screenshots
					? `
				<div class="screenshots">
					<h4>Screenshots:</h4>
					${result.screenshots
						.map(
							(screenshot) => `
						<img src="../screenshots/${screenshot}" alt="Screenshot ${screenshot}">
					`
						)
						.join('')}
				</div>
			`
					: ''
			}
		</div>
	`
		)
		.join('')}
</body>
</html>
	`;
}

/**
 * Exportar configuración para uso en otros scripts
 */
export { VISTAS_AUDIT, VIEWPORTS, BASE_URL, setupOutputDirs, generateAuditReport };

console.log('📋 Script de auditoría de vistas configurado.');
console.log(`📊 Total de vistas a auditar: ${VISTAS_AUDIT.principales.length + VISTAS_AUDIT.contenido.length}`);
console.log('🎯 Para ejecutar la auditoría, usar las herramientas MCP de Playwright disponibles en el entorno.');
