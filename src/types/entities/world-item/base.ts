/**
 * @file Tipos base para la entidad WorldItem
 * @module types/entities/world-item/base
 */

/**
 * 🌍 Tipo base para WorldItem, solo campos canónicos y serializables
 */
export interface WorldItemBase {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	type?: string;
	rarity?: string;
	size?: string;
	origin?: string;
	attributes?: string;
	effects?: string;
	requirements?: string;
	stats?: string;
	properties?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	sortBy?: string;
	filters?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Datos para crear un WorldItem
 */
export interface WorldItemCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	type?: string;
	rarity?: string;
	size?: string;
	origin?: string;
	attributes?: string;
	effects?: string;
	requirements?: string;
	stats?: string;
	properties?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	sortBy?: string;
	filters?: string;
}

/**
 * Datos para actualizar un WorldItem
 */
export interface WorldItemUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	type?: string;
	rarity?: string;
	size?: string;
	origin?: string;
	attributes?: string;
	effects?: string;
	requirements?: string;
	stats?: string;
	properties?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	sortBy?: string;
	filters?: string;
}

// ✅ WorldItemBase ahora es seguro y serializable para frontend/backend.
