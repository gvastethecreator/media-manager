import * as crypto from 'crypto';
import { and, asc, count, desc, eq, like } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { images, imageWorldItems, worldItems } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';

// Hot reload trigger: v3
const router = express.Router();

// Schema de validación para crear/actualizar world items
const WorldItemCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	emoji: z.string().optional().default('🎭'),
	color: z.string().optional().default('#f59e0b'),
	category: z.string().optional(),
	type: z.string().optional(),
	origin: z.string().optional(),
	abilities: z.string().optional(),
	history: z.string().optional(),
	appearance: z.string().optional(),
	notes: z.string().optional(),
	featuredImage: z.string().optional(),
	parentId: z.string().optional(),
	isFavorite: z.boolean().optional().default(false),
});

const WorldItemUpdateSchema = WorldItemCreateSchema.partial();

// Schema para filtros de búsqueda
const WorldItemFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/world-items - Listar world items
router.get('/', async (req: Request, res: Response) => {
	const parse = WorldItemFiltersSchema.safeParse(req.query);
	if (!parse.success) {
		res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.issues });
		return;
	}

	const { search, limit, offset, sortBy, sortOrder } = parse.data;

	try {
		const whereConditions = [];
		if (search) {
			whereConditions.push(like(worldItems.name, `%${search}%`));
		}

		const orderByColumn = worldItems[sortBy];
		const orderByClause = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

		const [data, totalResult] = await Promise.all([
			db.query.worldItems.findMany({
				where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
				orderBy: orderByClause,
				limit,
				offset,
			}),
			db
				.select({ count: count() })
				.from(worldItems)
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined),
		]);

		const total = totalResult[0].count;

		res.json({
			data,
			pagination: { total, limit, offset, hasNext: offset + limit < total, hasPrev: offset > 0 },
		});
	} catch (error) {
		serverLogger.error('Error fetching world items:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/world-items/:id/recent-images - Obtener imágenes recientes de un world item
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para evitar que /:id la capture
router.get('/:id/recent-images', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;

		// Verificar que el world item existe
		const worldItem = await db.query.worldItems.findFirst({
			where: eq(worldItems.id, id),
		});
		if (!worldItem) {
			res.status(404).json({ error: 'World item no encontrado' });
			return;
		}

		// Obtener imágenes recientes
		const recentImages = await db
			.select({
				id: images.id,
				name: images.name,
			})
			.from(images)
			.innerJoin(imageWorldItems, eq(imageWorldItems.A, images.id))
			.where(eq(imageWorldItems.B, id))
			.orderBy(desc(images.updatedAt))
			.limit(limit);

		const thumbnails = recentImages.map((img: { id: string; name: string }) => ({
			id: img.id,
			name: img.name,
			thumbnailUrl: `/api/thumbnails/${img.id}`,
			url: `/api/images/${img.id}`,
		}));

		res.json(thumbnails);
	} catch (error) {
		serverLogger.error('Error getting world item recent images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/world-items/:id - Obtener world item específico
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const worldItem = await db.query.worldItems.findFirst({
			where: eq(worldItems.id, id),
		});

		if (!worldItem) {
			res.status(404).json({ error: 'World item no encontrado' });
			return;
		}

		res.json(worldItem);
	} catch (error) {
		serverLogger.error('Error getting world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /api/world-items - Crear world item
router.post('/', async (req: Request, res: Response) => {
	const parse = WorldItemCreateSchema.safeParse(req.body);
	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		const data = parse.data;
		const newItem = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description || null,
			emoji: data.emoji || '🎭',
			color: data.color || '#f59e0b',
			category: data.category || null,
			type: data.type || null,
			origin: data.origin || null,
			abilities: data.abilities || null,
			history: data.history || null,
			appearance: data.appearance || null,
			notes: data.notes || null,
			featuredImage: data.featuredImage || null,
			parentId: data.parentId || null,
			isFavorite: data.isFavorite ?? false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const [created] = await db.insert(worldItems).values(newItem).returning();
		res.status(201).json(created);
	} catch (error) {
		serverLogger.error('Error creating world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /api/world-items/:id - Actualizar world item
router.put('/:id', async (req: Request, res: Response) => {
	const { id } = req.params;
	const parse = WorldItemUpdateSchema.safeParse(req.body);

	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		// Verificar que existe
		const existing = await db.query.worldItems.findFirst({
			where: eq(worldItems.id, id),
		});

		if (!existing) {
			res.status(404).json({ error: 'World item no encontrado' });
			return;
		}

		const [updated] = await db
			.update(worldItems)
			.set({
				...parse.data,
				updatedAt: new Date(),
			})
			.where(eq(worldItems.id, id))
			.returning();

		res.json(updated);
	} catch (error) {
		serverLogger.error('Error updating world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/world-items/:id - Eliminar world item
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		// Verificar que existe
		const existing = await db.query.worldItems.findFirst({
			where: eq(worldItems.id, id),
		});

		if (!existing) {
			res.status(404).json({ error: 'World item no encontrado' });
			return;
		}

		// Eliminar relaciones primero
		await db.delete(imageWorldItems).where(eq(imageWorldItems.B, id));

		// Eliminar el world item
		await db.delete(worldItems).where(eq(worldItems.id, id));

		res.json({ success: true, message: 'World item eliminado correctamente', deletedId: id });
	} catch (error) {
		serverLogger.error('Error deleting world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /api/world-items/:id/images/:imageId - Agregar imagen a world item
router.post('/:id/images/:imageId', async (req: Request, res: Response) => {
	try {
		const { id, imageId } = req.params;

		// Verificar que el world item existe
		const worldItem = await db.query.worldItems.findFirst({
			where: eq(worldItems.id, id),
		});
		if (!worldItem) {
			res.status(404).json({ error: 'World item no encontrado' });
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

		// Verificar si la relación ya existe (A=imageId, B=worldItemId)
		const existingRelation = await db
			.select()
			.from(imageWorldItems)
			.where(and(eq(imageWorldItems.A, imageId), eq(imageWorldItems.B, id)))
			.limit(1);

		if (existingRelation.length > 0) {
			res.status(200).json({ message: 'La imagen ya está en el world item', alreadyExists: true });
			return;
		}

		// Crear la relación
		await db.insert(imageWorldItems).values({
			A: imageId, // imageId
			B: id, // worldItemId
		});

		serverLogger.info(`✅ Imagen ${imageId} agregada a world item ${id}`);
		res.status(201).json({ message: 'Imagen agregada al world item exitosamente' });
	} catch (error) {
		serverLogger.error('Error adding image to world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/world-items/:id/images/:imageId - Remover imagen de world item
router.delete('/:id/images/:imageId', async (req: Request, res: Response) => {
	try {
		const { id, imageId } = req.params;

		await db.delete(imageWorldItems).where(and(eq(imageWorldItems.A, imageId), eq(imageWorldItems.B, id)));

		serverLogger.info(`✅ Imagen ${imageId} removida de world item ${id}`);
		res.status(200).json({ message: 'Imagen removida del world item' });
	} catch (error) {
		serverLogger.error('Error removing image from world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
