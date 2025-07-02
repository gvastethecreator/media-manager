import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import {
	getOriginalImage,
	getImageThumbnailBuffer,
	generateThumbnailWithForce,
	verifySignedToken,
} from '@/app/actions/images';
import { normalizeQuality } from '@/lib/config/thumbnail.config';

const router = Router();
const prisma = new PrismaClient();

// Schema de validación para crear imagen
const CreateImageSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	description: z.string().max(1000).optional().nullable(),
	path: z.string().min(1, 'La ruta es requerida').max(500),
	hash: z.string().min(1, 'El hash es requerido'),
	size: z.number().int().positive('El tamaño debe ser positivo'),
	width: z.number().int().positive('El ancho debe ser positivo'),
	height: z.number().int().positive('El alto debe ser positivo'),
	metadata: z.string().optional().nullable(),
	isFavorite: z.boolean().default(false).optional(),
	folderId: z.string().uuid('El ID de carpeta debe ser un UUID válido'),
});

// Schema de validación para actualizar imagen
const UpdateImageSchema = CreateImageSchema.partial().omit({
	path: true,
	hash: true,
	size: true,
	width: true,
	height: true,
	folderId: true,
});

// Schema para filtros de búsqueda
const ImageFiltersSchema = z.object({
	folderId: z.string().uuid().optional(),
	isFavorite: z.boolean().optional(),
	minWidth: z.number().int().positive().optional(),
	maxWidth: z.number().int().positive().optional(),
	minHeight: z.number().int().positive().optional(),
	maxHeight: z.number().int().positive().optional(),
	minSize: z.number().int().positive().optional(),
	maxSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	tags: z.array(z.string().uuid()).optional(),
	albums: z.array(z.string().uuid()).optional(),
	characters: z.array(z.string().uuid()).optional(),
	limit: z.number().int().positive().max(100).default(20).optional(),
	offset: z.number().int().min(0).default(0).optional(),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'width', 'height']).default('createdAt').optional(),
	sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

// Incluye estándar para imágenes con relaciones
const imageInclude = {
	folder: true,
	stats: true,
	albums: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	tags: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	characters: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	collections: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	_count: {
		select: {
			albums: true,
			tags: true,
			characters: true,
			collections: true,
			activities: true,
		},
	},
};

