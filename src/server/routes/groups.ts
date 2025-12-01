import { and, asc, count, desc, eq, like } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { groups } from '@/lib/drizzle/schema/index';
import { groupService } from '@/services/group/group.service';
import { toGroupWithStats } from '@/transformers/group';
import { serverLogger } from '@/lib/logger/server-logger';

const router = express.Router();

// Schema para filtros de búsqueda
const GroupFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().int().positive().max(100).default(50).optional(),
	offset: z.coerce.number().int().min(0).default(0).optional(),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'totalImages', 'totalVideos']).default('name').optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

// GET /groups - MIGRADO A DRIZZLE
router.get('/', async (req, res) => {
	try {
		const filtersResult = GroupFiltersSchema.safeParse(req.query);
		if (!filtersResult.success) {
			res.status(400).json({ error: 'Parámetros de filtro inválidos', details: filtersResult.error.issues });
			return;
		}

		const filters = filtersResult.data;
		const conditions = [];

		// Búsqueda por texto
		if (filters.search) {
			conditions.push(like(groups.name, `%${filters.search}%`));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Determinar orden - solo campos válidos del esquema
		let orderByClause: ReturnType<typeof asc>;
		const sortBy = filters.sortBy || 'name';

		if (filters.sortOrder === 'desc') {
			switch (sortBy) {
				case 'createdAt':
					orderByClause = desc(groups.createdAt);
					break;
				case 'updatedAt':
					orderByClause = desc(groups.updatedAt);
					break;
				default:
					orderByClause = desc(groups.name);
			}
		} else {
			switch (sortBy) {
				case 'createdAt':
					orderByClause = asc(groups.createdAt);
					break;
				case 'updatedAt':
					orderByClause = asc(groups.updatedAt);
					break;
				default:
					orderByClause = asc(groups.name);
			}
		}

		// Ejecutar consultas en paralelo
		const [groupResults, totalCount] = await Promise.all([
			db
				.select({
					id: groups.id,
					name: groups.name,
					description: groups.description,
					createdAt: groups.createdAt,
					updatedAt: groups.updatedAt,
				})
				.from(groups)
				.where(whereClause)
				.orderBy(orderByClause)
				.limit(filters.limit || 50)
				.offset(filters.offset || 0),

			db
				.select({ count: count() })
				.from(groups)
				.where(whereClause)
				.then((result: any[]) => result[0]?.count || 0),
		]);

		// Formatear respuesta para compatibilidad
		const transformedGroups = groupResults.map((group: any) => ({
			...group,
			// Para compatibilidad con transformer
			images: [],
			videos: [],
			_count: {
				images: 0,
				videos: 0,
			},
		}));

		res.json({
			data: transformedGroups,
			pagination: {
				total: totalCount,
				limit: filters.limit || 50,
				offset: filters.offset || 0,
				hasNext: (filters.offset || 0) + (filters.limit || 50) < totalCount,
				hasPrev: (filters.offset || 0) > 0,
			},
		});
	} catch (error) {
		serverLogger.error('Error al obtener grupos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /groups/:id - MIGRADO A DRIZZLE
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			res.status(400).json({ error: 'ID de grupo inválido' });
			return;
		}

		const groupResult = await db
			.select({
				id: groups.id,
				name: groups.name,
				description: groups.description,
				createdAt: groups.createdAt,
				updatedAt: groups.updatedAt,
			})
			.from(groups)
			.where(eq(groups.id, id))
			.limit(1);

		const group = groupResult[0];
		if (!group) {
			res.status(404).json({ error: 'Grupo no encontrado' });
			return;
		}

		// Formatear respuesta para compatibilidad
		const formattedGroup = {
			...group,
			images: [],
			videos: [],
			_count: {
				images: 0,
				videos: 0,
			},
		};

		res.json(toGroupWithStats(formattedGroup));
	} catch (error) {
		serverLogger.error('Error al obtener grupo:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// MÉTODOS COMPLEJOS - PENDIENTES DE MIGRACIÓN (usan GroupService temporalmente)
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

		const filters = {
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		// TODO: Implementar getGroupImages en groupService
		// const { images, total } = await groupService.getGroupImages(id, filters);
		const images: any[] = [];
		const total = 0;

		res.json({
			data: images,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		serverLogger.error('Error getting group images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

router.get('/:id/media', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;
		// TODO: Implementar getRecentGroupMediaService en groupService
		// const media = await groupService.getRecentGroupMediaService(id, limit);
		const media: any[] = [];
		res.json(media);
	} catch (error) {
		serverLogger.error('Error getting recent group media:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

router.get('/:id/card-data', async (req, res) => {
	try {
		const { id } = req.params;
		// TODO: Implementar getGroupCardDataService en groupService
		// const cardData = await groupService.getGroupCardDataService(id);
		const cardData = await groupService.getCardData(id);
		res.json(cardData);
	} catch (error) {
		serverLogger.error('Error getting group card data:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// MÉTODOS DE ESCRITURA - PENDIENTES DE MIGRACIÓN (Status 501)
router.post('/', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

router.put('/:id', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

router.delete('/:id', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

router.post('/:id/images/:imageId', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

router.delete('/:id/images/:imageId', async (_req, res) => {
	res.status(501).json({ error: 'Método de escritura pendiente de migración a Drizzle' });
});

export default router;
