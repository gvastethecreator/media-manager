/**
 * @file Serializadores para la entidad Task
 * @module transformers/task/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TaskBase, TaskExtended, TaskPriority, TaskStatus, TaskType } from '@/types/entities/task';
import { TransformerError } from '@/utils/transformers/errors';
import { TransformTaskOptions } from './transformer';

// Logger específico para este módulo
const logger = serverLogger.child({ module: 'TaskSerializers' });

/**
 * Convierte un objeto de Prisma a TaskBase
 */
export function fromPrismaTask(prismaTask: any): TaskBase {
	try {
		const baseTask: TaskBase = {
			id: prismaTask.id,
			type: prismaTask.type,
			name: prismaTask.name,
			description: prismaTask.description || undefined,
			priority: prismaTask.priority as TaskPriority,
			status: prismaTask.status as TaskStatus,
			schedule: prismaTask.schedule || undefined,
			handler: prismaTask.handler,
			params: deserializeParams(prismaTask.params),
			timeout: prismaTask.timeout || undefined,
			retryPolicy: deserializeRetryPolicy(prismaTask.retryPolicy),
			dependencies: deserializeDependencies(prismaTask.dependencies),
			tags: deserializeTags(prismaTask.tags),
			createdAt: new Date(prismaTask.createdAt),
			updatedAt: new Date(prismaTask.updatedAt),
		};

		return baseTask;
	} catch (error) {
		logger.error('❌ Error al convertir de Prisma a TaskBase:', error);
		throw new TransformerError('Error al deserializar tarea desde Prisma');
	}
}

/**
 * Convierte un objeto TaskBase a Extended con propiedades UI
 */
export function toExtendedTask(task: Partial<TaskBase>, _options: TransformTaskOptions = {}): TaskExtended {
	try {
		// Asegurarse de que tenemos un TaskBase válido
		if (!task.id || !task.name || !task.handler) {
			throw new Error('Campos requeridos faltantes en la tarea');
		}

		// Crear la versión extendida de la tarea
		const extendedTask: TaskExtended = {
			// Base fields (valores predeterminados para campos requeridos en caso de que falten)
			id: task.id,
			type: task.type || TaskType.CUSTOM,
			name: task.name,
			description: task.description,
			priority: task.priority || TaskPriority.NORMAL,
			status: task.status || TaskStatus.PENDING,
			schedule: task.schedule,
			handler: task.handler,
			params: task.params,
			timeout: task.timeout,
			retryPolicy: task.retryPolicy,
			dependencies: task.dependencies || [],
			tags: task.tags || [],
			createdAt: task.createdAt || new Date(),
			updatedAt: task.updatedAt || new Date(),

			// UI default properties
			isSelected: false,
			isHovered: false,
			isExpanded: false,
		};

		// Calcular propiedades adicionales según el estado
		if (task.status === TaskStatus.RUNNING) {
			const now = new Date();
			const startTime = task.createdAt || now;
			const runningTime = now.getTime() - startTime.getTime();

			extendedTask.progress = task.params?.progress || 0;
			extendedTask.runningTime = runningTime;

			// Estimar tiempo restante si hay progreso
			if (extendedTask.progress && extendedTask.progress > 0) {
				const remainingPercent = 100 - extendedTask.progress;
				const remainingTime = (runningTime / extendedTask.progress) * remainingPercent;
				extendedTask.remainingTime = remainingTime;
			}
		}

		// Calcular próxima ejecución si hay un horario programado
		if (task.schedule && task.status !== TaskStatus.COMPLETED) {
			// Simplificado: en un caso real, habría que interpretar la expresión cron
			extendedTask.nextRunAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 día
		}

		// Asignar propiedades visuales
		const typeIconMap: Record<string, string> = {
			[TaskType.MAINTENANCE]: '🔧',
			[TaskType.PROCESSING]: '⚙️',
			[TaskType.IMPORT]: '📥',
			[TaskType.EXPORT]: '📤',
			[TaskType.INDEXING]: '🔍',
			[TaskType.CLEANUP]: '🧹',
			[TaskType.BACKUP]: '💾',
			[TaskType.CUSTOM]: '🔮',
		};

		const statusColorMap: Record<string, string> = {
			[TaskStatus.PENDING]: '#6941C6', // Púrpura
			[TaskStatus.SCHEDULED]: '#3538CD', // Índigo
			[TaskStatus.RUNNING]: '#026AA2', // Azul
			[TaskStatus.COMPLETED]: '#039855', // Verde
			[TaskStatus.FAILED]: '#D92D20', // Rojo
			[TaskStatus.CANCELLED]: '#B54708', // Naranja
			[TaskStatus.PAUSED]: '#EAAA08', // Amarillo
		};

		extendedTask.icon = typeIconMap[extendedTask.type] || '⚡';
		extendedTask.color = statusColorMap[extendedTask.status] || '#667085';

		return extendedTask;
	} catch (error) {
		logger.error('❌ Error al convertir a TaskExtended:', error);
		throw new TransformerError('Error al transformar a tarea extendida');
	}
}

/**
 * Deserializa el campo params (JSON)
 */
function deserializeParams(params: string | object | undefined): Record<string, any> | undefined {
	if (!params) return undefined;

	try {
		if (typeof params === 'string') {
			return JSON.parse(params);
		}
		return params as Record<string, any>;
	} catch (error) {
		logger.warn('⚠️ Error al deserializar params de Task:', error);
		return {};
	}
}

/**
 * Deserializa el campo retryPolicy (JSON)
 */
function deserializeRetryPolicy(policy: string | object | undefined) {
	if (!policy) return undefined;

	try {
		if (typeof policy === 'string') {
			return JSON.parse(policy);
		}
		return policy;
	} catch (error) {
		logger.warn('⚠️ Error al deserializar retryPolicy de Task:', error);
		return undefined;
	}
}

/**
 * Deserializa el campo dependencies (array o string JSON)
 */
function deserializeDependencies(dependencies: string | string[] | undefined): string[] {
	if (!dependencies) return [];

	try {
		if (typeof dependencies === 'string') {
			return JSON.parse(dependencies);
		}
		return dependencies;
	} catch (error) {
		logger.warn('⚠️ Error al deserializar dependencies de Task:', error);
		return [];
	}
}

/**
 * Deserializa el campo tags (array o string JSON)
 */
function deserializeTags(tags: string | string[] | undefined): string[] {
	if (!tags) return [];

	try {
		if (typeof tags === 'string') {
			return JSON.parse(tags);
		}
		return tags;
	} catch (error) {
		logger.warn('⚠️ Error al deserializar tags de Task:', error);
		return [];
	}
}
