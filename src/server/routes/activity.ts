import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { getActivityService } from '../../services/activity/activity.service';

const router = Router();
const prisma = new PrismaClient();
const activityService = getActivityService(prisma);

// Schema para validación
const createActivitySchema = z.object({
	type: z.string().min(1, 'El tipo de actividad es requerido'),
	description: z.string().min(1, 'La descripción es requerida'),
	imageId: z.string().optional(),
	albumId: z.string().optional(),
	folderId: z.string().optional(),
	characterId: z.string().optional(),
	collectionId: z.string().optional(),
	metadata: z.record(z.any()).optional(),
});

const getActivitiesSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(20),
	type: z.string().optional(),
	imageId: z.string().optional(),
	albumId: z.string().optional(),
	folderId: z.string().optional(),
	characterId: z.string().optional(),
	collectionId: z.string().optional(),
});

// POST /api/activity - Registrar nueva actividad
router.post('/', async (req, res) => {
	try {
		const validatedData = createActivitySchema.parse(req.body);

		const activity = await activityService.create(validatedData);

		res.status(201).json({
			data: activity,
			message: 'Actividad registrada exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: error.errors,
				timestamp: new Date().toISOString(),
			});
		}

		console.error('Error registrando actividad:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// GET /api/activity - Obtener actividades
router.get('/', async (req, res) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 20;

		const filters = {
			page,
			limit,
			type: req.query.type as string,
			imageId: req.query.imageId as string,
			albumId: req.query.albumId as string,
			folderId: req.query.folderId as string,
			characterId: req.query.characterId as string,
			collectionId: req.query.collectionId as string,
		};

		// Remover filtros undefined
		for (const key of Object.keys(filters)) {
			if (filters[key as keyof typeof filters] === undefined) {
				delete filters[key as keyof typeof filters];
			}
		}

		const result = await activityService.list(filters);

		// Calcular páginas
		const totalPages = Math.ceil(result.totalCount / limit);

		res.json({
			data: result.activities,
			pagination: {
				page,
				limit,
				total: result.totalCount,
				pages: totalPages,
				hasMore: result.hasMore,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error obteniendo actividades:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// GET /api/activity/stats - Obtener estadísticas de actividad
router.get('/stats', async (req, res) => {
	try {
		const days = Number(req.query.days) || 30;
		const type = req.query.type as string;

		// Para estadísticas, usamos el método list con filtros específicos
		const filters: any = {};
		if (type) filters.type = type;

		// Obtener actividades recientes
		const recentActivities = await activityService.list(filters);

		// Calcular estadísticas básicas
		const stats = {
			totalActivities: recentActivities.totalCount,
			activitiesByType: {},
			activitiesByDay: [],
			mostActiveEntities: [],
		};

		// Agrupar por tipo
		const typeCount: Record<string, number> = {};
		for (const activity of recentActivities.activities) {
			typeCount[activity.type] = (typeCount[activity.type] || 0) + 1;
		}
		stats.activitiesByType = typeCount;

		res.json({
			data: stats,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error obteniendo estadísticas de actividad:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// GET /api/activity/:id - Obtener actividad específica
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const activity = await activityService.findById(id);

		if (!activity) {
			return res.status(404).json({
				error: 'Actividad no encontrada',
				timestamp: new Date().toISOString(),
			});
		}

		res.json({
			data: activity,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error obteniendo actividad:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// DELETE /api/activity/:id - Eliminar actividad
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const success = await activityService.delete(id);

		if (!success) {
			return res.status(404).json({
				error: 'Actividad no encontrada',
				timestamp: new Date().toISOString(),
			});
		}

		res.json({
			message: 'Actividad eliminada exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error eliminando actividad:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// DELETE /api/activity - Eliminar todas las actividades (con filtros opcionales)
router.delete('/', async (req, res) => {
	try {
		const filters: any = {};

		// Aplicar filtros opcionales
		if (req.query.type) filters.type = req.query.type;
		if (req.query.imageId) filters.imageId = req.query.imageId;
		if (req.query.albumId) filters.albumId = req.query.albumId;

		const deletedCount = await activityService.clearAll(filters);

		res.json({
			message: `${deletedCount} actividades eliminadas exitosamente`,
			deletedCount,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error eliminando actividades:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

export default router;