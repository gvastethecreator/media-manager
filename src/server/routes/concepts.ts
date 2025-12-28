import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { serverLogger } from '@/lib/logger/server-logger';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { concepts, imageConcepts, images } from '@/lib/drizzle/schema/index';

const router = express.Router();

const ConceptFiltersSchema = z.object({
	search: z.string().optional(),
	category: z.string().optional(),
	limit: z.coerce.number().int().positive().max(100).default(50).optional(),
	offset: z.coerce.number().int().min(0).default(0).optional(),
	sortBy: z
		.enum(['name', 'createdAt', 'updatedAt', 'category', 'totalImages', 'totalVideos', 'type', 'complexity'])
		.default('name')
		.optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

// GET /concepts - MIGRADO A DRIZZLE
const getConceptsHandler = async (req: Request, res: Response) => {
	try {
		const filtersResult = ConceptFiltersSchema.safeParse(req.query);
		if (!filtersResult.success) {
			res.status(400).json({ error: 'Parámetros de filtro inválidos', details: filtersResult.error.issues });
			return;
		}

		const filters = filtersResult.data;
		const conditions = [];

		// Construir condiciones WHERE
		if (filters.category) {
			conditions.push(eq(concepts.category, filters.category));
		}

		// Búsqueda por texto
		if (filters.search) {
			conditions.push(
				or(like(concepts.name, `%${filters.search}%`), like(concepts.description, `%${filters.search}%`))
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Determinar orden (removiendo campos eliminados del ordenamiento)
		const validSortFields = ['name', 'category', 'createdAt', 'updatedAt', 'type', 'complexity'] as const;
		const sortBy = validSortFields.includes(filters.sortBy as any)
			? (filters.sortBy as 'name' | 'category' | 'createdAt' | 'updatedAt' | 'type' | 'complexity')
			: 'name';
		const orderByClause = filters.sortOrder === 'desc' ? desc(concepts[sortBy]) : asc(concepts[sortBy]);

		// Ejecutar consultas en paralelo
		const [conceptResults, totalCount] = await Promise.all([
			db
				.select({
					id: concepts.id,
					name: concepts.name,
					description: concepts.description,
					emoji: concepts.emoji,
					color: concepts.color,
					category: concepts.category,
					isFavorite: concepts.isFavorite,
					// Los agregados se obtienen por separado desde EntityAggregates si necesario
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

			db
				.select({ count: count() })
				.from(concepts)
				.where(whereClause)
				.then((result: any) => result[0]?.count || 0),
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
		serverLogger.error('Error al obtener conceptos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.get('/', getConceptsHandler);

// GET /concepts/:id - MIGRADO A DRIZZLE
const getConceptByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		if (!z.string().uuid().safeParse(id).success) {
			res.status(400).json({ error: 'ID de concepto inválido' });
			return;
		}

		const conceptResult = await db
			.select({
				id: concepts.id,
				name: concepts.name,
				description: concepts.description,
				emoji: concepts.emoji,
				color: concepts.color,
				category: concepts.category,
				isFavorite: concepts.isFavorite,
				// Los agregados se obtienen por separado desde EntityAggregates si necesario
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
			res.status(404).json({ error: 'Concepto no encontrado' });
			return;
		}

		res.json(conceptResult[0]);
	} catch (error) {
		serverLogger.error('Error al obtener concepto:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.get('/:id', getConceptByIdHandler);

// GET /concepts/:id/stats - Obtener estadísticas de un concepto (métodos de escritura pendientes)
router.get('/:id/stats', async (_req, res) => {
	res.status(501).json({ error: 'Método no implementado - pendiente de migración' });
});

// POST /concepts - Crear nuevo concepto (métodos de escritura pendientes)
router.post('/', async (_req, res) => {
	res.status(501).json({ error: 'Método no implementado - pendiente de migración' });
});

// PUT /concepts/:id - Actualizar concepto (métodos de escritura pendientes)
router.put('/:id', async (_req, res) => {
	res.status(501).json({ error: 'Método no implementado - pendiente de migración' });
});

// DELETE /concepts/:id - Eliminar concepto (métodos de escritura pendientes)
router.delete('/:id', async (_req, res) => {
	res.status(501).json({ error: 'Método no implementado - pendiente de migración' });
});

// POST /concepts/:id/images/:imageId - Agregar imagen a concepto
router.post('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		const concept = await db.query.concepts.findFirst({ where: eq(concepts.id, id) });
		if (!concept) {
			res.status(404).json({ error: 'Concepto no encontrado' });
			return;
		}

		const image = await db.query.images.findFirst({ where: eq(images.id, imageId) });
		if (!image) {
			res.status(404).json({ error: 'Imagen no encontrada' });
			return;
		}

		// A=imageId, B=conceptId
		const existing = await db
			.select()
			.from(imageConcepts)
			.where(and(eq(imageConcepts.A, imageId), eq(imageConcepts.B, id)))
			.limit(1);

		if (existing.length > 0) {
			res.status(200).json({ message: 'La imagen ya está asociada', alreadyExists: true });
			return;
		}

		await db.insert(imageConcepts).values({ A: imageId, B: id });
		serverLogger.info(`✅ Imagen ${imageId} agregada a concepto ${id}`);
		res.status(201).json({ message: 'Imagen agregada al concepto exitosamente' });
	} catch (error) {
		serverLogger.error('Error adding image to concept:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /concepts/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;
		await db.delete(imageConcepts).where(and(eq(imageConcepts.A, imageId), eq(imageConcepts.B, id)));
		res.status(200).json({ message: 'Imagen removida del concepto' });
	} catch (error) {
		serverLogger.error('Error removing image from concept:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
