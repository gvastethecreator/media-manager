/**
 * @file Serializadores para la entidad WorldItem
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
    WorldItemEffect,
    WorldItemFilter,
    WorldItemProperty,
    WorldItemRelations,
    WorldItemRequirement,
    WorldItemStat,
    WorldItemUI
} from '@/types/entities/world-item/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import { getRelationCounts } from '@/utils/transformers/relations';
import { Prisma } from '@prisma/client';

// Re-importar el tipo WorldItem desde types para compatibilidad
export type { WorldItemDeserialized as WorldItem } from '@/types/entities/world-item/types';

// Logger específico para este módulo
const logger = createLogger('WorldItemTransformer:Serializers');

/**
 * Valida un objeto WorldItem contra su esquema
 * @param worldItem - Objeto WorldItem a validar
 * @returns El objeto validado o lanza un error
 */
export function validateWorldItem(worldItem: WorldItemBase): WorldItemBase {
	try {
		const result = WorldItemSchema.parse(worldItem);
		return worldItem;
	} catch (error) {
		logger.error('Error validando WorldItem:', error);
		throw new Error(`Datos de WorldItem inválidos: ${error instanceof Error ? error.message : String(error)}`);
	}
}

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
 * 🔄 Deserializa un WorldItem desde Prisma, manejando campos JSON y relaciones
 */
