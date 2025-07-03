import { db } from '@/lib/drizzle';
import { concepts } from '@/lib/drizzle/schema';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';

const router = express.Router();

const ConceptFiltersSchema = z.object({
	search: z.string().optional(),
	category: z.string().optional(),
	limit: z.number().int().positive().max(100).default(50).optional(),
	offset: z.number().int().min(0).default(0).optional(),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'category']).default('name').optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

// GET /concepts - MIGRADO A DRIZZLE
router.get('/', async (req, res) => {
	try {
		const filtersResult = ConceptFiltersSchema.safeParse(req.query);
		if (!filtersResult.success) {
			return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: filtersResult.error.errors });
		}

		const filters = filtersResult.data;
		const conditions = [];

		// Construir condiciones WHERE
		if (filters.category) conditions.push(eq(concepts.category, filters.category));

		// Búsqueda por texto
		if (filters.search) {
			conditions.push(
				or(
					like(concepts.name, `%${filters.search}%`),
					like(concepts.description, `%${filters.search}%`)
				)
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Determinar orden
		const orderByClause = filters.sortOrder === 'desc'
			? desc(concepts[filters.sortBy || 'name'] as any)
			: asc(concepts[filters.sortBy || 'name'] as any);

		// Ejecutar consultas en paralelo
		const [conceptResults, totalCount] = await Promise.all([
			db.select({
				id: concepts.id,
				name: concepts.name,
				description: concepts.description,
				emoji: concepts.emoji,
				color: concepts.color,
				category: concepts.category,
				isPublic: concepts.isPublic,
				isFavorite: concepts.isFavorite,
				totalImages: concepts.totalImages,
				totalVideos: concepts.totalVideos,
				type: concepts.type,
				complexity: concepts.complexity,
				applications: concepts.applications,
				examples: concepts.examples,
				relatedConcepts: concepts.relatedConcepts,
				notes: concepts.notes,
				featuredImage: concepts.featuredImage,
				parentId: concepts.parentId,
				createdAt: concepts.createdAt,
				updatedAt: concepts.updatedAt,
			})
			.from(concepts)
			.where(whereClause)
			.orderBy(orderByClause)
			.limit(filters.limit || 50)
			.offset(filters.offset || 0),

			db.select({ count: count() })
			.from(concepts)
			.where(whereClause)
			.then(result => result[0]?.count || 0)
		]);

		res.json({
			data: conceptResults,
			pagination: {
				total: totalCount,
				limit: filters.limit || 50,
				offset: filters.offset || 0,
				hasNext: (filters.offset || 0) + (filters.limit || 50) < totalCount,
				hasPrev: (filters.offset || 0) > 0,
			},
		});
	} catch (error) {
		console.error('Error al obtener conceptos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /concepts/:id - MIGRADO A DRIZZLE
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de concepto inválido' });
		}

		const conceptResult = await db.select({
			id: concepts.id,
			name: concepts.name,
			description: concepts.description,
			emoji: concepts.emoji,
			color: concepts.color,
			category: concepts.category,
			isPublic: concepts.isPublic,
			isFavorite: concepts.isFavorite,
			totalImages: concepts.totalImages,
			totalVideos: concepts.totalVideos,
			type: concepts.type,
			complexity: concepts.complexity,
			applications: concepts.applications,
			examples: concepts.examples,
			relatedConcepts: concepts.relatedConcepts,
			notes: concepts.notes,
			featuredImage: concepts.featuredImage,
			parentId: concepts.parentId,
			createdAt: concepts.createdAt,
			updatedAt: concepts.updatedAt,
		})
		.from(concepts)
		.where(eq(concepts.id, id))
		.limit(1);

		if (!conceptResult.length) {
			return res.status(404).json({ error: 'Concepto no encontrado' });
		}

		res.json(conceptResult[0]);
	} catch (error) {
		console.error('Error al obtener concepto:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /concepts/:id/stats - Obtener estadísticas de un concepto (métodos de escritura pendientes)
router.get('/:id/stats', async (req, res) => {
	res.status(501).json({ error: 'Método no implementado - pendiente de migración' });
});

// POST /concepts - Crear nuevo concepto (métodos de escritura pendientes)
router.post('/', async (req, res) => {
	res.status(501).json({ error: 'Método no implementado - pendiente de migración' });
});

// PUT /concepts/:id - Actualizar concepto (métodos de escritura pendientes)
router.put('/:id', async (req, res) => {
	res.status(501).json({ error: 'Método no implementado - pendiente de migración' });
});

// DELETE /concepts/:id - Eliminar concepto (métodos de escritura pendientes)
router.delete('/:id', async (req, res) => {
	res.status(501).json({ error: 'Método no implementado - pendiente de migración' });
});

export default router;
