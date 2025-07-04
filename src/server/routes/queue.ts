import { Router } from 'express';
import { z } from 'zod';
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
import { CreateQueueJobInputSchema, UpdateQueueJobInputSchema } from '@/types/entities/queue-job/schema';

export const queueRouter = Router();
const logger = serverLogger.withContext('QueueRoutes');

// GET /api/queue - Obtiene una lista paginada de trabajos en cola
queueRouter.get('/', async (req, res) => {
	try {
		const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
		const pagination = req.query.pagination ? JSON.parse(req.query.pagination as string) : {};
		const result = await findQueueJobs(filters, pagination);
		res.json(result);
	} catch (error) {
		logger.error('Error en GET /api/queue', { error });
		res.status(500).json({
			message: 'Error al obtener trabajos en cola',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// POST /api/queue - Crea un nuevo trabajo en cola
queueRouter.post('/', async (req, res) => {
	try {
		const validatedData = CreateQueueJobInputSchema.parse(req.body);
		const job = await createQueueJob(validatedData);
		res.status(201).json(job);
	} catch (error) {
		logger.error('Error en POST /api/queue', { error });
		res.status(400).json({
			message: 'Error al crear trabajo en cola',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/:id - Obtiene un trabajo en cola por ID
queueRouter.get('/:id', async (req, res) => {
	try {
		const job = await getQueueJobById(req.params.id);
		if (job) {
			res.json(job);
		} else {
			res.status(404).json({ message: 'Trabajo en cola no encontrado' });
		}
	} catch (error) {
		logger.error('Error en GET /api/queue/:id', { error });
		res.status(500).json({
			message: 'Error al obtener trabajo en cola',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// PUT /api/queue/:id - Actualiza un trabajo en cola existente
queueRouter.put('/:id', async (req, res) => {
	try {
		const validatedData = UpdateQueueJobInputSchema.parse(req.body);
		const job = await updateQueueJob(req.params.id, validatedData);
		res.json(job);
	} catch (error) {
		logger.error('Error en PUT /api/queue/:id', { error });
		res.status(400).json({
			message: 'Error al actualizar trabajo en cola',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// DELETE /api/queue/:id - Elimina un trabajo en cola
queueRouter.delete('/:id', async (req, res) => {
	try {
		await deleteQueueJob(req.params.id);
		res.status(204).send();
	} catch (error) {
		logger.error('Error en DELETE /api/queue/:id', { error });
		res.status(500).json({
			message: 'Error al eliminar trabajo en cola',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// POST /api/queue/:id/cancel - Cancela un trabajo en cola
queueRouter.post('/:id/cancel', async (req, res) => {
	try {
		const job = await cancelQueueJob(req.params.id);
		res.json(job);
	} catch (error) {
		logger.error('Error en POST /api/queue/:id/cancel', { error });
		res.status(500).json({
			message: 'Error al cancelar trabajo en cola',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// POST /api/queue/:id/retry - Reintenta un trabajo en cola
queueRouter.post('/:id/retry', async (req, res) => {
	try {
		const job = await retryQueueJob(req.params.id);
		res.json(job);
	} catch (error) {
		logger.error('Error en POST /api/queue/:id/retry', { error });
		res.status(500).json({
			message: 'Error al reintentar trabajo en cola',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/stats - Obtiene estadísticas de la cola
queueRouter.get('/stats', async (req, res) => {
	try {
		const stats = await getQueueStats();
		res.json(stats);
	} catch (error) {
		logger.error('Error en GET /api/queue/stats', { error });
		res.status(500).json({
			message: 'Error al obtener estadísticas de la cola',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/recent - Busca trabajos recientes
queueRouter.get('/recent', async (req, res) => {
	try {
		const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : 5;
		const jobs = await findRecentQueueJobs(limit);
		res.json(jobs);
	} catch (error) {
		logger.error('Error en GET /api/queue/recent', { error });
		res.status(500).json({
			message: 'Error al buscar trabajos recientes',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/status/:status - Busca trabajos por estado
queueRouter.get('/status/:status', async (req, res) => {
	try {
		const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : 10;
		const jobs = await findQueueJobsByStatus(req.params.status, limit);
		res.json(jobs);
	} catch (error) {
		logger.error('Error en GET /api/queue/status/:status', { error });
		res.status(500).json({
			message: 'Error al buscar trabajos por estado',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/stats/:queue - Obtiene estadísticas para una cola específica
queueRouter.get('/stats/:queue', async (req, res) => {
	try {
		const stats = await getQueueStatsByQueue(req.params.queue);
		res.json(stats);
	} catch (error) {
		logger.error('Error en GET /api/queue/stats/:queue', { error });
		res.status(500).json({
			message: 'Error al obtener estadísticas para cola específica',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/count/completed - Cuenta trabajos completados
queueRouter.get('/count/completed', async (req, res) => {
	try {
		const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
		const count = await countCompletedJobs(since);
		res.json({ count });
	} catch (error) {
		logger.error('Error en GET /api/queue/count/completed', { error });
		res.status(500).json({
			message: 'Error al contar trabajos completados',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/count/failed - Cuenta trabajos fallidos
queueRouter.get('/count/failed', async (req, res) => {
	try {
		const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
		const count = await countFailedJobs(since);
		res.json({ count });
	} catch (error) {
		logger.error('Error en GET /api/queue/count/failed', { error });
		res.status(500).json({
			message: 'Error al contar trabajos fallidos',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/count/total - Cuenta el total de trabajos
queueRouter.get('/count/total', async (req, res) => {
	try {
		const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
		const count = await countTotalJobs(since);
		res.json({ count });
	} catch (error) {
		logger.error('Error en GET /api/queue/count/total', { error });
		res.status(500).json({
			message: 'Error al contar total de trabajos',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

// GET /api/queue/processing-times - Busca los tiempos de procesamiento
queueRouter.get('/processing-times', async (req, res) => {
	try {
		const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
		const times = await findProcessingTimes(since);
		res.json(times);
	} catch (error) {
		logger.error('Error en GET /api/queue/processing-times', { error });
		res.status(500).json({
			message: 'Error al buscar tiempos de procesamiento',
			error: error instanceof Error ? error.message : String(error),
		});
	}
});
