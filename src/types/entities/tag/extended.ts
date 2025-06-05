/**
 * @file Tipos extendidos para la entidad Tag
 * @module types/entities/tag/extended
 */

import type { TagBase, TagWithRelations } from './types';

/**
 * Interfaz para Tag con campos JSON deserializados
 * @description Aunque Tag no tiene campos JSON serializados en el modelo,
 * se incluye esta interfaz para mantener consistencia con otras entidades
 * y facilitar futuras extensiones.
 */
export interface TagComplete extends TagBase {
	// En el futuro, si se añaden campos JSON serializados como strings,
	// se deserealizarán aquí. Por ahora, es idéntico a TagBase.
}

/**
 * Interfaz para Tag con relaciones y campos JSON deserializados
 */
export interface TagWithRelationsComplete extends TagComplete, Omit<TagWithRelations, keyof TagBase> {
	// Esta interfaz combina TagComplete con las relaciones de TagWithRelations
}

/**
 * Interfaz extendida con propiedades de UI para la interacción del usuario
 */
export interface TagExtended extends TagComplete {
	isSelected?: boolean;
	isHighlighted?: boolean;
	isEditing?: boolean;
	isExpanded?: boolean;
}

/**
 * Interfaz para Tag con relaciones, campos deserializados y propiedades de UI
 */
export interface TagWithRelationsExtended extends TagExtended, Omit<TagWithRelationsComplete, keyof TagComplete> {
	// Combina TagExtended con las relaciones y campos deserializados
}

/**
 * Interfaz para etiquetas con estadísticas de uso
 * @description Extiende la etiqueta completa con datos estadísticos
 */
export interface TagWithStats extends TagComplete {
	/** Número de elementos asociados a esta etiqueta */
	count: number;
	/** Tamaño total de los elementos asociados (formateado) */
	size: string;
}