export function fromPrismaWorldItem(
	// ✨ Aceptar un objeto parcial y más genérico ✨
	prismaItem: Partial<Prisma.WorldItemGetPayload<{
		include: { // Definir todas las relaciones *posibles*
			images: true; videos: true; notes: true; concepts: true;
			prompts: true; groups: true; properties: true; wildcards: true;
			tags: true; _count: true;
		};
	}>>
): WorldItemDeserialized {
	try {
		// Validar campos esenciales
		if (!prismaItem || !prismaItem.id || typeof prismaItem.name !== 'string') {
			logger.error('Invalid prismaItem object received in fromPrismaWorldItem', { prismaItem });
			throw new Error('Invalid prismaItem object received');
		}

		// 🛠️ Función auxiliar para normalizar strings comunes a valores JSON válidos
		const normalizeCommonStrings = (field: string): string | null => {
			const trimmed = field.trim().toLowerCase();
			
			// Casos de "ningún valor" o "vacío"
			if (['ninguno', 'none', 'null', 'vacio', 'vacío', 'empty', 'n/a', 'na', '-'].includes(trimmed)) {
				return '[]'; // Array vacío por defecto
			}
			
			// Casos de objetos vacíos
			if (['{}', 'objeto vacio', 'objeto vacío', 'no hay'].includes(trimmed)) {
				return '{}';
			}
			
			return null; // No se pudo normalizar
		};

		// 🔧 Función auxiliar para reparar patrones de atributos tipo "Fuerza 15"
		const repairAttributePattern = (field: string): string | null => {
			// Detectar patrones como "Fuerza 15", "Fuerza 15, Destreza 10", etc.
			const attributePattern = /^[A-Za-zÀ-ÿ\s]+\s+\d+/;
			if (!attributePattern.test(field)) return null;

			try {
				const items = field.split(',')
					.map(item => item.trim())
					.filter(Boolean)
					.map(item => {
						// Buscar patrón: "Nombre + Número + (opcional) descripción"
						const matches = item.match(/^([A-Za-zÀ-ÿ\s]+?)\s+(\d+)(.*)$/);
						if (matches) {
							return {
								name: matches[1].trim(),
								value: Number.parseInt(matches[2]),
								description: matches[3]?.trim() || ''
							};
						}
						// Fallback: considerar todo como nombre
						return { name: item, value: 0, description: '' };
					});

				return JSON.stringify(items);
			} catch (error) {
				logger.error(`❌ Error al reparar patrón de atributos: ${field}`, error);
				return null;
			}
		};

		// 🎯 Parsear campos JSON de forma segura con múltiples estrategias de reparación
		const parseJsonField = <T>(field: string | null | undefined, defaultValue: T): T => {
			if (typeof field !== 'string' || !field) return defaultValue;

			// Valores especiales conocidos
			if (field === 'empty_array') return [] as unknown as T;
			if (field === 'empty_object') return {} as unknown as T;

			try {
				return JSON.parse(field) as T;
			} catch (originalError) {
				logger.debug(`🔄 Intentando reparar campo JSON para WorldItem: "${field.substring(0, 50)}${field.length > 50 ? '...' : ''}"`);

				// 🔧 Estrategia 1: Normalizar strings comunes
				const normalized = normalizeCommonStrings(field);
				if (normalized) {
					try {
						const parsed = JSON.parse(normalized);
						logger.info(`✅ Campo reparado con normalización: "${field}" → ${normalized}`);
						return parsed as T;
					} catch (error) {
						logger.error(`❌ Error al parsear campo normalizado: ${normalized}`, error);
					}
				}

				// 🔧 Estrategia 2: Reparar patrones de atributos
				const repairedAttribute = repairAttributePattern(field);
				if (repairedAttribute) {
					try {
						const parsed = JSON.parse(repairedAttribute);
						logger.info(`✅ Campo reparado como atributos: "${field}" → ${repairedAttribute}`);
						return parsed as T;
					} catch (error) {
						logger.error(`❌ Error al parsear atributos reparados: ${repairedAttribute}`, error);
					}
				}

				// 🔧 Estrategia 3: Intentar envolver en array si parece ser un elemento único
				if (field.length > 0 && !field.startsWith('[') && !field.startsWith('{')) {
					try {
						// Envolver en array como string
						const wrappedAsArray = `["${field.replace(/"/g, '\\"')}"]`;
						const parsed = JSON.parse(wrappedAsArray);
						logger.info(`✅ Campo envuelto en array: "${field}" → ${wrappedAsArray}`);
						return parsed as T;
					} catch (error) {
						logger.debug(`❌ No se pudo envolver en array: ${field}`, error);
					}
				}

				// 🚨 Si todas las estrategias fallan, registrar para análisis y usar valor por defecto
				logger.warn(`❌ No se pudo reparar campo JSON para WorldItem. Campo: "${field}", Error original: ${originalError}. Usando valor por defecto.`);
				return defaultValue;
			}
		};

		const baseItem: WorldItemBase = {
			id: prismaItem.id,
			name: prismaItem.name,
			description: prismaItem.description ?? null,
			type: prismaItem.type ?? '', // Asumir que type siempre debe existir
			category: prismaItem.category ?? null,
			rarity: prismaItem.rarity ?? null,
			value: prismaItem.value ?? null,
			// Parsear campos JSON
			properties: parseJsonField(prismaItem.properties, {}), // Default a objeto vacío
			effects: parseJsonField(prismaItem.effects, []),      // Default a array vacío
			attributes: parseJsonField(prismaItem.attributes, []), // Default a array vacío
			requirements: parseJsonField(prismaItem.requirements, {}), // Default a objeto vacío
			isFavorite: prismaItem.isFavorite ?? false,
			createdAt: prismaItem.createdAt ? new Date(prismaItem.createdAt) : new Date(0),
			updatedAt: prismaItem.updatedAt ? new Date(prismaItem.updatedAt) : new Date(0),
		};

		// Obtener conteos
		const counts = getRelationCounts('WorldItem', prismaItem);

		// Construir objeto completo
		return {
			...baseItem,
			images: prismaItem.images?.map(img => ({ id: img.id })) ?? [],
			videos: prismaItem.videos?.map(vid => ({ id: vid.id })) ?? [],
			notes: prismaItem.notes?.map(note => ({ id: note.id })) ?? [],
			concepts: prismaItem.concepts?.map(con => ({ id: con.id })) ?? [],
			prompts: prismaItem.prompts?.map(p => ({ id: p.id })) ?? [],
			groups: prismaItem.groups?.map(g => ({ id: g.id })) ?? [],
			properties: prismaItem.properties?.map(p => ({ id: p.id })) ?? [],
			wildcards: prismaItem.wildcards?.map(w => ({ id: w.id })) ?? [],
			tags: prismaItem.tags?.map(t => ({ id: t.id })) ?? [],
			_count: counts,
		};

	} catch (error) {
		logger.error('Error en fromPrismaWorldItem:', error);
		throw handleTransformerError(error);
	}
}

/**
 * Convierte un WorldItem deserializado a formato Prisma para almacenamiento
 * @param worldItem - WorldItem con campos deserializados
 * @returns WorldItem en formato para Prisma
 */
