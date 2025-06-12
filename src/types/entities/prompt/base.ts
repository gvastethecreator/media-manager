/**
 * 💬 Tipo base para Prompt, solo campos canónicos y serializables
 */
export interface PromptBase {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	parameters?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Datos para crear un prompt
 */
export interface PromptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	parameters?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
}

/**
 * Datos para actualizar un prompt
 */
export interface PromptUpdateInput {
	id: string;
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	parameters?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
}

/**
 * Relación de prompt con otras entidades
 */
export interface PromptRelation {
	entityId: string;
	entityType: string;
	promptId: string;
}

// ✅ PromptBase ahora es seguro y serializable para frontend/backend.
