/**
 * @file Operaciones CRUD para Folders
 * @module server/routes/folders/crud
 * @description
 * Endpoints principales para operaciones de carpetas:
 * - GET / - Listar carpetas (con filtro por parentId)
 * - GET /:id - Obtener carpeta específica
 * - POST / - Crear nueva carpeta
 * - PUT /:id - Actualizar carpeta
 * - DELETE /:id - Eliminar carpeta
 * - GET /root - Obtener/crear carpeta raíz
 *
 * ✅ REFACTORIZADO - Septiembre 2025
 */

// @ts-nocheck - Temporary suppression for Express handler parameter types

import { asc, eq, isNull } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateFolderIdFromName, isValidFolderId } from '@/lib/utils/folder-id-generator';
import { getFolderMediaCountsBatch } from '@/services/folder/folder.service';
import { CreateFolderSchema } from '@/types/entities/folder/schema';

const router = Router();
const logger = serverLogger.withContext('FoldersCRUD');

// Schema de validación para actualización de carpetas
const updateFolderSchema = z
	.object({
		name: z.string().min(1).max(255).optional(),
		parentId: z.string().nullable().optional(),
		description: z.string().max(1000).nullable().optional(),
		sortOrder: z.number().int().min(0).optional(),
		isHidden: z.boolean().optional(),
		color: z
			.string()
			.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
			.nullable()
			.optional(),
		tags: z.array(z.string()).optional(),
	})
	.strict();

