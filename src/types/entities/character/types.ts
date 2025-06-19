/**
 * @file Tipos canónicos para la entidad Character
 * @module types/entities/character/types
 * @description Estructura unificada y validada para Character, siguiendo las mejores prácticas.
 */

import type { Prisma } from '@prisma/client';

/**
 * 🧑‍🎤 Tipo base para un personaje.
 * Contiene todos los campos primitivos y datos serializados en JSON.
 */
export interface CharacterBase {
	id: string;
	name: string;
	description: string | null;
	level: number;
	class: string;
	race: string;
	alignment: string;
	backstory: string | null;
	// Campos JSON: Prisma maneja la serialización/deserialización
	stats: Prisma.JsonValue;
	skills: Prisma.JsonValue;
	inventory: Prisma.JsonValue;
	spells: Prisma.JsonValue;
	feats: Prisma.JsonValue;
	isActive: boolean;
	isFavorite: boolean;
	metadata: Prisma.JsonValue;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🧑‍🎤 Input para crear un nuevo personaje.
 * Las relaciones se especifican mediante arrays de IDs.
 */
export interface CharacterCreateInput
	extends Omit<
		CharacterBase,
		'id' | 'createdAt' | 'updatedAt' | 'stats' | 'skills' | 'inventory' | 'spells' | 'feats' | 'metadata'
	> {
	stats?: Record<string, any>;
	skills?: Record<string, any>;
	inventory?: any[];
	spells?: any[];
	feats?: any[];
	metadata?: Record<string, any>;
	// IDs de relaciones
	imageIds?: string[];
	tagIds?: string[];
	groupIds?: string[];
	propertyIds?: string[];
}

/**
 * 🧑‍🎤 Input para actualizar un personaje existente.
 * Todos los campos son opcionales.
 */
export interface CharacterUpdateInput extends Partial<CharacterCreateInput> {}

/**
 * 🧑‍🎤 Relaciones de un personaje con otras entidades.
 * Utiliza los tipos `Base` de las entidades relacionadas para evitar dependencias circulares complejas.
 */
export interface CharacterRelations {
	// Se deben importar los tipos Base de otras entidades aquí si es necesario
	// Por ahora, usamos un marcador de posición para evitar errores de importación.
	images?: unknown[];
	tags?: unknown[];
	groups?: unknown[];
	properties?: unknown[];
}

/**
 * 🧑‍🎤 Conteos de las relaciones de un personaje.
 */
export interface CharacterCounts {
	_count?: {
		images?: number;
		tags?: number;
		groups?: number;
		properties?: number;
	};
}

/**
 * 🧑‍🎤 Tipo completo de un personaje, incluyendo relaciones y conteos.
 */
export interface CharacterComplete extends CharacterBase, CharacterRelations, CharacterCounts {}

// Alias para mantener consistencia con otros módulos
export type CharacterWithRelations = CharacterComplete;
export type CreateCharacterData = CharacterCreateInput;
export type UpdateCharacterData = CharacterUpdateInput;

/**
 * 🧑‍🎤 Filtros para buscar personajes.
 */
export interface CharacterFilters {
	search?: string;
	level?: { min?: number; max?: number };
	class?: string[];
	race?: string[];
	alignment?: string[];
	isFavorite?: boolean;
	tagIds?: string[];
}

/**
 * 🧑‍🎤 Opciones para las consultas de búsqueda de personajes.
 */
export interface CharacterSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: Prisma.CharacterOrderByWithRelationInput;
	filters?: CharacterFilters;
	include?: Prisma.CharacterInclude;
}
