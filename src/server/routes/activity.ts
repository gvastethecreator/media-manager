import { Effect } from 'effect';
import express from 'express';
import { z } from 'zod';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import type { ActivityFilters } from '@/types/entities/activity/types';
import { getActivityService } from '../../services/activity/activity.service';

const router = express.Router();
const activityService = getActivityService();

// Schema para validación
const createActivitySchema = z.object({
	type: z.string().min(1, 'El tipo de actividad es requerido'),
	message: z.string().min(1, 'El mensaje es requerido'),
	imageId: z.string().optional(),
	albumId: z.string().optional(),
	folderId: z.string().optional(),
	characterId: z.string().optional(),
	collectionId: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/activity - Registrar nueva actividad
const createActivity = effectHandler((req, res) =>
	Effect.gen(function* () {
		const validatedResult = createActivitySchema.safeParse(req.body);
		if (!validatedResult.success) {
			res.status(400);
			return {
				error: 'Datos de entrada inválidos',
				details: validatedResult.error.issues,
			};
		}

		const validatedData = validatedResult.data;

		const activity = yield* Effect.tryPromise({
			try: () =>
				activityService.create({
					type: validatedData.type,
					entityType: 'general',
					entityId:
						validatedData.imageId ||
						validatedData.albumId ||
						validatedData.folderId ||
						validatedData.characterId ||
						validatedData.collectionId ||
						'',
					action: 'create',
					userId: 'system',
					description: validatedData.message,
					metadata: validatedData.metadata,
				}),
			catch: (error) => {
				serverLogger.error('Error registrando actividad:', error);
				return error;
			},
		});

		res.status(201);
		return {
			data: activity,
			message: 'Actividad registrada exitosamente',
		};
	})
);

// GET /api/activity - Obtener actividades
const getActivities = effectHandler((req, _res) =>
	Effect.gen(function* () {
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 20;

		const filters: ActivityFilters = {
			limit,
			offset: (page - 1) * limit,
		};

		if (req.query.type) {
			filters.types = [req.query.type as string];
		}
		if (req.query.imageId) {
			filters.imageId = req.query.imageId as string;
		}

		const result = yield* Effect.tryPromise({
			try: () => activityService.list(filters),
			catch: (error) => {
				serverLogger.error('Error obteniendo actividades:', error);
				return error;
			},
		});

		return {
			data: result.activities,
			pagination: {
				page,
				limit,
				total: result.totalCount,
				hasMore: result.hasMore,
			},
		};
	})
);

// GET /api/activity/stats - Obtener estadísticas de actividad
const getActivityStats = effectHandler((req, _res) =>
	Effect.gen(function* () {
		const type = req.query.type as string;
		const filters: ActivityFilters = {};
		if (type) {
			filters.types = [type];
		}

		const recentActivities = yield* Effect.tryPromise({
			try: () => activityService.list(filters),
			catch: (error) => {
				serverLogger.error('Error obteniendo estadísticas de actividad:', error);
				return error;
			},
		});

		const typeCount: Record<string, number> = {};
		for (const activity of recentActivities.activities) {
			typeCount[activity.type] = (typeCount[activity.type] || 0) + 1;
		}

		const stats = {
			totalActivities: recentActivities.totalCount,
			activitiesByType: typeCount,
		};

		return { data: stats };
	})
);

// GET /api/activity/:id - Obtener actividad específica
const getActivityById = effectHandler((req, res) =>
	Effect.gen(function* () {
		const { id } = req.params;
		const activity = yield* Effect.tryPromise({
			try: () => activityService.findById(id),
			catch: (error) => {
				serverLogger.error('Error obteniendo actividad:', error);
				return error;
			},
		});

		if (!activity) {
			res.status(404);
			return { error: 'Actividad no encontrada' };
		}

		return { data: activity };
	})
);

// DELETE /api/activity/:id - Eliminar actividad
const deleteActivity = effectHandler((req, res) =>
	Effect.gen(function* () {
		const { id } = req.params;
		const success = yield* Effect.tryPromise({
			try: () => activityService.delete(id),
			catch: (error) => {
				serverLogger.error('Error eliminando actividad:', error);
				return error;
			},
		});

		if (!success) {
			res.status(404);
			return { error: 'Actividad no encontrada' };
		}

		return { message: 'Actividad eliminada exitosamente' };
	})
);

// Registrar las rutas
router.post('/', createActivity);
router.get('/', getActivities);
router.get('/stats', getActivityStats);
router.get('/:id', getActivityById);
router.delete('/:id', deleteActivity);

export default router;
