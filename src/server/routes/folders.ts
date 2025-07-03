// Drizzle imports
import { db } from '@/lib/drizzle';
import { folders, images, videos } from '@/lib/drizzle/schema';
import { asc, count, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

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
	parentId: z.string().uuid().optional().nullable(),
	presetId: z.string().uuid().optional().nullable(),
});

// Schema de validación para actualizar carpeta
const UpdateFolderSchema = CreateFolderSchema.partial().omit({ path: true });

// GET /api/folders - Obtener todas las carpetas
router.get('/', async (req, res) => {
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
		res.json(transformedFolders);
	} catch (error) {
		console.error('❌ Error al obtener carpetas:', error);
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({
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
		}).from(folders).where(eq(folders.id, id));

		if (!folder) {
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

		if (existingFolder) {
			return res.status(409).json({
				error: 'Ya existe una carpeta con esa ruta',
			});
		}

		const newFolder = await db.insert(folders).values({
			name: data.name,
			description: data.description,
			path: data.path,
			emoji: data.emoji,
			color: data.color,
			featuredImage: data.featuredImage,
			isFavorite: data.isFavorite || false,
			parentId: data.parentId,
			presetId: data.presetId,
		}).returning({
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

		res.status(201).json(newFolder);
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

		if (!z.string().uuid().safeParse(id).success) {
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

		if (!existingFolder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		const updatedFolder = await db.update(folders).set({
			...(data.name && { name: data.name }),
			...(data.description !== undefined && { description: data.description }),
			...(data.emoji !== undefined && { emoji: data.emoji }),
			...(data.color !== undefined && { color: data.color }),
			...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
			...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
			...(data.parentId !== undefined && { parentId: data.parentId }),
			...(data.presetId !== undefined && { presetId: data.presetId }),
		}).where(eq(folders.id, id)).returning({
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		// Verificar que la carpeta existe
		const existingFolder = await db.select({ id: folders.id }).from(folders).where(eq(folders.id, id));

		if (!existingFolder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		// Verificar que la carpeta no tiene archivos asociados
		const totalFiles = await db.select({ totalFiles: folders.totalFiles }).from(folders).where(eq(folders.id, id));

		if (totalFiles.totalFiles > 0) {
			return res.status(409).json({
				error: 'No se puede eliminar la carpeta porque contiene archivos',
				details: `La carpeta contiene ${totalFiles.totalFiles} archivos`,
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folderImages = await db.select({ thumbnailUrl: images.thumbnailUrl }).from(images).where(eq(images.folderId, id)).orderBy(desc(images.createdAt)).limit(limit);

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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({
			totalSize: folders.totalSize,
			lastIndexed: folders.lastIndexed,
			totalImages: count(images.id).from(images).where(eq(images.folderId, id)),
			totalVideos: count(videos.id).from(videos).where(eq(videos.folderId, id)),
		}).from(folders).leftJoin(images, eq(folders.id, images.folderId)).leftJoin(videos, eq(folders.id, videos.folderId)).where(eq(folders.id, id));

		if (!folder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		const stats = {
			totalImages: folder.totalImages,
			totalVideos: folder.totalVideos,
			totalSize: folder.totalSize,
			lastActivity: folder.lastIndexed,
		};
		res.json(stats);
	} catch (error) {
		console.error('Error al obtener estadísticas de la carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/root - Obtener el ID de la carpeta raíz
router.get('/root', async (req, res) => {
	try {
		const rootFolder = await db.select({ id: folders.id }).from(folders).where(eq(folders.parentFolderId, null));

		if (!rootFolder) {
			return res.status(404).json({ error: 'No se encontró la carpeta raíz' });
		}
		res.json({ id: rootFolder.id });
	} catch (error) {
		console.error('Error al obtener el ID de la carpeta raíz:', error);
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ path: folders.path }).from(folders).where(eq(folders.id, id));

		if (!folder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ path: folder.path });
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ name: folders.name }).from(folders).where(eq(folders.id, id));

		if (!folder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ name: folder.name });
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

		if (!folderPath) {
			return res.status(400).json({ error: 'La ruta es requerida' });
		}

		const folder = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, folderPath));

		if (!folder) {
			return res.status(404).json({ error: 'Carpeta no encontrada para la ruta proporcionada' });
		}
		res.json({ id: folder.id });
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ parentFolderId: folders.parentFolderId }).from(folders).where(eq(folders.id, id));

		if (!folder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ parentFolderId: folder.parentFolderId });
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ featuredImage: imageUrl }).where(eq(folders.id, id)).returning({
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

		if (!z.string().uuid().safeParse(id).success) {
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

		if (!z.string().uuid().safeParse(id).success) {
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

		if (!z.string().uuid().safeParse(id).success) {
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ description: description }).where(eq(folders.id, id)).returning({
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

		if (!z.string().uuid().safeParse(id).success) {
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

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ autoReindex: autoReindex }).where(eq(folders.id, id)).returning({
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

export { router as foldersRouter };

