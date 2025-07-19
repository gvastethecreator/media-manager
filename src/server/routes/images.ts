// Usar servicio de thumbnails en lugar de server action

import { and, asc, count, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { normalizeQuality } from '@/lib/config/thumbnail.config';
import { db } from '@/lib/drizzle';
import { folders, images } from '@/lib/drizzle/schema/index';
import { isValidFolderId } from '@/lib/utils/folder-id-generator';
import { imageService } from '@/services/image/image.service';
import { processImage } from '../services/image-processing.service';
import { verifySignedToken } from '../services/thumbnail.service';

const router = Router();

// Schema de validación para crear imagen
const CreateImageSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	description: z.string().max(1000).nullable().optional(),
	path: z.string().min(1, 'La ruta es requerida').max(500),
	hash: z.string().min(1, 'El hash es requerido'),
	size: z.number().int().positive('El tamaño debe ser positivo'),
	width: z.number().int().positive('El ancho debe ser positivo'),
	height: z.number().int().positive('El alto debe ser positivo'),
	metadata: z.string().nullable().optional(),
	thumbnail: z.string().nullable().optional(),
	thumbnailSize: z.number().int().min(0).nullable().optional(),
	thumbnailWidth: z.number().int().min(0).nullable().optional(),
	thumbnailHeight: z.number().int().min(0).nullable().optional(),
	thumbnailMimeType: z.string().nullable().optional(),
	thumbnailError: z.string().nullable().optional(),
	thumbnailErrorAt: z.date().nullable().optional(),
	thumbnailOptimizedAt: z.date().nullable().optional(),
	isFavorite: z.boolean().default(false).optional(),
	folderId: z.string().uuid('El ID de carpeta debe ser un UUID válido'),
	noteId: z.string().uuid().nullable().optional(),
	addedAt: z.date().optional(),
});

// Schema de validación para actualizar imagen
const UpdateImageSchema = CreateImageSchema.partial().omit({
	path: true,
	hash: true,
	size: true,
	width: true,
	height: true,
	folderId: true,
	addedAt: true,
});

