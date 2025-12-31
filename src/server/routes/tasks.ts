/**
 * @file Rutas de la API para Tasks
 * @module server/routes/tasks
 * @description Rutas REST completas para la gestión de tasks
 * @updated 2025-10-01
 */

import express from 'express';
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
} from '@/services/task';
import { serializeTask, serializeTasks } from '@/transformers/task';
import type { TaskCreateInput, TaskUpdateInput } from '@/types/entities/task';

const router = express.Router();

// =============================================================================
// 📋 LISTADO Y BÚSQUEDA
// =============================================================================

// GET /tasks - Listar tasks con filtros
router.get('/', async (req, res) => {
	try {
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

		const options = {
			search: search as string,
			status: status as any,
			priority: priority as any,
			category: category as string,
			assignedTo: assignedTo as string,
			parentTaskId: parentTaskId as string,
			projectId: projectId as string,
			isFavorite: isFavorite === 'true',
			isArchived: isArchived === 'true',
			sortBy: sortBy as 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'status' | 'priority',
			sortOrder: sortOrder as 'asc' | 'desc',
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
		};

		const result = await listTasks(options);

		res.json({
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
		});
	} catch (error) {
		serverLogger.error('Error listing tasks:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /tasks/stats - Obtener estadísticas de tasks
router.get('/stats', async (req, res) => {
	try {
		const stats = await getTaskStats();
		res.json(stats);
	} catch (error) {
		serverLogger.error('Error getting task stats:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// =============================================================================
// 🔍 OBTENER POR ID
// =============================================================================

// GET /tasks/:id - Obtener task por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const task = await getTaskById(id);

		if (!task) {
			res.status(404).json({ error: 'Task no encontrado' });
			return;
		}

		res.json(serializeTask(task));
	} catch (error) {
		serverLogger.error('Error getting task:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /tasks/:id/subtasks - Obtener subtasks de un task
router.get('/:id/subtasks', async (req, res) => {
	try {
		const { id } = req.params;
		const subtasks = await getSubtasks(id);
		res.json(serializeTasks(subtasks));
	} catch (error) {
		serverLogger.error('Error getting subtasks:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// =============================================================================
// ✏️ CREAR
// =============================================================================

// POST /tasks - Crear task
router.post('/', async (req, res) => {
	try {
		const input: TaskCreateInput = req.body;

		// Validación básica
		if (!input.title || input.title.trim() === '') {
			res.status(400).json({ error: 'El título es requerido' });
			return;
		}

		const task = await createTask(input);
		res.status(201).json(serializeTask(task));
	} catch (error) {
		serverLogger.error('Error creating task:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// =============================================================================
// 📝 ACTUALIZAR
// =============================================================================

// PUT /tasks/:id - Actualizar task
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const input: TaskUpdateInput = req.body;

		const task = await updateTask(id, input);

		if (!task) {
			res.status(404).json({ error: 'Task no encontrado' });
			return;
		}

		res.json(serializeTask(task));
	} catch (error) {
		serverLogger.error('Error updating task:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PATCH /tasks/:id/progress - Actualizar progreso de un task
router.patch('/:id/progress', async (req, res) => {
	try {
		const { id } = req.params;
		const { progress } = req.body;

		if (typeof progress !== 'number' || progress < 0 || progress > 100) {
			res.status(400).json({ error: 'El progreso debe ser un número entre 0 y 100' });
			return;
		}

		const task = await updateTaskProgress(id, progress);

		if (!task) {
			res.status(404).json({ error: 'Task no encontrado' });
			return;
		}

		res.json(serializeTask(task));
	} catch (error) {
		serverLogger.error('Error updating task progress:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// =============================================================================
// 🗑️ ELIMINAR
// =============================================================================

// DELETE /tasks/:id - Eliminar task
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await deleteTask(id);
		res.status(204).send();
	} catch (error) {
		serverLogger.error('Error deleting task:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /tasks/bulk-delete - Eliminar múltiples tasks
router.post('/bulk-delete', async (req, res) => {
	try {
		const { ids } = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			res.status(400).json({ error: 'Se requiere un array de IDs' });
			return;
		}

		await deleteTasks(ids);
		res.json({ deleted: ids.length });
	} catch (error) {
		serverLogger.error('Error bulk deleting tasks:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// =============================================================================
// ⭐ OPERACIONES ESPECIALES
// =============================================================================

// POST /tasks/:id/favorite - Toggle favorito
router.post('/:id/favorite', async (req, res) => {
	try {
		const { id } = req.params;
		const task = await toggleTaskFavorite(id);

		if (!task) {
			res.status(404).json({ error: 'Task no encontrado' });
			return;
		}

		res.json(serializeTask(task));
	} catch (error) {
		serverLogger.error('Error toggling task favorite:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /tasks/:id/archive - Toggle archivo
router.post('/:id/archive', async (req, res) => {
	try {
		const { id } = req.params;
		const task = await toggleTaskArchive(id);

		if (!task) {
			res.status(404).json({ error: 'Task no encontrado' });
			return;
		}

		res.json(serializeTask(task));
	} catch (error) {
		serverLogger.error('Error toggling task archive:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
