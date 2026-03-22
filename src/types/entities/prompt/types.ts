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
	description?: string;
	key: string;
	type?: string;
	value: any;
}

/**
 * Extended prompt type for UI with parsed fields
 */
export interface PromptExtended extends PromptBase {
	lastUpdated?: Date;
	// Additional fields for UI
	notesEntities?: NoteWithStats[];
	parsedParameters: PromptParameter[];
	parsedTags: string[];
	previewContent?: string;
}

/**
 * 🎯 Tipo completo para Prompt con todas las relaciones y campos JSON deserializados.
 */
export interface PromptComplete extends Omit<PromptBase, 'notes'> {
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
	albums?: AlbumWithStats[];
	characters?: CharacterWithStats[];
	collections?: CollectionWithStats[];
	concepts?: ConceptWithStats[];
	groups?: GroupWithStats[];

	// Relaciones
	images?: ImageWithStats[];
	notes?: NoteWithStats[];
	places?: PlaceComplete[];
	properties?: PropertyComplete[];
	tagEntities?: TagWithStats[];
	// Campos serializados/deserializados
	tags?: string[] | string;
	videos?: VideoWithStats[];
	wildcards?: WildcardWithStats[];
	worldItems?: WorldItemWithStats[];
}

/**
 * ➕ Input para crear un nuevo prompt.
 */
export interface PromptCreateInput {
	category?: string | null;
	color?: string | null;
	composition?: string | null;
	content?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	groups?: (string | { id: string })[];
	inspiration?: string | null;

	isFavorite?: boolean;
	lighting?: string | null;
	mood?: string | null;
	name: string;
	notes?: string | null;
	parameters?: string | null;
	parentId?: string | null;
	properties?: (string | { id: string })[];
	purpose?: string | null;
	style?: string | null;
	// Relaciones
	tags?: (string | { id: string })[];
	technique?: string | null;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	wildcards?: (string | { id: string })[];
}

/**
 * 🔄 Input para actualizar un prompt existente.
 */
export interface PromptUpdateInput {
	category?: string | null;
	color?: string | null;
	composition?: string | null;
	content?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	groups?: (string | { id: string })[];
	inspiration?: string | null;

	isFavorite?: boolean;
	lighting?: string | null;
	mood?: string | null;
	name?: string;
	notes?: string | null;
	parameters?: string | null;
	parentId?: string | null;
	properties?: (string | { id: string })[];
	purpose?: string | null;
	style?: string | null;
	// Relaciones
	tags?: (string | { id: string })[];
	technique?: string | null;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	wildcards?: (string | { id: string })[];
}

/**
 * 🔍 Opciones para buscar y filtrar prompts.
 */
export interface PromptSearchOptions {
	filters?: {
		search?: string;
		category?: string | string[];
		purpose?: string | string[];
		onlyFavorites?: boolean;
		tags?: string[];
		contentContains?: string;
	};
	includeRelations?: boolean;
	orderBy?: Record<string, 'asc' | 'desc'>;
	skip?: number;
	take?: number;
}

/**
 * 📊 Estadísticas de un prompt.
 */
export interface PromptStats {
	imageCount: number;
	noteCount: number;
	tagCount: number;
	totalContentItems: number;
	videoCount: number;
}

/**
 * 🔍 Resultado de búsqueda de prompts
 */
export interface PromptSearchResult {
	data: PromptWithStats[];
	hasNext: boolean;
	hasPrevious: boolean;
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

/**
 * ⚡ Resultado de ejecución de un prompt
 */
export interface PromptExecutionResult {
	completedAt?: Date;
	content: string;
	createdAt: Date;
	error?: string;
	executionTime?: number;
	id: string;
	model?: string;
	parameters?: Record<string, any>;
	promptId: string;
	result?: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	tokens?: {
		total?: number;
		prompt?: number;
		completion?: number;
	};
}

/**
 * ⚙️ Parámetros para ejecutar un prompt
 */
export interface PromptExecutionParams {
	model?: string;
	options?: Record<string, any>;
	parameters?: Record<string, any>;
	promptId: string;
}

/**
 * 🏷️ Filtros para prompts
 */
export interface PromptFilters {
	categories?: string[]; // Alias para compatibilidad
	category?: string[];
	dateRange?: {
		from?: Date;
		to?: Date;
	};

	isFavorite?: boolean;
	onlyFavorites?: boolean;
	purpose?: string[];
	purposes?: string[]; // Alias para compatibilidad
	search?: string;
	searchQuery?: string; // Alias para compatibilidad
	tags?: string[];
	type?: string[];
}

/**
 * 🔗 Prompt con relaciones completas
 */
export interface PromptWithRelations extends PromptComplete {
	// Alias para compatibilidad
}

/**
 * 🔗 Prompt simplificado para relaciones
 */
export interface PromptRelated {
	category: string | null;
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	id: string;
	name: string;
	updatedAt: Date;
}

/**
 * 🗄️ Tipos para Drizzle ORM
 */
export interface DrizzleCreatePromptData {
	category?: string | null;
	color?: string | null;
	composition?: string | null;
	content?: string | null;
	createdAt?: Date;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	id?: string;
	inspiration?: string | null;

	isFavorite?: boolean;
	lighting?: string | null;
	mood?: string | null;
	name: string;
	notes?: string | null;
	parameters?: string | null;
	parentId?: string | null;
	purpose?: string | null;
	style?: string | null;
	technique?: string | null;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	updatedAt?: Date;
}

export interface DrizzleUpdatePromptData {
	category?: string | null;
	color?: string | null;
	composition?: string | null;
	content?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	inspiration?: string | null;

	isFavorite?: boolean;
	lighting?: string | null;
	mood?: string | null;
	name?: string;
	notes?: string | null;
	parameters?: string | null;
	parentId?: string | null;
	purpose?: string | null;
	style?: string | null;
	technique?: string | null;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	updatedAt?: Date;
}

export interface DrizzleWhereFilter {
	AND?: DrizzleWhereFilter[];
	category?: any;
	content?: any;
	createdAt?: any;
	id?: any;

	isFavorite?: any;
	NOT?: DrizzleWhereFilter;
	name?: any;
	OR?: DrizzleWhereFilter[];
	purpose?: any;
	type?: any;
	updatedAt?: any;
}

export interface DrizzleOrderBy {
	[key: string]: 'asc' | 'desc';
}

export interface DrizzleUpdateArgs {
	set: DrizzleUpdatePromptData;
	where: DrizzleWhereFilter;
}
