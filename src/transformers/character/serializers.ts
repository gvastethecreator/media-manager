/**
 * @file Funciones de serialización/deserialización para la entidad Character
 * @module transformers/character/serializers
 */

import { Logger } from '@/lib/logger';
import type {
    CharacterExtended,
    CharacterFilter,
    CharacterRelationship,
    CharacterStats,
    CharacterSummary,
} from '@/types/entities/character';
import {
    type CharacterBase,
    type CharacterComplete,
    type CharacterCreateInput,
    CharacterSchema,
    type CharacterUpdateInput,
} from '@/types/entities/character/types';
import {
    deserializeJsonField,
    serializeJsonField,
    validateFieldType,
    validateRequiredFields,
} from '@/utils/transformers/common';
import {
    handleTransformerError
} from '@/utils/transformers/errors';
import {
    getRelationCounts,
    preparePrismaRelations,
    validateEntityRelations,
} from '@/utils/transformers/relations';
import {
    validateBaseEntity,
    validateMetadataFields
} from '@/utils/transformers/validation';
import type { Character as PrismaCharacter } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const logger = new Logger('CharacterSerializer');

/**
 * Transforma un objeto Character de Prisma a un objeto CharacterExtended
 * Los campos JSON almacenados como strings en la BD (stats, relationships, goals, etc.)
 * son deserializados a sus correspondientes tipos de datos (objetos/arrays)
 *
 * @param character Character de Prisma
 * @returns CharacterExtended con propiedades adicionales y campos JSON deserializados
 */
export function toExtendedCharacter(character: PrismaCharacter | Partial<PrismaCharacter>): CharacterExtended {
	// Si no hay character, lanzar error
	if (!character) {
		throw new Error('Character is null or undefined');
	}

	// Parse complex fields (deserialization)
	const parsedFilters = character.filters ? parseCharacterFilters(character.filters) : [];
	const parsedStats = character.stats ? parseCharacterStats(character.stats) : {};
	const parsedRelationships = character.relationships
		? parseCharacterRelationships(character.relationships)
		: [];
	const parsedGoals = character.goals ? parseStringArray(character.goals) : [];
	const parsedFears = character.fears ? parseStringArray(character.fears) : [];
	const parsedBeliefs = character.beliefs ? parseStringArray(character.beliefs) : [];
	const parsedPersonality = character.personality ? parseStringArray(character.personality) : [];

	// Build and return CharacterExtended object
	return {
		...character,
		// Keep original (strings) for future serialization
		filters: character.filters || 'empty_array',
		stats: character.stats || '{}',
		relationships: character.relationships || 'empty_array',
		goals: character.goals || 'empty_array',
		fears: character.fears || 'empty_array',
		beliefs: character.beliefs || 'empty_array',
		personality: character.personality || 'empty_array',
		// Add parsed versions for application use
		parsedFilters,
		parsedStats,
		parsedRelationships,
		parsedGoals,
		parsedFears,
		parsedBeliefs,
		parsedPersonality,
		// Default values for optional properties
		shortcut: character.shortcut || '',
		emoji: character.emoji || '👤',
		color: character.color || '#3b82f6',
		level: character.level || 1,
		class: character.class || 'unknown',
		race: character.race || 'unknown',
		alignment: character.alignment || 'neutral',
		psychologicalProfile: character.psychologicalProfile || '',
		socialProfile: character.socialProfile || '',
		description: character.description || '',
		backstory: character.backstory || '',
		isFavorite: character.isFavorite || false,
		sortBy: character.sortBy || 'name',
		category: character.category || 'character',
		// Propiedades adicionales de UI
		isSelected: false,
		isHovered: false,
		isOpen: false,
		isLoading: false,
		hasError: false,
		imageCount: 0,
	} as CharacterExtended;
}

/**
 * Transforma un Character en un resumen para listados
 * @param character Character a resumir
 * @param imageCount Cantidad de imágenes opcional
 * @returns CharacterSummary con datos básicos
 */
export function toCharacterSummary(
	character: PrismaCharacter | CharacterExtended,
	imageCount?: number
): CharacterSummary {
	return {
		id: character.id,
		name: character.name,
		emoji: character.emoji || '👤',
		color: character.color || '#3b82f6',
		class: character.class || 'unknown',
		race: character.race || 'unknown',
		level: character.level || 1,
		imageCount: imageCount || 0,
		category: character.category,
	};
}

