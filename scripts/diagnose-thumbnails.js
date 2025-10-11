/**
 * @file Script de diagnóstico del sistema de generación de thumbnails
 * @description Indexa test-files/ y genera reporte detallado de éxitos/fallos
 */

import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

// Colores para consola
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

const log = {
	info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
	success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
	error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
	warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
	section: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Resultado de diagnóstico por archivo
 */
class FileResult {
	constructor(filePath, entityType) {
		this.filePath = filePath;
		this.entityType = entityType;
		this.status = 'pending'; // pending, success, error, partial
		this.phases = {
			basic: { success: false, time: 0, error: null },
			metadata: { success: false, time: 0, error: null },
			thumbnail: { success: false, time: 0, error: null },
		};
		this.thumbnailInfo = {
			generated: false,
			size: 0,
			format: null,
			valid: false,
		};
		this.dbFields = {};
		this.totalTime = 0;
	}
}

/**
 * Reporte de diagnóstico
 */
class DiagnosticReport {
	constructor() {
		this.startTime = Date.now();
		this.files = [];
		this.summary = {
			total: 0,
			success: 0,
			partial: 0,
			error: 0,
		};
		this.byType = {};
	}

	addFile(result) {
		this.files.push(result);
		this.summary.total++;

		if (result.status === 'success') this.summary.success++;
		else if (result.status === 'partial') this.summary.partial++;
		else if (result.status === 'error') this.summary.error++;

		if (!this.byType[result.entityType]) {
			this.byType[result.entityType] = { success: 0, error: 0, partial: 0 };
		}
		this.byType[result.entityType][result.status]++;
	}

	generateMarkdown() {
		const duration = Date.now() - this.startTime;
		const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

		let md = `# 🔍 Reporte de Diagnóstico de Thumbnails\n\n`;
		md += `**Fecha**: ${new Date().toLocaleString('es')}\n`;
		md += `**Duración**: ${(duration / 1000).toFixed(2)}s\n\n`;

		// Resumen general
		md += `## 📊 Resumen General\n\n`;
		md += `| Métrica | Valor |\n`;
		md += `|---------|-------|\n`;
		md += `| Total archivos | ${this.summary.total} |\n`;
		md += `| ✅ Exitosos | ${this.summary.success} (${((this.summary.success / this.summary.total) * 100).toFixed(1)}%) |\n`;
		md += `| ⚠️ Parciales | ${this.summary.partial} (${((this.summary.partial / this.summary.total) * 100).toFixed(1)}%) |\n`;
		md += `| ❌ Fallidos | ${this.summary.error} (${((this.summary.error / this.summary.total) * 100).toFixed(1)}%) |\n\n`;

		// Resumen por tipo
		md += `## 📁 Resultados por Tipo de Archivo\n\n`;
		md += `| Tipo | ✅ Éxito | ⚠️ Parcial | ❌ Error | Estado |\n`;
		md += `|------|----------|-----------|----------|--------|\n`;
		for (const [type, stats] of Object.entries(this.byType)) {
			const total = stats.success + stats.partial + stats.error;
			const status = stats.success === total ? '✅' : stats.error === total ? '❌' : '⚠️';
			md += `| ${type} | ${stats.success} | ${stats.partial} | ${stats.error} | ${status} |\n`;
		}
		md += `\n`;

		// Detalles por archivo
		md += `## 📄 Detalles por Archivo\n\n`;
		for (const file of this.files) {
			const icon = file.status === 'success' ? '✅' : file.status === 'partial' ? '⚠️' : '❌';
			md += `### ${icon} ${file.filePath.split(/[/\\]/).pop()}\n\n`;
			md += `- **Tipo**: ${file.entityType}\n`;
			md += `- **Estado**: ${file.status}\n`;
			md += `- **Tiempo total**: ${file.totalTime.toFixed(2)}ms\n\n`;

			md += `**Fases**:\n`;
			for (const [phase, data] of Object.entries(file.phases)) {
				const phaseIcon = data.success ? '✅' : '❌';
				md += `- ${phaseIcon} ${phase}: ${data.time.toFixed(2)}ms`;
				if (data.error) md += ` - Error: \`${data.error}\``;
				md += `\n`;
			}

			if (file.thumbnailInfo.generated) {
				md += `\n**Thumbnail**:\n`;
				md += `- Generado: ✅\n`;
				md += `- Tamaño: ${(file.thumbnailInfo.size / 1024).toFixed(2)} KB\n`;
				md += `- Formato: ${file.thumbnailInfo.format || 'desconocido'}\n`;
				md += `- Válido: ${file.thumbnailInfo.valid ? '✅' : '❌'}\n`;
			} else {
				md += `\n**Thumbnail**: ❌ No generado\n`;
			}

			md += `\n`;
		}

		// Problemas detectados
		md += `## 🚨 Problemas Detectados\n\n`;
		const errors = this.files.filter((f) => f.status === 'error' || f.status === 'partial');
		if (errors.length === 0) {
			md += `✅ No se detectaron problemas críticos.\n\n`;
		} else {
			for (const file of errors) {
				md += `### ${file.filePath.split(/[/\\]/).pop()}\n\n`;
				for (const [phase, data] of Object.entries(file.phases)) {
					if (data.error) {
						md += `- **${phase}**: ${data.error}\n`;
					}
				}
				md += `\n`;
			}
		}

		// Recomendaciones
		md += `## 💡 Recomendaciones\n\n`;
		const recommendations = this.generateRecommendations();
		for (const rec of recommendations) {
			md += `- ${rec}\n`;
		}

		return md;
	}

	generateRecommendations() {
		const recs = [];

		// Analizar errores comunes
		const errorTypes = {};
		for (const file of this.files) {
			for (const [phase, data] of Object.entries(file.phases)) {
				if (data.error) {
					const key = `${file.entityType}-${phase}`;
					if (!errorTypes[key]) errorTypes[key] = [];
					errorTypes[key].push(data.error);
				}
			}
		}

		// Generar recomendaciones basadas en errores
		for (const [key, errors] of Object.entries(errorTypes)) {
			const [type, phase] = key.split('-');
			if (errors.length > 0) {
				recs.push(`⚠️ **${type}** - ${phase}: ${errors.length} error(es) detectado(s). Revisar procesador.`);
			}
		}

		// Recomendaciones por tipo
		if (this.byType.video && this.byType.video.error > 0) {
			recs.push('🎬 Video: Verificar que mediabunny y/o FFmpeg estén instalados y funcionales.');
		}
		if (this.byType.file3d && this.byType.file3d.error > 0) {
			recs.push('🎨 3D: Implementar generación de thumbnails para modelos 3D.');
		}
		if (this.byType.audio && this.byType.audio.error > 0) {
			recs.push('🎵 Audio: Implementar generación de waveforms visuales.');
		}

		// Performance
		const avgTime = this.files.reduce((sum, f) => sum + f.totalTime, 0) / this.files.length;
		if (avgTime > 5000) {
			recs.push(`⏱️ Performance: Tiempo promedio alto (${(avgTime / 1000).toFixed(2)}s). Considerar optimizaciones.`);
		}

		if (recs.length === 0) {
			recs.push('✅ Sistema funcionando correctamente. No hay recomendaciones críticas.');
		}

		return recs;
	}
}

/**
 * Ejecuta el diagnóstico completo
 */
async function runDiagnostic() {
	log.section('🔍 DIAGNÓSTICO DEL SISTEMA DE THUMBNAILS');

	const report = new DiagnosticReport();
	const testFilesDir = join(process.cwd(), 'test-files');

	// Verificar que existe la carpeta
	if (!existsSync(testFilesDir)) {
		log.error(`No se encontró la carpeta test-files/ en ${testFilesDir}`);
		process.exit(1);
	}

	// Leer archivos
	log.info(`Escaneando carpeta: ${testFilesDir}`);
	const files = await readdir(testFilesDir);
	log.info(`Encontrados ${files.length} archivos`);

	// Importar servicios necesarios
	log.info('Cargando servicios...');
	const { FileEntityMapperCore } = await import('../src/services/file-entity-mapper/core.service.js');
	const { db } = await import('../src/lib/drizzle/index.js');
	const { folders } = await import('../src/lib/drizzle/schema/index.js');
	const { eq } = await import('drizzle-orm');

	// Crear carpeta de prueba en BD si no existe
	let testFolder = await db.query.folders.findFirst({
		where: eq(folders.path, testFilesDir),
	});

	if (!testFolder) {
		log.info('Creando carpeta de prueba en BD...');
		const { nanoid } = await import('nanoid');
		const [created] = await db
			.insert(folders)
			.values({
				id: nanoid(),
				name: 'test-files',
				path: testFilesDir,
				isWatched: false,
			})
			.returning();
		testFolder = created;
	}

	const core = FileEntityMapperCore.getInstance();

	// Procesar cada archivo
	for (const file of files) {
		const filePath = join(testFilesDir, file);
		log.section(`📄 Procesando: ${file}`);

		const result = new FileResult(filePath, 'unknown');
		const startTime = performance.now();

		try {
			// Fase 1: Creación básica
			log.info('Fase 1: Creación básica...');
			const t1 = performance.now();
			const basicResult = await core.createBasicEntityFromFile(filePath, testFolder.id);
			result.phases.basic.time = performance.now() - t1;
			result.phases.basic.success = basicResult.success;
			result.entityType = basicResult.entityType;

			if (!basicResult.success) {
				result.phases.basic.error = basicResult.error || 'Unknown error';
				result.status = 'error';
				log.error(`Fase básica falló: ${result.phases.basic.error}`);
			} else if (basicResult.error === 'Entity already exists') {
				log.warning('Entidad ya existe, continuando...');
				result.phases.basic.success = true;
			} else {
				log.success(`Entidad creada: ${basicResult.entityId}`);
			}

			const entityId = basicResult.entityId;

			// Fase 2: Metadata
			if (entityId && result.phases.basic.success) {
				log.info('Fase 2: Extracción de metadata...');
				const t2 = performance.now();
				const metaResult = await core.extractMetadataForEntity(filePath, entityId, basicResult.entityType);
				result.phases.metadata.time = performance.now() - t2;
				result.phases.metadata.success = metaResult.success;
				if (!metaResult.success) {
					result.phases.metadata.error = metaResult.error || 'Unknown error';
					log.warning(`Metadata falló: ${result.phases.metadata.error}`);
				} else {
					log.success('Metadata extraída');
				}
			}

			// Fase 3: Thumbnail
			if (entityId && result.phases.basic.success) {
				log.info('Fase 3: Generación de thumbnail...');
				const t3 = performance.now();
				const thumbResult = await core.processThumbnailForEntity(filePath, entityId, basicResult.entityType);
				result.phases.thumbnail.time = performance.now() - t3;
				result.phases.thumbnail.success = thumbResult.success;

				if (!thumbResult.success) {
					result.phases.thumbnail.error = thumbResult.error || 'Unknown error';
					log.error(`Thumbnail falló: ${result.phases.thumbnail.error}`);
				} else {
					log.success('Thumbnail generado');
					result.thumbnailInfo.generated = true;

					// Validar thumbnail en BD
					await validateThumbnail(db, entityId, basicResult.entityType, result);
				}
			}

			// Determinar estado final
			if (result.phases.basic.success && result.phases.metadata.success && result.phases.thumbnail.success) {
				result.status = 'success';
			} else if (result.phases.basic.success) {
				result.status = 'partial';
			} else {
				result.status = 'error';
			}
		} catch (error) {
			log.error(`Error crítico: ${error.message}`);
			result.status = 'error';
			result.phases.basic.error = error.message;
		}

		result.totalTime = performance.now() - startTime;
		report.addFile(result);

		log.info(`✓ Completado en ${result.totalTime.toFixed(2)}ms - Estado: ${result.status}`);
	}

	// Generar reporte
	log.section('📊 GENERANDO REPORTE');
	const markdown = report.generateMarkdown();

	// Guardar reporte
	const reportsDir = join(process.cwd(), 'reports');
	if (!existsSync(reportsDir)) {
		await mkdir(reportsDir, { recursive: true });
	}

	const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
	const reportPath = join(reportsDir, `thumbnail-diagnosis-${timestamp}.md`);
	await writeFile(reportPath, markdown, 'utf-8');

	log.success(`Reporte guardado en: ${reportPath}`);

	// Mostrar resumen en consola
	log.section('📊 RESUMEN');
	console.log(`Total archivos: ${report.summary.total}`);
	console.log(`${colors.green}✅ Exitosos: ${report.summary.success}${colors.reset}`);
	console.log(`${colors.yellow}⚠️  Parciales: ${report.summary.partial}${colors.reset}`);
	console.log(`${colors.red}❌ Fallidos: ${report.summary.error}${colors.reset}`);

	return report.summary.error === 0 ? 0 : 1;
}

/**
 * Valida que el thumbnail se haya guardado correctamente en BD
 */
async function validateThumbnail(db, entityId, entityType, result) {
	try {
		let record = null;
		const { eq } = await import('drizzle-orm');

		switch (entityType) {
			case 'image': {
				const { images } = await import('../src/lib/drizzle/schema/index.js');
				record = await db.query.images.findFirst({ where: eq(images.id, entityId) });
				if (record?.metadata) {
					const meta = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
					if (meta.thumbnail) {
						result.thumbnailInfo.size = meta.thumbnail.length;
						result.thumbnailInfo.format = 'base64-jpeg';
						result.thumbnailInfo.valid = true;
					}
				}
				break;
			}
			case 'video': {
				const { videos } = await import('../src/lib/drizzle/schema/index.js');
				record = await db.query.videos.findFirst({ where: eq(videos.id, entityId) });
				if (record?.thumbnail) {
					result.thumbnailInfo.size = record.thumbnail.length;
					result.thumbnailInfo.format = record.thumbnailMimeType || 'base64-webp';
					result.thumbnailInfo.valid = true;
				}
				break;
			}
			case 'document': {
				const { documents } = await import('../src/lib/drizzle/schema/index.js');
				record = await db.query.documents.findFirst({ where: eq(documents.id, entityId) });
				// Documentos usan preview SVG, no thumbnail directo
				result.thumbnailInfo.format = 'svg-preview';
				result.thumbnailInfo.valid = true;
				break;
			}
			case 'jsonFile': {
				const { jsonFiles } = await import('../src/lib/drizzle/schema/index.js');
				record = await db.query.jsonFiles.findFirst({ where: eq(jsonFiles.id, entityId) });
				// JSON usa preview SVG
				result.thumbnailInfo.format = 'svg-preview';
				result.thumbnailInfo.valid = true;
				break;
			}
			default:
				result.thumbnailInfo.valid = false;
		}
	} catch (error) {
		console.warn(`No se pudo validar thumbnail: ${error.message}`);
		result.thumbnailInfo.valid = false;
	}
}

// Ejecutar diagnóstico
runDiagnostic()
	.then((exitCode) => {
		process.exit(exitCode);
	})
	.catch((error) => {
		console.error('Error fatal:', error);
		process.exit(1);
	});
