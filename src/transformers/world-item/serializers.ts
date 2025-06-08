/**
 * @file Serializadores para la entidad WorldItem - VERSIÓN CORREGIDA ✅
 * @module transformers/world-item/serializers
 */

import { createLogger } from '@/lib/logger';
import { WorldItemSchema } from '@/types/entities/world-item/schema';
import type {
	WorldItemAttribute,
	WorldItemBase,
	WorldItemComplete,
	WorldItemCounts,
	WorldItemDeserialized,
	WorldItemDeserializedFields,
	WorldItemEffect,
	WorldItemFilter,
	WorldItemProperty,
	WorldItemRelations,
	WorldItemRequirement,
	WorldItemStat,
	WorldItemUI,
} from '@/types/entities/world-item/types';
import { handleTransformerError } from '@/utils/transformers/errors';

// Logger específico para este módulo
const logger = createLogger('WorldItemTransformer:Serializers');

/**
 * Serializa atributos de WorldItem para almacenamiento
 * @param attributes - Atributos a serializar
 * @returns String JSON con los atributos serializados
 */
export function serializeAttributes(attributes: WorldItemAttribute[] | string): string {
	try {
		if (typeof attributes === 'string') return attributes;
		return attributes && attributes.length > 0 ? JSON.stringify(attributes) : '[]';
	} catch (error) {
		logger.error('Error serializando atributos de WorldItem:', error);
		return '[]';
	}
}

/**
 * Deserializa atributos de WorldItem desde almacenamiento
 * @param attributesString - String JSON con atributos
 * @returns Array de atributos deserializados
 */
