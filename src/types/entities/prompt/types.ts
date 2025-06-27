/**
 * @file Tipos canónicos para la entidad Prompt
 * @module types/entities/prompt/types
 * @description Define las estructuras de datos, inputs y tipos para la entidad Prompt.
 */

import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { CollectionComplete } from '../collection';
import type { ConceptComplete } from '../concept';
import type { GroupComplete } from '../group';
import type { ImageComplete } from '../image';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { PropertyComplete } from '../property';
import type { TagComplete } from '../tag';
import type { VideoComplete } from '../video';
import type { WildcardComplete } from '../wildcard';
import type { WorldItemComplete } from '../world-item';

/**
 * Define la estructura de un parámetro dentro de un prompt.
 */
export interface PromptParameter {
	name: string;
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';
	description?: string;
	required?: boolean;
	defaultValue?: unknown;
	options?: string[];
}

/**
 * 🎯 Tipo completo para Prompt con todas las relaciones y campos JSON deserializados.
 */
export interface PromptComplete {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	purpose: string;
	category: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;

	// Campos JSON deserializados
	parameters: PromptParameter[];
	tags: string[]; // El campo `tags` es un array de strings serializado

	// Relaciones
	images?: ImageComplete[];
	videos?: VideoComplete[];
	albums?: AlbumComplete[];
	collections?: CollectionComplete[];
	tagEntities?: TagComplete[];
	characters?: CharacterComplete[];
	places?: PlaceComplete[];
	worldItems?: WorldItemComplete[];
	concepts?: ConceptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardComplete[];
	properties?: PropertyComplete[];
	groups?: GroupComplete[];

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
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	purpose?: string;
	category?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;

	// Campos JSON
	parameters?: PromptParameter[];
	tags?: string[];

	// IDs de relaciones
	imageIds?: string[];
	videoIds?: string[];
	albumIds?: string[];
	collectionIds?: string[];
	tagEntityIds?: string[];
	characterIds?: string[];
	placeIds?: string[];
	worldItemIds?: string[];
	conceptIds?: string[];
	noteIds?: string[];
	wildcardIds?: string[];
	propertyIds?: string[];
	groupIds?: string[];
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
		category?: string[];
		purpose?: string[];
		onlyFavorites?: boolean;
		tags?: string[];
		contentContains?: string;
	};
	includeRelations?: boolean;
}
