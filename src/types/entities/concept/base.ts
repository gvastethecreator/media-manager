/**
 * 💡 Tipo base para Concept, solo campos canónicos y serializables
 */
export interface ConceptBase {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string | string[];
	featuredImage?: string | null;
	isFavorite?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Datos para crear un concepto
 */
export interface ConceptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string | string[];
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Datos para actualizar un concepto
 */
export interface ConceptUpdateInput {
	id: string;
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string | string[];
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Relación de concepto con otras entidades
 */
export interface ConceptRelation {
	entityId: string;
	entityType: string;
	conceptId: string;
}

/**
 * Estadísticas de un concepto
 */
export interface ConceptStats {
	characters: number;
	places: number;
	worldItems: number;
	notes: number;
	prompts: number;
	images: number;
}

// ✅ ConceptBase ahora es seguro y serializable para frontend/backend.
