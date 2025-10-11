/**
 * @file Servicio estructurado de reindexado de carpetas
 * @description Implementa el flujo completo de reindexado en fases separadas y ordenadas
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emitProgress } from '@/lib/server/events.server';
import type { ProcessStatus } from '@/types/folders';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from './folder-reindex-types';

// Re-exports para compatibilidad backward
export type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from './folder-reindex-types';

export class FolderReindexService {
	private static instance: FolderReindexService;
	private readonly logger = serverLogger.withContext('FolderReindexService');

	static getInstance(): FolderReindexService {
		if (!FolderReindexService.instance) {
			FolderReindexService.instance = new FolderReindexService();
		}
		return FolderReindexService.instance;
	}

	/**
	 * 🚀 FLUJO COMPLETO DE REINDEXADO ESTRUCTURADO
	 * Sigue el orden exacto especificado:
	 * 1. Análisis → 2. Existencia → 3. Eliminación → 4. Estructura → 5. Indexado → 6. Thumbnails → 7. Metadata → 8. Verificación
	 */
	async executeStructuredReindex(options: ReindexOptions = {}): Promise<{
		success: boolean;
		phases: Record<string, ReindexPhaseResult>;
		totalDuration: number;
		summary: {
			foldersProcessed: number;
			filesIndexed: number;
			thumbnailsGenerated: number;
			metadataExtracted: number;
		};
	}> {
		const startTime = Date.now();
		const phases: Record<string, ReindexPhaseResult> = {};

		this.logger.info('🚀 Iniciando reindexado estructurado', options);

		if (options.emitEvents !== false) {
			await this.emitProgress('starting', 0, 'Iniciando análisis de carpetas...');
		}

		try {
			// ===== FASE 1: ANÁLISIS =====
			this.logger.info('📊 FASE 1: Analizando carpetas y archivos');
			const analysisResult = await this.phase1_analyzeStructure(options);
			phases.analysis = {
				success: true,
				processed: analysisResult.totalFolders,
				failed: 0,
				errors: [],
				duration: 0,
			};

			if (options.emitEvents !== false) {
				await this.emitProgress('analysis', 12, 'Análisis completado. Verificando existencia...');
			}

			// ===== FASE 2: VERIFICACIÓN DE EXISTENCIA =====
			this.logger.info('🔍 FASE 2: Verificando existencia de carpetas');
			phases.existence = await this.phase2_checkExistence(analysisResult, options);

			if (options.emitEvents !== false) {
				await this.emitProgress('existence', 25, 'Verificación completada. Limpiando carpetas inexistentes...');
			}

			// ===== FASE 3: ELIMINACIÓN =====
			this.logger.info('🗑️ FASE 3: Eliminando carpetas inexistentes');
			phases.deletion = await this.phase3_removeNonExistentFolders(analysisResult, options);

			if (options.emitEvents !== false) {
				await this.emitProgress('deletion', 35, 'Limpieza completada. Creando estructura de subcarpetas...');
			}

			// ===== FASE 4: ESTRUCTURA =====
			this.logger.info('🌳 FASE 4: Creando estructura de subcarpetas');
			phases.structure = await this.phase4_buildSubfolderStructure(analysisResult, options);

			if (options.emitEvents !== false) {
				await this.emitProgress('structure', 45, 'Estructura creada. Iniciando indexado de archivos...');
			}

			// ===== FASE 5: INDEXADO =====
			this.logger.info('📁 FASE 5: Indexado de archivos');
			phases.indexing = await this.phase5_indexFiles(analysisResult, options);

			if (options.emitEvents !== false) {
				await this.emitProgress('indexing', 60, 'Indexado completado. Generando thumbnails...');
			}

			// ===== FASE 6: THUMBNAILS =====
			let thumbnailsResult: ReindexPhaseResult = { success: true, processed: 0, failed: 0, errors: [], duration: 0 };
			if (options.skipThumbnails) {
				this.logger.info('⏭️ FASE 6: Saltando generación de thumbnails (skipThumbnails=true)');
			} else {
				this.logger.info('🖼️ FASE 6: Generación de thumbnails');
				thumbnailsResult = await this.phase6_generateThumbnails(analysisResult, options);
			}
			phases.thumbnails = thumbnailsResult;

			if (options.emitEvents !== false) {
				await this.emitProgress('thumbnails', 80, 'Thumbnails generados. Extrayendo metadata...');
			}

			// ===== FASE 7: METADATA =====
			let metadataResult: ReindexPhaseResult = { success: true, processed: 0, failed: 0, errors: [], duration: 0 };
			if (options.skipMetadata) {
				this.logger.info('⏭️ FASE 7: Saltando extracción de metadata (skipMetadata=true)');
			} else {
				this.logger.info('📊 FASE 7: Extracción de metadata');
				metadataResult = await this.phase7_extractMetadata(analysisResult, options);
			}
			phases.metadata = metadataResult;

			if (options.emitEvents !== false) {
				await this.emitProgress('metadata', 95, 'Metadata extraída. Verificando integridad...');
			}

			// ===== FASE 8: VERIFICACIÓN =====
			this.logger.info('✅ FASE 8: Verificación final');
			phases.verification = await this.phase8_verifyIntegrity(analysisResult, options);

			const totalDuration = Date.now() - startTime;
			const success = Object.values(phases).every((phase) => phase.success);

			if (options.emitEvents !== false) {
				await this.emitProgress('completed', 100, 'Reindexado completado exitosamente');
			}

			const summary = {
				foldersProcessed: analysisResult.totalFolders,
				filesIndexed: phases.indexing.processed,
				thumbnailsGenerated: phases.thumbnails.processed,
				metadataExtracted: phases.metadata.processed,
			};

			this.logger.info('✅ Reindexado estructurado completado', {
				success,
				totalDuration,
				summary,
			});

			return {
				success,
				phases,
				totalDuration,
				summary,
			};
		} catch (error) {
			this.logger.error('❌ Error durante reindexado estructurado', error);

			if (options.emitEvents !== false) {
				await this.emitProgress('error', 0, `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
			}

			throw error;
		}
	}

	/**
	 * FASE 1: 📊 ANÁLISIS DE ESTRUCTURA
	 * Analiza todas las carpetas y archivos para planificar el reindexado
	 */
	private async phase1_analyzeStructure(options: ReindexOptions): Promise<ReindexAnalysisResult> {
		this.logger.info('📊 Iniciando análisis de estructura');

		try {
			const { db } = await import('@/lib/drizzle');
			const { folders } = await import('@/lib/drizzle/schema/index');
			const { eq } = await import('drizzle-orm');

			// Si se especifica una carpeta específica, solo analizar esa
			let foldersToAnalyze: Array<{ id: string; path: string; name: string }>;
			if (options.folderId) {
				foldersToAnalyze = await db
					.select({ id: folders.id, path: folders.path, name: folders.name })
					.from(folders)
					.where(eq(folders.id, options.folderId));
			} else {
				foldersToAnalyze = await db.select({ id: folders.id, path: folders.path, name: folders.name }).from(folders);
			}

			// Verificar existencia física de cada carpeta
			const { folderExists } = await import('@/lib/filesystem/folder-scanner');
			const existingFolders = [];
			const missingFolders = [];

			for (const folder of foldersToAnalyze) {
				const exists = await folderExists(folder.path);
				if (exists) {
					existingFolders.push({ ...folder, exists: true });
				} else {
					missingFolders.push(folder);
				}
			}

			// Buscar nuevas subcarpetas en las carpetas existentes
			const newSubfolders = [];
			if (options.includeSubfolders !== false) {
				for (const folder of existingFolders) {
					try {
						const { scanFolder } = await import('@/lib/filesystem/folder-scanner');
						const scan = await scanFolder(folder.path, {
							recursive: true,
							includeHidden: options.includeHidden,
							limit: 0,
						});

						// Agregar subcarpetas encontradas que no estén en BD
						for (const subfolder of scan.directories || []) {
							const existsInDB = foldersToAnalyze.some((f) => f.path === subfolder.path);
							if (!existsInDB) {
								newSubfolders.push({
									path: subfolder.path,
									parentId: folder.id,
									name: subfolder.name,
								});
							}
						}
					} catch (error) {
						this.logger.warn(`Error escaneando subcarpetas de ${folder.path}:`, error);
					}
				}
			}

			// Calcular total de archivos estimado (RECURSIVO para incluir archivos en subcarpetas)
			let totalFiles = 0;
			for (const folder of existingFolders) {
				try {
					const { scanFolder } = await import('@/lib/filesystem/folder-scanner');
					const scan = await scanFolder(folder.path, {
						recursive: true,
						includeHidden: options.includeHidden,
						limit: 0,
					});
					totalFiles += scan.files?.length || 0;
				} catch (error) {
					this.logger.warn(`Error contando archivos en ${folder.path}:`, error);
				}
			}

			const estimatedDuration = this.estimateProcessingTime(totalFiles, existingFolders.length);

			this.logger.info('📊 Análisis completado', {
				totalFolders: foldersToAnalyze.length,
				existingFolders: existingFolders.length,
				missingFolders: missingFolders.length,
				newSubfolders: newSubfolders.length,
				totalFiles,
				estimatedDuration,
			});

			return {
				totalFolders: foldersToAnalyze.length,
				existingFolders,
				missingFolders,
				newSubfolders,
				totalFiles,
				estimatedDuration,
			};
		} catch (error) {
			this.logger.error('❌ Error en análisis de estructura:', error);
			throw error;
		}
	}

	/**
	 * FASE 2: 🔍 VERIFICACIÓN DE EXISTENCIA
	 * Confirma qué carpetas existen físicamente
	 */
	private async phase2_checkExistence(
		analysisResult: ReindexAnalysisResult,
		options: ReindexOptions
	): Promise<ReindexPhaseResult> {
		const startTime = Date.now();
		this.logger.info('🔍 Verificando existencia de carpetas');

		try {
			// La verificación ya se hizo en la fase de análisis
			// Aquí solo confirmamos los resultados

			const duration = Date.now() - startTime;
			const result = {
				success: true,
				processed: analysisResult.existingFolders.length,
				failed: analysisResult.missingFolders.length,
				errors: analysisResult.missingFolders.map((f) => `Carpeta no encontrada: ${f.path}`),
				duration,
			};

			this.logger.info('✅ Verificación de existencia completada', result);
			return result;
		} catch (error) {
			this.logger.error('❌ Error en verificación de existencia:', error);
			return {
				success: false,
				processed: 0,
				failed: 0,
				errors: [error instanceof Error ? error.message : 'Error desconocido'],
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * FASE 3: 🗑️ ELIMINACIÓN DE CARPETAS INEXISTENTES
	 * Elimina de la BD las carpetas que ya no existen físicamente
	 */
	private async phase3_removeNonExistentFolders(
		analysisResult: ReindexAnalysisResult,
		options: ReindexOptions
	): Promise<ReindexPhaseResult> {
		const startTime = Date.now();
		this.logger.info('🗑️ Eliminando carpetas inexistentes de la base de datos');

		const errors: string[] = [];
		let processed = 0;

		try {
			if (analysisResult.missingFolders.length === 0) {
				this.logger.info('✅ No hay carpetas inexistentes para eliminar');
				return {
					success: true,
					processed: 0,
					failed: 0,
					errors: [],
					duration: Date.now() - startTime,
				};
			}

			const { db } = await import('@/lib/drizzle');
			const { folders } = await import('@/lib/drizzle/schema/index');
			const { inArray } = await import('drizzle-orm');

			// Eliminar carpetas inexistentes (esto también eliminará su contenido en cascada)
			const folderIdsToDelete = analysisResult.missingFolders.map((f) => f.id);

			// Usar el servicio de sincronización que ya maneja la limpieza en cascada
			const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');
			const syncResult = await syncFoldersWithFileSystem({
				dryRun: false,
				forceSync: true,
			});

			processed = syncResult.removed.length;
			errors.push(...syncResult.errors);

			this.logger.info('✅ Eliminación de carpetas inexistentes completada', {
				eliminadas: processed,
				errores: errors.length,
			});

			return {
				success: errors.length === 0,
				processed,
				failed: errors.length,
				errors,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			this.logger.error('❌ Error eliminando carpetas inexistentes:', error);
			return {
				success: false,
				processed,
				failed: analysisResult.missingFolders.length - processed,
				errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * FASE 4: 🌳 CONSTRUCCIÓN DE ESTRUCTURA DE SUBCARPETAS
	 * Crea las subcarpetas encontradas en el sistema de archivos
	 */
	private async phase4_buildSubfolderStructure(
		analysisResult: ReindexAnalysisResult,
		options: ReindexOptions
	): Promise<ReindexPhaseResult> {
		const startTime = Date.now();
		this.logger.info('🌳 Construyendo estructura de subcarpetas');

		const errors: string[] = [];
		let processed = 0;

		try {
			if (analysisResult.newSubfolders.length === 0) {
				this.logger.info('✅ No hay nuevas subcarpetas para crear');
				return {
					success: true,
					processed: 0,
					failed: 0,
					errors: [],
					duration: Date.now() - startTime,
				};
			}

			const { db } = await import('@/lib/drizzle');
			const { folders } = await import('@/lib/drizzle/schema/index');
			const { generateFolderIdFromName } = await import('@/lib/utils/folder-id-generator');

			// Crear subcarpetas ordenadas por profundidad (padres primero)
			const sortedSubfolders = analysisResult.newSubfolders.sort((a, b) => {
				const depthA = a.path.split(/[\\/]/).length;
				const depthB = b.path.split(/[\\/]/).length;
				return depthA - depthB;
			});

			for (const subfolder of sortedSubfolders) {
				try {
					const folderId = await generateFolderIdFromName(subfolder.name);

					await db.insert(folders).values({
						id: folderId,
						name: subfolder.name,
						path: subfolder.path,
						parentId: subfolder.parentId,
						totalFiles: 0,
						totalSize: 0,
						lastIndexed: new Date(),
						description: null,
						emoji: null,
						color: null,
						featuredImage: null,
						isFavorite: false,
						presetId: null,
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					processed++;
					this.logger.debug(`✅ Subcarpeta creada: ${subfolder.path}`);
				} catch (error) {
					const errorMsg = `Error creando subcarpeta ${subfolder.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
					errors.push(errorMsg);
					this.logger.error(errorMsg);
				}
			}

			this.logger.info('✅ Construcción de estructura completada', {
				procesadas: processed,
				errores: errors.length,
			});

			return {
				success: errors.length === 0,
				processed,
				failed: errors.length,
				errors,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			this.logger.error('❌ Error construyendo estructura:', error);
			return {
				success: false,
				processed,
				failed: analysisResult.newSubfolders.length - processed,
				errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * FASE 5: 📁 INDEXADO DE ARCHIVOS
	 * Indexa todos los archivos en las carpetas existentes
	 */
	private async phase5_indexFiles(
		analysisResult: ReindexAnalysisResult,
		options: ReindexOptions
	): Promise<ReindexPhaseResult> {
		const startTime = Date.now();
		this.logger.info('📁 Iniciando indexado de archivos');

		const errors: string[] = [];
		let processed = 0;
		let successful = 0;

		try {
			const concurrency = options.concurrency || 3;
			const totalFolders = analysisResult.existingFolders.length;

			// Procesar cada carpeta existente
			for (let i = 0; i < analysisResult.existingFolders.length; i++) {
				const folder = analysisResult.existingFolders[i];
				try {
					this.logger.debug(`📁 Indexando archivos en: ${folder.path}`);

					// Emitir evento de progreso para esta carpeta
					if (options.emitEvents !== false) {
						await emitProgress('folder:progress', {
							isProcessing: true,
							folderId: folder.id,
							phase: 'processing',
							progress: Math.round(((i + 1) / totalFolders) * 100),
							filesProcessed: i + 1,
							totalFiles: totalFolders,
							message: `📁 Indexando: ${folder.name} [${i + 1}/${totalFolders}]`,
							timestamp: Date.now(),
						});
					}

					const { FileSyncService } = await import('@/lib/filesystem/file-sync.service');
					const fileSyncService = FileSyncService.getInstance();

					// Sincronizar archivos de la carpeta (esto indexa los archivos)
					const syncResult = await fileSyncService.syncFolderFiles(folder.id, {
						dryRun: false,
						// Callback para reportar progreso de archivos individuales
						onProgress: async (filesProcessed, totalFiles, currentFile) => {
							if (options.emitEvents !== false) {
								const fileName = currentFile.split(/[\\/]/).pop() || currentFile;
								await emitProgress('folder:progress', {
									isProcessing: true,
									folderId: folder.id,
									phase: 'processing',
									progress: Math.round((filesProcessed / totalFiles) * 100),
									filesProcessed,
									totalFiles,
									message: `   └── [${filesProcessed}/${totalFiles}] ${fileName}`,
									timestamp: Date.now(),
								});
							}
						},
					});

					processed += syncResult.stats.totalChecked;
					successful +=
						syncResult.stats.newFilesFound + syncResult.stats.totalChecked - syncResult.stats.filesRemoved || 0;
					errors.push(...(syncResult.errors || []));

					// Recalcular y persistir estadísticas de carpeta
					try {
						const { recomputeAndPersistFolderAggregates } = await import(
							'@/lib/filesystem/folder-stats.aggregates'
						);
						await recomputeAndPersistFolderAggregates(folder.id);
						this.logger.debug(`📊 Estadísticas actualizadas para: ${folder.name}`);
					} catch (statsError) {
						this.logger.warn(`⚠️ No se pudieron actualizar estadísticas para ${folder.name}:`, statsError);
					}

					this.logger.debug(
						`✅ Carpeta indexada: ${folder.name} (${syncResult.stats.totalChecked} archivos verificados, ${syncResult.stats.newFilesFound} nuevos)`
					);
				} catch (error) {
					const errorMsg = `Error indexando carpeta ${folder.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
					errors.push(errorMsg);
					this.logger.error(errorMsg);
				}
			}

			this.logger.info('✅ Indexado de archivos completado', {
				procesados: processed,
				exitosos: successful,
				errores: errors.length,
			});

			return {
				success: errors.length === 0,
				processed: successful,
				failed: processed - successful,
				errors,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			this.logger.error('❌ Error en indexado de archivos:', error);
			return {
				success: false,
				processed,
				failed: analysisResult.totalFiles - processed,
				errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * FASE 6: 🖼️ GENERACIÓN DE THUMBNAILS
	 * Genera thumbnails para todos los archivos indexados
	 */
	private async phase6_generateThumbnails(
		analysisResult: ReindexAnalysisResult,
		options: ReindexOptions
	): Promise<ReindexPhaseResult> {
		const startTime = Date.now();
		this.logger.info('🖼️ Iniciando generación de thumbnails');

		const errors: string[] = [];
		let processed = 0;

		try {
			const { bulkGenerateThumbnails } = await import('@/server/services/thumbnail.service');
			// Ya no necesitamos instanciar un servicio, usamos la función directamente

			// Procesar thumbnails por tipo de entidad
			const entityTypes = ['image', 'video', 'document', 'file3d', 'json'];

			for (const entityType of entityTypes) {
				try {
					this.logger.debug(`🖼️ Generando thumbnails para: ${entityType}`);

					// Obtener entidades sin thumbnail
					const { db } = await import('@/lib/drizzle');
					let entitiesQuery: any;

					switch (entityType) {
						case 'image': {
							const { images } = await import('@/lib/drizzle/schema/index');
							const { isNull, inArray } = await import('drizzle-orm');
							entitiesQuery = db
								.select({ id: images.id, path: images.path, folderId: images.folderId })
								.from(images)
								.where(
									inArray(
										images.folderId,
										analysisResult.existingFolders.map((f) => f.id)
									)
								);
							break;
						}
						// Agregar casos para video, document, etc.
						default:
							continue;
					}

					const entities = await entitiesQuery;

					for (const entity of entities) {
						try {
							// Usar la función bulkGenerateThumbnails con un solo elemento
							await bulkGenerateThumbnails([entity.id]);
							processed++;
						} catch (error) {
							const errorMsg = `Error generando thumbnail para ${entity.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
							errors.push(errorMsg);
						}
					}
				} catch (error) {
					const errorMsg = `Error procesando thumbnails de tipo ${entityType}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
					errors.push(errorMsg);
					this.logger.error(errorMsg);
				}
			}

			this.logger.info('✅ Generación de thumbnails completada', {
				procesados: processed,
				errores: errors.length,
			});

			return {
				success: errors.length === 0,
				processed,
				failed: errors.length,
				errors,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			this.logger.error('❌ Error en generación de thumbnails:', error);
			return {
				success: false,
				processed,
				failed: analysisResult.totalFiles - processed,
				errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * FASE 7: 📊 EXTRACCIÓN DE METADATA
	 * Extrae metadata de todos los archivos indexados
	 */
	private async phase7_extractMetadata(
		analysisResult: ReindexAnalysisResult,
		options: ReindexOptions
	): Promise<ReindexPhaseResult> {
		const startTime = Date.now();
		this.logger.info('📊 Iniciando extracción de metadata');

		const errors: string[] = [];
		let processed = 0;

		try {
			const { extractMetadata, clearMetadataCache } = await import('@/services/metadata/metadata.service');
			// Ya no necesitamos instanciar un servicio, usamos las funciones directamente

			// Obtener todos los archivos que necesitan metadata
			const { db } = await import('@/lib/drizzle');
			const { images, metadatas } = await import('@/lib/drizzle/schema/index');
			const { inArray, isNull, and, eq } = await import('drizzle-orm');

			// Buscar imágenes sin metadata
			const imagesWithoutMetadata = await db
				.select({ id: images.id, path: images.path })
				.from(images)
				.leftJoin(metadatas, and(eq(metadatas.entityId, images.id), eq(metadatas.entityType, 'image')))
				.where(
					and(
						inArray(
							images.folderId,
							analysisResult.existingFolders.map((f) => f.id)
						),
						isNull(metadatas.id)
					)
				);

			for (const image of imagesWithoutMetadata) {
				try {
					// Usar la función extractMetadata y almacenar la metadata
					const metadata = await extractMetadata(image.path);
					// TODO: Implementar almacenamiento de metadata extraída
					processed++;
				} catch (error) {
					const errorMsg = `Error extrayendo metadata de ${image.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
					errors.push(errorMsg);
				}
			}

			this.logger.info('✅ Extracción de metadata completada', {
				procesados: processed,
				errores: errors.length,
			});

			return {
				success: errors.length === 0,
				processed,
				failed: errors.length,
				errors,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			this.logger.error('❌ Error en extracción de metadata:', error);
			return {
				success: false,
				processed,
				failed: analysisResult.totalFiles - processed,
				errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * FASE 8: ✅ VERIFICACIÓN FINAL
	 * Verifica que todo el proceso se completó correctamente
	 */
	private async phase8_verifyIntegrity(
		analysisResult: ReindexAnalysisResult,
		options: ReindexOptions
	): Promise<ReindexPhaseResult> {
		const startTime = Date.now();
		this.logger.info('✅ Iniciando verificación final');

		const errors: string[] = [];
		let processed = 0;

		try {
			const { db } = await import('@/lib/drizzle');
			const { folders, images, thumbnails, metadatas } = await import('@/lib/drizzle/schema/index');
			const { eq, inArray, sql } = await import('drizzle-orm');

			// Verificar que todas las carpetas existentes están en BD
			for (const folder of analysisResult.existingFolders) {
				try {
					const folderInDB = await db
						.select({ id: folders.id })
						.from(folders)
						.where(eq(folders.id, folder.id))
						.limit(1);

					if (folderInDB.length === 0) {
						errors.push(`Carpeta faltante en BD: ${folder.path}`);
					} else {
						processed++;
					}
				} catch (error) {
					errors.push(
						`Error verificando carpeta ${folder.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`
					);
				}
			}

			// Verificar estadísticas generales
			const stats = await db
				.select({
					totalFolders: sql<number>`COUNT(*)`,
				})
				.from(folders)
				.where(
					inArray(
						folders.id,
						analysisResult.existingFolders.map((f) => f.id)
					)
				);

			const imageStats = await db
				.select({
					totalImages: sql<number>`COUNT(*)`,
				})
				.from(images)
				.where(
					inArray(
						images.folderId,
						analysisResult.existingFolders.map((f) => f.id)
					)
				);

			this.logger.info('📊 Estadísticas finales:', {
				carpetas: stats[0]?.totalFolders || 0,
				imagenes: imageStats[0]?.totalImages || 0,
				erroresVerificacion: errors.length,
			});

			return {
				success: errors.length === 0,
				processed,
				failed: errors.length,
				errors,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			this.logger.error('❌ Error en verificación final:', error);
			return {
				success: false,
				processed,
				failed: analysisResult.totalFolders - processed,
				errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Emite eventos de progreso si está habilitado
	 * 🔧 FIX: Emite 'folder:reindexAll:progress' para eventos globales
	 */
	private async emitProgress(phase: string, progress: number, message: string): Promise<void> {
		try {
			// 🎯 Usar evento correcto para reindexado global
			await emitProgress('folder:reindexAll:progress', {
				isProcessing: progress < 100,
				folderId: undefined,
				phase,
				progress,
				filesProcessed: 0,
				totalFiles: 0,
				message,
				timestamp: Date.now(),
			} as ProcessStatus);
		} catch (error) {
			// Silencioso - no bloquear el proceso por errores de eventos
		}
	}

	/**
	 * Estima el tiempo de procesamiento basado en la cantidad de archivos y carpetas
	 */
	private estimateProcessingTime(totalFiles: number, totalFolders: number): number {
		// Estimación basada en benchmarks típicos:
		// - ~100ms por archivo (indexado + thumbnail + metadata)
		// - ~50ms por carpeta (análisis + estructura)
		return totalFiles * 100 + totalFolders * 50;
	}
}
