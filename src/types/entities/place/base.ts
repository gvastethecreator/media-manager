/**
 * @file Tipos base para la entidad Place
 * @module types/entities/place/base
 */

/**
 * 🗺️ Tipo base para Place, solo campos canónicos y serializables
 */
export interface PlaceBase {
	id: string;
	name: string;
	emoji?: string | null;
	color?: string | null;
	description?: string | null;
	shortcut?: string | null;
	region?: string | null;
	type?: string | null;
	climate?: string | null;
	population?: number | null;
	government?: string | null;
	dangers?: string | null;
	resources?: string | null;
	lore?: string | null;
	history?: string | null;
	stats?: string | null;
	sortBy?: string | null;
	filters?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	category?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Datos básicos para crear un nuevo lugar
 */
export interface CreatePlaceData {
	name: string;
	emoji?: string | null;
	color?: string | null;
	description?: string | null;
	shortcut?: string | null;
	region?: string | null;
	type?: string | null;
	climate?: string | null;
	population?: number | null;
	government?: string | null;
	dangers?: string | null;
	resources?: string | null;
	lore?: string | null;
	history?: string | null;
	stats?: string | null;
	sortBy?: string | null;
	filters?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	category?: string | null;
}

/**
 * Datos para actualizar un lugar existente
 */
export interface UpdatePlaceData {
	name?: string;
	emoji?: string | null;
	color?: string | null;
	description?: string | null;
	shortcut?: string | null;
	region?: string | null;
	type?: string | null;
	climate?: string | null;
	population?: number | null;
	government?: string | null;
	dangers?: string | null;
	resources?: string | null;
	lore?: string | null;
	history?: string | null;
	stats?: string | null;
	sortBy?: string | null;
	filters?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	category?: string | null;
}

// ✅ PlaceBase ahora es seguro y serializable para frontend/backend.
