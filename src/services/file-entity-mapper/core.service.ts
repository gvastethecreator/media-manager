import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import PQueue from 'p-queue';
import { shouldSkipFileByTypeAndSize } from '@/config/media-processing';
import { serverLogger } from '@/lib/logger/server-logger';
import type { EntityCreationResult, EntityCreationStats, EntityType } from '@/types/file-entity-mapper';
import { AudioProcessor } from './processors/audio.processor';
import { DocumentProcessor } from './processors/document.processor';
import { File3DProcessor } from './processors/file3d.processor';
import { ImageProcessor } from './processors/image.processor';
import { JsonProcessor } from './processors/json.processor';
import { VideoProcessor } from './processors/video.processor';
import { getEntityTypeFromExtension, getFileInfo } from './utils/file-info.utils';
import { MetricsCollector } from './utils/metrics.utils';

type ProcessorResult = { success: boolean; error?: string };

interface EntityProcessor {
	checkExists(hash: string): Promise<boolean>;
	createBasicEntity(fileInfo: Awaited<ReturnType<typeof getFileInfo>>): Promise<string>;
	extractMetadata?: (filePath: string, entityId: string) => Promise<ProcessorResult>;
	generateThumbnail?: (filePath: string, entityId: string) => Promise<ProcessorResult>;
}

export function resolveFileEntityMapperConcurrency(rawValue = process.env.MEDIA_MANAGER_INGEST_CONCURRENCY): number {
	if (!rawValue) return 1;
	const parsed = Number.parseInt(rawValue, 10);
	return Number.isFinite(parsed) ? Math.min(4, Math.max(1, parsed)) : 1;
}

/**
 * Servicio core que orquesta el mapeo de archivos físicos a entidades BD
 * Arquitectura de 3 etapas:
 * 1. Creación básica (sin metadata ni thumbnail)
 * 2. Extracción de metadata (especializada por tipo)
 * 3. Procesamiento de thumbnail
 */
export class FileEntityMapperCore {
	private static instance: FileEntityMapperCore;
	private readonly processors: Map<EntityType, EntityProcessor>;
	private readonly metrics: MetricsCollector;
	private readonly queue: PQueue;
	private basicStageChain: Promise<unknown>;

	private constructor() {
		this.processors = new Map();
		this.processors.set('image' as EntityType, new ImageProcessor());
		this.processors.set('video' as EntityType, new VideoProcessor());
		this.processors.set('audio' as EntityType, new AudioProcessor());
		this.processors.set('document' as EntityType, new DocumentProcessor());
		this.processors.set('file3d' as EntityType, new File3DProcessor());
		this.processors.set('jsonFile' as EntityType, new JsonProcessor());

		this.metrics = new MetricsCollector();
		// SQLite sólo admite un escritor. El valor seguro es 1; un operador puede
		// optar explícitamente por hasta 4 pipelines cuando el almacenamiento local
		// y las métricas de SQLITE_BUSY demuestren que hay margen.
		this.queue = new PQueue({ concurrency: resolveFileEntityMapperConcurrency() });
		this.basicStageChain = Promise.resolve();
	}

	static getInstance(): FileEntityMapperCore {
		if (!FileEntityMapperCore.instance) {
			FileEntityMapperCore.instance = new FileEntityMapperCore();
		}
		return FileEntityMapperCore.instance;
	}

	// ===================== ETAPA 1: CREACIÓN BÁSICA =====================