// GET /api/folders - Listado de carpetas (alias top-level cuando parentId == rootId)
router.get('/', async (req, res) => {
	try {
		const { parentId } = req.query as { parentId?: string };
		logger.info('📁 Obteniendo listado de carpetas', { parentId });

		// Obtener carpetas base
		const baseSelect = db
			.select({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.orderBy(asc(folders.name));

		let folderRows: any[] = [];

		if (parentId) {
			const rootRow = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, '/')).limit(1);
			if (rootRow.length && rootRow[0].id === parentId) {
				folderRows = await baseSelect.where(isNull(folders.parentId));
			} else {
				folderRows = await baseSelect.where(eq(folders.parentId, parentId));
			}
		} else {
			folderRows = await baseSelect;
		}

		// Enriquecer con conteos por tipo (batch, evita N+1)
		const ids = folderRows.map((f) => f.id);
		const countsMap = await getFolderMediaCountsBatch(ids);

		const enrichedFolders = folderRows.map((folder) => {
			const c = countsMap[folder.id] ?? {
				images: 0,
				videos: 0,
				audios: 0,
				documents: 0,
				jsonFiles: 0,
				file3Ds: 0,
			};
			return {
				...folder,
				// Compatibilidad existente
				totalImages: c.images,
				imageCount: c.images,
				totalVideos: c.videos,
				videoCount: c.videos,
				// Campos extendidos (no romper UI si no los usan todavía)
				totalAudios: c.audios,
				audioCount: c.audios,
				totalDocuments: c.documents,
				documentCount: c.documents,
				totalJsonFiles: c.jsonFiles,
				jsonFileCount: c.jsonFiles,
				totalFile3Ds: c.file3Ds,
				file3DCount: c.file3Ds,
			};
		});

		logger.info('✅ Listado de carpetas obtenido', {
			total: enrichedFolders.length,
			withImages: enrichedFolders.filter((f) => (f as any).totalImages > 0).length,
			withVideos: enrichedFolders.filter((f) => (f as any).totalVideos > 0).length,
		});

		return res.json(enrichedFolders);
	} catch (error) {
		logger.error('Error al obtener carpetas', { error });
		return res.status(500).json({
			error: 'Error al obtener carpetas',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/root - Obtener carpeta raíz (crear si no existe)
router.get('/root', async (_req, res) => {
	try {
		logger.info('🔍 Obteniendo carpeta raíz');

		// Buscar carpeta raíz existente
		let rootFolder = await db
			.select({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.where(eq(folders.path, '/'))
			.limit(1);

		// Si no existe, crear carpeta raíz
		if (rootFolder.length === 0) {
			logger.info('🆕 Creando carpeta raíz');
			const rootId = await generateFolderIdFromName('Root');
			const inserted = await db
				.insert(folders)
				.values({
					id: rootId,
					name: 'Root',
					description: 'Carpeta raíz del sistema',
					path: '/',
					emoji: '🏠',
					color: '#3b82f6',
					featuredImage: null,
					isFavorite: false,
					totalFiles: 0,
					totalSize: 0,
					parentId: null,
					presetId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastIndexed: null,
				})
				.returning({
					id: folders.id,
					name: folders.name,
					description: folders.description,
					path: folders.path,
					emoji: folders.emoji,
					color: folders.color,
					featuredImage: folders.featuredImage,
					isFavorite: folders.isFavorite,
					totalFiles: folders.totalFiles,
					totalSize: folders.totalSize,
					lastIndexed: folders.lastIndexed,
					createdAt: folders.createdAt,
					updatedAt: folders.updatedAt,
					parentId: folders.parentId,
					presetId: folders.presetId,
				});
			rootFolder = inserted;
		}
		return res.json(rootFolder[0]);
	} catch (error) {
		logger.error('Error al obtener/crear la carpeta raíz', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders - Crear carpeta
router.post('/', async (req, res) => {
	try {
		const validationResult = CreateFolderSchema.safeParse(req.body);
		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.issues,
			});
		}

		const data = validationResult.data;
		const existingFolder = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, data.path));
		if (existingFolder.length > 0) {
			return res.status(409).json({ error: 'Ya existe una carpeta con esa ruta' });
		}

		const folderId = await generateFolderIdFromName(data.name);
		const newFolder = await db
			.insert(folders)
			.values({
				id: folderId,
				name: data.name,
				description: data.description ?? null,
				path: data.path,
				emoji: data.emoji ?? null,
				color: data.color ?? null,
				featuredImage: data.featuredImage ?? null,
				isFavorite: data.isFavorite ?? false,
				totalFiles: 0,
				totalSize: 0,
				parentId: data.parentId ?? null,
				presetId: data.presetId ?? null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});

		return res.status(201).json(newFolder[0]);
	} catch (error) {
		logger.error('Error al crear carpeta', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id - Obtener carpeta específica
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db
			.select({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.where(eq(folders.id, id))
			.limit(1);

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		// Enriquecer con conteos
		const countsMap = await getFolderMediaCountsBatch([id]);
		const c = countsMap[id] ?? {
			images: 0,
			videos: 0,
			audios: 0,
			documents: 0,
			jsonFiles: 0,
			file3Ds: 0,
		};

		const enrichedFolder = {
			...folder[0],
			totalImages: c.images,
			imageCount: c.images,
			totalVideos: c.videos,
			videoCount: c.videos,
			totalAudios: c.audios,
			audioCount: c.audios,
			totalDocuments: c.documents,
			documentCount: c.documents,
			totalJsonFiles: c.jsonFiles,
			jsonFileCount: c.jsonFiles,
			totalFile3Ds: c.file3Ds,
			file3DCount: c.file3Ds,
		};

		return res.json(enrichedFolder);
	} catch (error) {
		logger.error('Error al obtener carpeta', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/folders/:id - Actualizar carpeta
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		// Validar datos de entrada
		const validationResult = updateFolderSchema.safeParse(req.body);
		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const validatedData = validationResult.data;

		// Aplicar la actualización
		const updatedFolder = await db
			.update(folders)
			.set({
				...validatedData,
				updatedAt: new Date(),
			})
			.where(eq(folders.id, id))
			.returning();

		if (updatedFolder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		return res.json(updatedFolder[0]);
	} catch (error) {
		logger.error('Error al actualizar carpeta', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/folders/:id - Eliminar carpeta
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const deletedFolder = await db.delete(folders).where(eq(folders.id, id)).returning();

		if (deletedFolder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		return res.json({ message: 'Carpeta eliminada exitosamente', folder: deletedFolder[0] });
	} catch (error) {
		logger.error('Error al eliminar carpeta', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as crudRoutes };
