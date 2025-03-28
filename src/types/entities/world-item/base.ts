/**
 * @file Tipos base para la entidad WorldItem
 * @module types/entities/world-item/base
 */

import type { Concept } from '../concepts';
import type { Image } from '../images';
import type { Note } from '../notes';
import type { Prompt } from '../prompts';

/**
 * Datos básicos para crear un nuevo objeto del mundo
 */
export interface CreateWorldItemData {
	name: string;
	emoji?: string | null;
	color?: string | null;
	description?: string | null;
	shortcut?: string | null;
	type?: string | null;
	rarity?: string | null;
	properties?: string | null; // JSON string
	requirements?: string | null; // JSON string
	origin?: string | null;
	stats?: string | null; // JSON string
	sortBy?: string | null;
	filters?: string | null; // JSON string
	featuredImage?: string | null;
	isFavorite?: boolean;
	category?: string | null;
}

/**
 * Datos para actualizar un objeto del mundo existente
 */
export interface UpdateWorldItemData {
	name?: string;
	emoji?: string | null;
	color?: string | null;
	description?: string | null;
	shortcut?: string | null;
	type?: string | null;
	rarity?: string | null;
	properties?: string | null; // JSON string
	requirements?: string | null; // JSON string
	origin?: string | null;
	stats?: string | null; // JSON string
	sortBy?: string | null;
	filters?: string | null; // JSON string
	featuredImage?: string | null;
	isFavorite?: boolean;
	category?: string | null;
}

/**
 * Entidad base WorldItem
 */
export interface WorldItemBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	type: string;
	rarity: string;
	properties: string; // JSON string
	requirements: string; // JSON string
	origin: string;
	stats: string; // JSON string
	sortBy: string;
	filters: string; // JSON string
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	category: string | null;
}

/**
 * Entidad WorldItem con relaciones
 */
export interface WorldItemWithRelations extends WorldItemBase {
	// Relaciones
	images?: Image[];
	notes?: Note[];
	concepts?: Concept[];
	prompts?: Prompt[];

	// Contadores
	_count?: {
		images?: number;
		notes?: number;
		concepts?: number;
		prompts?: number;
	};
}
