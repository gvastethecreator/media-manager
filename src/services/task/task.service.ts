/**
 * @file Servicio para la gestión de tareas
 * @module services/task
 * @description Service completo para CRUD de tasks con Drizzle ORM
 * @deprecated Task en deprecación por ADR target architecture. Patrón legacy pre-Effect.
 * Si reabre como `Workflow/Projects`, migrar a Effect-TS.
 */

import type { InferSelectModel } from 'drizzle-orm';
import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/drizzle';
import { tasks } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats/stats.service';

// Tipo inferido del esquema
type Task = InferSelectModel<typeof tasks>;

// Logger específico para el servicio de tasks
const logger = serverLogger.withContext('TaskService');

// =================================================================================
// TIPOS
// =================================================================================

export interface TaskCreateInput {
	assignedTo?: string;
	category?: string;
	color?: string;
	description?: string;
	dueDate?: Date;
	emoji?: string;
	estimatedHours?: number;
	featuredImage?: string;
	isFavorite?: boolean;
	notes?: string;
	parentTaskId?: string;
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	projectId?: string;
	status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	tags?: string[];
	title: string;
}

export interface TaskUpdateInput {
	actualHours?: number;
	assignedTo?: string;
	category?: string;
	color?: string;
	completedAt?: Date;
	description?: string;
	dueDate?: Date;
	emoji?: string;
	estimatedHours?: number;
	featuredImage?: string;
	isArchived?: boolean;
	isFavorite?: boolean;
	notes?: string;
	parentTaskId?: string;
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	progress?: number;
	projectId?: string;
	status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	tags?: string[];
	title?: string;
}

export interface TaskFilters {
	assignedTo?: string;
	category?: string;
	isArchived?: boolean;
	isFavorite?: boolean;
	parentTaskId?: string;
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	projectId?: string;
	search?: string;
	status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface TaskSearchOptions extends TaskFilters {
	limit?: number;
	offset?: number;
	sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';
	sortOrder?: 'asc' | 'desc';
}

export interface TaskWithStats {
	_count: {
		subtasks: number;
		images: number;
		videos: number;
		albums: number;
		characters: number;
	};
	actualHours: number | null;
	assignedTo: string | null;
	category: string | null;
	color: string | null;
	completedAt: Date | null;
	createdAt: Date;
	description: string | null;
	dueDate: Date | null;
	emoji: string | null;
	estimatedHours: number | null;
	featuredImage: string | null;
	id: string;
	isArchived: boolean;
	isFavorite: boolean;
	notes: string | null;
	parentTaskId: string | null;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	progress: number;
	projectId: string | null;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	tags: string | null;
	title: string;
	updatedAt: Date | null;
}

// =================================================================================
// CÓDIGOS DE ERROR
// =================================================================================

export enum TaskErrorCode {
	NOT_FOUND = 'TASK_NOT_FOUND',
	ALREADY_EXISTS = 'TASK_ALREADY_EXISTS',
	INVALID_DATA = 'TASK_INVALID_DATA',
	OPERATION_FAILED = 'TASK_OPERATION_FAILED',
	PERMISSION_DENIED = 'TASK_PERMISSION_DENIED',
}

export const createTaskError = (
	message: string,
	code: TaskErrorCode = TaskErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'TaskServiceError';
	Object.assign(error, { code, cause });
	return error;
};

// =================================================================================
// EVENTOS
// =================================================================================

export const TASK_EVENTS = {
	CREATED: 'task:created',
	UPDATED: 'task:updated',
	DELETED: 'task:deleted',
	STATUS_CHANGED: 'task:status:changed',
	COMPLETED: 'task:completed',
} as const;

export const notifyTaskChange = async (
	action: 'create' | 'update' | 'delete' | 'complete',
	task: TaskWithStats | { id: string }
) => {
	await emit({
		type: 'update',
		data: { action, task },
	});

	statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);
	logger.info(`🔔 Notificado cambio en task: ${action}`, { taskId: task.id });
};

// =================================================================================
// OPERACIONES CRUD
// =================================================================================

/**
 * Obtiene un task por su ID con estadísticas
 */
