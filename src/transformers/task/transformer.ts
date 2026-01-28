/**
 * @file Transformadores para la entidad Task
 * @module transformers/task
 * @description Transformaciones entre Drizzle y tipos de aplicación
 */

import type { Task } from '@/lib/drizzle/schema/taxonomy/tasks';
import type { TaskCreateInput, TaskExtended, TaskUpdateInput, TaskWithStats } from '@/types/entities/task';

/**
 * Transforma un task de Drizzle a TaskWithStats
 */
export function fromDrizzleTask(task: Task, counts?: Partial<TaskWithStats['_count']>): TaskWithStats {
	return {
		id: task.id,
		title: task.title,
		description: task.description,
		status: task.status,
		priority: task.priority,
		emoji: task.emoji,
		color: task.color,
		category: task.category,
		tags: task.tags,
		dueDate: task.dueDate,
		completedAt: task.completedAt,
		estimatedHours: task.estimatedHours,
		actualHours: task.actualHours,
		progress: task.progress,
		assignedTo: task.assignedTo,
		parentTaskId: task.parentTaskId,
		projectId: task.projectId,
		notes: task.notes,
		featuredImage: task.featuredImage,
		isFavorite: task.isFavorite,
		isArchived: task.isArchived,
		createdAt: task.createdAt,
		updatedAt: task.updatedAt,
		_count: {
			subtasks: counts?.subtasks ?? 0,
			images: counts?.images ?? 0,
			videos: counts?.videos ?? 0,
			albums: counts?.albums ?? 0,
			characters: counts?.characters ?? 0,
		},
	};
}

/**
 * Transforma TaskCreateInput a formato Drizzle insert
 */
export function toCreateTaskData(input: TaskCreateInput) {
	return {
		title: input.title,
		description: input.description ?? null,
		status: input.status ?? 'pending',
		priority: input.priority ?? 'medium',
		emoji: input.emoji ?? '📋',
		color: input.color ?? 'var(--preset-indigo)',
		category: input.category ?? null,
		tags: input.tags ? JSON.stringify(input.tags) : null,
		dueDate: input.dueDate ?? null,
		estimatedHours: input.estimatedHours ?? null,
		assignedTo: input.assignedTo ?? null,
		parentTaskId: input.parentTaskId ?? null,
		projectId: input.projectId ?? null,
		notes: input.notes ?? null,
		featuredImage: input.featuredImage ?? null,
		isFavorite: input.isFavorite ?? false,
	};
}

/**
 * Transforma TaskUpdateInput a formato Drizzle update
 */
export function toUpdateTaskData(input: TaskUpdateInput) {
	const updateData: Partial<Task> = {
		updatedAt: new Date(),
	};

	if (input.title !== undefined) updateData.title = input.title;
	if (input.description !== undefined) updateData.description = input.description;
	if (input.status !== undefined) {
		updateData.status = input.status;
		// Auto-completar cuando el status es completed
		if (input.status === 'completed') {
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

	return updateData;
}

/**
 * Transforma TaskWithStats a TaskExtended con campos procesados
 */
export function toExtendedTask(task: TaskWithStats): TaskExtended {
	const now = new Date();
	const parsedTags = task.tags ? (JSON.parse(task.tags) as string[]) : [];

	const isOverdue = task.dueDate ? task.dueDate < now && task.status !== 'completed' : false;

	const daysUntilDue = task.dueDate
		? Math.floor((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
		: null;

	const completionPercentage = task.progress;

	const timeSpentPercentage =
		task.estimatedHours && task.actualHours ? (task.actualHours / task.estimatedHours) * 100 : null;

	return {
		...task,
		parsedTags,
		isOverdue,
		daysUntilDue,
		completionPercentage,
		timeSpentPercentage,
	};
}

/**
 * Transforma un array de tasks de Drizzle
 */
export function fromDrizzleTasks(tasks: Task[]): TaskWithStats[] {
	return tasks.map((task) => fromDrizzleTask(task));
}

/**
 * Serializa TaskWithStats para API response
 */
export function serializeTask(task: TaskWithStats): Record<string, unknown> {
	return {
		id: task.id,
		title: task.title,
		description: task.description,
		status: task.status,
		priority: task.priority,
		emoji: task.emoji,
		color: task.color,
		category: task.category,
		tags: task.tags ? JSON.parse(task.tags) : [],
		dueDate: task.dueDate?.toISOString() ?? null,
		completedAt: task.completedAt?.toISOString() ?? null,
		estimatedHours: task.estimatedHours,
		actualHours: task.actualHours,
		progress: task.progress,
		assignedTo: task.assignedTo,
		parentTaskId: task.parentTaskId,
		projectId: task.projectId,
		notes: task.notes,
		featuredImage: task.featuredImage,
		isFavorite: task.isFavorite,
		isArchived: task.isArchived,
		createdAt: task.createdAt.toISOString(),
		updatedAt: task.updatedAt?.toISOString() ?? null,
		_count: task._count,
	};
}

/**
 * Serializa un array de tasks
 */
export function serializeTasks(tasks: TaskWithStats[]): Record<string, unknown>[] {
	return tasks.map(serializeTask);
}
