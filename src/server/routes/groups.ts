import * as crypto from 'crypto';
import { and, asc, count, desc, eq, like } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { groups, groupImages, images } from '@/lib/drizzle/schema/index';
import { groupService } from '@/services/group/group.service';
import { toGroupWithStats } from '@/transformers/group';
import { serverLogger } from '@/lib/logger/server-logger';

const router = express.Router();

// Schema de validación para crear/actualizar grupos
const GroupCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	emoji: z.string().optional().default('📁'),
	color: z.string().optional().default('#3b82f6'),
	category: z.string().optional(),
	isFavorite: z.boolean().optional().default(false),
});

const GroupUpdateSchema = GroupCreateSchema.partial();

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

		// Verificar que el grupo existe
		const group = await db.query.groups.findFirst({
			where: eq(groups.id, id),
		});
		if (!group) {
			res.status(404).json({ error: 'Grupo no encontrado' });
			return;
		}

		// Obtener imágenes recientes del grupo (A = groupId, B = imageId)
		const recentImages = await db
			.select({
				id: images.id,
				name: images.name,
			})
			.from(images)
			.innerJoin(groupImages, eq(groupImages.B, images.id))
			.where(eq(groupImages.A, id))
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

// MÉTODOS DE ESCRITURA - IMPLEMENTADOS
router.post('/', async (req, res) => {
	const parse = GroupCreateSchema.safeParse(req.body);
	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		const data = parse.data;
		const newGroup = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description || null,
			emoji: data.emoji || '📁',
			color: data.color || '#3b82f6',
			category: data.category || null,
			isFavorite: data.isFavorite ?? false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const [created] = await db.insert(groups).values(newGroup).returning();
		res.status(201).json(toGroupWithStats(created));
	} catch (error) {
		serverLogger.error('Error creating group:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

router.put('/:id', async (req, res) => {
	const { id } = req.params;
	const parse = GroupUpdateSchema.safeParse(req.body);

	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		// Verificar que existe
		const existing = await db.query.groups.findFirst({
			where: eq(groups.id, id),
		});

		if (!existing) {
			res.status(404).json({ error: 'Grupo no encontrado' });
			return;
		}

		const [updated] = await db
			.update(groups)
			.set({
				...parse.data,
				updatedAt: new Date(),
			})
			.where(eq(groups.id, id))
			.returning();

		res.json(toGroupWithStats(updated));
	} catch (error) {
		serverLogger.error('Error updating group:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		// Verificar que existe
		const existing = await db.query.groups.findFirst({
			where: eq(groups.id, id),
		});

		if (!existing) {
			res.status(404).json({ error: 'Grupo no encontrado' });
			return;
		}

		// Eliminar relaciones primero
		await db.delete(groupImages).where(eq(groupImages.A, id));

		// Eliminar el grupo
		await db.delete(groups).where(eq(groups.id, id));

		res.json({ success: true, message: 'Grupo eliminado correctamente', deletedId: id });
	} catch (error) {
		serverLogger.error('Error deleting group:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /groups/:id/images/:imageId - Agregar imagen a grupo
router.post('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		// Verificar que el grupo existe
		const group = await db.query.groups.findFirst({
			where: eq(groups.id, id),
		});
		if (!group) {
			res.status(404).json({ error: 'Grupo no encontrado' });
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

		// Verificar si la relación ya existe (Group-Image: A=groupId, B=imageId)
		const existingRelation = await db
			.select()
			.from(groupImages)
			.where(and(eq(groupImages.A, id), eq(groupImages.B, imageId)))
			.limit(1);

		if (existingRelation.length > 0) {
			res.status(200).json({ message: 'La imagen ya está en el grupo', alreadyExists: true });
			return;
		}

		// Crear la relación
		await db.insert(groupImages).values({
			A: id, // groupId
			B: imageId, // imageId
		});

		serverLogger.info(`✅ Imagen ${imageId} agregada a grupo ${id}`);
		res.status(201).json({ message: 'Imagen agregada al grupo exitosamente' });
	} catch (error) {
		serverLogger.error('Error adding image to group:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /groups/:id/images/:imageId - Remover imagen de grupo
router.delete('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		// Eliminar la relación
		await db.delete(groupImages).where(and(eq(groupImages.A, id), eq(groupImages.B, imageId)));

		serverLogger.info(`✅ Imagen ${imageId} removida de grupo ${id}`);
		res.status(200).json({ message: 'Imagen removida del grupo' });
	} catch (error) {
		serverLogger.error('Error removing image from group:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
