import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { prompts } from '@/lib/drizzle/schema/index';
import { PromptService, promptService } from '@/services/prompt/prompt.service';
import { toImageWithStats } from '@/transformers/image';
import { toPromptWithStats } from '@/transformers/prompt';

const router = express.Router();
const legacyPromptService = new PromptService(); // Para métodos legacy

// Schema para filtros de búsqueda
const PromptFiltersSchema = z.object({
	search: z.string().optional(),
	category: z.string().nullable().optional(),
	isPublic: z.boolean().optional(),
	isFavorite: z.boolean().optional(),
	limit: z.number().int().positive().max(100).default(50).optional(),
	offset: z.number().int().min(0).default(0).optional(),
	sortBy: z
		.enum([
			'name',
			'createdAt',
			'updatedAt',
			'totalImages',
			'totalVideos',
			'type',
			'notes',
			'featuredImage',
			'parentId',
		])
		.default('name')
		.optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

// GET /prompts - MIGRADO A DRIZZLE
router.get('/', async (req, res) => {
	try {
		const filtersResult = PromptFiltersSchema.safeParse(req.query);
		if (!filtersResult.success) {
			res.status(400).json({ error: 'Parámetros de filtro inválidos', details: filtersResult.error.errors });
			return;
		}

		const filters = filtersResult.data;
		const conditions = [];

		// Construir condiciones WHERE
		if (filters.category) conditions.push(eq(prompts.category, filters.category));
		if (filters.isPublic !== undefined) conditions.push(eq(prompts.isPublic, filters.isPublic));
		if (filters.isFavorite !== undefined) conditions.push(eq(prompts.isFavorite, filters.isFavorite));

		// Búsqueda por texto
		if (filters.search) {
			conditions.push(
				or(
					like(prompts.name, `%${filters.search}%`),
					like(prompts.description, `%${filters.search}%`),
					like(prompts.content, `%${filters.search}%`)
				)
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Determinar orden
		const orderByClause =
			filters.sortOrder === 'desc'
				? desc(prompts[filters.sortBy || 'name'] as any)
				: asc(prompts[filters.sortBy || 'name'] as any);

		// Ejecutar consultas en paralelo
		const [promptResults, totalCount] = await Promise.all([
			db
				.select({
					id: prompts.id,
					name: prompts.name,
					description: prompts.description,
					emoji: prompts.emoji,
					color: prompts.color,
					category: prompts.category,
					isPublic: prompts.isPublic,
					isFavorite: prompts.isFavorite,
					totalImages: prompts.totalImages,
					totalVideos: prompts.totalVideos,
					type: prompts.type,
					content: prompts.content,
					parameters: prompts.parameters,
					style: prompts.style,
					mood: prompts.mood,
					lighting: prompts.lighting,
					composition: prompts.composition,
					technique: prompts.technique,
					inspiration: prompts.inspiration,
					notes: prompts.notes,
					featuredImage: prompts.featuredImage,
					parentId: prompts.parentId,
					createdAt: prompts.createdAt,
					updatedAt: prompts.updatedAt,
				})
				.from(prompts)
				.where(whereClause)
				.orderBy(orderByClause)
				.limit(filters.limit || 50)
				.offset(filters.offset || 0),

			db
				.select({ count: count() })
				.from(prompts)
				.where(whereClause)
				.then((result: any) => result[0]?.count || 0),
		]);

		// Formatear respuesta para compatibilidad
		const transformedPrompts = promptResults.map((prompt: any) => ({
			...prompt,
			// Para compatibilidad con transformer
			images: [],
			videos: [],
			_count: {
				images: prompt.totalImages || 0,
				videos: prompt.totalVideos || 0,
			},
		}));

		res.json({
			data: transformedPrompts,
			pagination: {
				total: totalCount,
				limit: filters.limit || 50,
				offset: filters.offset || 0,
				hasNext: (filters.offset || 0) + (filters.limit || 50) < totalCount,
				hasPrev: (filters.offset || 0) > 0,
			},
		});
	} catch (error) {
		console.error('Error al obtener prompts:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /prompts/:id - MIGRADO A DRIZZLE
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			res.status(400).json({ error: 'ID de prompt inválido' });
			return;
		}

		const promptResult = await db
			.select({
				id: prompts.id,
				name: prompts.name,
				description: prompts.description,
				emoji: prompts.emoji,
				color: prompts.color,
				category: prompts.category,
				isPublic: prompts.isPublic,
				isFavorite: prompts.isFavorite,
				totalImages: prompts.totalImages,
				totalVideos: prompts.totalVideos,
				type: prompts.type,
				content: prompts.content,
				parameters: prompts.parameters,
				style: prompts.style,
				mood: prompts.mood,
				lighting: prompts.lighting,
				composition: prompts.composition,
				technique: prompts.technique,
				inspiration: prompts.inspiration,
				notes: prompts.notes,
				featuredImage: prompts.featuredImage,
				parentId: prompts.parentId,
				createdAt: prompts.createdAt,
				updatedAt: prompts.updatedAt,
			})
			.from(prompts)
			.where(eq(prompts.id, id))
			.limit(1);

		const prompt = promptResult[0];
		if (!prompt) {
			res.status(404).json({ error: 'Prompt no encontrado' });
			return;
		}

		// Formatear respuesta para compatibilidad
		const formattedPrompt = {
			...prompt,
			images: [],
			videos: [],
			_count: {
				images: prompt.totalImages || 0,
				videos: prompt.totalVideos || 0,
			},
		};

		res.json(toPromptWithStats(formattedPrompt));
	} catch (error) {
		console.error('Error al obtener prompt:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// MÉTODOS COMPLEJOS - PENDIENTES DE MIGRACIÓN (usan PromptService temporalmente)
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const images = await promptService.getImages(id);
		const transformedImages = images.map(toImageWithStats);
		res.json(transformedImages);
	} catch (error) {
		console.error('Error getting prompt images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

router.get('/:id/recent-images', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;
		const images = await promptService.getRecentImages(id, limit);
		res.json(images);
	} catch (error) {
		console.error('Error getting recent prompt images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /prompts - MIGRADO A DRIZZLE
router.post('/', async (req, res) => {
	try {
		const newPrompt = await promptService.create(req.body);
		res.status(201).json(newPrompt);
	} catch (error) {
		console.error('Error al crear prompt:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /prompts/:id - MIGRADO A DRIZZLE
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const updatedPrompt = await promptService.update(id, req.body);
		res.json(updatedPrompt);
	} catch (error) {
		console.error('Error al actualizar prompt:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /prompts/:id - MIGRADO A DRIZZLE
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await promptService.delete(id);
		res.json({
			success: true,
			message: 'Prompt eliminado correctamente',
			deletedId: id,
		});
	} catch (error) {
		console.error('Error al eliminar prompt:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export default router;