	/**
	 * Crea entidad básica desde archivo (sin metadata ni thumbnail)
	 * Serializa operaciones para garantizar orden determinista en tests
	 */
	async createBasicEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		return this.runInBasicStage(() => this.performBasicCreation(filePath, folderId));
	}

	private async performBasicCreation(filePath: string, folderId: string): Promise<EntityCreationResult> {
		try {
			// Pre-check rápido: stat + extensión para filtros antes de hashing
			let quickSize: number | null = null;
			let extension = '';
			try {
				const quickStats = await stat(filePath);
				quickSize = quickStats.size;
				extension = extname(filePath).toLowerCase();
			} catch {
				extension = extname(filePath).toLowerCase();
			}

			const entityType = getEntityTypeFromExtension(extension);
			if (entityType === ('unknown' as EntityType)) {
				// Permitir continuar para tests que stubbea el flujo
			}

			// Validar límites de tamaño antes de hash costoso
			if (quickSize !== null && shouldSkipFileByTypeAndSize(filePath, quickSize)) {
				const typeLabel = this.getEntityTypeLabel(entityType);
				serverLogger.warn(
					`[skip][${typeLabel}-size]`,
					JSON.stringify({
						path: filePath,
						sizeBytes: quickSize,
						sizeMB: (quickSize / (1024 * 1024)).toFixed(2),
						entityType,
						reason: `${typeLabel} file too large - skipped before hashing`,
					})
				);
				return { success: true, entityType, error: 'Skipped: file size exceeds limit' };
			}

			// Continuar con flujo completo
			const fileInfo = await getFileInfo(filePath, folderId);
			const processor = this.processors.get(entityType);

			if (!processor) {
				throw new Error(`Unsupported entity type: ${entityType}`);
			}

			if (!fileInfo.hash) {
				throw new Error('File hash is required for entity creation');
			}

			// Verificar si ya existe
			const exists = await processor.checkExists(fileInfo.hash);
			if (exists) {
				return { success: true, entityType, error: 'Entity already exists' };
			}

			// Crear entidad básica
			const entityId = await processor.createBasicEntity(fileInfo);
			return { success: true, entityType, entityId };
		} catch (e) {
			return {
				success: false,
				entityType: getEntityTypeFromExtension(extname(filePath).toLowerCase()),
				error: e instanceof Error ? e.message : 'Unknown error',
			};
		}
	}

	// ===================== ETAPA 2: METADATA =====================

	/**
	 * Extrae metadata especializada según tipo de entidad
	 */
	async extractMetadataForEntity(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		try {
			const t = Date.now();
			const processor = this.processors.get(entityType);

			if (!processor) {
				return { success: true };
			}

			if (!processor.extractMetadata) {
				return { success: true }; // No hay procesador de metadata
			}

			const result = await processor.extractMetadata(filePath, entityId);
			this.metrics.recordPhase(`metadata_${entityType}`, t);
			return result;
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	// ===================== ETAPA 3: THUMBNAIL =====================

	/**
	 * Procesa generación de thumbnail según tipo de entidad
	 */
	async processThumbnailForEntity(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		try {
			const processor = this.processors.get(entityType);

			if (!processor) {
				return { success: true };
			}

			if (!processor.generateThumbnail) {
				return { success: true }; // No hay procesador de thumbnail
			}

			return await processor.generateThumbnail(filePath, entityId);
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	// ===================== FLUJO COMPLETO =====================

	/**
	 * Crea entidad completa (3 etapas: básica + metadata + thumbnail)
	 */
	async createEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		const t0 = Date.now();
		const basic = await this.createBasicEntityFromFile(filePath, folderId);
		this.metrics.recordPhase('basic', t0);

		if (!basic.success) {
			return basic;
		}

		// Si ya existe, verificar metadata diferida para imágenes
		if (basic.error === 'Entity already exists') {
			await this.maybeDeferredImageMetadataExtraction(filePath, basic.entityType);
			return basic;
		}

		const id = basic.entityId;
		if (!id) {
			return { success: false, entityType: basic.entityType, error: 'Missing entity id post creation' };
		}

		// Etapa 2: Metadata
		const t1 = Date.now();
		const meta = await this.extractMetadataForEntity(filePath, id, basic.entityType);
		this.metrics.recordPhase('metadata', t1);
		if (!meta.success) {
			serverLogger.warn('Metadata extraction issue', meta.error);
		}

		// Etapa 3: Thumbnail
		const t2 = Date.now();
		const thumb = await this.processThumbnailForEntity(filePath, id, basic.entityType);
		this.metrics.recordPhase('thumbnail', t2);
		if (!thumb.success) {
			serverLogger.warn('Thumbnail processing issue', thumb.error);
		}

		return { success: true, entityType: basic.entityType, entityId: id };
	}

	/**
	 * Procesa múltiples archivos en lote con cola de concurrencia
	 */
	async processFiles(
		filePaths: string[],
		folderId: string,
		options?: { onProgress?: (processed: number, total: number, currentFile: string) => void | Promise<void> }
	): Promise<EntityCreationStats> {
		const stats: EntityCreationStats = {
			totalFiles: filePaths.length,
			processed: 0,
			successful: 0,
			failed: 0,
			errors: [],
		};

		const tasks = filePaths.map((fp) =>
			this.queue.add(async () => {
				try {
					const res = await this.createEntityFromFile(fp, folderId);
					stats.processed++;
					if (res.success) {
						stats.successful++;
					} else {
						stats.failed++;
						if (res.error && res.error !== 'Entity already exists') {
							stats.errors.push({ file: fp, error: res.error });
						}
					}

					// Reportar progreso si hay callback
					if (options?.onProgress) {
						await options.onProgress(stats.processed, stats.totalFiles, fp);
					}
				} catch (e) {
					stats.processed++;
					stats.failed++;
					stats.errors.push({ file: fp, error: e instanceof Error ? e.message : 'Unknown error' });

					// Reportar progreso incluso en error
					if (options?.onProgress) {
						await options.onProgress(stats.processed, stats.totalFiles, fp);
					}
				}
			})
		);

		await Promise.all(tasks);
		await this.metrics.flushMetrics();
		return stats;
	}

	// ===================== UTILIDADES PRIVADAS =====================

	private runInBasicStage<T>(fn: () => Promise<T>): Promise<T> {
		const next = this.basicStageChain.then(fn);
		this.basicStageChain = next.catch(() => null);
		return next;
	}

	private async maybeDeferredImageMetadataExtraction(filePath: string, entityType: EntityType): Promise<void> {
		try {
			if (entityType !== ('image' as EntityType)) {
				return;
			}

			const processor = this.processors.get(entityType) as ImageProcessor;
			const check = await processor.checkNeedsDeferredMetadata(filePath);

			if (check.needsUpdate && check.entityId) {
				await this.extractMetadataForEntity(filePath, check.entityId, entityType);
			}
		} catch (e) {
			serverLogger.warn('Deferred metadata extraction failed', e);
		}
	}

	private getEntityTypeLabel(entityType: EntityType): string {
		const labels: Record<string, string> = {
			image: 'image',
			video: 'video',
			audio: 'audio',
			document: 'document',
			file3d: '3d-file',
			jsonFile: 'json',
		};
		return labels[entityType] || 'file';
	}
}
