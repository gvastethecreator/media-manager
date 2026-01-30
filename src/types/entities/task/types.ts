/**
 * 🗂️ Tipos canónicos para la entidad Task
 * @module types/entities/task
 * @description Define las estructuras de datos completas para Tasks
 */

import type { AlbumWithStats } from '../album';
import type { CharacterWithStats } from '../character';
import type { ImageWithStats } from '../image';
import type { VideoWithStats } from '../video';

/**
 * 📋 Tipo base Task - estructura canónica principal
 * Contiene todos los campos de la tabla Drizzle
 */
export interface TaskBase {
	id: string;
	title: string;
	description: string | null;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	emoji: string | null;
	color: string | null;
	category: string | null;
	tags: string | null; // JSON stringified array
	dueDate: Date | null;
	completedAt: Date | null;
	estimatedHours: number | null;
	actualHours: number | null;
	progress: number;
	assignedTo: string | null;
	parentTaskId: string | null;
	projectId: string | null;
	notes: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: Date;
	updatedAt: Date | null;
}

/**
 * 📊 Estadísticas de Task
 */
export interface TaskStatistics {
	subtasks: number;
	images: number;
	videos: number;
	albums: number;
	characters: number;
}

/**
 * 🎯 Task con estadísticas
 * Principal tipo para uso en services y transformers
 */
export interface TaskWithStats extends TaskBase {
	_count: TaskStatistics;
}

/**
 * 🔗 Relaciones de Task con otras entidades
 */
export interface TaskRelations {
	subtasks?: TaskWithStats[];
	parentTask?: TaskWithStats | null;
	images?: ImageWithStats[];
	videos?: VideoWithStats[];
	albums?: AlbumWithStats[];
	characters?: CharacterWithStats[];
}

/**
 * 📝 Task completo con relaciones
 */
export interface TaskComplete extends TaskWithStats, TaskRelations {}

/**
 * ✏️ Input para crear un nuevo task
 */
export interface TaskCreateInput {
	title: string;
	description?: string;
	status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	emoji?: string;
	color?: string;
	category?: string;
	tags?: string[];
	dueDate?: Date;
	estimatedHours?: number;
	assignedTo?: string;
	parentTaskId?: string;
	projectId?: string;
	notes?: string;
	featuredImage?: string;
	isFavorite?: boolean;
}

/**
 * ✏️ Input para actualizar un task existente
 */
export interface TaskUpdateInput {
	title?: string;
	description?: string;
	status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	emoji?: string;
	color?: string;
	category?: string;
	tags?: string[];
	dueDate?: Date;
	completedAt?: Date;
	estimatedHours?: number;
	actualHours?: number;
	progress?: number;
	assignedTo?: string;
	parentTaskId?: string;
	projectId?: string;
	notes?: string;
	featuredImage?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
}

/**
 * 🔍 Filtros para búsqueda de tasks
 */
export interface TaskFilters {
	status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	category?: string;
	assignedTo?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	parentTaskId?: string;
	projectId?: string;
	search?: string;
}

/**
 * 🔎 Opciones de búsqueda con ordenamiento y paginación
 */
export interface TaskSearchOptions extends TaskFilters {
	sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';
	sortOrder?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

/**
 * 📦 Resultado de búsqueda paginado
 */
export interface TaskSearchResult {
	tasks: TaskWithStats[];
	total: number;
	hasMore: boolean;
}

/**
 * 📋 Task extendido para UI con campos procesados
 */
export interface TaskExtended extends TaskWithStats {
	parsedTags: string[];
	isOverdue: boolean;
	daysUntilDue: number | null;
	completionPercentage: number;
	timeSpentPercentage: number | null;
}
