/**
 * @file Tipos canónicos para la entidad Prompt
 * @module types/entities/prompt/types
 * @description Define las estructuras de datos, inputs y tipos para la entidad Prompt.
 */

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
import type { PromptBase, PromptWithStats } from './base';

/**
 * 🎯 Tipos base canónicos para Prompt
 */
// Re-export tipos base desde base.ts para evitar duplicación
export type { PromptBase, PromptStatistics, PromptWithStats } from './base';

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
	// Additional fields for UI
	notesEntities?: NoteWithStats[];
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
	purpose?: string | null;
	// Relaciones
	tags?: (string | { id: string })[];
	groups?: (string | { id: string })[];
	properties?: (string | { id: string })[];
	wildcards?: (string | { id: string })[];
}

/**
 * 🔄 Input para actualizar un prompt existente.
 */
export interface PromptUpdateInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;

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
	purpose?: string | null;
	// Relaciones
	tags?: (string | { id: string })[];
	groups?: (string | { id: string })[];
	properties?: (string | { id: string })[];
	wildcards?: (string | { id: string })[];
}

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
	model?: string;
	tokens?: {
		total?: number;
		prompt?: number;
		completion?: number;
	};
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
	categories?: string[]; // Alias para compatibilidad
	type?: string[];
	tags?: string[];

	isFavorite?: boolean;
	search?: string;
	searchQuery?: string; // Alias para compatibilidad
	purpose?: string[];
	purposes?: string[]; // Alias para compatibilidad
	onlyFavorites?: boolean;
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

/**
 * 🗄️ Tipos para Drizzle ORM
 */
export interface DrizzleCreatePromptData {
	id?: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;

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
	purpose?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface DrizzleUpdatePromptData {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;

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
	purpose?: string | null;
	updatedAt?: Date;
}

export interface DrizzleWhereFilter {
	id?: any;
	name?: any;
	category?: any;
	type?: any;
	isPublic?: any;
	isFavorite?: any;
	content?: any;
	purpose?: any;
	createdAt?: any;
	updatedAt?: any;
	AND?: DrizzleWhereFilter[];
	OR?: DrizzleWhereFilter[];
	NOT?: DrizzleWhereFilter;
}

export interface DrizzleOrderBy {
	[key: string]: 'asc' | 'desc';
}

export interface DrizzleUpdateArgs {
	set: DrizzleUpdatePromptData;
	where: DrizzleWhereFilter;
}

/**
 * 🔗 Tipos relacionados para mappers
 */
export interface PromptRelated {
	id: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	type?: string | null;
	createdAt: Date;
	updatedAt: Date;
}
