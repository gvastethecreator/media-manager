import { PrismaClient } from '@prisma/client';
// Drizzle imports
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, folders, images, jsonFiles, videos } from '@/lib/drizzle/schema';

const router = Router();
const prisma = new PrismaClient();

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
		// **MIGRACIÓN A DRIZZLE**
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

		// Transformar a formato compatible con Prisma
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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prismaFolders = await prisma.folder.findMany({
					include: {
						_count: {
							select: {
								images: true,
								videos: true,
								documents: true,
								file3Ds: true,
								jsonFiles: true,
								audios: true,
							},
						},
						preset: true,
						parent: true,
						children: true,
					},
					orderBy: {
						name: 'asc',
					},
				});

				// Comparar conteos básicos
				if (Math.abs(transformedFolders.length - prismaFolders.length) > 0) {
					console.warn('⚠️ Diferencia en conteo de folders:', {
						drizzle: transformedFolders.length,
						prisma: prismaFolders.length
					});
				} else {
					console.info('✅ Validación dual exitosa folders:', {
						total: transformedFolders.length
					});
				}
			} catch (validationError) {
				console.error('❌ Error en validación dual folders:', validationError);
			}
		}

		res.json(transformedFolders);
	} catch (error) {
		console.error('Error al obtener carpetas:', error);
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

		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
				preset: true,
				parent: true,
				children: true,
			},
		});

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
		const existingFolder = await prisma.folder.findFirst({
			where: { path: data.path },
		});

		if (existingFolder) {
			return res.status(409).json({
				error: 'Ya existe una carpeta con esa ruta',
			});
		}

		const newFolder = await prisma.folder.create({
			data: {
				name: data.name,
				description: data.description,
				path: data.path,
				emoji: data.emoji,
				color: data.color,
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite || false,
				parentId: data.parentId,
				presetId: data.presetId,
			},
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
				preset: true,
				parent: true,
				children: true,
			},
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
		const existingFolder = await prisma.folder.findUnique({
			where: { id },
		});

		if (!existingFolder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: {
				...(data.name && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.emoji !== undefined && { emoji: data.emoji }),
				...(data.color !== undefined && { color: data.color }),
				...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
				...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
				...(data.parentId !== undefined && { parentId: data.parentId }),
				...(data.presetId !== undefined && { presetId: data.presetId }),
			},
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
				preset: true,
				parent: true,
				children: true,
			},
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
		const existingFolder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
			},
		});

		if (!existingFolder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		// Verificar que la carpeta no tiene archivos asociados
		const totalFiles = Object.values(existingFolder._count).reduce((sum, count) => sum + count, 0);

		if (totalFiles > 0) {
			return res.status(409).json({
				error: 'No se puede eliminar la carpeta porque contiene archivos',
				details: `La carpeta contiene ${totalFiles} archivos`,
			});
		}

		await prisma.folder.delete({
			where: { id },
		});

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

		const images = await prisma.image.findMany({
			where: { folderId: id },
			select: { thumbnailUrl: true },
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		const imageUrls = images.map((img) => img.thumbnailUrl).filter((url): url is string => url !== null);
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

		const folder = await prisma.folder.findUnique({
			where: { id },
			select: {
				totalSize: true,
				lastIndexed: true,
				_count: {
					select: {
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!folder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		const stats = {
			totalImages: folder._count.images,
			totalVideos: folder._count.videos,
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
		const rootFolder = await prisma.folder.findFirst({
			where: { parentFolderId: null },
			select: { id: true },
		});

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

		const folder = await prisma.folder.findUnique({
			where: { id },
			select: { path: true },
		});

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

		const folder = await prisma.folder.findUnique({
			where: { id },
			select: { name: true },
		});

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

		const folder = await prisma.folder.findUnique({
			where: { path: folderPath },
			select: { id: true },
		});

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

		const folder = await prisma.folder.findUnique({
			where: { id },
			select: { parentFolderId: true },
		});

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

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: { featuredImage: imageUrl },
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

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: { color: color },
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

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: { emoji: emoji },
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

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: { isFavorite: isFavorite },
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

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: { description: description },
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

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: { name: name },
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

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: { autoReindex: autoReindex },
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

// DELETE /api/folders/:id - Eliminar carpeta
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		// Verificar que la carpeta existe
		const existingFolder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
			},
		});

		if (!existingFolder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		// Verificar que la carpeta no tiene archivos asociados
		const totalFiles = Object.values(existingFolder._count).reduce((sum, count) => sum + count, 0);

		if (totalFiles > 0) {
			return res.status(409).json({
				error: 'No se puede eliminar la carpeta porque contiene archivos',
				details: `La carpeta contiene ${totalFiles} archivos`,
			});
		}

		await prisma.folder.delete({
			where: { id },
		});

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

export { router as foldersRouter };