export async function getTaskById(id: string): Promise<TaskWithStats | null> {
	try {
		logger.info(`🔍 Buscando task con ID: ${id}`);

		const taskResult = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

		if (taskResult.length === 0) {
			logger.warn(`⚠️ Task no encontrado: ${id}`);
			return null;
		}

		const task = taskResult[0];

		// Contar subtareas
		const subtasksCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.parentTaskId, id));

		// TODO: Implementar conteos de relaciones cuando se agreguen las tablas many-to-many

		const result: TaskWithStats = {
			...task,
			_count: {
				subtasks: subtasksCount[0]?.count || 0,
				images: 0, // TODO: Implementar cuando exista imageTasks
				videos: 0, // TODO: Implementar cuando exista videoTasks
				albums: 0, // TODO: Implementar cuando exista albumTasks
				characters: 0, // TODO: Implementar cuando exista characterTasks
			},
		};

		logger.info(`✅ Task encontrado: ${task.title}`);
		return result;
	} catch (error) {
		logger.error('❌ Error al obtener task:', error);
		throw createTaskError('Error al obtener task', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Lista tasks con filtros y paginación
 */
export async function listTasks(options: TaskSearchOptions = {}): Promise<{
	tasks: TaskWithStats[];
	total: number;
	hasMore: boolean;
}> {
	try {
		logger.info('📋 Listando tasks con opciones:', options);

		const { sortBy = 'createdAt', sortOrder = 'desc', limit = 50, offset = 0, ...filters } = options;

		// Construir condiciones de filtrado
		const conditions: any[] = [];

		if (filters.status) {
			conditions.push(eq(tasks.status, filters.status));
		}

		if (filters.priority) {
			conditions.push(eq(tasks.priority, filters.priority));
		}

		if (filters.category) {
			conditions.push(eq(tasks.category, filters.category));
		}

		if (filters.assignedTo) {
			conditions.push(eq(tasks.assignedTo, filters.assignedTo));
		}

		if (filters.parentTaskId) {
			conditions.push(eq(tasks.parentTaskId, filters.parentTaskId));
		}

		if (filters.projectId) {
			conditions.push(eq(tasks.projectId, filters.projectId));
		}

		if (filters.isFavorite !== undefined) {
			conditions.push(eq(tasks.isFavorite, filters.isFavorite));
		}

		if (filters.isArchived !== undefined) {
			conditions.push(eq(tasks.isArchived, filters.isArchived));
		}

		if (filters.search) {
			conditions.push(
				or(
					like(tasks.title, `%${filters.search}%`),
					like(tasks.description, `%${filters.search}%`),
					like(tasks.notes, `%${filters.search}%`)
				)
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Obtener el conteo total
		const totalResult = await db.select({ count: count() }).from(tasks).where(whereClause);

		const total = totalResult[0]?.count || 0;

		// Obtener tasks
		const orderByClause = sortOrder === 'desc' ? desc(tasks[sortBy]) : asc(tasks[sortBy]);

		const tasksResult = await db
			.select()
			.from(tasks)
			.where(whereClause)
			.orderBy(orderByClause)
			.limit(limit)
			.offset(offset);

		// Agregar estadísticas a cada task
		const tasksWithStats: TaskWithStats[] = await Promise.all(
			tasksResult.map(async (task: Task) => {
				const subtasksCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.parentTaskId, task.id));

				return {
					...task,
					_count: {
						subtasks: subtasksCount[0]?.count || 0,
						images: 0,
						videos: 0,
						albums: 0,
						characters: 0,
					},
				};
			})
		);

		const hasMore = offset + tasksResult.length < total;

		logger.info(`✅ Se encontraron ${tasksResult.length} tasks de ${total} totales`);

		return {
			tasks: tasksWithStats,
			total,
			hasMore,
		};
	} catch (error) {
		logger.error('❌ Error al listar tasks:', error);
		throw createTaskError('Error al listar tasks', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo task
 */
export async function createTask(input: TaskCreateInput): Promise<TaskWithStats> {
	try {
		logger.info('➕ Creando nuevo task:', input.title);

		const id = nanoid();
		const now = new Date();
		const requestedIsFavorite = input.isFavorite === true;

		const insertData = {
			id,
			title: input.title,
			description: input.description || null,
			status: input.status || 'pending',
			priority: input.priority || 'medium',
			emoji: input.emoji || '📋',
			color: input.color || '#6366f1',
			category: input.category || null,
			tags: input.tags ? JSON.stringify(input.tags) : null,
			dueDate: input.dueDate || null,
			completedAt: null,
			estimatedHours: input.estimatedHours || null,
			actualHours: null,
			progress: 0,
			assignedTo: input.assignedTo || null,
			parentTaskId: input.parentTaskId || null,
			projectId: input.projectId || null,
			notes: input.notes || null,
			featuredImage: input.featuredImage || null,
			isFavorite: requestedIsFavorite,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
		};

		await db.insert(tasks).values(insertData);

		const newTask = await getTaskById(id);

		if (!newTask) {
			throw createTaskError('Error al recuperar el task creado', TaskErrorCode.OPERATION_FAILED);
		}

		await notifyTaskChange('create', newTask);

		logger.info(`✅ Task creado exitosamente: ${newTask.title}`);
		return newTask;
	} catch (error) {
		logger.error('❌ Error al crear task:', error);
		throw createTaskError('Error al crear task', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un task existente
 */
export async function updateTask(id: string, input: TaskUpdateInput): Promise<TaskWithStats> {
	try {
		logger.info(`📝 Actualizando task: ${id}`);

		const existing = await getTaskById(id);

		if (!existing) {
			throw createTaskError('Task no encontrado', TaskErrorCode.NOT_FOUND);
		}

		const updateData: any = {
			updatedAt: new Date(),
		};

		if (input.title !== undefined) updateData.title = input.title;
		if (input.description !== undefined) updateData.description = input.description;
		if (input.status !== undefined) {
			updateData.status = input.status;
			// Auto-completar cuando el status es completed
			if (input.status === 'completed' && !existing.completedAt) {
				updateData.completedAt = new Date();
				updateData.progress = 100;
			}
		}
		if (input.priority !== undefined) updateData.priority = input.priority;
		if (input.emoji !== undefined) updateData.emoji = input.emoji;
		if (input.color !== undefined) updateData.color = input.color;
		if (input.category !== undefined) updateData.category = input.category;
		if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
		if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
		if (input.completedAt !== undefined) updateData.completedAt = input.completedAt;
		if (input.estimatedHours !== undefined) updateData.estimatedHours = input.estimatedHours;
		if (input.actualHours !== undefined) updateData.actualHours = input.actualHours;
		if (input.progress !== undefined) updateData.progress = input.progress;
		if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
		if (input.parentTaskId !== undefined) updateData.parentTaskId = input.parentTaskId;
		if (input.projectId !== undefined) updateData.projectId = input.projectId;
		if (input.notes !== undefined) updateData.notes = input.notes;
		if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
		if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;
		if (input.isArchived !== undefined) updateData.isArchived = input.isArchived;

		await db.update(tasks).set(updateData).where(eq(tasks.id, id));

		const updatedTask = await getTaskById(id);

		if (!updatedTask) {
			throw createTaskError('Error al recuperar el task actualizado', TaskErrorCode.OPERATION_FAILED);
		}

		const action = input.status === 'completed' ? 'complete' : 'update';
		await notifyTaskChange(action, updatedTask);

		logger.info(`✅ Task actualizado exitosamente: ${updatedTask.title}`);
		return updatedTask;
	} catch (error) {
		logger.error('❌ Error al actualizar task:', error);
		throw createTaskError('Error al actualizar task', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un task
 */
export async function deleteTask(id: string): Promise<void> {
	try {
		logger.info(`🗑️ Eliminando task: ${id}`);

		const existing = await getTaskById(id);

		if (!existing) {
			throw createTaskError('Task no encontrado', TaskErrorCode.NOT_FOUND);
		}

		await db.delete(tasks).where(eq(tasks.id, id));

		await notifyTaskChange('delete', { id });

		logger.info(`✅ Task eliminado exitosamente: ${id}`);
	} catch (error) {
		logger.error('❌ Error al eliminar task:', error);
		throw createTaskError('Error al eliminar task', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina múltiples tasks
 */
export async function deleteTasks(ids: string[]): Promise<void> {
	try {
		logger.info(`🗑️ Eliminando ${ids.length} tasks`);

		if (ids.length === 0) {
			return;
		}

		await db.delete(tasks).where(inArray(tasks.id, ids));

		for (const id of ids) {
			await notifyTaskChange('delete', { id });
		}

		logger.info(`✅ ${ids.length} tasks eliminados exitosamente`);
	} catch (error) {
		logger.error('❌ Error al eliminar tasks:', error);
		throw createTaskError('Error al eliminar tasks', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Marca un task como favorito o no favorito
 */
export async function toggleTaskFavorite(id: string): Promise<TaskWithStats> {
	try {
		logger.info(`⭐ Alternando favorito para task: ${id}`);

		const existing = await getTaskById(id);

		if (!existing) {
			throw createTaskError('Task no encontrado', TaskErrorCode.NOT_FOUND);
		}

		await db
			.update(tasks)
			.set({ isFavorite: !existing.isFavorite, updatedAt: new Date() })
			.where(eq(tasks.id, id));

		const updatedTask = await getTaskById(id);

		if (!updatedTask) {
			throw createTaskError('Error al recuperar el task tras alternar favorito', TaskErrorCode.OPERATION_FAILED);
		}

		await notifyTaskChange('update', updatedTask);

		return updatedTask;
	} catch (error) {
		logger.error('❌ Error al alternar favorito:', error);
		throw createTaskError('Error al alternar favorito', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Archiva o desarchivatask
 */
export async function toggleTaskArchive(id: string): Promise<TaskWithStats> {
	try {
		logger.info(`📦 Alternando archivo para task: ${id}`);

		const existing = await getTaskById(id);

		if (!existing) {
			throw createTaskError('Task no encontrado', TaskErrorCode.NOT_FOUND);
		}

		return await updateTask(id, { isArchived: !existing.isArchived });
	} catch (error) {
		logger.error('❌ Error al alternar archivo:', error);
		throw createTaskError('Error al alternar archivo', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza el progreso de un task
 */
export async function updateTaskProgress(id: string, progress: number): Promise<TaskWithStats> {
	try {
		logger.info(`📊 Actualizando progreso de task ${id} a ${progress}%`);

		const validProgress = Math.max(0, Math.min(100, progress));

		return await updateTask(id, {
			progress: validProgress,
			status: validProgress === 100 ? 'completed' : 'in_progress',
		});
	} catch (error) {
		logger.error('❌ Error al actualizar progreso:', error);
		throw createTaskError('Error al actualizar progreso', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene subtareas de un task padre
 */
export async function getSubtasks(parentId: string): Promise<TaskWithStats[]> {
	try {
		logger.info(`📋 Obteniendo subtareas para task: ${parentId}`);

		const result = await listTasks({
			parentTaskId: parentId,
			sortBy: 'createdAt',
			sortOrder: 'asc',
		});

		logger.info(`✅ Se encontraron ${result.tasks.length} subtareas`);
		return result.tasks;
	} catch (error) {
		logger.error('❌ Error al obtener subtareas:', error);
		throw createTaskError('Error al obtener subtareas', TaskErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene estadísticas de tasks
 */
export async function getTaskStats() {
	try {
		logger.info('📊 Obteniendo estadísticas de tasks');

		const [totalResult, byStatusResult, byPriorityResult, completedResult] = await Promise.all([
			db.select({ count: count() }).from(tasks),
			db
				.select({
					status: tasks.status,
					count: count(),
				})
				.from(tasks)
				.groupBy(tasks.status),
			db
				.select({
					priority: tasks.priority,
					count: count(),
				})
				.from(tasks)
				.groupBy(tasks.priority),
			db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'completed')),
		]);

		const stats = {
			total: totalResult[0]?.count || 0,
			completed: completedResult[0]?.count || 0,
			byStatus: byStatusResult.reduce(
				(acc: Record<string, number>, { status, count }: any) => {
					acc[status] = count;
					return acc;
				},
				{} as Record<string, number>
			),
			byPriority: byPriorityResult.reduce(
				(acc: Record<string, number>, { priority, count }: any) => {
					acc[priority] = count;
					return acc;
				},
				{} as Record<string, number>
			),
		};

		logger.info('✅ Estadísticas obtenidas exitosamente');
		return stats;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas:', error);
		throw createTaskError('Error al obtener estadísticas', TaskErrorCode.OPERATION_FAILED, error);
	}
}
