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
	tags: string | null; // JSON stringified array
	title: string;
	updatedAt: Date | null;
}

/**
 * 📊 Estadísticas de Task
 */
export interface TaskStatistics {
	albums: number;
	characters: number;
	images: number;
	subtasks: number;
	videos: number;
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
	albums?: AlbumWithStats[];
	characters?: CharacterWithStats[];
	images?: ImageWithStats[];
	parentTask?: TaskWithStats | null;
	subtasks?: TaskWithStats[];
	videos?: VideoWithStats[];
}

/**
 * 📝 Task completo con relaciones
 */
export interface TaskComplete extends TaskWithStats, TaskRelations {}

/**
 * ✏️ Input para crear un nuevo task
 */
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

/**
 * ✏️ Input para actualizar un task existente
 */
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

/**
 * 🔍 Filtros para búsqueda de tasks
 */
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

/**
 * 🔎 Opciones de búsqueda con ordenamiento y paginación
 */
export interface TaskSearchOptions extends TaskFilters {
	limit?: number;
	offset?: number;
	sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';
	sortOrder?: 'asc' | 'desc';
}

/**
 * 📦 Resultado de búsqueda paginado
 */
export interface TaskSearchResult {
	hasMore: boolean;
	tasks: TaskWithStats[];
	total: number;
}

/**
 * 📋 Task extendido para UI con campos procesados
 */
export interface TaskExtended extends TaskWithStats {
	completionPercentage: number;
	daysUntilDue: number | null;
	isOverdue: boolean;
	parsedTags: string[];
	timeSpentPercentage: number | null;
}
