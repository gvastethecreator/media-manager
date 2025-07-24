import { count, desc, eq, ilike, or } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { activities } from '@/lib/drizzle/schema/index';

const router = express.Router();

// Schemas de validación
const ActivityFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['type', 'action', 'createdAt']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
	type: z.string().optional(),
	entityType: z.string().optional(),
	entityId: z.string().optional(),
});

// GET /api/activity - Listar actividades
router.get('/', async (req, res) => {
	try {
		const parse = ActivityFiltersSchema.safeParse(req.query);
		if (!parse.success) {
			return res.status(400).json({
				error: 'Parámetros inválidos',
				details: parse.error.errors,
			});
		}

		const { search, limit, offset, sortBy, sortOrder, type, entityType, entityId } = parse.data;

		let query = db.select().from(activities);

		// Aplicar filtros
		const conditions = [];

		if (search) {
			conditions.push(
				or(
					ilike(activities.type, `%${search}%`),
					ilike(activities.action, `%${search}%`),
					ilike(activities.description, `%${search}%`)
				)
			);
		}

		if (type) {
			conditions.push(eq(activities.type, type));
		}

		if (entityType) {
			conditions.push(eq(activities.entityType, entityType));
		}

		if (entityId) {
			conditions.push(eq(activities.entityId, entityId));
		}

		if (conditions.length > 0) {
			query = query.where(conditions.length === 1 ? conditions[0] : or(...conditions));
		}

		// Aplicar ordenamiento
		const orderByColumn =
			sortBy === 'type' ? activities.type : sortBy === 'action' ? activities.action : activities.createdAt;

		const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

		query = orderDirection === 'asc' ? query.orderBy(orderByColumn) : query.orderBy(desc(orderByColumn));

		const result = await query.limit(limit).offset(offset);

		// Obtener total de registros
		const totalQuery = db.select({ count: count() }).from(activities);
		if (conditions.length > 0) {
			totalQuery.where(conditions.length === 1 ? conditions[0] : or(...conditions));
		}
		const [{ count: total }] = await totalQuery;

		res.json({
			data: result,
			pagination: {
				total,
				limit,
				offset,
				hasNext: offset + limit < total,
				hasPrev: offset > 0,
			},
		});
	} catch (error) {
		console.error('Error al obtener actividades:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: 'No se pudieron listar las actividades',
			timestamp: new Date().toISOString(),
		});
	}
});

// GET /api/activity/:id - Obtener actividad por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);

		if (result.length === 0) {
			return res.status(404).json({ error: 'Actividad no encontrada' });
		}

		res.json(result[0]);
	} catch (error) {
		console.error('Error al obtener actividad:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export default router;
