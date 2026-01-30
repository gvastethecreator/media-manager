/**
 * @file Serializadores para la entidad Property
 * @module transformers/property/serializers
 
 */

import type { PropertyWithStats } from '../../types/entities/property';

/**
 * Serializa un objeto Property para respuesta de API
 */
export function serializeProperty(property: PropertyWithStats) {
	return {
		id: property.id,
		name: property.name,
		value: property.value,
		description: property.description,
		emoji: property.emoji,
		color: property.color,
		shortcut: property.shortcut,
		category: property.category,
		featuredImage: property.featuredImage,
		isFavorite: property.isFavorite,
		entityType: property.entityType,
		type: property.type,
		createdAt: property.createdAt.toISOString(),
		updatedAt: property.updatedAt.toISOString(),
		stats: property.stats,
	};
}

/**
 * Serializa un array de Properties para respuesta de API
 */
export function serializeProperties(properties: PropertyWithStats[]) {
	return properties.map(serializeProperty);
}

/**
 * Convierte valor según el tipo especificado
 */
export function parsePropertyValue(value: any, type: string): any {
	switch (type) {
		case 'string':
			return String(value);
		case 'number':
			return Number(value);
		case 'boolean':
			return Boolean(value);
		case 'object':
		case 'array':
			return typeof value === 'string' ? JSON.parse(value) : value;
		default:
			return value;
	}
}
