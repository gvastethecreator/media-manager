/**
 * 📊 FOLDER STATS - FUNCIONES PRINCIPALES
 *
 * Procesamiento y actualización de estadísticas de carpetas
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { recomputeAndPersistFolderAggregates } from './folder-stats.aggregates';
import type { ProcessOptions, ProgressEmitter, SimpleStats } from './folder-stats.types';
import { computeOverallProgress, mapWithConcurrency, safeEmitProgress } from './folder-stats.utils';

export { getFolderStats, recomputeAndPersistFolderAggregates } from './folder-stats.aggregates';
// Re-export tipos y utilidades para backward compatibility
export type {
	AggregateResult,
	FileEntityMapper,
	ProcessOptions,
	ProgressEmitter,
	SimpleStats,
} from './folder-stats.types';
export { computeOverallProgress, mapWithConcurrency, safeEmitProgress } from './folder-stats.utils';

export async function processFilesWithProgress(
	filePaths: string[],
	folderId: string,
	fileEntityMapper: {
		createBasicEntityFromFile: (
			filePath: string,
			folderId: string
		) => Promise<{ success: boolean; entityId?: string; entityType?: string }>;
		extractMetadataForEntity: (filePath: string, entityId: string) => Promise<{ success: boolean }>;
		processThumbnailForEntity: (filePath: string, entityId: string) => Promise<{ success: boolean }>;
	},
	emitEvents: boolean,
	options: ProcessOptions = {}
): Promise<SimpleStats> {
	const total = filePaths.length;
	if (total === 0) {
		return { totalFiles: 0, processed: 0, successful: 0, failed: 0, errors: [] };
	}

	const concurrency = Math.max(1, options.concurrency ?? 3);
	const microPauseMs = options.microPauseMs ?? 6;
	const emit: ProgressEmitter | null = emitEvents
		? (options.progressEmitter ??
			((p) => {
				// emitir progresos de forma segura sin bloquear
				safeEmitProgress(p).catch(() => {
					/* no-op */
				});
			}))
		: null;

	const stats: SimpleStats = { totalFiles: total, processed: 0, successful: 0, failed: 0, errors: [] };

	if (emit)
		emit({
			isProcessing: true,
			folderId,
			phase: 'starting',
			progress: 0,
			filesProcessed: 0,
			totalFiles: total,
			timestamp: Date.now(),
		});

	// Etapa 1: Indexación
	let stageProcessed = 0;
	const createdIds: (string | null)[] = new Array(total).fill(null);
	if (emit)
		emit({
			isProcessing: true,
			folderId,
			phase: 'scanning',
			progress: computeOverallProgress(1, 0, total),
			filesProcessed: 0,
			totalFiles: total,
			timestamp: Date.now(),
		});
	await mapWithConcurrency(filePaths, Math.min(concurrency, 2), async (fp, idx) => {
		try {
			const res = await fileEntityMapper.createBasicEntityFromFile(fp, folderId);
			if (res.success) {
				createdIds[idx] = res.entityId ?? null;
				stats.successful += 1;
			} else {
				stats.failed += 1;
				stats.errors.push({ file: fp, error: 'createBasicEntityFromFile failed' });
			}
		} catch (e) {
			stats.failed += 1;
			stats.errors.push({ file: fp, error: e instanceof Error ? e.message : String(e) });
		} finally {
			stageProcessed += 1;
			stats.processed += 1;
			if (emit)
				emit({
					isProcessing: true,
					folderId,
					phase: 'scanning',
					progress: computeOverallProgress(1, stageProcessed, total),
					filesProcessed: stageProcessed,
					totalFiles: total,
					timestamp: Date.now(),
				});
		}
	});
	if (emit)
		emit({
			isProcessing: true,
			folderId,
			phase: 'scanning',
			progress: computeOverallProgress(1, total, total),
			filesProcessed: total,
			totalFiles: total,
			timestamp: Date.now(),
		});
	if (microPauseMs > 0) await new Promise((r) => setTimeout(r, microPauseMs));

	// Etapa 2: Thumbnails (procesamiento visual)
	stageProcessed = 0;
	if (emit)
		emit({
			isProcessing: true,
			folderId,
			phase: 'processing',
			progress: computeOverallProgress(2, 0, total),
			filesProcessed: stats.processed,
			totalFiles: total,
			timestamp: Date.now(),
		});
	await mapWithConcurrency(filePaths, concurrency, async (fp, idx) => {
		const id = createdIds[idx];
		if (!id) return;
		try {
			await fileEntityMapper.processThumbnailForEntity(fp, id);
		} catch (e) {
			stats.errors.push({ file: fp, error: e instanceof Error ? e.message : String(e) });
		} finally {
			stageProcessed += 1;
			if (emit)
				emit({
					isProcessing: true,
					folderId,
					phase: 'processing',
					progress: computeOverallProgress(2, stageProcessed, total),
					filesProcessed: stats.processed,
					totalFiles: total,
					timestamp: Date.now(),
				});
		}
	});
	if (emit)
		emit({
			isProcessing: true,
			folderId,
			phase: 'processing',
			progress: computeOverallProgress(2, total, total),
			filesProcessed: stats.processed,
			totalFiles: total,
			timestamp: Date.now(),
		});
	if (microPauseMs > 0) await new Promise((r) => setTimeout(r, microPauseMs));

	// Etapa 3: Metadata
	stageProcessed = 0;
	if (emit)
		emit({
			isProcessing: true,
			folderId,
			phase: 'metadata',
			progress: computeOverallProgress(3, 0, total),
			filesProcessed: stats.processed,
			totalFiles: total,
			timestamp: Date.now(),
		});
	await mapWithConcurrency(filePaths, concurrency, async (fp, idx) => {
		const id = createdIds[idx];
		if (!id) return;
		try {
			await fileEntityMapper.extractMetadataForEntity(fp, id);
		} catch (e) {
			stats.errors.push({ file: fp, error: e instanceof Error ? e.message : String(e) });
		} finally {
			stageProcessed += 1;
			if (emit)
				emit({
					isProcessing: true,
					folderId,
					phase: 'metadata',
					progress: computeOverallProgress(3, stageProcessed, total),
					filesProcessed: stats.processed,
					totalFiles: total,
					timestamp: Date.now(),
				});
		}
	});
	if (emit)
		emit({
			isProcessing: true,
			folderId,
			phase: 'metadata',
			progress: computeOverallProgress(3, total, total),
			filesProcessed: stats.processed,
			totalFiles: total,
			timestamp: Date.now(),
		});

	return stats;
}

