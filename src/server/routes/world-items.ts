import { and, asc, count, desc, eq, like } from 'drizzle-orm';
import { serverLogger } from '@/lib/logger/server-logger';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { worldItems, imageWorldItems, images } from '@/lib/drizzle/schema/index';

const router = express.Router();

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
