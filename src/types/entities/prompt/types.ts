/**
 * @file Tipos canónicos para la entidad Prompt
 * @module types/entities/prompt/types
 * @description Define las estructuras de datos, inputs y tipos para la entidad Prompt.
 */

import type { PromptBase, PromptWithStats } from './base';
import type { AlbumWithStats } from '../album';
import type { CharacterWithStats } from '../character';
import type { CollectionWithStats } from '../collection';
import type { ConceptWithStats } from '../concept';
import type { GroupWithStats } from '../group';
import type { ImageWithStats } from '../image';
import type { NoteWithStats } from '../note';
import type { PlaceComplete } from '../place';
import type { PropertyComplete } from '../property';
import type { TagWithStats } from '../tag';
import type { VideoWithStats } from '../video';
import type { WildcardWithStats } from '../wildcard';
import type { WorldItemWithStats } from '../world-item';

/**
 * 🎯 Tipos base canónicos para Prompt
 */
// Re-export tipos base desde base.ts para evitar duplicación
export type { PromptBase, PromptWithStats, PromptStatistics } from './base';

/**
 * Interface for prompt parameters
 */
export interface PromptParameter {
	key: string;
	value: any;
	type?: string;
	description?: string;
}

/**
 * Extended prompt type for UI with parsed fields
 */
export interface PromptExtended extends PromptBase {
	parsedTags: string[];
	parsedParameters: PromptParameter[];
	previewContent?: string;
	lastUpdated?: Date;
}

/**
 * 🎯 Tipo completo para Prompt con todas las relaciones y campos JSON deserializados.
 */
export interface PromptComplete extends Omit<PromptBase, 'notes'> {
	// Campos serializados/deserializados
	tags?: string[] | string;

	// Relaciones
	images?: ImageWithStats[];
	videos?: VideoWithStats[];
	albums?: AlbumWithStats[];
	collections?: CollectionWithStats[];
	tagEntities?: TagWithStats[];
	characters?: CharacterWithStats[];
	places?: PlaceComplete[];
	worldItems?: WorldItemWithStats[];
	concepts?: ConceptWithStats[];
	notes?: NoteWithStats[];
	wildcards?: WildcardWithStats[];
	properties?: PropertyComplete[];
	groups?: GroupWithStats[];

	// Conteos
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tagEntities?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * ➕ Input para crear un nuevo prompt.
 */
export interface PromptCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	content?: string | null;
	parameters?: string | null;
	style?: string | null;
	mood?: string | null;
	lighting?: string | null;
	composition?: string | null;
	technique?: string | null;
	inspiration?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
}

/**
 * 🔄 Input para actualizar un prompt existente.
 */
export type PromptUpdateInput = Partial<PromptCreateInput>;

/**
 * 🔍 Opciones para buscar y filtrar prompts.
 */
export interface PromptSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: {
		search?: string;
		category?: string | string[];
		purpose?: string | string[];
		onlyFavorites?: boolean;
		tags?: string[];
		contentContains?: string;
	};
	includeRelations?: boolean;
}

/**
 * 📊 Estadísticas de un prompt.
 */
export interface PromptStats {
	imageCount: number;
	videoCount: number;
	tagCount: number;
	noteCount: number;
	totalContentItems: number;
}

/**
 * 🎯 Resultado de la ejecución de un prompt
 */
export interface PromptExecutionResult {
	promptId: string;
	content: string;
	model: string;
	executionTime: number;
	timestamp: Date;
}



/**
 * 🔍 Resultado de búsqueda de prompts
 */
export interface PromptSearchResult {
	data: PromptWithStats[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
	hasNext: boolean;
	hasPrevious: boolean;
}

/**
 * ⚡ Resultado de ejecución de un prompt
 */
export interface PromptExecutionResult {
	id: string;
	promptId: string;
	content: string;
	parameters?: Record<string, any>;
	result?: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	error?: string;
	executionTime?: number;
	createdAt: Date;
	completedAt?: Date;
}

/**
 * ⚙️ Parámetros para ejecutar un prompt
 */
export interface PromptExecutionParams {
	promptId: string;
	parameters?: Record<string, any>;
	model?: string;
	options?: Record<string, any>;
}

/**
 * 🏷️ Filtros para prompts
 */
export interface PromptFilters {
	category?: string[];
	type?: string[];
	tags?: string[];
	isPublic?: boolean;
	isFavorite?: boolean;
	search?: string;
	dateRange?: {
		from?: Date;
		to?: Date;
	};
}

/**
 * 🔗 Prompt con relaciones completas
 */
export interface PromptWithRelations extends PromptComplete {
	// Alias para compatibilidad
}
