/**
 * @file Tipos extendidos para la entidad Character
 * @module types/entities/character/extended
 */

import type { Concept, Image, Note, Prompt } from '@prisma/client';
import type { CharacterFilter, CharacterRelationship, CharacterStats } from './base';
import type { CharacterComplete, CharacterWithRelations } from './types';

/**
 * Interfaz extendida con campos deserializados para Character
 * Convierte los campos JSON string a sus respectivos objetos/arrays
 */
export interface CharacterExtended
	extends Omit<
		CharacterWithRelations,
		'stats' | 'relationships' | 'goals' | 'fears' | 'beliefs' | 'personality' | 'skills' | 'abilities' | 'filters'
	> {
	/**
	 * Estadísticas del personaje como objeto
	 * En la base de datos es almacenado como string JSON
	 */
	stats: Record<string, any>;

	/**
	 * Relaciones del personaje como array
	 * En la base de datos es almacenado como string JSON
	 */
	relationships: any[];

	/**
	 * Objetivos del personaje como array de strings
	 * En la base de datos es almacenado como string JSON
	 */
	goals: string[];

	/**
	 * Miedos del personaje como array de strings
	 * En la base de datos es almacenado como string JSON
	 */
	fears: string[];

	/**
	 * Creencias del personaje como array de strings
	 * En la base de datos es almacenado como string JSON
	 */
	beliefs: string[];

	/**
	 * Rasgos de personalidad como array de strings
	 * En la base de datos es almacenado como string JSON
	 */
	personality: string[];

	/**
	 * Habilidades del personaje como array de strings
	 * En la base de datos es almacenado como string JSON
	 */
	skills: string[];

	/**
	 * Capacidades del personaje como array de strings
	 * En la base de datos es almacenado como string JSON
	 */
	abilities: string[];

	/**
	 * Configuración de filtros como objeto
	 * En la base de datos es almacenado como string JSON
	 */
	filters: Record<string, any>;

	// Propiedades de UI
	isSelected?: boolean;
	isExpanded?: boolean;
	isEditing?: boolean;
	activeTab?: 'info' | 'stats' | 'relationships' | 'background' | 'images';

	// Calculados/runtime
	parsedFilters?: CharacterFilter[];
	parsedStats?: CharacterStats;
	parsedRelationships?: CharacterRelationship[];
	parsedGoals?: string[];
	parsedFears?: string[];
	parsedBeliefs?: string[];
	parsedPersonality?: string[];
	imageCount?: number;

	// Relaciones expandidas
	images?: Image[];
	relatedCharacters?: CharacterComplete[];
	relatedTo?: CharacterComplete[];
	notes?: Note[];
	concepts?: Concept[];
	prompts?: Prompt[];
}

/**
 * Tipo para las estadísticas y atributos adicionales de un personaje
 */
export interface CharacterAttributes {
	level: number;
	stats: CharacterStats;
	skills: Record<string, number>;
	traits: string[];
	inventory: CharacterInventoryItem[];
	experience: number;
	health: {
		current: number;
		max: number;
	};
	resources: Record<
		string,
		{
			current: number;
			max: number;
		}
	>;
}

/**
 * Tipo para los elementos del inventario de un personaje
 */
export interface CharacterInventoryItem {
	id: string;
	name: string;
	description?: string;
	quantity: number;
	type: string;
	isEquipped?: boolean;
	rarity?: string;
	stats?: Record<string, number>;
}

/**
 * Tipo para los datos de una lista de personajes
 */
export interface CharacterListItem extends CharacterExtended {
	isFeatured?: boolean;
	thumbnailUrl?: string;
}

/**
 * Tipo para la configuración de visualización de personajes
 */
export interface CharacterViewConfig {
	viewType: 'grid' | 'list' | 'compact' | 'gallery' | 'card';
	sortBy: 'name' | 'level' | 'race' | 'class' | 'date';
	sortDirection: 'asc' | 'desc';
	showImages: boolean;
	imageCount: number;
	enableAnimations: boolean;
	groupBy?: 'race' | 'class' | 'alignment' | 'category' | null;
	showStats: boolean;
	compactView: boolean;
}

/**
 * Tipo para la tarjeta de personaje
 */
export interface CharacterCard {
	character: CharacterExtended;
	thumbnails: string[];
	isExpanded: boolean;
	isFlipped: boolean;
	showDetails: boolean;
	activeTab?: 'info' | 'stats' | 'relationships' | 'background' | 'images';
}

/**
 * Interfaz para resumen de personaje (vista previa)
 */
export interface CharacterSummary {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	level: number;
	class: string;
	race: string;
	alignment: string;
	type: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		images?: number;
		videos?: number;
		relatedCharacters?: number;
		relatedTo?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}
