/**
 * @file Tipos extendidos para la entidad Task
 * @module types/entities/task/extended
 */

import { TaskBase } from './base';

/**
 * Task con propiedades extendidas para UI
 */
export interface TaskExtended extends TaskBase {
	// Propiedades extendidas para UI
	progress?: number; // progreso de 0 a 100
	runningTime?: number; // tiempo de ejecución en ms
	remainingTime?: number; // tiempo estimado restante en ms
	lastRunAt?: Date; // última vez que se ejecutó
	nextRunAt?: Date; // próxima ejecución programada

	// Propiedades de UI
	isSelected?: boolean;
	isHovered?: boolean;
	isExpanded?: boolean;

	// Propiedades visuales
	color?: string;
	icon?: string;
}

/**
 * Task con estadísticas
 */
export interface TaskWithStats extends TaskExtended {
	stats: {
		// Tiempos
		averageRuntime?: number; // tiempo promedio de ejecución en ms
		lastRuntime?: number; // tiempo de la última ejecución en ms

		// Resultados
		successCount?: number; // número de ejecuciones exitosas
		failureCount?: number; // número de ejecuciones fallidas
		retryCount?: number; // número de reintentos

		// Rendimiento
		averageCpuUsage?: number; // uso promedio de CPU en %
		averageMemoryUsage?: number; // uso promedio de memoria en MB
	};
}

/**
 * Resultado de búsqueda de tareas
 */
export interface TaskSearchResult {
	items: TaskExtended[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

/**
 * Opciones para búsqueda de tareas
 */
export interface TaskSearchOptions {
	status?: string[];
	priority?: string[];
	type?: string[];
	tags?: string[];
	search?: string;
	from?: Date;
	to?: Date;
	limit?: number;
	page?: number;
	sort?: string;
	order?: 'asc' | 'desc';
}

/**
 * Resultados del progreso de una tarea
 */
export interface TaskProgress {
	taskId: string;
	progress: number;
	status: string;
	message?: string;
	details?: Record<string, any>;
	timestamp: Date;
}

/**
 * Log de ejecución de tareas
 */
export interface TaskExecutionLog {
	taskId: string;
	timestamp: Date;
	status: string;
	duration?: number;
	message?: string;
	error?: string;
	data?: Record<string, any>;
}
