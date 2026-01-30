import { Effect } from 'effect';
import { Router } from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	cancelQueueJob,
	countCompletedJobs,
	countFailedJobs,
	countTotalJobs,
	createQueueJob,
	deleteQueueJob,
	findProcessingTimes,
	findQueueJobs,
	findQueueJobsByStatus,
	findRecentQueueJobs,
	getQueueJobById,
	getQueueStats,
	getQueueStatsByQueue,
	retryQueueJob,
	updateQueueJob,
} from '@/services/queue-job/queue-job.service';
import { serializeQueueJobMetadata } from '@/transformers/queue-job';
import { CreateQueueJobInputSchema, UpdateQueueJobInputSchema } from '@/types/entities/queue-job/schema';
import { QueueJobStatus, QueueJobUpdateInput } from '@/types/entities/queue-job/types';

export const queueRouter = Router();
const logger = serverLogger.withContext('QueueRoutes');

// GET /api/queue - Obtiene una lista paginada de trabajos en cola
queueRouter.get(
	'/',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => {
				const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
				const pagination = req.query.pagination ? JSON.parse(req.query.pagination as string) : {};
				return findQueueJobs(filters, pagination);
			},
			catch: (error) => {
				logger.error('Error en GET /api/queue', { error });
				return error;
			},
		})
	)
);

// POST /api/queue - Crea un nuevo trabajo en cola
queueRouter.post(
	'/',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const validatedData = CreateQueueJobInputSchema.parse(req.body);
				const job = await createQueueJob(validatedData);
				res.status(201);
				return job;
			},
			catch: (error) => {
				logger.error('Error en POST /api/queue', { error });
				res.status(400);
				return {
					message: 'Error al crear trabajo en cola',
					error: error instanceof Error ? error.message : String(error),
				};
			},
		})
	)
);

// GET /api/queue/:id - Obtiene un trabajo en cola por ID
queueRouter.get(
	'/:id',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const job = await getQueueJobById(req.params.id);
				if (job) {
					return job;
				}
				res.status(404);
				return { message: 'Trabajo en cola no encontrado' };
			},
			catch: (error) => {
				logger.error('Error en GET /api/queue/:id', { error });
				return error;
			},
		})
	)
);

// PUT /api/queue/:id - Actualiza un trabajo en cola existente
queueRouter.put(
	'/:id',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const validatedData = UpdateQueueJobInputSchema.parse(req.body);

				// Crear el objeto de actualización correctamente tipado
				const updateData: QueueJobUpdateInput = {
					...validatedData,
					metadata: validatedData.metadata ? serializeQueueJobMetadata(validatedData.metadata) : undefined,
				};

				return await updateQueueJob(req.params.id, updateData);
			},
			catch: (error) => {
				logger.error('Error en PUT /api/queue/:id', { error });
				res.status(400);
				return {
					message: 'Error al actualizar trabajo en cola',
					error: error instanceof Error ? error.message : String(error),
				};
			},
		})
	)
);

// DELETE /api/queue/:id - Elimina un trabajo en cola
queueRouter.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				await deleteQueueJob(req.params.id);
				res.status(204);
				return { success: true };
			},
			catch: (error) => {
				logger.error('Error en DELETE /api/queue/:id', { error });
				return error;
			},
		})
	)
);

// POST /api/queue/:id/cancel - Cancela un trabajo en cola
queueRouter.post(
	'/:id/cancel',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => cancelQueueJob(req.params.id),
			catch: (error) => {
				logger.error('Error en POST /api/queue/:id/cancel', { error });
				return error;
			},
		})
	)
);

// POST /api/queue/:id/retry - Reintenta un trabajo en cola
queueRouter.post(
	'/:id/retry',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => retryQueueJob(req.params.id),
			catch: (error) => {
				logger.error('Error en POST /api/queue/:id/retry', { error });
				return error;
			},
		})
	)
);

// GET /api/queue/stats - Obtiene estadísticas de la cola
queueRouter.get(
	'/stats',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getQueueStats(),
			catch: (error) => {
				logger.error('Error en GET /api/queue/stats', { error });
				return error;
			},
		})
	)
);

// GET /api/queue/recent - Busca trabajos recientes
queueRouter.get(
	'/recent',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => {
				const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : 5;
				return findRecentQueueJobs(limit);
			},
			catch: (error) => {
				logger.error('Error en GET /api/queue/recent', { error });
				return error;
			},
		})
	)
);

// GET /api/queue/status/:status - Busca trabajos por estado
queueRouter.get(
	'/status/:status',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : 10;
				const statusParam = req.params.status;

				// Validar que el status es válido
				if (!Object.values(QueueJobStatus).includes(statusParam as QueueJobStatus)) {
					res.status(400);
					return {
						message: 'Estado inválido',
						validStatuses: Object.values(QueueJobStatus),
					};
				}

				const status = statusParam as QueueJobStatus;
				return await findQueueJobsByStatus(status, limit);
			},
			catch: (error) => {
				logger.error('Error en GET /api/queue/status/:status', { error });
				return error;
			},
		})
	)
);

// GET /api/queue/stats/:queue - Obtiene estadísticas para una cola específica
queueRouter.get(
	'/stats/:queue',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => getQueueStatsByQueue(req.params.queue),
			catch: (error) => {
				logger.error('Error en GET /api/queue/stats/:queue', { error });
				return error;
			},
		})
	)
);

// GET /api/queue/count/completed - Cuenta trabajos completados
queueRouter.get(
	'/count/completed',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => {
				const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
				return countCompletedJobs(since).then((count) => ({ count }));
			},
			catch: (error) => {
				logger.error('Error en GET /api/queue/count/completed', { error });
				return error;
			},
		})
	)
);

// GET /api/queue/count/failed - Cuenta trabajos fallidos
queueRouter.get(
	'/count/failed',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => {
				const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
				return countFailedJobs(since).then((count) => ({ count }));
			},
			catch: (error) => {
				logger.error('Error en GET /api/queue/count/failed', { error });
				return error;
			},
		})
	)
);

// GET /api/queue/count/total - Cuenta el total de trabajos
queueRouter.get(
	'/count/total',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => {
				const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
				return countTotalJobs(since).then((count) => ({ count }));
			},
			catch: (error) => {
				logger.error('Error en GET /api/queue/count/total', { error });
				return error;
			},
		})
	)
);

// GET /api/queue/processing-times - Busca los tiempos de procesamiento
queueRouter.get(
	'/processing-times',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: () => {
				const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
				return findProcessingTimes(since);
			},
			catch: (error) => {
				logger.error('Error en GET /api/queue/processing-times', { error });
				return error;
			},
		})
	)
);

export default queueRouter;