// Stubs seguros para API pública actual (se implementarán cuando se integre con servicios reales)
export async function updateFolderStats(
	folderId: string,
	_processedPaths: Set<string> = new Set(),
	_maxDepth = 10,
	_currentDepth = 0,
	_enableSync = true,
	_emitProgressEvents = true
): Promise<SimpleStats> {
	// 1) Obtener info de carpeta desde BD
	const { db } = await import('@/lib/drizzle');
	const { folders } = await import('@/lib/drizzle/schema/index');
	const { eq } = await import('drizzle-orm');
	const folderRows = await db
		.select({ id: folders.id, path: folders.path, name: folders.name })
		.from(folders)
		.where(eq(folders.id, folderId))
		.limit(1);
	if (folderRows.length === 0) {
		return { totalFiles: 0, processed: 0, successful: 0, failed: 0, errors: [{ file: '', error: 'Folder not found' }] };
	}
	const folderPath = folderRows[0].path;

	// 1b) Validar existencia en FS; si no existe, eliminar de DB y emitir evento
	try {
		const { folderExists } = await import('@/lib/filesystem/folder-scanner');
		const exists = await folderExists(folderPath);
		if (!exists) {
			serverLogger.warn('updateFolderStats: carpeta no existe en FS; eliminando de DB', { folderId, folderPath });
			await db.delete(folders).where(eq(folders.id, folderId));
			try {
				const { emit } = await import('@/lib/server/events.server');
				await emit({ type: 'directory:deleted', data: { folderId, path: folderPath, timestamp: Date.now() } });
			} catch {}
			return { totalFiles: 0, processed: 0, successful: 0, failed: 0, errors: [] };
		}
	} catch (e) {
		serverLogger.error('updateFolderStats: error comprobando existencia en FS', { err: e, folderId, folderPath });
	}

	// 2) Sincronizar subcarpetas (agregar faltantes y reconciliar parentId)
	try {
		const { syncSpecificFolder } = await import('@/lib/filesystem/folder-sync');
		await syncSpecificFolder(folderId, { dryRun: false, forceSync: true });
	} catch (e) {
		serverLogger.warn('updateFolderStats: fallo sincronizando subcarpetas; continuo', { err: e, folderId });
	}

	// 3) Escanear carpeta para obtener archivos soportados (RECURSIVO para incluir subcarpetas)
	const { scanFolder } = await import('@/lib/filesystem/folder-scanner');
	const scan = await scanFolder(folderPath, { recursive: true, includeHidden: false, limit: 0 });
	const filePaths = scan.files.map((f: any) => f.path);

	// 3b) Carpeta vacía: emitir y retornar temprano
	if (filePaths.length === 0) {
		serverLogger.info('updateFolderStats: carpeta vacía', { folderId, folderPath });
		const { emitProgress, emit } = await import('@/lib/server/events.server');
		if (_emitProgressEvents) {
			await emitProgress('folder:progress', {
				isProcessing: false,
				status: 'completed',
				folderId,
				phase: 'complete',
				progress: 100,
				filesProcessed: 0,
				totalFiles: 0,
				message: 'empty-folder',
				timestamp: Date.now(),
			});
		}
		await emit({
			type: 'folder:stats',
			data: { folderId, totalFiles: 0, totalSize: 0, processed: 0, successful: 0, failed: 0 },
		});
		await emit({
			type: 'folder:complete',
			data: { folderId, success: true, totalFiles: 0, totalSize: 0, timestamp: Date.now() },
		});
		return { totalFiles: 0, processed: 0, successful: 0, failed: 0, errors: [] };
	}

	// 4) Sincronización opcional de archivos (solo si se pide)
	if (_enableSync) {
		try {
			const { FileSyncService } = await import('@/lib/filesystem/file-sync.service');
			const svc = FileSyncService.getInstance();
			await svc.syncFolderFiles(folderId, { dryRun: false });
		} catch {
			// continuar aunque la sync falle; se registrará en servicios
		}
	}

	// 5) Emitir inicio
	const { emitProgress, emit } = await import('@/lib/server/events.server');
	if (_emitProgressEvents) {
		await emitProgress('folder:progress', {
			isProcessing: true,
			status: 'processing',
			folderId,
			phase: 'starting',
			progress: 0,
			filesProcessed: 0,
			totalFiles: filePaths.length,
		});
	}

	// 6) Preparar mapper de entidades usando servicio existente
	const { FileEntityMapperService } = await import('@/services/file-entity-mapper/file-entity-mapper.service');
	const mapper = FileEntityMapperService.getInstance();

	const fileEntityMapper = {
		createBasicEntityFromFile: (filePath: string, folderId2: string) =>
			mapper.createBasicEntityFromFile(filePath, folderId2),
		extractMetadataForEntity: async (filePath: string, entityId: string) => {
			try {
				if (typeof (mapper as any).extractMetadataForEntity === 'function') {
					const ext = (await import('node:path')).extname(filePath).toLowerCase();
					const entityType = mapper.getEntityTypeFromExtension(ext);
					return await (mapper as any).extractMetadataForEntity(filePath, entityId, entityType);
				}
				return { success: true } as const;
			} catch (e) {
				return { success: false, error: e instanceof Error ? e.message : String(e) } as any;
			}
		},
		processThumbnailForEntity: async (filePath: string, entityId: string) => {
			try {
				if (typeof (mapper as any).processThumbnailForEntity === 'function') {
					const ext = (await import('node:path')).extname(filePath).toLowerCase();
					const entityType = mapper.getEntityTypeFromExtension(ext);
					return await (mapper as any).processThumbnailForEntity(filePath, entityId, entityType);
				}
				return { success: true } as const;
			} catch (e) {
				return { success: false, error: e instanceof Error ? e.message : String(e) } as any;
			}
		},
	} as const;

	// 7) Procesar archivos con progreso (Etapas: index → thumbnails → metadata)
	const stats = await processFilesWithProgress(filePaths, folderId, fileEntityMapper, _emitProgressEvents, {
		concurrency: 3,
		microPauseMs: 6,
	});

	// 8) Recalcular agregados y persistir
	const { totalFiles: aggregatedTotalFiles, totalSize: aggregatedTotalSize } =
		await recomputeAndPersistFolderAggregates(folderId);

	// 9) Emitir finalización y evento de stats
	if (_emitProgressEvents) {
		await emitProgress('folder:progress', {
			isProcessing: false,
			status: 'completed',
			folderId,
			phase: 'complete',
			progress: 100,
			filesProcessed: stats.processed,
			totalFiles: aggregatedTotalFiles,
			message: `Completado: ${stats.successful}/${stats.totalFiles}`,
			timestamp: Date.now(),
		});
	}

	await emit({
		type: 'folder:stats',
		data: {
			folderId,
			totalFiles: aggregatedTotalFiles,
			totalSize: aggregatedTotalSize,
			processed: stats.processed,
			successful: stats.successful,
			failed: stats.failed,
		},
	});

	// Emitir evento de completado explícito para que los hooks limpien estado
	await emit({
		type: 'folder:complete',
		data: {
			folderId,
			success: true,
			totalFiles: aggregatedTotalFiles,
			totalSize: aggregatedTotalSize,
			timestamp: Date.now(),
		},
	});

	return stats;
}

