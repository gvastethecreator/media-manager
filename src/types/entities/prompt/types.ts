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

/**
 * 🎯 Tipo base canónico para Prompt
 */
export interface PromptBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	isPublic: boolean;
	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	content: string | null;
	parameters: string | null; // JSON string
	style: string | null;
	mood: string | null;
	lighting: string | null;
	composition: string | null;
	technique: string | null;
	inspiration: string | null;
	notes: string | null;
	featuredImage: string | null;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🎯 Tipo completo para Prompt con todas las relaciones y campos JSON deserializados.
 */
export interface PromptComplete extends PromptBase {
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
	totalVideos?: number; // Para compatibilidad con prompt-card.tsx
	tagCount: number;
	noteCount: number;
	totalContentItems: number;
	lastUpdated: Date;
	totalImages: number;
	totalAssociations: number;
	albumCount?: number;
	collectionCount?: number;
	characterCount?: number;
	placeCount?: number;
	worldItemCount?: number;
	conceptCount?: number;
	wildcardCount?: number;
	propertyCount?: number;
	groupCount?: number;
}

/**
 * 🎯 Prompt con estadísticas calculadas
 */
export interface PromptWithStats extends PromptBase {
	entityType: 'prompt';
	// Contadores de relaciones
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
	tags?: any; // Para compatibilidad con prompt-card.tsx
	stats?: PromptStats;
}
