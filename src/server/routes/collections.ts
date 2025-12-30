import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { serverLogger } from '@/lib/logger/server-logger';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { collections, imageCollections, images } from '@/lib/drizzle/schema/index';

const router = express.Router();

// Schemas de validación
const CollectionFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/collections - Listar colecciones
const getCollectionsHandler = async (req: Request, res: Response) => {
	const parse = CollectionFiltersSchema.safeParse(req.query);
	if (!parse.success) {
		res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.issues });
		return;
	}

	const { search, limit, offset, sortBy, sortOrder } = parse.data;

	try {
		serverLogger.debug('🔍 [DEBUG] Iniciando consulta de collections...');

		const whereConditions = [];
		if (search) {
			whereConditions.push(or(like(collections.name, `%${search}%`), like(collections.description, `%${search}%`)));
		}

		const orderByColumn = collections[sortBy];
		const orderByClause = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

		const [collectionsData, totalResult] = await Promise.all([
			db.query.collections.findMany({
				where: and(...whereConditions),
				orderBy: orderByClause,
				limit,
				offset,
			}),
			db
				.select({ count: count() })
				.from(collections)
				.where(and(...whereConditions)),
		]);

		const total = totalResult[0].count;
		serverLogger.debug('🔍 [DEBUG] Collections obtenidos:', collectionsData.length);

		res.json({
			data: collectionsData,
			pagination: {
				total,
				limit,
				offset,
				hasNext: offset + limit < total,
				hasPrev: offset > 0,
			},
		});
	} catch (error) {
		serverLogger.error('🚨 [ERROR] Error en /api/collections:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.get('/', getCollectionsHandler);

// GET /api/collections/:id - Obtener colección específica
const getCollectionByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const collection = await db.query.collections.findFirst({
			where: eq(collections.id, id),
		});

		if (!collection) {
			res.status(404).json({ error: 'Colección no encontrada' });
			return;
		}

		res.json(collection);
	} catch (error) {
		serverLogger.error('Error getting collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

// GET /api/collections/:id/media - Obtener medios recientes de una colección
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para evitar que /:id capture 'media' como ID
const getCollectionMediaHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;

		// Verificar que la colección existe
		const collection = await db.query.collections.findFirst({
			where: eq(collections.id, id),
		});
		if (!collection) {
			res.status(404).json({ error: 'Colección no encontrada' });
			return;
		}

		// Obtener imágenes recientes de la colección
		const recentImages = await db
			.select({
				id: images.id,
				name: images.name,
			})
			.from(images)
			.innerJoin(imageCollections, eq(imageCollections.A, images.id))
			.where(eq(imageCollections.B, id))
			.orderBy(desc(images.updatedAt))
			.limit(limit);

		const thumbnails = recentImages.map((img) => ({
			id: img.id,
			name: img.name,
			thumbnailUrl: `/api/thumbnails/${img.id}`,
			url: `/api/images/${img.id}`,
			isVideo: false,
		}));

		res.json(thumbnails);
	} catch (error) {
		serverLogger.error('Error getting collection media:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.get('/:id/media', getCollectionMediaHandler);
router.get('/:id', getCollectionByIdHandler);

// POST /api/collections/:id/images/:imageId - Agregar imagen a colección
const addImageToCollectionHandler = async (req: Request, res: Response) => {
	try {
		const { id, imageId } = req.params;

		// Verificar que la colección existe
		const collection = await db.query.collections.findFirst({
			where: eq(collections.id, id),
		});
		if (!collection) {
			res.status(404).json({ error: 'Colección no encontrada' });
			return;
		}

		// Verificar que la imagen existe
		const image = await db.query.images.findFirst({
			where: eq(images.id, imageId),
		});
		if (!image) {
			res.status(404).json({ error: 'Imagen no encontrada' });
			return;
		}

		// Verificar si la relación ya existe usando select
		const existingRelation = await db
			.select()
			.from(imageCollections)
			.where(and(eq(imageCollections.A, imageId), eq(imageCollections.B, id)))
			.limit(1);

		if (existingRelation.length > 0) {
			res.status(200).json({ message: 'La imagen ya está en la colección', alreadyExists: true });
			return;
		}

		// Crear la relación
		await db.insert(imageCollections).values({
			A: imageId, // imageId
			B: id, // collectionId
		});

		serverLogger.info(`✅ Imagen ${imageId} agregada a colección ${id}`);
		res.status(201).json({ message: 'Imagen agregada a la colección exitosamente' });
	} catch (error) {
		serverLogger.error('Error adding image to collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.post('/:id/images/:imageId', addImageToCollectionHandler);

// DELETE /api/collections/:id/images/:imageId - Remover imagen de colección
const removeImageFromCollectionHandler = async (req: Request, res: Response) => {
	try {
		const { id, imageId } = req.params;

		// Eliminar la relación
		const result = await db
			.delete(imageCollections)
			.where(and(eq(imageCollections.A, imageId), eq(imageCollections.B, id)));

		serverLogger.info(`✅ Imagen ${imageId} removida de colección ${id}`);
		res.status(200).json({ message: 'Imagen removida de la colección' });
	} catch (error) {
		serverLogger.error('Error removing image from collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.delete('/:id/images/:imageId', removeImageFromCollectionHandler);

export default router;