export async function updateAllFolderStats(): Promise<void> {
	const { db } = await import('@/lib/drizzle');
	const { folders, images, videos, audios, documents, jsonFiles, file3Ds } = await import('@/lib/drizzle/schema/index');
	const { recomputeAggregatesForFolder } = await import('@/server/services/aggregates.service');
	const { eq, sql } = await import('drizzle-orm');

	// 1) Limpieza: sincronizar carpetas contra el sistema de archivos (elimina inexistentes, agrega nuevas)
	try {
		const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');
		await syncFoldersWithFileSystem({ dryRun: false, forceSync: true });
	} catch {
		// Continuar aunque falle la sync de carpetas; no bloquear recálculo
	}

	// 2) Recalcular agregados para todas las carpetas con concurrencia limitada
	const all = await db.select({ id: folders.id }).from(folders);
	const ids: string[] = all.map((f: { id: string }) => f.id);

	await mapWithConcurrency<string, void>(ids, 4, async (id) => {
		const [imgAgg] = await db
			.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${images.size}), 0)` })
			.from(images)
			.where(eq(images.folderId, id));
		const [vidAgg] = await db
			.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${videos.size}), 0)` })
			.from(videos)
			.where(eq(videos.folderId, id));
		const [audAgg] = await db
			.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${audios.size}), 0)` })
			.from(audios)
			.where(eq(audios.folderId, id));
		const [docAgg] = await db
			.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${documents.size}), 0)` })
			.from(documents)
			.where(eq(documents.folderId, id));
		const [jsonAgg] = await db
			.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)` })
			.from(jsonFiles)
			.where(eq(jsonFiles.folderId, id));
		const [f3dAgg] = await db
			.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)` })
			.from(file3Ds)
			.where(eq(file3Ds.folderId, id));

		const totalFiles =
			Number(imgAgg?.count ?? 0) +
			Number(vidAgg?.count ?? 0) +
			Number(audAgg?.count ?? 0) +
			Number(docAgg?.count ?? 0) +
			Number(jsonAgg?.count ?? 0) +
			Number(f3dAgg?.count ?? 0);
		const totalSize =
			Number(imgAgg?.size ?? 0) +
			Number(vidAgg?.size ?? 0) +
			Number(audAgg?.size ?? 0) +
			Number(docAgg?.size ?? 0) +
			Number(jsonAgg?.size ?? 0) +
			Number(f3dAgg?.size ?? 0);

		await db.update(folders).set({ totalFiles, totalSize, lastIndexed: new Date() }).where(eq(folders.id, id));
		try {
			await recomputeAggregatesForFolder(id);
		} catch {}
	});
}

