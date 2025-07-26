import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { places } from '@/lib/drizzle/schema/index';

const router = express.Router();

// Schemas de validación
const PlaceFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(50),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
	category: z.string().optional(),
	isFavorite: z.coerce.boolean().optional(),
});

// GET /api/places - Listar lugares
router.get('/', async (req, res) => {
	const parse = PlaceFiltersSchema.safeParse(req.query);
	if (!parse.success) {
		res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.errors });; return;
	}

	const { search, limit, offset, sortBy, sortOrder, category, isFavorite } = parse.data;

	try {
		console.log('🔍 [DEBUG] Iniciando consulta de places...');

		const whereConditions = [];
		if (search) {
			whereConditions.push(
				or(
					like(places.name, `%${search}%`),
					like(places.description, `%${search}%`),
					like(places.category, `%${search}%`),
					like(places.location, `%${search}%`)
				)
			);
		}
		if (category) {
			whereConditions.push(like(places.category, `%${category}%`));
		}
		if (isFavorite !== undefined) {
			whereConditions.push(eq(places.isFavorite, isFavorite));
		}

		const orderByColumn = places[sortBy];
		const orderByClause = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

		const [placesData, totalResult] = await Promise.all([
			db.query.places.findMany({
				where: and(...whereConditions),
				orderBy: orderByClause,
				limit: limit,
				offset: offset,
			}),
			db
				.select({ count: count() })
				.from(places)
				.where(and(...whereConditions)),
		]);

		const total = totalResult[0].count;
		console.log('🔍 [DEBUG] Places obtenidos:', placesData.length);

		res.json({
			data: placesData,
			pagination: {
				total,
				limit,
				offset,
				hasNext: offset + limit < total,
				hasPrev: offset > 0,
			},
		});
	} catch (error) {
		console.error('🚨 [ERROR] Error en /api/places:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/places/:id - Obtener lugar específico
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const place = await db.query.places.findFirst({
			where: eq(places.id, id),
		});

		if (!place) {
			res.status(404).json({ error: 'Lugar no encontrado' });; return;
		}

		res.json(place);
	} catch (error) {
		console.error('Error getting place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
