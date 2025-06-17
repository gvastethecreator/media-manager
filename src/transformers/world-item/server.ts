/**
 * @file Funciones del lado del servidor para la entidad WorldItem
 * @module transformers/world-item/server
 */

import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/logger';
import { WorldItemSchema } from '@/types/entities/world-item/schema';
import type {
	WorldItemAttribute,
	WorldItemBase,
	WorldItemDeserialized,
	WorldItemEffect,
	WorldItemFilter,
	WorldItemProperty,
	WorldItemRequirement,
	WorldItemStat,
} from '@/types/entities/world-item/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
	serializeAttributes,
	serializeEffects,
	serializeFilters,
	serializeProperties,
	serializeRequirements,
	serializeStats,
	serializeTags,
} from './serializers';

const logger = createLogger('WorldItemTransformer:Server');

/**
 * Valida un objeto WorldItem contra su esquema
 * @param worldItem - Objeto WorldItem a validar
 * @returns El objeto validado o lanza un error
 */
export function validateWorldItem(worldItem: WorldItemBase): WorldItemBase {
	try {
		const _result = WorldItemSchema.parse(worldItem);
		return worldItem;
	} catch (error) {
		logger.error('Error validando WorldItem:', error);
		throw new Error(`Datos de WorldItem inválidos: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🔄 Deserializa un WorldItem desde Prisma, manejando campos JSON y relaciones
 */
export function fromPrismaWorldItem(
	prismaItem: Partial<
		Prisma.WorldItemGetPayload<{
			include: {
				images: true;
				videos: true;
				notes: true;
				concepts: true;
				prompts: true;
				groups: true;
				properties: true;
				wildcards: true;
				tags: true;
				_count: true;
			};
		}>
	>
): WorldItemDeserialized {
	try {
		// ✅ Validar campos esenciales
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
				const items = field
					.split(',')
					.map((item) => item.trim())
					.filter(Boolean)
					.map((item) => {
						// Buscar patrón: "Nombre + Número + (opcional) descripción"
						const matches = item.match(/^([A-Za-zÀ-ÿ\s]+?)\s+(\d+)(.*)$/);
						if (matches) {
							return {
								name: matches[1].trim(),
								value: Number.parseInt(matches[2], 10),
								description: matches[3]?.trim() || '',
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
			if (field === 'empty_object') return {} as unknown as T;
			if (field === '[]' && Array.isArray(defaultValue)) return [] as T;
			try {
				return JSON.parse(field) as T;
			} catch (originalError) {
				logger.debug(
					`🔄 Intentando reparar campo JSON para WorldItem: "${field.substring(0, 50)}${field.length > 50 ? '...' : ''}"`
				);

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
				logger.warn(
					`❌ No se pudo reparar campo JSON para WorldItem. Campo: "${field}", Error original: ${originalError}. Usando valor por defecto.`
				);
				return defaultValue;
			}
		};

		// 🏗️ Construir objeto base con validaciones mejoradas
		const baseItem: WorldItemBase = {
			// ✅ Campos requeridos con validación
			id: prismaItem.id,
			name: prismaItem.name,
			description: prismaItem.description ?? null,
			shortcut: prismaItem.shortcut ?? null,

			// ✅ Campos categóricos con valores por defecto seguros
			category: prismaItem.category ?? 'other',
			type: prismaItem.type ?? 'item',
			rarity: prismaItem.rarity ?? 'common',
			size: prismaItem.size ?? 'medium',
			origin: prismaItem.origin ?? 'unknown',

			// ✅ Campos JSON como strings serializados (para WorldItemBase)
			attributes:
				typeof prismaItem.attributes === 'string' ? prismaItem.attributes : JSON.stringify(prismaItem.attributes || []),
			effects: typeof prismaItem.effects === 'string' ? prismaItem.effects : JSON.stringify(prismaItem.effects || []),
			requirements:
				typeof prismaItem.requirements === 'string'
					? prismaItem.requirements
					: JSON.stringify(prismaItem.requirements || {}),
			stats: typeof prismaItem.stats === 'string' ? prismaItem.stats : JSON.stringify(prismaItem.stats || []),
			properties:
				typeof prismaItem.properties === 'string' ? prismaItem.properties : JSON.stringify(prismaItem.properties || []),
			filters: typeof prismaItem.filters === 'string' ? prismaItem.filters : JSON.stringify(prismaItem.filters || []),

			// ✅ Otros campos
			featuredImage: prismaItem.featuredImage ?? null,
			isFavorite: prismaItem.isFavorite ?? false,
			emoji: prismaItem.emoji ?? '🔮',
			color: prismaItem.color ?? '#6D28D9',
			sortBy: prismaItem.sortBy ?? 'name',

			// ✅ Timestamps
			createdAt: prismaItem.createdAt ? new Date(prismaItem.createdAt) : new Date(),
			updatedAt: prismaItem.updatedAt ? new Date(prismaItem.updatedAt) : new Date(),
		};

		// 🎯 Parsear campos JSON para la versión deserializada
		const deserializedFields = {
			attributesList: parseJsonField(baseItem.attributes, [] as WorldItemAttribute[]),
			effectsList: parseJsonField(baseItem.effects, [] as WorldItemEffect[]),
			requirementsList: parseJsonField(baseItem.requirements, [] as WorldItemRequirement[]),
			statsList: parseJsonField(baseItem.stats, [] as WorldItemStat[]),
			propertiesList: parseJsonField(baseItem.properties, [] as WorldItemProperty[]),
			filtersList: parseJsonField(baseItem.filters, [] as WorldItemFilter[]),
			tagsList: parseJsonField(JSON.stringify(prismaItem.tags?.map((t) => t.name) || []), [] as string[]),
		};

		// 🏗️ Construir objeto deserializado completo
		const deserializedItem: WorldItemDeserialized = {
			...baseItem,
			...deserializedFields,
		};

		return deserializedItem;
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
		const { attributesList, effectsList, requirementsList, statsList, propertiesList, filtersList, tagsList, ...rest } =
			worldItem;

		// Serializar campos según sea necesario
		const result: Partial<WorldItemBase> = {
			...rest,
			...(attributesList && { attributes: serializeAttributes(attributesList) }),
			...(effectsList && { effects: serializeEffects(effectsList) }),
			...(requirementsList && { requirements: serializeRequirements(requirementsList) }),
			...(statsList && { stats: serializeStats(statsList) }),
			...(propertiesList && { properties: serializeProperties(propertiesList) }),
			...(filtersList && { filters: serializeFilters(filtersList) }),
			...(tagsList && { tags: serializeTags(tagsList) }),
		};

		return result;
	} catch (error) {
		logger.error('Error en toPrismaWorldItem:', error);
		throw new Error(`Error serializando WorldItem: ${error instanceof Error ? error.message : String(error)}`);
	}
}
