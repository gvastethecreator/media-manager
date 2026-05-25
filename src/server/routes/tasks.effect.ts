/**
 * @file Rutas de la API para Tasks - Versión Effect-TS
 * @module server/routes/tasks.effect
 * @description Rutas REST completas para la gestión de tasks en Effect-TS
 * @updated 2026-02-03
 */

import { Effect } from 'effect';
import { Router } from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	createTask,
	deleteTask,
	deleteTasks,
	getSubtasks,
	getTaskById,
	getTaskStats,
	listTasks,
	toggleTaskArchive,
	toggleTaskFavorite,
	updateTask,
	updateTaskProgress,
} from '@/services/task/task.service';
import { serializeTask, serializeTasks } from '@/transformers/task';
import type { TaskCreateInput, TaskUpdateInput } from '@/types/entities/task';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = Router();
const logger = serverLogger.withContext('TasksEffect');

// =============================================================================
// 📋 LISTADO Y BÚSQUEDA
// =============================================================================

// GET /api/tasks - Listar tasks con filtros
router.get(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const {
				search,
				status,
				priority,
				category,
				assignedTo,
				parentTaskId,
				projectId,
				isFavorite,
				isArchived,
				sortBy = 'createdAt',
				sortOrder = 'desc',
				limit = '50',
				offset = '0',
			} = req.query;

			const favoriteFilter = typeof isFavorite === 'string' ? isFavorite === 'true' : undefined;
			const archivedFilter = typeof isArchived === 'string' ? isArchived === 'true' : undefined;

			const options = {
				search: search as string,
				status: status as any,
				priority: priority as any,
				category: category as string,
				assignedTo: assignedTo as string,
				parentTaskId: parentTaskId as string,
				projectId: projectId as string,
				isFavorite: favoriteFilter,
				isArchived: archivedFilter,
				sortBy: sortBy as 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'status' | 'priority',
				sortOrder: sortOrder as 'asc' | 'desc',
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
			};

			const result = yield* Effect.tryPromise({
				try: () => listTasks(options),
				catch: (error) => {
					logger.error('Error listing tasks:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			return {
				tasks: serializeTasks(result.tasks),
				total: result.total,
				hasMore: result.hasMore,
				pagination: {
					total: result.total,
					limit: options.limit,
					offset: options.offset,
					hasNext: result.hasMore,
					hasPrev: options.offset > 0,
				},
			};
		})
	)
);

// GET /api/tasks/stats - Obtener estadísticas de tasks
router.get(
	'/stats',
	effectHandler((_req, res) =>
		Effect.gen(function* () {
			const stats = yield* Effect.tryPromise({
				try: () => getTaskStats(),
				catch: (error) => {
					logger.error('Error getting task stats:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			return stats;
		})
	)
);

// =============================================================================
// 🔍 OBTENER POR ID
// =============================================================================

// GET /api/tasks/:id - Obtener task por ID
router.get(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			const task = yield* Effect.tryPromise({
				try: () => getTaskById(id),
				catch: (error) => {
					logger.error(`Error getting task ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			if (!task) {
				res.status(404);
				return { error: 'Task no encontrado' };
			}

			return serializeTask(task);
		})
	)
);

// GET /api/tasks/:id/subtasks - Obtener subtasks de un task
router.get(
	'/:id/subtasks',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			const subtasks = yield* Effect.tryPromise({
				try: () => getSubtasks(id),
				catch: (error) => {
					logger.error(`Error getting subtasks for ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			return serializeTasks(subtasks);
		})
	)
);

// =============================================================================
// ✏️ CREAR
// =============================================================================

// POST /api/tasks - Crear task
router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const input: TaskCreateInput = req.body;

			// Validación básica
			if (!input.title || input.title.trim() === '') {
				res.status(400);
				return { error: 'El título es requerido' };
			}

			const task = yield* Effect.tryPromise({
				try: () => createTask(input),
				catch: (error) => {
					logger.error('Error creating task:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			res.status(201);
			return serializeTask(task);
		})
	)
);

// =============================================================================
// 📝 ACTUALIZAR
// =============================================================================

// PUT /api/tasks/:id - Actualizar task
router.put(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;
			const input: TaskUpdateInput = req.body;

			const task = yield* Effect.tryPromise({
				try: () => updateTask(id, input),
				catch: (error) => {
					logger.error(`Error updating task ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			if (!task) {
				res.status(404);
				return { error: 'Task no encontrado' };
			}

			return serializeTask(task);
		})
	)
);

// PATCH /api/tasks/:id/progress - Actualizar progreso de un task
router.patch(
	'/:id/progress',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;
			const { progress } = req.body;

			if (typeof progress !== 'number' || progress < 0 || progress > 100) {
				res.status(400);
				return { error: 'El progreso debe ser un número entre 0 y 100' };
			}

			const task = yield* Effect.tryPromise({
				try: () => updateTaskProgress(id, progress),
				catch: (error) => {
					logger.error(`Error updating task progress ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			if (!task) {
				res.status(404);
				return { error: 'Task no encontrado' };
			}

			return serializeTask(task);
		})
	)
);

// =============================================================================
// 🗑️ ELIMINAR
// =============================================================================

// DELETE /api/tasks/:id - Eliminar task
router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			yield* Effect.tryPromise({
				try: () => deleteTask(id),
				catch: (error) => {
					logger.error(`Error deleting task ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			res.status(204);
			return { success: true };
		})
	)
);

// POST /api/tasks/bulk-delete - Eliminar múltiples tasks
router.post(
	'/bulk-delete',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { ids } = req.body;

			if (!Array.isArray(ids) || ids.length === 0) {
				res.status(400);
				return { error: 'Se requiere un array de IDs' };
			}

			yield* Effect.tryPromise({
				try: () => deleteTasks(ids),
				catch: (error) => {
					logger.error('Error bulk deleting tasks:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			return { deleted: ids.length };
		})
	)
);

// =============================================================================
// ⭐ OPERACIONES ESPECIALES
// =============================================================================

// POST /api/tasks/:id/favorite - Toggle favorito
router.post(
	'/:id/favorite',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			const task = yield* Effect.tryPromise({
				try: () => toggleTaskFavorite(id),
				catch: (error) => {
					logger.error(`Error toggling task favorite ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			if (!task) {
				res.status(404);
				return { error: 'Task no encontrado' };
			}

			return serializeTask(task);
		})
	)
);

// POST /api/tasks/:id/archive - Toggle archivo
router.post(
	'/:id/archive',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			const task = yield* Effect.tryPromise({
				try: () => toggleTaskArchive(id),
				catch: (error) => {
					logger.error(`Error toggling task archive ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			if (!task) {
				res.status(404);
				return { error: 'Task no encontrado' };
			}

			return serializeTask(task);
		})
	)
);

export default router;
