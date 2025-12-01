/**
 * @file Router principal de folders
 * @module server/routes/folders
 * @description Exporta el router de Express para las rutas de carpetas
 * ✅ FIXED - Integrados módulos implementados (Oct 10, 2025)
 */

import { eq } from 'drizzle-orm';
import type { Request, Response, Router } from 'express';
import express from 'express';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { FolderReindexService } from '@/services/folders/folder-reindex.service';
import { registerFolderFilesEndpoints } from './files-endpoints';
import { registerFolderPreviewEndpoint } from './preview-endpoint';

const logger = serverLogger.withContext('FoldersRouter');

// Express 5 + TypeScript estricto requiere casteo para handlers async con return condicional
export const foldersRouter: Router = express.Router();

// ==================== BASIC ROUTES ====================

// Health check
foldersRouter.get('/health', (_req, res) => {
	res.json({ status: 'ok', service: 'folders' });
});

// GET /api/folders/tree - Obtener árbol de carpetas (ANTES de /:id para evitar conflictos)
foldersRouter.get('/tree', async (_req, res) => {
	try {
		logger.debug('🌳 GET /folders/tree - Obteniendo árbol');
		const allFolders = await db.select().from(folders);
		res.json(allFolders);
	} catch (error) {
		logger.error('Error getting folders tree:', error);
		res.status(500).json({
			error: 'Error al obtener árbol de carpetas',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders - Listar todas las carpetas
foldersRouter.get('/', async (_req, res) => {
	try {
		logger.debug('📂 GET /folders - Listando carpetas');
		const allFolders = await db.select().from(folders);
		res.json(allFolders);
	} catch (error) {
		logger.error('Error listing folders:', error);
		res.status(500).json({
			error: 'Error al listar carpetas',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// ==================== REINDEX OPERATIONS ====================

// POST /api/folders/reindex-all - Reindexar todas las carpetas (debe ir ANTES de /:id)
foldersRouter.post('/reindex-all', async (req, res) => {
	try {
		logger.info('🔄 POST /folders/reindex-all - Iniciando reindexación global');
		
		const options = req.body || {};
		const reindexService = FolderReindexService.getInstance();
		
		const result = await reindexService.executeStructuredReindex({
			emitEvents: true,
			includeSubfolders: true,
			skipThumbnails: options.skipThumbnails || false,
			skipMetadata: options.skipMetadata || false,
			concurrency: 3,
		});

		logger.info('✅ Reindexación global completada', {
			foldersProcessed: result.summary.foldersProcessed,
			filesIndexed: result.summary.filesIndexed,
		});

		res.json({
			processed: result.summary.foldersProcessed,
			errors: Object.values(result.phases)
				.flatMap(phase => phase.errors)
				.filter(Boolean),
		});
	} catch (error) {
		logger.error('Error en reindexación global:', error);
		res.status(500).json({
			error: 'Error al reindexar carpetas',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// ==================== CRUD OPERATIONS ====================

// POST /api/folders - Crear nueva carpeta
foldersRouter.post('/', async (req, res) => {
	try {
		logger.info('📝 POST /folders - Creando carpeta');
		const data = req.body;

		// Validación básica
		if (!data.path || !data.name) {
			res.status(400).json({ error: 'path y name son requeridos' });
			return;
		}

		// Verificar si ya existe una carpeta con ese path
		const existing = await db.select().from(folders).where(eq(folders.path, data.path)).limit(1);
		if (existing.length > 0) {
			logger.warn(`❌ Carpeta ya existe: ${data.path}`);
			res.status(409).json({ error: 'Ya existe una carpeta con esa ruta' });
			return;
		}

		// Generar ID único
		const { generateFolderIdFromName } = await import('@/lib/utils/folder-id-generator');
		const folderId = await generateFolderIdFromName(data.name);

		// Crear carpeta
		const newFolder = await db
			.insert(folders)
			.values({
				id: folderId,
				name: data.name,
				path: data.path,
				description: data.description || null,
				emoji: data.emoji || null,
				color: data.color || null,
				parentId: data.parentId || null,
				presetId: data.presetId || null,
				featuredImage: null,
				isFavorite: false,
				totalFiles: 0,
				totalSize: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		logger.info(`✅ Carpeta creada: ${newFolder[0].id}`);
		res.json(newFolder[0]);
	} catch (error) {
		logger.error('Error creando carpeta:', error);
		res.status(500).json({
			error: 'Error al crear carpeta',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// ==================== PARAMETRIC ROUTES ====================

// GET /api/folders/:id - Obtener carpeta específica
// GET /api/folders/:id/stats - Obtener estadísticas de carpeta (ANTES de /:id)
foldersRouter.get('/:id/stats', async (req, res) => {
	try {
		const { id } = req.params;
		logger.debug(`� GET /folders/${id}/stats - Obteniendo estadísticas`);

		const folder = await db.query.folders.findFirst({
			where: eq(folders.id, id),
		});

		if (!folder) {
			res.status(404).json({ error: 'Carpeta no encontrada' });
			return;
		}

		// Retornar estadísticas from folder record
		res.json({
			totalImages: folder.totalImages || 0,
			totalVideos: folder.totalVideos || 0,
			totalFiles: folder.totalFiles || 0,
			totalSize: folder.totalSize || 0,
			lastIndexed: folder.lastIndexed || null,
		});
	} catch (error) {
		logger.error(`Error getting folder stats ${req.params.id}:`, error);
		res.status(500).json({
			error: 'Error al obtener estadísticas',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id - Obtener carpeta específica
foldersRouter.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		logger.debug(`📂 GET /folders/${id} - Obteniendo carpeta`);

		const folder = await db.query.folders.findFirst({
			where: eq(folders.id, id),
		});

		if (!folder) {
			res.status(404).json({ error: 'Carpeta no encontrada' });
			return;
		}

		res.json(folder);
	} catch (error) {
		logger.error(`Error getting folder ${req.params.id}:`, error);
		res.status(500).json({
			error: 'Error al obtener carpeta',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/folders/:id - Actualizar carpeta
foldersRouter.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const data = req.body;
		logger.info(`✏️ PUT /folders/${id} - Actualizando carpeta`);

		// Verificar que existe
		const existing = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
		if (existing.length === 0) {
			logger.warn(`❌ Carpeta no encontrada: ${id}`);
			res.status(404).json({ error: 'Carpeta no encontrada' });
			return;
		}

		// Actualizar
		const updated = await db
			.update(folders)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(folders.id, id))
			.returning();

		logger.info(`✅ Carpeta actualizada: ${id}`);
		res.json(updated[0]);
	} catch (error) {
		logger.error(`Error actualizando carpeta ${req.params.id}:`, error);
		res.status(500).json({
			error: 'Error al actualizar carpeta',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/folders/:id - Eliminar carpeta
foldersRouter.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		logger.info(`🗑️ DELETE /folders/${id} - Eliminando carpeta`);

		const deleted = await db.delete(folders).where(eq(folders.id, id)).returning();

		if (deleted.length === 0) {
			logger.warn(`❌ Carpeta no encontrada: ${id}`);
			res.status(404).json({ error: 'Carpeta no encontrada' });
			return;
		}

		logger.info(`✅ Carpeta eliminada: ${id}`);
		res.json({ message: 'Carpeta eliminada', folder: deleted[0] });
	} catch (error) {
		logger.error(`Error eliminando carpeta ${req.params.id}:`, error);
		res.status(500).json({
			error: 'Error al eliminar carpeta',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/:id/move - Mover carpeta a otro padre
foldersRouter.post('/:id/move', async (req, res) => {
	try {
		const { id } = req.params;
		const { newParentId } = req.body;
		logger.info(`📦 POST /folders/${id}/move - Moviendo carpeta`);

		// Verificar que existe
		const existing = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
		if (existing.length === 0) {
			logger.warn(`❌ Carpeta no encontrada: ${id}`);
			res.status(404).json({ error: 'Carpeta no encontrada' });
			return;
		}

		// Actualizar parentId
		const moved = await db
			.update(folders)
			.set({
				parentId: newParentId,
				updatedAt: new Date(),
			})
			.where(eq(folders.id, id))
			.returning();

		logger.info(`✅ Carpeta movida: ${id} -> ${newParentId || 'root'}`);
		res.json(moved[0]);
	} catch (error) {
		logger.error(`Error moviendo carpeta ${req.params.id}:`, error);
		res.status(500).json({
			error: 'Error al mover carpeta',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/:id/toggle-favorite - Toggle favorito
foldersRouter.post('/:id/toggle-favorite', async (req, res) => {
	try {
		const { id } = req.params;
		logger.info(`⭐ POST /folders/${id}/toggle-favorite - Toggle favorito`);

		// Obtener estado actual
		const current = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
		if (current.length === 0) {
			logger.warn(`❌ Carpeta no encontrada: ${id}`);
			res.status(404).json({ error: 'Carpeta no encontrada' });
			return;
		}

		// Toggle
		const updated = await db
			.update(folders)
			.set({
				isFavorite: !current[0].isFavorite,
				updatedAt: new Date(),
			})
			.where(eq(folders.id, id))
			.returning();

		logger.info(`✅ Favorito toggleado: ${id} -> ${updated[0].isFavorite}`);
		res.json(updated[0]);
	} catch (error) {
		logger.error(`Error toggleando favorito ${req.params.id}:`, error);
		res.status(500).json({
			error: 'Error al cambiar favorito',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/:id/reindex - Reindexar carpeta específica
foldersRouter.post('/:id/reindex', async (req, res) => {
	try {
		const { id } = req.params;
		logger.info(`🔄 POST /folders/${id}/reindex - Iniciando reindexación`);
		
		// Verificar que la carpeta existe
		const folder = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
		if (!folder || folder.length === 0) {
			logger.warn(`❌ Carpeta no encontrada: ${id}`);
			res.status(404).json({ error: 'Carpeta no encontrada' });
			return;
		}

		const options = req.body || {};
		const reindexService = FolderReindexService.getInstance();
		
		const result = await reindexService.executeStructuredReindex({
			folderId: id,
			emitEvents: true,
			includeSubfolders: true,
			skipThumbnails: options.skipThumbnails || false,
			skipMetadata: options.skipMetadata || false,
			concurrency: 3,
		});

		logger.info(`✅ Reindexación de carpeta ${id} completada`, {
			filesIndexed: result.summary.filesIndexed,
		});

		// Devolver la carpeta actualizada
		const updatedFolder = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
		res.json(updatedFolder[0]);
	} catch (error) {
		logger.error(`Error en reindexación de carpeta ${req.params.id}:`, error);
		res.status(500).json({
			error: 'Error al reindexar carpeta',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// ==================== SUB-MODULES ====================

// Files Endpoints (GET /:folderId/files, etc.)
registerFolderFilesEndpoints(foldersRouter);
logger.info('✅ Files endpoints registered');

// Preview Endpoint
registerFolderPreviewEndpoint(foldersRouter);
logger.info('✅ Preview endpoint registered');

logger.info('✅ Folders router initialized');
