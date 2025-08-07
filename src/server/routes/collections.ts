import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { collections } from '@/lib/drizzle/schema/index';

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
		res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.errors });
		return;
	}

	const { search, limit, offset, sortBy, sortOrder } = parse.data;

	try {
		console.log('🔍 [DEBUG] Iniciando consulta de collections...');

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
		console.log('🔍 [DEBUG] Collections obtenidos:', collectionsData.length);

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
		console.error('🚨 [ERROR] Error en /api/collections:', error);
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
		console.error('Error getting collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.get('/:id', getCollectionByIdHandler);

export default router;
