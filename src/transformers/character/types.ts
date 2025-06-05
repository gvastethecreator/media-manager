/**
 * @file Tipos para el transformer de Character
 * @module transformers/character/types
 */

import type { CharacterBase } from '@/types/entities/character/base';
import type { CharacterExtended, CharacterWithStats } from '@/types/entities/character/types';
import type { Character } from '@prisma/client';

/**
 * Tipo para un personaje completo con todas sus propiedades
 */
export interface CharacterComplete extends CharacterBase {
	// Relaciones con contenido (opcionales para el transformer)
	images?: any[];
	videos?: any[];
	albums?: any[];
	collections?: any[];
	tags?: any[];
	notes?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];

	// Relaciones con otros personajes
	relatedCharacters?: any[];
	relatedTo?: any[];

	// Contadores
	_count?: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		notes: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		wildcards: number;
		properties: number;
		groups: number;
		relatedCharacters: number;
		relatedTo: number;
	};
}

/**
 * Opciones para transformar personajes
 */
export interface TransformCharacterOptions {
	/** Habilita la validación de campos */
	validateFields?: boolean;
	/** Deserializa campos JSON */
	deserializeFields?: boolean;
	/** Incluye relaciones */
	includeRelations?: boolean;
	/** Incluye propiedades UI */
	includeUI?: boolean;
	/** Incluye estadísticas calculadas */
	includeStats?: boolean;
}

export type { Character, CharacterExtended, CharacterWithStats };