// Schema para filtros de búsqueda
const ImageFiltersSchema = z.object({
	folderId: z
		.string()
		.refine((id) => isValidFolderId(id), {
			message: 'ID de carpeta inválido',
		})
		.optional(),
	isFavorite: z.boolean().optional(),
	minWidth: z.number().int().positive().optional(),
	maxWidth: z.number().int().positive().optional(),
	minHeight: z.number().int().positive().optional(),
	maxHeight: z.number().int().positive().optional(),
	minSize: z.number().int().positive().optional(),
	maxSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	limit: z.preprocess((val) => val ? Number.parseInt(String(val), 10) : 20, z.number().int().positive().max(100)).optional(),
	offset: z.preprocess((val) => val ? Number.parseInt(String(val), 10) : 0, z.number().int().min(0)).optional(),
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

// GET /api/images - MIGRADO A DRIZZLE
router.get('/', async (req, res) => {
	try {
		const filtersResult = ImageFiltersSchema.safeParse(req.query);
		if (!filtersResult.success) {
			return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: filtersResult.error.errors });
		}

		const filters = filtersResult.data;
		const conditions = [];

		// Construir condiciones WHERE
		if (filters.folderId) conditions.push(eq(images.folderId, filters.folderId));
		if (filters.isFavorite !== undefined) conditions.push(eq(images.isFavorite, filters.isFavorite));
		if (filters.minWidth) conditions.push(gte(images.width, filters.minWidth));
		if (filters.maxWidth) conditions.push(lte(images.width, filters.maxWidth));
		if (filters.minHeight) conditions.push(gte(images.height, filters.minHeight));
		if (filters.maxHeight) conditions.push(lte(images.height, filters.maxHeight));
		if (filters.minSize) conditions.push(gte(images.size, filters.minSize));
		if (filters.maxSize) conditions.push(lte(images.size, filters.maxSize));

		// Búsqueda por texto
		if (filters.search) {
			conditions.push(or(like(images.name, `%${filters.search}%`), like(images.description, `%${filters.search}%`)));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Determinar orden
		const orderByClause =
			filters.sortOrder === 'desc'
				? desc(images[filters.sortBy || 'createdAt'] as any)
				: asc(images[filters.sortBy || 'createdAt'] as any);

		// Ejecutar consultas en paralelo
		const [imageResults, totalCount] = await Promise.all([
			db
				.select({
					id: images.id,
					name: images.name,
					description: images.description,
					path: images.path,
					hash: images.hash,
					size: images.size,
					width: images.width,
					height: images.height,
					metadata: images.metadata,
					thumbnail: images.thumbnail,
					thumbnailSize: images.thumbnailSize,
					thumbnailWidth: images.thumbnailWidth,
					thumbnailHeight: images.thumbnailHeight,
					thumbnailMimeType: images.thumbnailMimeType,
					isFavorite: images.isFavorite,
					folderId: images.folderId,
					noteId: images.noteId,
					createdAt: images.createdAt,
					updatedAt: images.updatedAt,
					addedAt: images.addedAt,
					// Incluir datos de folder
					folderName: folders.name,
					folderPath: folders.path,
				})
				.from(images)
				.leftJoin(folders, eq(images.folderId, folders.id))
				.where(whereClause)
				.orderBy(orderByClause)
				.limit(filters.limit || 20)
				.offset(filters.offset || 0),

			db
				.select({ count: count() })
				.from(images)
				.where(whereClause)
				.then((result) => result[0]?.count || 0),
		]);

		// Formatear respuesta para compatibilidad
		const formattedImages = imageResults.map((img) => ({
			...img,
			entityType: 'image' as const,
			// Agregar thumbnailUrl si hay thumbnail
			thumbnailUrl: img.thumbnail ? `/api/images/${img.id}/thumbnail` : null,
			folder: img.folderName
				? {
						id: img.folderId,
						name: img.folderName,
						path: img.folderPath,
					}
				: null,
			// Para compatibilidad - estos se implementarán después
			albums: [],
			tags: [],
			characters: [],
			collections: [],
			stats: { views: 0, lastViewed: new Date() },
			_count: {
				albums: 0,
				tags: 0,
				characters: 0,
				collections: 0,
				activities: 0,
			},
		}));

		res.json({
			images: formattedImages,
			total: totalCount,
			hasMore: (filters.offset || 0) + (filters.limit || 20) < totalCount,
		});
	} catch (error) {
		console.error('Error al obtener imágenes:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/images/:id/content - Servir la imagen original
router.get('/:id/content', async (req, res) => {
	try {
		const { id } = req.params;
		const buffer = await imageService.getOriginalImage(id);
		res.set({
			'Content-Type': 'image/jpeg', // Asumimos JPEG por defecto, se puede mejorar
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
		const buffer = await imageService.getThumbnail(id);
		if (!buffer) {
			return res.status(404).send('Thumbnail not found');
		}
		res.set({
			'Content-Type': 'image/webp', // Asumimos WEBP por defecto, se puede mejorar
			'Content-Length': buffer.length.toString(),
			'Cache-Control': 'public, max-age=31536000',
		});
		res.send(buffer);
	} catch (error) {
		console.error('Error serving thumbnail:', error);
		res.status(500).send('Error serving thumbnail');
	}
});

// GET /api/images/:id - MIGRADO A DRIZZLE
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de imagen inválido' });
		}

		const imageResult = await db
			.select({
				id: images.id,
				name: images.name,
				description: images.description,
				path: images.path,
				hash: images.hash,
				size: images.size,
				width: images.width,
				height: images.height,
				metadata: images.metadata,
				isFavorite: images.isFavorite,
				folderId: images.folderId,
				createdAt: images.createdAt,
				updatedAt: images.updatedAt,
				noteId: images.noteId,
				thumbnail: images.thumbnail,
				thumbnailSize: images.thumbnailSize,
				thumbnailWidth: images.thumbnailWidth,
				thumbnailHeight: images.thumbnailHeight,
				thumbnailMimeType: images.thumbnailMimeType,
				addedAt: images.addedAt,
				// Datos del folder
				folderName: folders.name,
				folderPath: folders.path,
			})
			.from(images)
			.leftJoin(folders, eq(images.folderId, folders.id))
			.where(eq(images.id, id))
			.limit(1);

		const image = imageResult[0];
		if (!image) {
			return res.status(404).json({ error: 'Imagen no encontrada' });
		}

		// Formatear respuesta para compatibilidad
		const formattedImage = {
			...image,
			entityType: 'image' as const,
			// Agregar thumbnailUrl si hay thumbnail
			thumbnailUrl: image.thumbnail ? `/api/images/${image.id}/thumbnail` : null,
			folder: image.folderName
				? {
						id: image.folderId,
						name: image.folderName,
						path: image.folderPath,
					}
				: null,
			// Para compatibilidad - estos se pueden implementar después con subqueries
			albums: [],
			tags: [],
			characters: [],
			collections: [],
			stats: { views: 0, lastViewed: new Date() },
			_count: {
				albums: 0,
				tags: 0,
				characters: 0,
				collections: 0,
				activities: 0,
			},
		};

		res.json(formattedImage);
	} catch (error) {
		console.error('Error al obtener imagen:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
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

// POST /api/images - Crear nueva imagen
router.post('/', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

// PUT /api/images/:id - Actualizar imagen
router.put('/:id', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

// DELETE /api/images/:id - Eliminar imagen
router.delete('/:id', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

// POST /api/images/:id/relations/:entityType/:entityId - Agregar relación
router.post('/:id/relations/:entityType/:entityId', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

// DELETE /api/images/:id/relations/:entityType/:entityId - Eliminar relación
router.delete('/:id/relations/:entityType/:entityId', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

// POST /api/images/:id/process - Procesar imagen
router.post('/:id/process', async (req, res) => {
	try {
		const { id } = req.params;
		const options = req.body || {};

		const processedBuffer = await processImage(id, options);

		res.set({
			'Content-Type': 'image/jpeg', // Asumimos JPEG por defecto, se puede mejorar
			'Content-Length': processedBuffer.length.toString(),
		});
		res.send(processedBuffer);
	} catch (error) {
		console.error('Error processing image:', error);
		res.status(500).send('Error al procesar la imagen');
	}
});

export { router as imagesRouter };
