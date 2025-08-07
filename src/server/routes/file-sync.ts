/**
 * @file Rutas de API para sincronización de archivos
 * @module server/routes/file-sync
 * @description Endpoints para sincronizar archivos individuales con el sistema de archivos
 */

import { Router } from 'express';
import { fileSyncService } from '@/lib/filesystem/file-sync.service';
import { serverLogger } from '@/lib/logger/server-logger';

const router = Router();
const logger = serverLogger.withContext('FileSyncAPI');

// POST /api/folders/:id/sync-files - Sincronizar archivos de una carpeta específica
router.post('/:id/sync-files', async (req, res) => {
	try {
		const { id: folderId } = req.params;
		const { dryRun = false, includeHidden = false, entityTypes } = req.body;

		logger.info('🔄 Iniciando sincronización de archivos:', {
			folderId,
			dryRun,
			includeHidden,
			entityTypes,
		});

		const result = await fileSyncService.syncFolderFiles(folderId, {
			dryRun,
			includeHidden,
			entityTypes,
			forceSync: true,
		});

		logger.info('✅ Sincronización de archivos completada:', {
			folderId,
			totalChecked: result.stats.totalChecked,
			filesRemoved: result.stats.filesRemoved,
			newFilesFound: result.stats.newFilesFound,
			errors: result.errors.length,
			dryRun,
		});

		res.json({
			totalChecked: result.stats.totalChecked,
			filesRemoved: result.stats.filesRemoved,
			newFilesFound: result.stats.newFilesFound,
			duration: result.stats.duration,
			removedFiles: result.removedFiles,
			newFiles: result.newFiles,
			errors: result.errors,
		});
	} catch (error) {
		logger.error('❌ Error en sincronización de archivos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/sync-all-files - Sincronizar archivos de todas las carpetas
router.post('/sync-all-files', async (req, res) => {
	try {
		const { dryRun = false, includeHidden = false, entityTypes } = req.body;

		logger.info('🔄 Iniciando sincronización global de archivos:', {
			dryRun,
			includeHidden,
			entityTypes,
		});

		// Obtener todas las carpetas
		const { db } = await import('@/lib/drizzle');
		const { folders } = await import('@/lib/drizzle/schema/index');

		const allFolders = await db.select({ id: folders.id, name: folders.name }).from(folders);

		const folderIds = allFolders.map((f: { id: string }) => f.id);

		const results = await fileSyncService.syncMultipleFolders(folderIds, {
			dryRun,
			includeHidden,
			entityTypes,
			forceSync: true,
		});

		// Calcular estadísticas globales
		const globalStats = Object.values(results).reduce(
			(acc, result) => ({
				totalChecked: acc.totalChecked + result.stats.totalChecked,
				filesRemoved: acc.filesRemoved + result.stats.filesRemoved,
				newFilesFound: acc.newFilesFound + result.stats.newFilesFound,
				totalErrors: acc.totalErrors + result.errors.length,
			}),
			{ totalChecked: 0, filesRemoved: 0, newFilesFound: 0, totalErrors: 0 }
		);

		logger.info('✅ Sincronización global de archivos completada:', {
			foldersProcessed: folderIds.length,
			...globalStats,
			dryRun,
		});

		// Convertir resultados al formato esperado por el hook
		const formattedResults: Record<string, any> = {};

		for (const [folderId, result] of Object.entries(results)) {
			formattedResults[folderId] = {
				isSyncing: false,
				removedFiles: result.removedFiles,
				newFiles: result.newFiles,
				errors: result.errors,
				stats: {
					totalChecked: result.stats.totalChecked,
					filesRemoved: result.stats.filesRemoved,
					newFilesFound: result.stats.newFilesFound,
					duration: result.stats.duration,
				},
				lastSync: new Date(),
			};
		}

		res.json(formattedResults);
	} catch (error) {
		logger.error('❌ Error en sincronización global de archivos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/sync-status - Verificar estado de sincronización sin hacer cambios
router.get('/:id/sync-status', async (req, res) => {
	try {
		const { id: folderId } = req.params;
		const { includeHidden = false, entityTypes } = req.query;

		logger.info('🔍 Verificando estado de sincronización:', { folderId });

		const result = await fileSyncService.checkSyncStatus(folderId, {
			includeHidden: includeHidden === 'true',
			entityTypes: entityTypes ? JSON.parse(entityTypes as string) : undefined,
		});

		res.json({
			totalChecked: result.stats.totalChecked,
			filesRemoved: result.stats.filesRemoved,
			newFilesFound: result.stats.newFilesFound,
			duration: result.stats.duration,
			removedFiles: result.removedFiles,
			newFiles: result.newFiles,
			errors: result.errors,
		});
	} catch (error) {
		logger.error('❌ Error verificando estado de sincronización:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export default router;