/**
 * 🔄 Serializa un Character para Prisma
 */
export function toPrismaCharacter(data: CharacterCreateInput | CharacterUpdateInput): Prisma.CharacterCreateInput | Prisma.CharacterUpdateInput {
  try {
    // Validar campos requeridos para creación
    if (!('id' in data)) {
      validateRequiredFields(data, ['name', 'level', 'class', 'race', 'alignment', 'background']);
    }

    // Validar tipos de datos
    validateFieldType(data.name, 'string', 'name');
    validateFieldType(data.level, 'number', 'level');
    validateFieldType(data.experience, 'number', 'experience');
    validateFieldType(data.class, 'string', 'class');
    validateFieldType(data.race, 'string', 'race');
    validateFieldType(data.alignment, 'string', 'alignment');
    validateFieldType(data.background, 'string', 'background');

    // Serializar campos JSON
    const stats = serializeJsonField(data.stats, '{}');
    const skills = serializeJsonField(data.skills, '{}');
    const inventory = serializeJsonField(data.inventory, '[]');
    const spells = serializeJsonField(data.spells, '[]');
    const feats = serializeJsonField(data.feats, '[]');
    const metadata = serializeJsonField(data.metadata, '{}');

    // Preparar relaciones para Prisma
    const relations = preparePrismaRelations('Character', data);

    return {
      ...data,
      stats,
      skills,
      inventory,
      spells,
      feats,
      metadata,
      ...relations,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Deserializa un Character desde Prisma
 */
export function fromPrismaCharacter(
  prismaCharacter: Prisma.CharacterGetPayload<{
    include: {
      party: true;
      campaign: true;
      images: true;
      items: true;
      abilities: true;
      quests: true;
      locations: true;
      npcs: true;
      notes: true;
      relatedCharacters: true;
      relatedTo: true;
      _count: true;
    };
  }>
): CharacterComplete {
  try {
    // Deserializar campos JSON
    const stats = deserializeJsonField(prismaCharacter.stats, {});
    const skills = deserializeJsonField(prismaCharacter.skills, {});
    const inventory = deserializeJsonField(prismaCharacter.inventory, []);
    const spells = deserializeJsonField(prismaCharacter.spells, []);
    const feats = deserializeJsonField(prismaCharacter.feats, []);
    const metadata = deserializeJsonField(prismaCharacter.metadata, {});

    // Obtener conteos de relaciones
    const counts = getRelationCounts('Character', prismaCharacter);

    // Construir objeto base
    const baseCharacter: CharacterBase = {
      id: prismaCharacter.id,
      name: prismaCharacter.name,
      description: prismaCharacter.description,
      level: prismaCharacter.level,
      experience: prismaCharacter.experience,
      class: prismaCharacter.class,
      race: prismaCharacter.race,
      alignment: prismaCharacter.alignment,
      background: prismaCharacter.background,
      stats,
      skills,
      inventory,
      spells,
      feats,
      notes: prismaCharacter.notes,
      isActive: prismaCharacter.isActive,
      isFavorite: prismaCharacter.isFavorite,
      metadata,
      createdAt: prismaCharacter.createdAt,
      updatedAt: prismaCharacter.updatedAt,
    };

    // Validar objeto base
    validateBaseEntity(baseCharacter);
    validateMetadataFields(baseCharacter);

    // Construir objeto completo con relaciones
    return {
      ...baseCharacter,
      party: prismaCharacter.party ? { id: prismaCharacter.party.id } : undefined,
      campaign: prismaCharacter.campaign ? { id: prismaCharacter.campaign.id } : undefined,
      images: prismaCharacter.images?.map(img => ({ id: img.id })),
      items: prismaCharacter.items?.map(item => ({ id: item.id })),
      abilities: prismaCharacter.abilities?.map(ability => ({ id: ability.id })),
      quests: prismaCharacter.quests?.map(quest => ({ id: quest.id })),
      locations: prismaCharacter.locations?.map(location => ({ id: location.id })),
      npcs: prismaCharacter.npcs?.map(npc => ({ id: npc.id })),
      notes: prismaCharacter.notes?.map(note => ({ id: note.id })),
      relatedCharacters: prismaCharacter.relatedCharacters?.map(char => ({ id: char.id })),
      relatedTo: prismaCharacter.relatedTo?.map(char => ({ id: char.id })),
      _count: counts,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Valida un Character
 */
export function validateCharacter(data: unknown): CharacterComplete {
  try {
    const validated = CharacterSchema.parse(data);
    validateEntityRelations('Character', validated);
    return validated as CharacterComplete;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Extiende un Character con datos adicionales
 */
export async function extendCharacter(
  character: CharacterComplete,
  options: {
    includeRelations?: boolean;
    includeCount?: boolean;
    customFields?: string[];
  } = {}
): Promise<CharacterComplete> {
  try {
    const extended = { ...character };

    // Aquí puedes agregar lógica para cargar datos adicionales
    // basado en las opciones proporcionadas

    return extended;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Parsea filtros de Character
 */
export function parseCharacterFilters(filters: unknown): Record<string, unknown> {
  try {
    if (!filters || typeof filters !== 'object') {
      return {};
    }

    const parsed: Record<string, unknown> = {};
    const typedFilters = filters as Record<string, unknown>;

    // Procesar filtros específicos de Character
    if (typedFilters.search) {
      parsed.OR = [
        { name: { contains: typedFilters.search as string, mode: 'insensitive' } },
        { description: { contains: typedFilters.search as string, mode: 'insensitive' } },
      ];
    }

    // Filtros de nivel
    if (typedFilters.level?.min !== undefined) {
      parsed.level = { ...parsed.level, gte: typedFilters.level.min };
    }
    if (typedFilters.level?.max !== undefined) {
      parsed.level = { ...parsed.level, lte: typedFilters.level.max };
    }

    // Filtros de clase, raza y alineamiento
    if (typedFilters.class?.length) {
      parsed.class = { in: typedFilters.class };
    }
    if (typedFilters.race?.length) {
      parsed.race = { in: typedFilters.race };
    }
    if (typedFilters.alignment?.length) {
      parsed.alignment = { in: typedFilters.alignment };
    }
    if (typedFilters.background?.length) {
      parsed.background = { in: typedFilters.background };
    }

    // Filtros de estado
    if (typedFilters.isActive !== undefined) {
      parsed.isActive = typedFilters.isActive;
    }
    if (typedFilters.isFavorite !== undefined) {
      parsed.isFavorite = typedFilters.isFavorite;
    }

    // Filtros de relaciones
    if (typedFilters.hasParty) {
      parsed.party = { isNot: null };
    }
    if (typedFilters.hasCampaign) {
      parsed.campaign = { isNot: null };
    }
    if (typedFilters.hasImages) {
      parsed.images = { some: {} };
    }

    // Filtros de fecha
    if (typedFilters.dateRange?.start) {
      parsed.createdAt = { ...parsed.createdAt, gte: typedFilters.dateRange.start };
    }
    if (typedFilters.dateRange?.end) {
      parsed.createdAt = { ...parsed.createdAt, lte: typedFilters.dateRange.end };
    }

    return parsed;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Parsea una cadena de filtros a un array de objetos CharacterFilter
 * En la base de datos, los filtros se almacenan como string JSON o "empty_array"
 *
 * @param filtersStr Cadena serializada de filtros (JSON o "empty_array")
 * @returns Array de objetos CharacterFilter correctamente tipados
 */
export function parseCharacterFilters(filtersStr: string): CharacterFilter[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (filtersStr === 'empty_array') {
			return [];
		}

		// Intentar parsear el JSON
		const parsedFilters = JSON.parse(filtersStr);

		// Validar que sea un array
		if (!Array.isArray(parsedFilters)) {
			return [];
		}

		return parsedFilters;
	} catch (error) {
		console.error('Error al parsear filtros de personaje:', error);
		return [];
	}
}

/**
 * Parsea una cadena de estadísticas a un objeto CharacterStats
 * En la base de datos, las estadísticas se almacenan como string JSON o "{}"
 *
 * @param statsStr Cadena serializada de estadísticas (JSON o "{}")
 * @returns Objeto CharacterStats correctamente tipado
 */
export function parseCharacterStats(statsStr: string): CharacterStats {
	try {
		// Si es "{}", retornar un objeto vacío
		if (statsStr === '{}') {
			return {};
		}

		// Intentar parsear el JSON
		const parsedStats = JSON.parse(statsStr);

		// Validar que sea un objeto
		if (typeof parsedStats !== 'object' || parsedStats === null || Array.isArray(parsedStats)) {
			return {};
		}

		return parsedStats;
	} catch (error) {
		console.error('Error al parsear estadísticas de personaje:', error);
		return {};
	}
}

/**
 * Parsea una cadena de relaciones a un array de objetos CharacterRelationship
 * En la base de datos, las relaciones se almacenan como string JSON o "empty_array"
 *
 * @param relationshipsStr Cadena serializada de relaciones (JSON o "empty_array")
 * @returns Array de objetos CharacterRelationship correctamente tipados
 */
export function parseCharacterRelationships(relationshipsStr: string): CharacterRelationship[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (relationshipsStr === 'empty_array') {
			return [];
		}

		// Intentar parsear el JSON
		const parsedRelationships = JSON.parse(relationshipsStr);

		// Validar que sea un array
		if (!Array.isArray(parsedRelationships)) {
			return [];
		}

		return parsedRelationships;
	} catch (error) {
		console.error('Error al parsear relaciones de personaje:', error);
		return [];
	}
}

/**
 * Parsea una cadena que representa un array a un array de strings
 * En la base de datos, estos arrays se almacenan como string JSON o "empty_array"
 *
 * @param str Cadena serializada que representa un array (JSON o "empty_array")
 * @returns Array de strings correctamente tipado
 */
export function parseStringArray(str: string): string[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (str === 'empty_array') {
			return [];
		}

		// Intentar parsear el JSON
		const parsedArray = JSON.parse(str);

		// Validar que sea un array
		if (!Array.isArray(parsedArray)) {
			return [];
		}

		return parsedArray;
	}
	catch (error) {
		console.error('Error al parsear array de strings:', error);
		return [];
	}
}

/**
 * Serializa un array de tags en formato string
 * @param tags - Array de tags
 * @returns String de tags
 */
export function serializeTags(tags: string[]): string {
	if (!tags || !tags.length) {
		return '';
	}
	return tags.join(',');
}

/**
 * Deserializa tags desde string a array
 * @param tags - String de tags
 * @returns Array de tags
 */
export function deserializeTags(tags: string): string[] {
	if (!tags) {
		return [];
	}
	return tags.split(',').filter(Boolean);
}

/**
 * Serializa relaciones en formato JSON string
 * @param relationships - Array o string JSON de relaciones
 * @returns String JSON
 */
export function serializeRelationships(relationships: any[] | string): string {
	if (typeof relationships === 'string') {
		return relationships;
	}
	return JSON.stringify(relationships || []);
}

/**
 * Deserializa relaciones desde string JSON a array
 * @param relationships - String JSON de relaciones
 * @returns Array de relaciones
 */
export function deserializeRelationships(relationships: string): any[] {
	try {
		return relationships ? JSON.parse(relationships) : [];
	} catch (error) {
		console.error('Error deserializing relationships:', error);
		return [];
	}
}

/**
 * Serializa estadísticas en formato JSON string
 * @param stats - Objeto o string JSON de estadísticas
 * @returns String JSON
 */
export function serializeStats(stats: Record<string, any> | string): string {
	if (typeof stats === 'string') {
		return stats;
	}
	return JSON.stringify(stats || {});
}

/**
 * Deserializa estadísticas desde string JSON a objeto
 * @param stats - String JSON de estadísticas
 * @returns Objeto de estadísticas
 */
export function deserializeStats(stats: string): Record<string, any> {
	try {
		return stats ? JSON.parse(stats) : {};
	} catch (error) {
		console.error('Error deserializing stats:', error);
		return {};
	}
}

/**
 * Serializa array simple en formato JSON string
 * @param array - Array o string JSON
 * @returns String JSON
 */
export function serializeJsonArray(array: string[] | string): string {
	if (typeof array === 'string') {
		return array;
	}
	return JSON.stringify(array || []);
}

/**
 * Deserializa array simple desde string JSON
 * @param jsonString - String JSON de array
 * @returns Array de strings
 */
export function deserializeArray(jsonString: string): string[] {
	try {
		return jsonString ? JSON.parse(jsonString) : [];
	} catch (error) {
		console.error('Error deserializing array:', error);
		return [];
	}
}

/**
 * Serializa filtros en formato JSON string
 * @param filters - Objeto o string JSON de filtros
 * @returns String JSON
 */
export function serializeFilters(filters: Record<string, any> | string): string {
	if (typeof filters === 'string') {
		return filters;
	}
	return JSON.stringify(filters || {});
}

/**
 * Deserializa filtros desde string JSON a objeto
 * @param filters - String JSON de filtros
 * @returns Objeto de filtros
 */
export function deserializeFilters(filters: string): Record<string, any> {
	try {
		return filters ? JSON.parse(filters) : {};
	} catch (error) {
		console.error('Error deserializing filters:', error);
		return {};
	}
}

/**
 * Serializa un objeto para almacenarlo como string JSON en la base de datos
 * Este helper garantiza que objetos complejos se conviertan a formato serializado
 *
 * @param obj El objeto a serializar
 * @returns String en formato JSON o "empty_object" si es nulo o vacío
 */
export function serializeObject(obj: Record<string, any> | string | null | undefined): string {
	// Si ya es un string, asumimos que ya está serializado
	if (typeof obj === 'string') {
		return obj;
	}

	// Si es nulo o indefinido, devolver objeto vacío
	if (obj == null) {
		return '{}';
	}

	// Si es un objeto vacío
	if (Object.keys(obj).length === 0) {
		return '{}';
	}

	// Serializar a JSON
	try {
		return JSON.stringify(obj);
	} catch (error) {
		console.error('Error al serializar objeto:', error);
		return '{}';
	}
}

/**
 * Serializa un array para almacenarlo como string JSON en la base de datos
 *
 * @param arr El array a serializar
 * @returns String en formato JSON o "empty_array" si es nulo o vacío
 */
export function serializeArray(arr: any[] | string | null | undefined): string {
	// Si ya es un string, asumimos que ya está serializado
	if (typeof arr === 'string') {
		return arr;
	}

	// Si es nulo, indefinido o no es un array, devolver array vacío
	if (!arr || !Array.isArray(arr)) {
		return 'empty_array';
	}

	// Si es un array vacío
	if (arr.length === 0) {
		return 'empty_array';
	}

	// Serializar a JSON
	try {
		return JSON.stringify(arr);
	} catch (error) {
		console.error('Error al serializar array:', error);
		return 'empty_array';
	}
}

/**
 * Transforma un personaje extendido de vuelta a formato básico
 * @param extendedCharacter - Personaje en formato extendido
 * @returns Personaje con campos serializados
 */
export function fromExtendedCharacter(extendedCharacter: Partial<CharacterExtended>): Partial<CharacterBase> {
	const {
		stats,
		relationships,
		goals,
		fears,
		beliefs,
		personality,
		skills,
		abilities,
		filters,
		// Excluir relaciones y contadores
		images,
		videos,
		relatedCharacters,
		relatedTo,
		albums,
		collections,
		tags,
		places,
		worldItems,
		concepts,
		prompts,
		notes,
		wildcards,
		properties,
		groups,
		_count,
		...rest
	} = extendedCharacter;

	return {
		...rest,
		// Serializar campos de vuelta a JSON
		...(stats !== undefined && { stats: serializeObject(stats as Record<string, any>) }),
		...(relationships !== undefined && { relationships: serializeArray(relationships as any[]) }),
		...(goals !== undefined && { goals: serializeArray(goals as string[]) }),
		...(fears !== undefined && { fears: serializeArray(fears as string[]) }),
		...(beliefs !== undefined && { beliefs: serializeArray(beliefs as string[]) }),
		...(personality !== undefined && { personality: serializeArray(personality as string[]) }),
		...(skills !== undefined && { skills: serializeArray(skills as string[]) }),
		...(abilities !== undefined && { abilities: serializeArray(abilities as string[]) }),
		...(filters !== undefined && { filters: serializeArray(filters as any[]) }),
	};
}

/**
 * Transforma un personaje con datos de relaciones/conteos en una versión con estadísticas
 * @param character Personaje de la base de datos con _count
 * @returns Personaje extendido con estadísticas para UI
 */
export function toCharacterWithStats(character: PrismaCharacter & { _count?: { images?: number; concepts?: number; notes?: number; worldItems?: number } }) {
	return {
		...character,
		imageCount: character._count?.images || 0,
		conceptCount: character._count?.concepts || 0,
		noteCount: character._count?.notes || 0,
		worldItemCount: character._count?.worldItems || 0,
		parsedStats: parseCharacterStats(character.stats || '{}'),
	};
}