export function deserializeAttributes(attributesString?: string | null): WorldItemAttribute[] {
	if (!attributesString) return [];

	try {
		if (attributesString === 'empty_array' || attributesString === '[]') return [];
		const parsed = JSON.parse(attributesString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando atributos de WorldItem:', error);
		return [];
	}
}

/**
 * Serializa efectos de WorldItem para almacenamiento
 * @param effects - Efectos a serializar
 * @returns String JSON con los efectos serializados
 */
export function serializeEffects(effects: WorldItemEffect[] | string): string {
	try {
		if (typeof effects === 'string') return effects;
		return effects && effects.length > 0 ? JSON.stringify(effects) : '[]';
	} catch (error) {
		logger.error('Error serializando efectos de WorldItem:', error);
		return '[]';
	}
}

/**
 * Deserializa efectos de WorldItem desde almacenamiento
 * @param effectsString - String JSON con efectos
 * @returns Array de efectos deserializados
 */
export function deserializeEffects(effectsString?: string | null): WorldItemEffect[] {
	if (!effectsString) return [];

	try {
		if (effectsString === 'empty_array' || effectsString === '[]') return [];
		const parsed = JSON.parse(effectsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando efectos de WorldItem:', error);
		return [];
	}
}

/**
 * Serializa requisitos de WorldItem para almacenamiento
 * @param requirements - Requisitos a serializar
 * @returns String JSON con los requisitos serializados
 */
export function serializeRequirements(requirements: WorldItemRequirement[] | string): string {
	try {
		if (typeof requirements === 'string') return requirements;
		return requirements && requirements.length > 0 ? JSON.stringify(requirements) : '[]';
	} catch (error) {
		logger.error('Error serializando requisitos de WorldItem:', error);
		return '[]';
	}
}

/**
 * Deserializa requisitos de WorldItem desde almacenamiento
 * @param requirementsString - String JSON con requisitos
 * @returns Array de requisitos deserializados
 */
export function deserializeRequirements(requirementsString?: string | null): WorldItemRequirement[] {
	if (!requirementsString) return [];

	try {
		if (requirementsString === 'empty_array' || requirementsString === '[]') return [];
		const parsed = JSON.parse(requirementsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando requisitos de WorldItem:', error);
		return [];
	}
}

/**
 * Serializa estadísticas de WorldItem para almacenamiento
 * @param stats - Estadísticas a serializar
 * @returns String JSON con las estadísticas serializadas
 */
export function serializeStats(stats: WorldItemStat[] | string): string {
	try {
		if (typeof stats === 'string') return stats;
		return stats && stats.length > 0 ? JSON.stringify(stats) : '[]';
	} catch (error) {
		logger.error('Error serializando estadísticas de WorldItem:', error);
		return '[]';
	}
}

/**
 * Deserializa estadísticas de WorldItem desde almacenamiento
 * @param statsString - String JSON con estadísticas
 * @returns Array de estadísticas deserializadas
 */
export function deserializeStats(statsString?: string | null): WorldItemStat[] {
	if (!statsString) return [];

	try {
		if (statsString === 'empty_array' || statsString === '[]') return [];
		const parsed = JSON.parse(statsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando estadísticas de WorldItem:', error);
		return [];
	}
}

/**
 * Serializa propiedades de WorldItem para almacenamiento
 * @param properties - Propiedades a serializar
 * @returns String JSON con las propiedades serializadas
 */
export function serializeProperties(properties: WorldItemProperty[] | string): string {
	try {
		if (typeof properties === 'string') return properties;
		return properties && properties.length > 0 ? JSON.stringify(properties) : '[]';
	} catch (error) {
		logger.error('Error serializando propiedades de WorldItem:', error);
		return '[]';
	}
}

/**
 * Deserializa propiedades de WorldItem desde almacenamiento
 * @param propertiesString - String JSON con propiedades
 * @returns Array de propiedades deserializadas
 */
export function deserializeProperties(propertiesString?: string | null): WorldItemProperty[] {
	if (!propertiesString) return [];

	try {
		if (propertiesString === 'empty_array' || propertiesString === '[]') return [];
		const parsed = JSON.parse(propertiesString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando propiedades de WorldItem:', error);
		return [];
	}
}

/**
 * Serializa filtros de WorldItem para almacenamiento
 * @param filters - Filtros a serializar
 * @returns String JSON con los filtros serializados
 */
export function serializeFilters(filters: WorldItemFilter[] | string): string {
	try {
		if (typeof filters === 'string') return filters;
		return filters && filters.length > 0 ? JSON.stringify(filters) : '[]';
	} catch (error) {
		logger.error('Error serializando filtros de WorldItem:', error);
		return '[]';
	}
}

/**
 * Deserializa filtros de WorldItem desde almacenamiento
 * @param filtersString - String JSON con filtros
 * @returns Array de filtros deserializados
 */
export function deserializeFilters(filtersString?: string | null): WorldItemFilter[] {
	if (!filtersString) return [];

	try {
		if (filtersString === 'empty_array' || filtersString === '[]') return [];
		const parsed = JSON.parse(filtersString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando filtros de WorldItem:', error);
		return [];
	}
}

/**
 * Serializa etiquetas de WorldItem para almacenamiento
 * @param tags - Etiquetas a serializar
 * @returns String JSON con las etiquetas serializadas
 */
export function serializeTags(tags: string[] | string): string {
	try {
		if (typeof tags === 'string') return tags;
		return tags && tags.length > 0 ? JSON.stringify(tags) : '[]';
	} catch (error) {
		logger.error('Error serializando etiquetas de WorldItem:', error);
		return '[]';
	}
}

/**
 * Deserializa etiquetas de WorldItem desde almacenamiento
 * @param tagsString - String JSON con etiquetas
 * @returns Array de etiquetas deserializadas
 */
export function deserializeTags(tagsString?: string | null): string[] {
	if (!tagsString) return [];

	try {
		if (tagsString === 'empty_array' || tagsString === '[]') return [];
		const parsed = JSON.parse(tagsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando etiquetas de WorldItem:', error);
		return [];
	}
}

/**
 * Extiende un WorldItem base para incluir propiedades de UI y relaciones,
 * transformando campos JSON a sus tipos de objeto correspondientes.
 * @param worldItem - El WorldItem base a extender.
 * @returns Un WorldItem completo con propiedades de UI y relaciones.
 */
export function extendWorldItem(worldItem: WorldItemDeserialized): WorldItemComplete {
	// Deserializar todos los campos JSON del WorldItem base
	const parsedItem: WorldItemDeserialized = {
		...worldItem,
		attributes: deserializeAttributes(worldItem.attributes as string),
		effects: deserializeEffects(worldItem.effects as string),
		requirements: deserializeRequirements(worldItem.requirements as string),
		stats: deserializeStats(worldItem.stats as string),
		properties: deserializeProperties(worldItem.properties as string),
		filters: deserializeFilters(worldItem.filters as string),
		tags: deserializeTags(worldItem.tags as string),
	};

	// Asignar los valores predeterminados para las relaciones si no existen
	const relations: WorldItemRelations = {
		images: [],
		videos: [],
		notes: [],
		concepts: [],
		prompts: [],
		groups: [],
		properties: [],
		wildcards: [],
		tags: [],
	};

	// Combinar el item parseado con las relaciones por defecto y las relaciones existentes
	const completeItem: WorldItemComplete = {
		...parsedItem,
		...relations,
		// Sobrescribir las relaciones por defecto con las que realmente existen en parsedItem
		images: (parsedItem as any).images || relations.images,
		videos: (parsedItem as any).videos || relations.videos,
		notes: (parsedItem as any).notes || relations.notes,
		concepts: (parsedItem as any).concepts || relations.concepts,
		prompts: (parsedItem as any).prompts || relations.prompts,
		groups: (parsedItem as any).groups || relations.groups,
		properties: (parsedItem as any).properties || relations.properties,
		wildcards: (parsedItem as any).wildcards || relations.wildcards,
		tags: (parsedItem as any).tags || relations.tags,
		// Añadir contadores (pueden ser opcionales o venir de _count de Prisma)
		_count: (parsedItem as any)._count || {
			images: (parsedItem as any).images?.length || 0,
			videos: (parsedItem as any).videos?.length || 0,
			notes: (parsedItem as any).notes?.length || 0,
			concepts: (parsedItem as any).concepts?.length || 0,
			prompts: (parsedItem as any).prompts?.length || 0,
			groups: (parsedItem as any).groups?.length || 0,
			properties: (parsedItem as any).properties?.length || 0,
			wildcards: (parsedItem as any).wildcards?.length || 0,
			tags: (parsedItem as any).tags?.length || 0,
		},
	};

	return completeItem;
}

/**
 * Extiende una lista de WorldItems base.
 * @param worldItems - Array de WorldItems base a extender.
 * @returns Array de WorldItems completos.
 */
export function extendWorldItems(worldItems: WorldItemDeserialized[]): WorldItemComplete[] {
	if (!Array.isArray(worldItems)) {
		return [];
	}
	return worldItems.map(extendWorldItem);
}

/**
 * Convierte un WorldItem base (deserializado) a su forma WorldItemDeserialized.
 * Útil para asegurar la estructura mínima y el parseo de JSON si se recibe un objeto plano.
 * @param worldItem - El WorldItem base.
 * @returns El WorldItemDeserialized con campos JSON parseados.
 */
export function fromWorldItemBase(worldItem: WorldItemBase): WorldItemDeserialized {
	// Asegurarse de que los campos JSON estén parseados si vienen como strings
	return {
		...worldItem,
		attributes: deserializeAttributes(worldItem.attributes as string | null),
		effects: deserializeEffects(worldItem.effects as string | null),
		requirements: deserializeRequirements(worldItem.requirements as string | null),
		stats: deserializeStats(worldItem.stats as string | null),
		properties: deserializeProperties(worldItem.properties as string | null),
		filters: deserializeFilters(worldItem.filters as string | null),
		tags: deserializeTags(worldItem.tags as string | null),
	};
}

/**
 * Normaliza strings comunes que pueden ser nulos o vacíos a null.
 * @param field - El string a normalizar.
 * @returns null si el string es vacío o nulo, de lo contrario, el string.
 */
export const normalizeCommonStrings = (field: string): string | null => {
	if (field === '' || field === null || field === undefined) {
		return null;
	}
	return field;
};

/**
 * Repara patrones de atributos específicos, si es necesario. (Placeholder)
 * @param field - El string a reparar.
 * @returns El string reparado.
 */
export const repairAttributePattern = (field: string): string | null => {
	// Implementa lógica de reparación si es necesario
	return field;
};

/**
 * Parsea un campo JSON de forma segura, proporcionando un valor por defecto en caso de error.
 * @param field - El campo a parsear.
 * @param defaultValue - El valor por defecto a devolver si el parseo falla.
 * @returns El objeto parseado o el valor por defecto.
 */
export const parseJsonField = <T>(field: string | null | undefined, defaultValue: T): T => {
	if (field === null || field === undefined || field === '') {
		return defaultValue;
	}
	try {
		// También considerar el caso de 'empty_object' o 'empty_array' si se usan como marcadores
		if (typeof field === 'string') {
			if (field === 'empty_object' && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
				return {} as T;
			}
			if (field === 'empty_array' && Array.isArray(defaultValue)) {
				return [] as T;
			}
			return JSON.parse(field) as T;
		}
		return field as T;
	} catch (error) {
		logger.warn(`Error al parsear campo JSON: ${field}. Usando valor por defecto.`, error);
		return defaultValue;
	}
};

/**
 * Parsea todos los campos JSON de un WorldItemBase a WorldItemDeserialized.
 * @param worldItem - El WorldItemBase con posibles strings JSON.
 * @returns Un WorldItemDeserialized con todos los campos JSON parseados.
 */
export function parseJsonFields(worldItem: WorldItemBase): WorldItemDeserialized {
	return {
		...worldItem,
		attributes: parseJsonField(worldItem.attributes, []),
		effects: parseJsonField(worldItem.effects, []),
		requirements: parseJsonField(worldItem.requirements, []),
		stats: parseJsonField(worldItem.stats, {}),
		properties: parseJsonField(worldItem.properties, []),
		filters: parseJsonField(worldItem.filters, {}),
		tags: parseJsonField(worldItem.tags, []),
	};
}

/**
 * Transforma un WorldItemBase en un WorldItemComplete (extendido para UI).
 * @param worldItem - El WorldItemBase a transformar.
 * @returns El WorldItemComplete.
 */
export function toExtendedWorldItem(worldItem: WorldItemBase): WorldItemComplete {
	const deserialized = parseJsonFields(worldItem);
	return extendWorldItem(deserialized);
}

/**
 * Transforma un WorldItem base o completo para incluir estadísticas de conteo y UI.
 * Esta función es útil cuando se necesita combinar datos de WorldItem con información de conteo
 * (por ejemplo, el número de imágenes asociadas) y presentarlos en un formato extendido para la UI.
 *
 * @param worldItem El WorldItem base o completo, con un campo `_count` opcional.
 * @returns Un objeto `WorldItemComplete` con propiedades de UI y estadísticas de conteo.
 */
export function toWorldItemWithStats(
	worldItem: WorldItemBase & { _count?: { images?: number; relatedItems?: number } }
): WorldItemComplete {
	const extendedItem = extendWorldItem(worldItem);

	// Asignar los conteos directamente si están disponibles, de lo contrario, 0
	const imagesCount = worldItem._count?.images || 0;
	const relatedItemsCount = worldItem._count?.relatedItems || 0;

	return {
		...extendedItem,
		_count: {
			...extendedItem._count,
			images: imagesCount,
			relatedItems: relatedItemsCount,
		},
		// Puedes añadir otras propiedades de UI o cálculos aquí si es necesario
	};
}

// Funciones de serialización/deserialización para campos individuales

/**
 * Deserializa atributos de WorldItem.
 * @param attributesString - String JSON con atributos.
 * @returns Array de atributos deserializados.
 */
export function deserializeWorldItemAttributes(attributesString?: string | null): WorldItemAttribute[] {
	return deserializeAttributes(attributesString);
}

/**
 * Serializa atributos de WorldItem.
 * @param attributes - Atributos a serializar.
 * @returns String JSON con los atributos serializados.
 */
export function serializeWorldItemAttributes(attributes: WorldItemAttribute[] | string): string {
	return serializeAttributes(attributes);
}

/**
 * Deserializa efectos de WorldItem.
 * @param effectsString - String JSON con efectos.
 * @returns Array de efectos deserializados.
 */
export function deserializeWorldItemEffects(effectsString?: string | null): WorldItemEffect[] {
	return deserializeEffects(effectsString);
}

/**
 * Serializa efectos de WorldItem.
 * @param effects - Efectos a serializar.
 * @returns String JSON con los efectos serializados.
 */
export function serializeWorldItemEffects(effects: WorldItemEffect[] | string): string {
	return serializeEffects(effects);
}

/**
 * Deserializa filtros de WorldItem.
 * @param filtersString - String JSON con filtros.
 * @returns Array de filtros deserializados.
 */
export function deserializeWorldItemFilters(filtersString?: string | null): WorldItemFilter[] {
	return deserializeFilters(filtersString);
}

/**
 * Serializa filtros de WorldItem.
 * @param filters - Filtros a serializar.
 * @returns String JSON con los filtros serializados.
 */
export function serializeWorldItemFilters(filters: WorldItemFilter[] | string): string {
	return serializeFilters(filters);
}

/**
 * Deserializa propiedades de WorldItem.
 * @param propertiesString - String JSON con propiedades.
 * @returns Array de propiedades deserializadas.
 */
export function deserializeWorldItemProperties(propertiesString?: string | null): WorldItemProperty[] {
	return deserializeProperties(propertiesString);
}

/**
 * Serializa propiedades de WorldItem.
 * @param properties - Propiedades a serializar.
 * @returns String JSON con las propiedades serializadas.
 */
export function serializeWorldItemProperties(properties: WorldItemProperty[] | string): string {
	return serializeProperties(properties);
}

/**
 * Deserializa requisitos de WorldItem.
 * @param requirementsString - String JSON con requisitos.
 * @returns Array de requisitos deserializados.
 */
export function deserializeWorldItemRequirements(requirementsString?: string | null): WorldItemRequirement[] {
	return deserializeRequirements(requirementsString);
}

/**
 * Serializa requisitos de WorldItem.
 * @param requirements - Requisitos a serializar.
 * @returns String JSON con los requisitos serializados.
 */
export function serializeWorldItemRequirements(requirements: WorldItemRequirement[] | string): string {
	return serializeRequirements(requirements);
}

/**
 * Deserializa estadísticas de WorldItem.
 * @param statsString - String JSON con estadísticas.
 * @returns Array de estadísticas deserializadas.
 */
export function deserializeWorldItemStats(statsString?: string | null): WorldItemStat[] {
	return deserializeStats(statsString);
}

/**
 * Serializa estadísticas de WorldItem.
 * @param stats - Estadísticas a serializar.
 * @returns String JSON con las estadísticas serializadas.
 */
export function serializeWorldItemStats(stats: WorldItemStat[] | string): string {
	return serializeStats(stats);
}

/**
 * Deserializa etiquetas de WorldItem.
 * @param tagsString - String JSON con etiquetas.
 * @returns Array de etiquetas deserializadas.
 */
export function deserializeWorldItemTags(tagsString?: string | null): string[] {
	return deserializeTags(tagsString);
}

/**
 * Serializa etiquetas de WorldItem.
 * @param tags - Etiquetas a serializar.
 * @returns String JSON con las etiquetas serializadas.
 */
export function serializeWorldItemTags(tags: string[] | string): string {
	return serializeTags(tags);
}

/**
 * Convierte un WorldItemComplete a WorldItemBase.
 * @param worldItem - El WorldItemComplete a convertir.
 * @returns El WorldItemBase.
 */
export function fromExtendedWorldItem(worldItem: WorldItemComplete): WorldItemBase {
        const {
                _count,
                images,
                videos,
                notes,
                concepts,
                prompts,
                groups,
                properties,
                wildcards,
                tags: relatedTags,
                isSelected,
                isExpanded,
                isEditing,
                ...base
        } = worldItem;

        return base;
}