export function toPrismaWorldItem(worldItem: Partial<WorldItemDeserialized>): Partial<WorldItemBase> {
	try {
		if (!worldItem) {
			throw new Error('WorldItem no proporcionado');
		}

		// Extraer los campos que necesitan ser serializados
		const {
			attributesList,
			effectsList,
			requirementsList,
			statsList,
			propertiesList,
			filtersList,
			tagsList,
			...rest
		} = worldItem;

		// Serializar campos según sea necesario
		const result: Partial<WorldItemBase> = {
			...rest,
			...(attributesList && { attributes: serializeAttributes(attributesList) }),
			...(effectsList && { effects: serializeEffects(effectsList) }),
			...(requirementsList && { requirements: serializeRequirements(requirementsList) }),
			...(statsList && { stats: serializeStats(statsList) }),
			...(propertiesList && { properties: serializeProperties(propertiesList) }),
			...(filtersList && { filters: serializeFilters(filtersList) }),
			...(tagsList && { tags: serializeTags(tagsList) })
		};

		return result;
	} catch (error) {
		logger.error('Error en toPrismaWorldItem:', error);
		throw new Error(`Error serializando WorldItem: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Extiende un WorldItem con campos UI adicionales
 * @param worldItem - WorldItem base
 * @returns WorldItem con campos UI adicionales
 */
export function extendWorldItem(worldItem: WorldItemDeserialized): WorldItemComplete {
	try {
		// Crear objeto UI
		const ui: WorldItemUI = {
			emoji: worldItem.emoji || '🔮',
			color: worldItem.color || '#6D28D9',
			formattedDate: new Date(worldItem.updatedAt).toLocaleDateString()
		};

		// Crear contadores
		const counts: WorldItemCounts = {
			images: 0,
			relatedItems: 0
		};

		// Crear relaciones vacías
		const relations: WorldItemRelations = {};

		return {
			...worldItem,
			ui,
			counts,
			relations
		};
	} catch (error) {
		logger.error('Error extendiendo WorldItem:', error);
		return {
			...worldItem,
			ui: {
				emoji: '🔮',
				color: '#6D28D9',
				formattedDate: new Date().toLocaleDateString()
			},
			counts: {},
			relations: {}
		};
	}
}

/**
 * Extiende múltiples WorldItems con campos UI adicionales
 * @param worldItems - Array de WorldItems
 * @returns Array de WorldItems extendidos
 */
export function extendWorldItems(worldItems: WorldItemDeserialized[]): WorldItemComplete[] {
	return worldItems.map(extendWorldItem);
}

// Exportar funciones en desuso con advertencias (para retrocompatibilidad)
/**
 * @deprecated Use deserializeAttributes instead
 */
export function deserializeWorldItemAttributes(attributesString?: string | null): WorldItemAttribute[] {
	logger.warn('deserializeWorldItemAttributes está obsoleto. Use deserializeAttributes en su lugar.');
	return deserializeAttributes(attributesString);
}

/**
 * @deprecated Use serializeAttributes instead
 */
export function serializeWorldItemAttributes(attributes: WorldItemAttribute[] | string): string {
	logger.warn('serializeWorldItemAttributes está obsoleto. Use serializeAttributes en su lugar.');
	return serializeAttributes(attributes);
}

/**
 * @deprecated Use deserializeEffects instead
 */
export function deserializeWorldItemEffects(effectsString?: string | null): WorldItemEffect[] {
	logger.warn('deserializeWorldItemEffects está obsoleto. Use deserializeEffects en su lugar.');
	return deserializeEffects(effectsString);
}

/**
 * @deprecated Use serializeEffects instead
 */
export function serializeWorldItemEffects(effects: WorldItemEffect[] | string): string {
	logger.warn('serializeWorldItemEffects está obsoleto. Use serializeEffects en su lugar.');
	return serializeEffects(effects);
}

/**
 * @deprecated Use deserializeFilters instead
 */
export function deserializeWorldItemFilters(filtersString?: string | null): WorldItemFilter[] {
	logger.warn('deserializeWorldItemFilters está obsoleto. Use deserializeFilters en su lugar.');
	return deserializeFilters(filtersString);
}

/**
 * @deprecated Use serializeFilters instead
 */
export function serializeWorldItemFilters(filters: WorldItemFilter[] | string): string {
	logger.warn('serializeWorldItemFilters está obsoleto. Use serializeFilters en su lugar.');
	return serializeFilters(filters);
}

/**
 * @deprecated Use deserializeProperties instead
 */
export function deserializeWorldItemProperties(propertiesString?: string | null): WorldItemProperty[] {
	logger.warn('deserializeWorldItemProperties está obsoleto. Use deserializeProperties en su lugar.');
	return deserializeProperties(propertiesString);
}

/**
 * @deprecated Use serializeProperties instead
 */
export function serializeWorldItemProperties(properties: WorldItemProperty[] | string): string {
	logger.warn('serializeWorldItemProperties está obsoleto. Use serializeProperties en su lugar.');
	return serializeProperties(properties);
}

/**
 * @deprecated Use deserializeRequirements instead
 */
export function deserializeWorldItemRequirements(requirementsString?: string | null): WorldItemRequirement[] {
	logger.warn('deserializeWorldItemRequirements está obsoleto. Use deserializeRequirements en su lugar.');
	return deserializeRequirements(requirementsString);
}

/**
 * @deprecated Use serializeRequirements instead
 */
export function serializeWorldItemRequirements(requirements: WorldItemRequirement[] | string): string {
	logger.warn('serializeWorldItemRequirements está obsoleto. Use serializeRequirements en su lugar.');
	return serializeRequirements(requirements);
}

/**
 * @deprecated Use deserializeStats instead
 */
export function deserializeWorldItemStats(statsString?: string | null): WorldItemStat[] {
	logger.warn('deserializeWorldItemStats está obsoleto. Use deserializeStats en su lugar.');
	return deserializeStats(statsString);
}

/**
 * @deprecated Use serializeStats instead
 */
export function serializeWorldItemStats(stats: WorldItemStat[] | string): string {
	logger.warn('serializeWorldItemStats está obsoleto. Use serializeStats en su lugar.');
	return serializeStats(stats);
}

/**
 * @deprecated Use deserializeTags instead
 */
export function deserializeWorldItemTags(tagsString?: string | null): string[] {
	logger.warn('deserializeWorldItemTags está obsoleto. Use deserializeTags en su lugar.');
	return deserializeTags(tagsString);
}

/**
 * @deprecated Use serializeTags instead
 */
export function serializeWorldItemTags(tags: string[] | string): string {
	logger.warn('serializeWorldItemTags está obsoleto. Use serializeTags en su lugar.');
	return serializeTags(tags);
}

/**
 * @deprecated Use fromPrismaWorldItem instead
 */
export function parseJsonFields(worldItem: WorldItemBase): WorldItemDeserialized {
	logger.warn('parseJsonFields está obsoleto. Use fromPrismaWorldItem en su lugar.');
	return fromPrismaWorldItem(worldItem);
}

/**
 * @deprecated Use extendWorldItem instead
 */
export function toExtendedWorldItem(worldItem: WorldItemBase): WorldItemComplete {
	logger.warn('toExtendedWorldItem está obsoleto. Use extendWorldItem en su lugar.');
	return extendWorldItem(fromPrismaWorldItem(worldItem));
}

/**
 * @deprecated Use fromPrismaWorldItem instead
 */
export function fromExtendedWorldItem(worldItem: WorldItemComplete): WorldItemBase {
	logger.warn('fromExtendedWorldItem está obsoleto. Use toPrismaWorldItem en su lugar.');
	return toPrismaWorldItem(worldItem) as WorldItemBase;
}

/**
 * @deprecated Use extendWorldItem instead with proper counts
 */
export function toWorldItemWithStats(worldItem: WorldItemBase & { _count?: { images?: number; relatedItems?: number } }): WorldItemComplete {
	logger.warn('toWorldItemWithStats está obsoleto. Use extendWorldItem con counts apropiados.');
	const extendedItem = extendWorldItem(fromPrismaWorldItem(worldItem));

	// Agregar conteos si están disponibles
	if (worldItem._count) {
		extendedItem.counts = {
			...extendedItem.counts,
			...worldItem._count
		};
	}

	return extendedItem;
}