// Reindexación global en 3 pasadas: 1) index de TODOS los archivos de TODAS las carpetas,
// 2) thumbnails de TODOS, 3) metadata de TODOS. No por carpeta.
export async function reindexAllFoldersThreePasses(
	options: { concurrency?: number; microPauseMs?: number; includeHidden?: boolean } = {}
): Promise<{
	totalItems: number;
	processed: number;
	successful: number;
	failed: number;
	errors: Array<{ file: string; error: string }>;
}> {
	const { emit, emitProgress } = await import('@/lib/server/events.server');
	const { db } = await import('@/lib/drizzle');
	const { folders } = await import('@/lib/drizzle/schema/index');
	const { eq } = await import('drizzle-orm');
	const { folderExists, scanFolder } = await import('@/lib/filesystem/folder-scanner');
	const { FileEntityMapperService } = await import('@/services/file-entity-mapper/file-entity-mapper.service');

	const concurrency = Math.max(1, options.concurrency ?? 4);
	const microPauseMs = options.microPauseMs ?? 6;
	const includeHidden = options.includeHidden ?? false;

	// 0) Sincronizar estructura de carpetas primero
	try {
		const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');
		await syncFoldersWithFileSystem({ dryRun: false, forceSync: true });
	} catch (e) {
		serverLogger.warn('reindexAll: fallo syncFoldersWithFileSystem; continúo', { err: e });
	}

	const allFolders = await db.select({ id: folders.id, path: folders.path, name: folders.name }).from(folders);

	// 1) Depurar carpetas inexistentes físicamente
	const stillExisting: { id: string; path: string; name: string }[] = [];
	for (const f of allFolders) {
		try {
			if (await folderExists(f.path)) {
				stillExisting.push(f);
			} else {
				serverLogger.warn('reindexAll: carpeta inexistente en FS; eliminando de DB', { id: f.id, path: f.path });
				await db.delete(folders).where(eq(folders.id, f.id));
				try {
					await emit({ type: 'directory:deleted', data: { folderId: f.id, path: f.path, timestamp: Date.now() } });
				} catch {}
			}
		} catch (e) {
			serverLogger.warn('reindexAll: error verificando carpeta', { id: f.id, path: f.path, err: e });
		}
	}

	// 1.b) Purga de archivos huérfanos en BD antes de procesar (evita file_not_found en thumbnails)
	try {
		const { syncMultipleFolders } = await import('@/lib/filesystem/file-sync.service');
		const folderIds = stillExisting.map((f) => f.id);
		if (folderIds.length > 0) {
			await syncMultipleFolders(folderIds, { dryRun: false, forceSync: true });
		}
	} catch (e) {
		serverLogger.warn('reindexAll: fallo sincronizando archivos por carpeta; continúo', { err: e });
	}

	// 2) Escanear TODAS las carpetas (RECURSIVO para incluir archivos en subcarpetas)
	type Item = { filePath: string; folderId: string };
	const items: Item[] = [];
	for (const f of stillExisting) {
		try {
			const scan = await scanFolder(f.path, { recursive: true, includeHidden, limit: 0 });
			for (const file of scan.files) items.push({ filePath: file.path, folderId: f.id });
		} catch (e) {
			serverLogger.warn('reindexAll: fallo escaneando carpeta; continúo', { id: f.id, path: f.path, err: e });
		}
	}

	const total = items.length;
	const createdIds: (string | null)[] = new Array(total).fill(null);
	const stats: SimpleStats = { totalFiles: total, processed: 0, successful: 0, failed: 0, errors: [] };

	await emitProgress('folder:reindexAll:start', {
		isProcessing: true,
		folderId: 'ALL',
		phase: 'starting',
		progress: 0,
		filesProcessed: 0,
		totalFiles: total,
		timestamp: Date.now(),
	});

	// Preparar mapper de servicio
	const mapper = FileEntityMapperService.getInstance();

	// PASO 1: INDEX para TODOS los archivos
	await emitProgress('folder:reindexAll:progress', {
		isProcessing: true,
		folderId: 'ALL',
		phase: 'scanning',
		progress: computeOverallProgress(1, 0, total),
		filesProcessed: 0,
		totalFiles: total,
		timestamp: Date.now(),
	});
	let processed = 0;
	await mapWithConcurrency(items, Math.min(concurrency, 3), async (it, idx) => {
		try {
			const res = await mapper.createBasicEntityFromFile(it.filePath, it.folderId);
			if (res?.success) {
				createdIds[idx] = res.entityId ?? null;
				stats.successful += 1;
			} else {
				stats.failed += 1;
				stats.errors.push({ file: it.filePath, error: 'createBasicEntityFromFile failed' });
			}
		} catch (e) {
			stats.failed += 1;
			stats.errors.push({ file: it.filePath, error: e instanceof Error ? e.message : String(e) });
		} finally {
			processed += 1;
			stats.processed += 1;
			await emitProgress('folder:reindexAll:progress', {
				isProcessing: true,
				folderId: 'ALL',
				phase: 'scanning',
				progress: computeOverallProgress(1, processed, total),
				filesProcessed: processed,
				totalFiles: total,
				timestamp: Date.now(),
			});
		}
	});
	if (microPauseMs > 0) await new Promise((r) => setTimeout(r, microPauseMs));

	// PASO 2: THUMBNAILS para TODOS
	processed = 0;
	await emitProgress('folder:reindexAll:progress', {
		isProcessing: true,
		folderId: 'ALL',
		phase: 'processing',
		progress: computeOverallProgress(2, 0, total),
		filesProcessed: stats.processed,
		totalFiles: total,
		timestamp: Date.now(),
	});
	await mapWithConcurrency(items, concurrency, async (it, idx) => {
		const id = createdIds[idx];
		if (!id) return;
		try {
			const ext = (await import('node:path')).extname(it.filePath).toLowerCase();
			const entityType = mapper.getEntityTypeFromExtension(ext);
			if (typeof (mapper as any).processThumbnailForEntity === 'function') {
				await (mapper as any).processThumbnailForEntity(it.filePath, id, entityType);
			}
		} catch (e) {
			stats.errors.push({ file: it.filePath, error: e instanceof Error ? e.message : String(e) });
		} finally {
			processed += 1;
			await emitProgress('folder:reindexAll:progress', {
				isProcessing: true,
				folderId: 'ALL',
				phase: 'processing',
				progress: computeOverallProgress(2, processed, total),
				filesProcessed: stats.processed,
				totalFiles: total,
				timestamp: Date.now(),
			});
		}
	});
	if (microPauseMs > 0) await new Promise((r) => setTimeout(r, microPauseMs));

	// PASO 3: METADATA para TODOS
	processed = 0;
	await emitProgress('folder:reindexAll:progress', {
		isProcessing: true,
		folderId: 'ALL',
		phase: 'metadata',
		progress: computeOverallProgress(3, 0, total),
		filesProcessed: stats.processed,
		totalFiles: total,
		timestamp: Date.now(),
	});
	await mapWithConcurrency(items, concurrency, async (it, idx) => {
		const id = createdIds[idx];
		if (!id) return;
		try {
			const ext = (await import('node:path')).extname(it.filePath).toLowerCase();
			const entityType = mapper.getEntityTypeFromExtension(ext);
			if (typeof (mapper as any).extractMetadataForEntity === 'function') {
				await (mapper as any).extractMetadataForEntity(it.filePath, id, entityType);
			}
		} catch (e) {
			stats.errors.push({ file: it.filePath, error: e instanceof Error ? e.message : String(e) });
		} finally {
			processed += 1;
			await emitProgress('folder:reindexAll:progress', {
				isProcessing: true,
				folderId: 'ALL',
				phase: 'metadata',
				progress: computeOverallProgress(3, processed, total),
				filesProcessed: stats.processed,
				totalFiles: total,
				timestamp: Date.now(),
			});
		}
	});

	// Recalcular agregados por carpeta
	const folderIds = Array.from(new Set(stillExisting.map((f) => f.id)));
	await mapWithConcurrency(folderIds, 4, async (id) => {
		try {
			await recomputeAndPersistFolderAggregates(id);
		} catch (e) {
			serverLogger.warn('reindexAll: fallo recalculando agregados', { id, err: e });
		}
	});

	await emitProgress('folder:reindexAll:complete', {
		isProcessing: false,
		folderId: 'ALL',
		phase: 'complete',
		progress: 100,
		filesProcessed: stats.processed,
		totalFiles: total,
		timestamp: Date.now(),
	});

	return {
		totalItems: total,
		processed: stats.processed,
		successful: stats.successful,
		failed: stats.failed,
		errors: stats.errors,
	};
}