// GET /api/images - Obtener imágenes con filtros
router.get('/', async (req, res) => {
	try {
		const filtersResult = ImageFiltersSchema.safeParse(req.query);

		if (!filtersResult.success) {
			return res.status(400).json({
				error: 'Parámetros de filtro inválidos',
				details: filtersResult.error.errors,
			});
		}

		const filters = filtersResult.data;

		// Construir condiciones WHERE
		const where: any = {};

		if (filters.folderId) where.folderId = filters.folderId;
		if (filters.isFavorite !== undefined) where.isFavorite = filters.isFavorite;
		if (filters.minWidth || filters.maxWidth) {
			where.width = {};
			if (filters.minWidth) where.width.gte = filters.minWidth;
			if (filters.maxWidth) where.width.lte = filters.maxWidth;
		}
		if (filters.minHeight || filters.maxHeight) {
			where.height = {};
			if (filters.minHeight) where.height.gte = filters.minHeight;
			if (filters.maxHeight) where.height.lte = filters.maxHeight;
		}
		if (filters.minSize || filters.maxSize) {
			where.size = {};
			if (filters.minSize) where.size.gte = filters.minSize;
			if (filters.maxSize) where.size.lte = filters.maxSize;
		}
		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
			];
		}
		if (filters.tags && filters.tags.length > 0) {
			where.tags = { some: { id: { in: filters.tags } } };
		}
		if (filters.albums && filters.albums.length > 0) {
			where.albums = { some: { id: { in: filters.albums } } };
		}
		if (filters.characters && filters.characters.length > 0) {
			where.characters = { some: { id: { in: filters.characters } } };
		}

		// Construir ordenamiento
		const orderBy: any = {};
		orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';

		// Ejecutar consulta con paginación
		const [images, total] = await Promise.all([
			prisma.image.findMany({
				where,
				include: imageInclude,
				orderBy,
				take: filters.limit,
				skip: filters.offset,
			}),
			prisma.image.count({ where }),
		]);

		res.json({
			data: images,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: (filters.offset || 0) + (filters.limit || 20) < total,
				hasPrev: (filters.offset || 0) > 0,
			},
		});
	} catch (error) {
		console.error('Error al obtener imágenes:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/images/:id - Obtener una imagen por ID
// GET /api/images/:id/content - Servir la imagen original
router.get('/:id/content', async (req, res) => {
	try {
		const { id } = req.params;
		const { buffer, mimeType } = await getOriginalImage(id);
		res.set({
			'Content-Type': mimeType,
			'Content-Length': buffer.length.toString(),
			'Cache-Control': 'public, max-age=31536000',
		});
		res.send(buffer);
	} catch (error) {
		console.error('Error serving image:', error);
		res.status(500).send('Error serving image');
	}
});

// GET /api/images/:id/thumbnail - Servir thumbnail
router.get('/:id/thumbnail', async (req, res) => {
	try {
		const { id } = req.params;
		const { buffer, mimeType } = await getImageThumbnailBuffer(id);
		if (!buffer) {
			return res.status(404).send('Thumbnail not found');
		}
		res.set({
			'Content-Type': mimeType,
			'Content-Length': buffer.length.toString(),
			'Cache-Control': 'public, max-age=31536000',
		});
		res.send(buffer);
	} catch (error) {
		console.error('Error serving thumbnail:', error);
		res.status(500).send('Error serving thumbnail');
	}
});

// POST /api/images/:id/thumbnail/generate - Generar thumbnail
router.post('/:id/thumbnail/generate', async (req, res) => {
	try {
		const { id } = req.params;
		const { quality: requestedQuality = 'medium', force = false } = req.body || {};
		const quality = normalizeQuality(requestedQuality);
		await generateThumbnailWithForce(id, quality, force);
		res.json({ status: 'success', quality });
	} catch (error) {
		console.error('Error generating thumbnail:', error);
		res.status(500).json({ error: 'Error generating thumbnail' });
	}
});

// GET /api/images/signed/:token - Servir imagen firmada
router.get('/signed/:token', async (req, res) => {
	try {
		const { token } = req.params;
		const { buffer, mimeType } = await verifySignedToken(token);
		res.set({
			'Content-Type': mimeType,
			'Cache-Control': 'public, max-age=3600, must-revalidate',
			'Content-Length': buffer.length.toString(),
		});
		res.send(buffer);
	} catch (error) {
		console.error('Error serving signed image:', error);
		res.status(500).send('Error al servir la imagen');
	}
});

// GET /api/images/:id - Obtener una imagen por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de imagen inválido' });
		}

		const image = await prisma.image.findUnique({
			where: { id },
			include: imageInclude,
		});

		if (!image) {
			return res.status(404).json({ error: 'Imagen no encontrada' });
		}

		// Incrementar contador de vistas si existe stats
		if (image.stats) {
			await prisma.imageStats.update({
				where: { imageId: id },
				data: {
					views: { increment: 1 },
					lastViewed: new Date(),
				},
			});
		}

		res.json(image);
	} catch (error) {
		console.error('Error al obtener imagen:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/images - Crear nueva imagen
router.post('/', async (req, res) => {
	try {
		const validationResult = CreateImageSchema.safeParse(req.body);

		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const data = validationResult.data;

		// Verificar que la carpeta existe
		const folder = await prisma.folder.findUnique({
			where: { id: data.folderId },
		});

		if (!folder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		// Verificar que no exista una imagen con la misma ruta
		const existingImage = await prisma.image.findFirst({
			where: { path: data.path },
		});

		if (existingImage) {
			return res.status(409).json({
				error: 'Ya existe una imagen con esa ruta',
			});
		}

		// Crear imagen y stats en transacción
		const newImage = await prisma.$transaction(async (tx) => {
			const image = await tx.image.create({
				data: {
					name: data.name,
					description: data.description,
					path: data.path,
					hash: data.hash,
					size: data.size,
					width: data.width,
					height: data.height,
					metadata: data.metadata,
					isFavorite: data.isFavorite || false,
					folderId: data.folderId,
				},
				include: imageInclude,
			});

			// Crear stats automáticamente
			await tx.imageStats.create({
				data: {
					imageId: image.id,
					views: 0,
					lastViewed: new Date(),
				},
			});

			return image;
		});

		res.status(201).json(newImage);
	} catch (error) {
		console.error('Error al crear imagen:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/images/:id - Actualizar imagen
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de imagen inválido' });
		}

		const validationResult = UpdateImageSchema.safeParse(req.body);

		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const data = validationResult.data;

		// Verificar que la imagen existe
		const existingImage = await prisma.image.findUnique({
			where: { id },
		});

		if (!existingImage) {
			return res.status(404).json({ error: 'Imagen no encontrada' });
		}

		const updatedImage = await prisma.image.update({
			where: { id },
			data: {
				...(data.name && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.metadata !== undefined && { metadata: data.metadata }),
				...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
			},
			include: imageInclude,
		});

		res.json(updatedImage);
	} catch (error) {
		console.error('Error al actualizar imagen:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/images/:id - Eliminar imagen
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de imagen inválido' });
		}

		// Verificar que la imagen existe
		const existingImage = await prisma.image.findUnique({
			where: { id },
			include: {
				stats: true,
				_count: {
					select: {
						albums: true,
						tags: true,
						characters: true,
						collections: true,
						activities: true,
					},
				},
			},
		});

		if (!existingImage) {
			return res.status(404).json({ error: 'Imagen no encontrada' });
		}

		// Eliminar imagen y stats en transacción
		await prisma.$transaction(async (tx) => {
			// Eliminar stats si existe
			if (existingImage.stats) {
				await tx.imageStats.delete({
					where: { imageId: id },
				});
			}

			// Eliminar imagen (las relaciones many-to-many se eliminan automáticamente)
			await tx.image.delete({
				where: { id },
			});
		});

		res.json({
			success: true,
			message: 'Imagen eliminada correctamente',
			deletedId: id,
		});
	} catch (error) {
		console.error('Error al eliminar imagen:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/images/:id/relations/:entityType/:entityId - Agregar relación
router.post('/:id/relations/:entityType/:entityId', async (req, res) => {
	try {
		const { id, entityType, entityId } = req.params;

		if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(entityId).success) {
			return res.status(400).json({ error: 'IDs inválidos' });
		}

		const validEntityTypes = [
			'albums',
			'tags',
			'characters',
			'collections',
			'places',
			'worldItems',
			'concepts',
			'prompts',
			'notes',
			'wildcards',
			'properties',
			'groups',
		];

		if (!validEntityTypes.includes(entityType)) {
			return res.status(400).json({ error: 'Tipo de entidad inválido' });
		}

		// Verificar que la imagen existe
		const image = await prisma.image.findUnique({ where: { id } });
		if (!image) {
			return res.status(404).json({ error: 'Imagen no encontrada' });
		}

		// Crear la relación según el tipo de entidad
		const updateData: any = {};
		updateData[entityType] = {
			connect: { id: entityId },
		};

		const updatedImage = await prisma.image.update({
			where: { id },
			data: updateData,
			include: imageInclude,
		});

		res.json({
			success: true,
			message: `Relación con ${entityType} agregada correctamente`,
			image: updatedImage,
		});
	} catch (error) {
		console.error('Error al agregar relación:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/images/:id/relations/:entityType/:entityId - Eliminar relación
router.delete('/:id/relations/:entityType/:entityId', async (req, res) => {
	try {
		const { id, entityType, entityId } = req.params;

		if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(entityId).success) {
			return res.status(400).json({ error: 'IDs inválidos' });
		}

		const validEntityTypes = [
			'albums',
			'tags',
			'characters',
			'collections',
			'places',
			'worldItems',
			'concepts',
			'prompts',
			'notes',
			'wildcards',
			'properties',
			'groups',
		];

		if (!validEntityTypes.includes(entityType)) {
			return res.status(400).json({ error: 'Tipo de entidad inválido' });
		}

		// Verificar que la imagen existe
		const image = await prisma.image.findUnique({ where: { id } });
		if (!image) {
			return res.status(404).json({ error: 'Imagen no encontrada' });
		}

		// Eliminar la relación según el tipo de entidad
		const updateData: any = {};
		updateData[entityType] = {
			disconnect: { id: entityId },
		};

		const updatedImage = await prisma.image.update({
			where: { id },
			data: updateData,
			include: imageInclude,
		});

		res.json({
			success: true,
			message: `Relación con ${entityType} eliminada correctamente`,
			image: updatedImage,
		});
	} catch (error) {
		console.error('Error al eliminar relación:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as imagesRouter };
