// Drizzle imports

import * as crypto from 'crypto';
import { asc, count, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { folders, images, videos } from '@/lib/drizzle/schema/index';
import { generateFolderIdFromName, isValidFolderId } from '@/lib/utils/folder-id-generator';

const router = Router();

// Schema de validación para crear carpeta
const CreateFolderSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	description: z.string().max(1000).optional().nullable(),
	path: z.string().min(1, 'La ruta es requerida').max(500),
	emoji: z.string().max(10).optional().nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
		.nullable(),
	featuredImage: z.string().url().optional().nullable(),
	isFavorite: z.boolean().default(false).optional(),
	autoReindex: z.boolean().default(true),
	parentId: z.string().min(1).optional().nullable(),
	presetId: z.string().min(1).optional().nullable(),
});

// Schema de validación para actualizar carpeta
const UpdateFolderSchema = CreateFolderSchema.partial().omit({ path: true });

// GET /api/folders - Obtener todas las carpetas
router.get('/', async (_req, res) => {
	try {
		console.log('🔍 Obteniendo carpetas con Drizzle ORM');

		const drizzleFolders = await db
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.orderBy(asc(folders.name));

		// Transformar a formato compatible
		const transformedFolders = drizzleFolders.map((folder) => ({
			...folder,
			isFavorite: Boolean(folder.isFavorite),
			autoReindex: Boolean(folder.autoReindex),
			// Relaciones vacías por ahora (TODO: implementar JOINs)
			preset: null,
			parent: null,
			children: [],
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				documents: 0,
				file3Ds: 0,
				jsonFiles: 0,
				audios: 0,
			},
		}));

		console.log(`✅ ${transformedFolders.length} carpetas obtenidas con Drizzle`);

		// Devolver estructura compatible con FoldersResponse
		res.json({
			data: transformedFolders,
			pagination: {
				total: transformedFolders.length,
				limit: 100, // Default limit
				offset: 0,
				hasNext: false,
				hasPrevious: false,
			},
		});
	} catch (error) {
		console.error('❌ Error al obtener carpetas:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/by-path - Obtener el ID de una carpeta por su ruta
router.get('/by-path', async (req, res) => {
	try {
		const folderPath = req.query.path as string;
		console.log('🔍 [BY-PATH] Parámetros recibidos:', { query: req.query, path: folderPath });

		if (!folderPath) {
			console.log('❌ [BY-PATH] Error: La ruta es requerida');
			return res.status(400).json({ error: 'La ruta es requerida' });
		}

		const folder = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, folderPath));

		if (!folder || folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada para la ruta proporcionada' });
		}
		res.json({ id: folder[0].id });
	} catch (error) {
		console.error('Error al obtener el ID de la carpeta por ruta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/root - Obtener carpeta raíz
router.get('/root', async (_req, res) => {
	try {
		const rootFolder = await db
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.where(eq(folders.path, '/'));

		if (rootFolder.length === 0) {
			return res.status(404).json({ error: 'Carpeta raíz no encontrada' });
		}
		res.json(rootFolder[0]);
	} catch (error) {
		console.error('Error al obtener la carpeta raíz:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id - Obtener una carpeta por ID
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.where(eq(folders.id, id));

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		res.json(folder);
	} catch (error) {
		console.error('Error al obtener carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders - Crear nueva carpeta
router.post('/', async (req, res) => {
	try {
		const validationResult = CreateFolderSchema.safeParse(req.body);

		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const data = validationResult.data;

		// Verificar que no exista una carpeta con la misma ruta
		const existingFolder = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, data.path));

		if (existingFolder.length > 0) {
			return res.status(409).json({
				error: 'Ya existe una carpeta con esa ruta',
			});
		}

		// Generar ID basado en el nombre de la carpeta
		const folderId = await generateFolderIdFromName(data.name);
		console.log(`🆔 ID generado para carpeta '${data.name}': ${folderId}`);

		const newFolder = await db
			.insert(folders)
			.values({
				id: folderId,
				name: data.name,
				description: data.description,
				path: data.path,
				emoji: data.emoji,
				color: data.color,
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite || false,
				autoReindex: data.autoReindex,
				totalFiles: 0,
				totalSize: 0,
				parentId: data.parentId,
				presetId: data.presetId,
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});

		// Retornar el primer elemento del array ya que .returning() retorna un array
		res.status(201).json(newFolder[0]);
	} catch (error) {
		console.error('Error al crear carpeta:', error);
		res.status(500).json({
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

		const validationResult = UpdateFolderSchema.safeParse(req.body);

		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const data = validationResult.data;

		// Verificar que la carpeta existe
		const existingFolder = await db.select({ id: folders.id }).from(folders).where(eq(folders.id, id));

		if (existingFolder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		const updatedFolder = await db
			.update(folders)
			.set({
				...(data.name && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.emoji !== undefined && { emoji: data.emoji }),
				...(data.color !== undefined && { color: data.color }),
				...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
				...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
				...(data.parentId !== undefined && { parentId: data.parentId }),
				...(data.presetId !== undefined && { presetId: data.presetId }),
			})
			.where(eq(folders.id, id))
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});

		// Retornar el primer elemento del array ya que .returning() retorna un array
		res.json(updatedFolder[0]);
	} catch (error) {
		console.error('Error al actualizar carpeta:', error);
		res.status(500).json({
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

		// Verificar que la carpeta existe
		const existingFolder = await db.select({ id: folders.id }).from(folders).where(eq(folders.id, id));

		if (existingFolder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		// Verificar que la carpeta no tiene archivos asociados
		const totalFiles = await db.select({ totalFiles: folders.totalFiles }).from(folders).where(eq(folders.id, id));

		if (totalFiles.length > 0 && totalFiles[0].totalFiles > 0) {
			return res.status(409).json({
				error: 'No se puede eliminar la carpeta porque contiene archivos',
				details: `La carpeta contiene ${totalFiles[0].totalFiles} archivos`,
			});
		}

		await db.delete(folders).where(eq(folders.id, id));

		res.json({
			success: true,
			message: 'Carpeta eliminada correctamente',
			deletedId: id,
		});
	} catch (error) {
		console.error('Error al eliminar carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/recent-images - Obtener imágenes recientes de una carpeta
router.get('/:id/recent-images', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 4;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folderImages = await db
			.select({ thumbnailUrl: images.thumbnailUrl })
			.from(images)
			.where(eq(images.folderId, id))
			.orderBy(desc(images.createdAt))
			.limit(limit);

		const imageUrls = folderImages.map((img) => img.thumbnailUrl).filter((url): url is string => url !== null);
		res.json(imageUrls);
	} catch (error) {
		console.error('Error al obtener imágenes recientes de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/stats - Obtener estadísticas de una carpeta
router.get('/:id/stats', async (req, res) => {
	try {
		const { id } = req.params;
		console.log(`🔍 [FOLDER-STATS] Iniciando obtención de estadísticas para carpeta: ${id}`);

		if (!isValidFolderId(id)) {
			console.log(`❌ [FOLDER-STATS] ID de carpeta inválido: ${id}`);
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		console.log(`✅ [FOLDER-STATS] ID válido, consultando datos básicos de carpeta...`);
		// Obtener estadísticas básicas de la carpeta
		const folderData = await db
			.select({
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
			})
			.from(folders)
			.where(eq(folders.id, id))
			.limit(1);

		console.log(`📊 [FOLDER-STATS] Datos de carpeta obtenidos:`, folderData);

		if (folderData.length === 0) {
			console.log(`❌ [FOLDER-STATS] Carpeta no encontrada: ${id}`);
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		console.log(`🖼️ [FOLDER-STATS] Consultando estadísticas de imágenes...`);
		// Contar imágenes por tipo
		const imageStats = await db
			.select({
				count: count(),
			})
			.from(images)
			.where(eq(images.folderId, id));

		console.log(`📹 [FOLDER-STATS] Consultando estadísticas de videos...`);
		// Contar videos
		const videoStats = await db
			.select({
				count: count(),
			})
			.from(videos)
			.where(eq(videos.folderId, id));

		console.log(`🔄 [FOLDER-STATS] Obteniendo imágenes recientes...`);
		// Obtener las últimas 4 imágenes
		const recentImages = await db
			.select({
				id: images.id,
				name: images.name,
				thumbnailUrl: images.thumbnailUrl,
				createdAt: images.createdAt,
			})
			.from(images)
			.where(eq(images.folderId, id))
			.orderBy(desc(images.createdAt))
			.limit(4);

		console.log(`📈 [FOLDER-STATS] Construyendo objeto de estadísticas...`);
		const stats = {
			totalImages: imageStats[0]?.count || 0,
			totalVideos: videoStats[0]?.count || 0,
			totalAudio: 0, // TODO: Implementar cuando se agregue tabla de audio
			totalDocuments: 0, // TODO: Implementar cuando se agregue tabla de documentos
			totalOthers: 0, // TODO: Implementar cuando se agregue tabla de otros archivos
			totalSize: folderData[0].totalSize,
			lastActivity: folderData[0].lastIndexed,
			recentImages: recentImages,
		};
		console.log(`✅ [FOLDER-STATS] Estadísticas construidas exitosamente:`, stats);
		res.json(stats);
	} catch (error) {
		console.error('💥 [FOLDER-STATS] Error al obtener estadísticas de la carpeta:', error);
		console.error('💥 [FOLDER-STATS] Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/path - Obtener la ruta de una carpeta por su ID
router.get('/:id/path', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ path: folders.path }).from(folders).where(eq(folders.id, id));

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ path: folder[0].path });
	} catch (error) {
		console.error('Error al obtener la ruta de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/name - Obtener el nombre de una carpeta por su ID
router.get('/:id/name', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ name: folders.name }).from(folders).where(eq(folders.id, id));

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ name: folder[0].name });
	} catch (error) {
		console.error('Error al obtener el nombre de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/by-path - Obtener el ID de una carpeta por su ruta
router.get('/by-path', async (req, res) => {
	try {
		const folderPath = req.query.path as string;
		console.log('🔍 [BY-PATH] Parámetros recibidos:', { query: req.query, path: folderPath });

		if (!folderPath) {
			console.log('❌ [BY-PATH] Error: La ruta es requerida');
			return res.status(400).json({ error: 'La ruta es requerida' });
		}

		const folder = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, folderPath));

		if (!folder || folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada para la ruta proporcionada' });
		}
		res.json({ id: folder[0].id });
	} catch (error) {
		console.error('Error al obtener el ID de la carpeta por ruta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/parent-id - Obtener el ID de la carpeta padre
router.get('/:id/parent-id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ parentFolderId: folders.parentFolderId }).from(folders).where(eq(folders.id, id));

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ parentFolderId: folder[0].parentFolderId });
	} catch (error) {
		console.error('Error al obtener el ID de la carpeta padre:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/featured-image - Actualizar imagen destacada de una carpeta
router.patch('/:id/featured-image', async (req, res) => {
	try {
		const { id } = req.params;
		const { imageUrl } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db
			.update(folders)
			.set({ featuredImage: imageUrl })
			.where(eq(folders.id, id))
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});
		res.json(updatedFolder);
	} catch (error) {
		console.error('Error al actualizar la imagen destacada de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/color - Actualizar color de una carpeta
router.patch('/:id/color', async (req, res) => {
	try {
		const { id } = req.params;
		const { color } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ color: color }).where(eq(folders.id, id)).returning({
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
			autoReindex: folders.autoReindex,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		console.error('Error al actualizar el color de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/emoji - Actualizar emoji de una carpeta
router.patch('/:id/emoji', async (req, res) => {
	try {
		const { id } = req.params;
		const { emoji } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ emoji: emoji }).where(eq(folders.id, id)).returning({
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
			autoReindex: folders.autoReindex,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		console.error('Error al actualizar el emoji de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/favorite - Actualizar estado de favorito de una carpeta
router.patch('/:id/favorite', async (req, res) => {
	try {
		const { id } = req.params;
		const { isFavorite } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ isFavorite: isFavorite }).where(eq(folders.id, id)).returning({
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
			autoReindex: folders.autoReindex,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		console.error('Error al actualizar el estado de favorito de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/description - Actualizar descripción de una carpeta
router.patch('/:id/description', async (req, res) => {
	try {
		const { id } = req.params;
		const { description } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db
			.update(folders)
			.set({ description: description })
			.where(eq(folders.id, id))
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});
		res.json(updatedFolder);
	} catch (error) {
		console.error('Error al actualizar la descripción de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/name - Actualizar nombre de una carpeta
router.patch('/:id/name', async (req, res) => {
	try {
		const { id } = req.params;
		const { name } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ name: name }).where(eq(folders.id, id)).returning({
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
			autoReindex: folders.autoReindex,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		console.error('Error al actualizar el nombre de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/auto-reindex - Actualizar estado de auto-reindexación de una carpeta
router.patch('/:id/auto-reindex', async (req, res) => {
	try {
		const { id } = req.params;
		const { autoReindex } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db
			.update(folders)
			.set({ autoReindex: autoReindex })
			.where(eq(folders.id, id))
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});
		res.json(updatedFolder);
	} catch (error) {
		console.error('Error al actualizar el estado de auto-reindexación de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/:id/reindex - Reindexar una carpeta específica
router.post('/:id/reindex', async (req, res) => {
	try {
		const { id } = req.params;
		const { enableSync = true } = req.body; // Permitir deshabilitar sincronización

		if (!id || typeof id !== 'string' || id.trim().length === 0) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		console.log(`🔄 Iniciando reindexación de carpeta: ${id}`, { enableSync });

		// Obtener la carpeta para verificar que existe
		const folder = await db
			.select({
				id: folders.id,
				path: folders.path,
				name: folders.name,
			})
			.from(folders)
			.where(eq(folders.id, id))
			.limit(1);

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		const targetFolder = folder[0];

		// Importar la función updateFolderStats que maneja el reindexado
		const { updateFolderStats } = await import('@/lib/filesystem/folder-stats');

		// Ejecutar la reindexación con sincronización automática y eventos de progreso
		const indexResult = await updateFolderStats(id, new Set(), 10, 0, enableSync, true);

		console.log(`✅ Reindexación completada para carpeta: ${targetFolder.name}`, {
			entitiesCreated: indexResult.created,
			entitiesUpdated: indexResult.updated,
			syncResult: indexResult.syncResult,
		});

		// Obtener la carpeta actualizada para devolverla
		const updatedFolder = await db
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
				autoReindex: folders.autoReindex,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.where(eq(folders.id, id))
			.limit(1);

		// Incluir información de sincronización en la respuesta
		res.json({
			folder: updatedFolder[0],
			indexResult: {
				created: indexResult.created,
				updated: indexResult.updated,
				errors: indexResult.errors,
			},
			...(indexResult.syncResult && { syncResult: indexResult.syncResult }),
		});
	} catch (error) {
		console.error('Error al reindexar la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/reindex-all - Reindexar todas las carpetas
router.post('/reindex-all', async (req, res) => {
	try {
		const { enableSync = true } = req.body; // Permitir deshabilitar sincronización
		console.log('🔄 Iniciando reindexación global de todas las carpetas', { enableSync });

		// Obtener todas las carpetas
		const allFolders = await db
			.select({
				id: folders.id,
				name: folders.name,
				path: folders.path,
			})
			.from(folders)
			.orderBy(asc(folders.name));

		if (allFolders.length === 0) {
			return res.json({ processed: 0, errors: [], syncResult: null });
		}

		// Importar la función updateFolderStats
		const { updateFolderStats } = await import('@/lib/filesystem/folder-stats');

		let processed = 0;
		const errors: string[] = [];
		let globalSyncResult = null;

		// Procesar cada carpeta (solo la primera ejecutará la sincronización global)
		for (let i = 0; i < allFolders.length; i++) {
			const folder = allFolders[i];
			try {
				console.log(`🔄 Reindexando carpeta: ${folder.name} (${folder.id})`);

				// Emitir progreso global
				const progress = Math.round(((i + 1) / allFolders.length) * 100);
				const { emit } = await import('@/lib/server/events.server');
				await emit({
					type: 'folder:reindexAll:progress',
					data: {
						folderId: null, // Para reindex global, folderId puede ser null
						isProcessing: i < allFolders.length - 1,
						progress,
						totalFiles: allFolders.length,
						filesProcessed: i + 1,
						phase: i === allFolders.length - 1 ? 'complete' : 'processing',
						message: `Reindexando carpetas... ${i + 1}/${allFolders.length} (${folder.name})`,
						timestamp: Date.now(),
						currentFolder: folder.name,
					},
				});

				// Solo ejecutar sincronización en la primera carpeta para evitar duplicados
				const shouldSync = enableSync && i === 0;
				const indexResult = await updateFolderStats(folder.id, new Set(), 10, 0, shouldSync, true);

				// Capturar resultado de sincronización de la primera carpeta
				if (shouldSync && indexResult.syncResult) {
					globalSyncResult = indexResult.syncResult;
				}

				processed++;
				console.log(`✅ Carpeta reindexada: ${folder.name}`);
			} catch (error) {
				const errorMessage = `Error en carpeta ${folder.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
				console.error(`❌ ${errorMessage}`);
				errors.push(errorMessage);
			}
		}

		console.log(`✅ Reindexación global completada: ${processed} carpetas procesadas, ${errors.length} errores`);

		res.json({
			processed,
			errors,
			...(globalSyncResult && { syncResult: globalSyncResult }),
		});
	} catch (error) {
		console.error('Error en reindexación global:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/sync - Sincronizar carpetas con el sistema de archivos
router.post('/sync', async (req, res) => {
	try {
		const { dryRun = false, maxDepth = 10, includeHidden = false } = req.body;
		console.log('🔄 Iniciando sincronización de carpetas', { dryRun, maxDepth, includeHidden });

		// Importar la función de sincronización
		const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');

		// Ejecutar sincronización
		const syncResult = await syncFoldersWithFileSystem({
			dryRun,
			maxDepth,
			includeHidden,
			forceSync: true,
		});

		console.log('✅ Sincronización completada:', {
			added: syncResult.added.length,
			removed: syncResult.removed.length,
			updated: syncResult.updated.length,
			errors: syncResult.errors.length,
			duration: `${syncResult.stats.duration}ms`,
			dryRun,
		});

		res.json(syncResult);
	} catch (error) {
		console.error('Error en sincronización de carpetas:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/sync/status - Verificar estado de sincronización (dry run)
router.get('/sync/status', async (req, res) => {
	try {
		const { maxDepth = 10, includeHidden = false } = req.query;
		console.log('🔍 Verificando estado de sincronización');

		// Importar la función de verificación
		const { checkSyncStatus } = await import('@/lib/filesystem/folder-sync');

		// Verificar estado sin hacer cambios
		const syncStatus = await checkSyncStatus({
			maxDepth: Number(maxDepth),
			includeHidden: includeHidden === 'true',
		});

		console.log('✅ Verificación completada:', {
			toAdd: syncStatus.added.length,
			toRemove: syncStatus.removed.length,
			toUpdate: syncStatus.updated.length,
			errors: syncStatus.errors.length,
		});

		res.json(syncStatus);
	} catch (error) {
		console.error('Error verificando estado de sincronización:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as foldersRouter };
