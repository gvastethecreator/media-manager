/**
 * @file Funciones de serialización/deserialización para la entidad Character
 * @module transformers/character/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
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
import type { Prisma, Character as PrismaCharacter } from '@prisma/client';

const logger = serverLogger.withContext('CharacterSerializer');

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

	// Construir campos faltantes con valores por defecto
	const defaultCharacterFields = {
		id: character.id || '',
		name: character.name || '',
		level: character.level || 1,
		class: character.class || 'unknown',
		race: character.race || 'unknown',
		alignment: character.alignment || 'neutral',
		description: character.description || '',
		sortBy: character.sortBy || 'name',
		createdAt: character.createdAt || new Date(),
		updatedAt: character.updatedAt || new Date(),
	};

	// Manejar la conversión de isFavorite/favorite
	let isFavorite = false;
	if ('favorite' in character) {
		isFavorite = Boolean(character.favorite);
	} else if ('isFavorite' in character) {
		isFavorite = Boolean(character.isFavorite);
	}

	// Componemos objeto final con tipado correcto
	const extended: any = {
		...defaultCharacterFields,
		stats: character.stats || '{}',
		relationships: character.relationships || '[]',
		goals: character.goals || '[]',
		fears: character.fears || '[]',
		beliefs: character.beliefs || '[]',
		personality: character.personality || '[]',
		filters: character.filters || '[]',
		parsedFilters,
		parsedStats,
		parsedRelationships,
		parsedGoals,
		parsedFears,
		parsedBeliefs,
		parsedPersonality,
		isSelected: false,
		imageCount: 0,
		isFavorite,
		skills: {} as Record<string, number>,
		abilities: [] as string[],
	};

	return extended as CharacterExtended;
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
		emoji: 'emoji' in character ? character.emoji : '👤',
		color: 'color' in character ? character.color : '#3b82f6',
		class: character.class || 'unknown',
		race: character.race || 'unknown',
		level: character.level || 1,
		imageCount: imageCount || 0,
	};
}

/**
 * 🔄 Serializa un Character para Prisma
 */
export function toPrismaCharacter(data: CharacterCreateInput | CharacterUpdateInput): Prisma.CharacterCreateInput | Prisma.CharacterUpdateInput {
  try {
    // Validar campos requeridos para creación
    if (!('id' in data)) {
      validateRequiredFields(data as Record<string, unknown>, ['name', 'level', 'class', 'race', 'alignment', 'background']);
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

    // Crear un objeto nuevo sin la propiedad isFavorite
    const { isFavorite, ...fieldsWithoutIsFavorite } = data as any;

    // Construir objeto resultado con los campos serializados
    const result: Record<string, any> = {
      ...fieldsWithoutIsFavorite,
      stats,
      skills,
      inventory,
      spells,
      feats,
      metadata,
    };

    // Agregar favorite si isFavorite estaba presente
    if (isFavorite !== undefined) {
      result.favorite = isFavorite;
    }

    // Preparar relaciones para Prisma
    const relations = preparePrismaRelations('Character', data as Record<string, unknown>);
    Object.assign(result, relations);

    return result as Prisma.CharacterCreateInput | Prisma.CharacterUpdateInput;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Deserializa un Character desde Prisma
 */
export function fromPrismaCharacter(prismaCharacter: any): CharacterComplete {
  try {
    // Deserializar campos JSON
    const stats = deserializeJsonField(prismaCharacter.stats, {});
    const skills = deserializeJsonField(prismaCharacter.skills, {});
    const inventory = deserializeJsonField(prismaCharacter.inventory || '[]', []);
    const spells = deserializeJsonField(prismaCharacter.spells || '[]', []);
    const feats = deserializeJsonField(prismaCharacter.feats || '[]', []);
    const metadata = deserializeJsonField(prismaCharacter.metadata || '{}', {});

    // Obtener conteos de relaciones
    const counts = getRelationCounts('Character', prismaCharacter);

    // Asegurar que los conteos tienen la estructura esperada
    const characterCounts = {
      images: counts.images || 0,
      items: counts.items || 0,
      abilities: counts.abilities || 0,
      quests: counts.quests || 0,
      locations: counts.locations || 0,
      npcs: counts.npcs || 0,
      notes: counts.notes || 0,
      relatedCharacters: counts.relatedCharacters || 0,
      relatedTo: counts.relatedTo || 0
    };

    // Construir objeto base
    const baseCharacter = {
      id: prismaCharacter.id,
      name: prismaCharacter.name,
      description: prismaCharacter.description || '',
      level: prismaCharacter.level,
      experience: prismaCharacter.experience || 0,
      class: prismaCharacter.class,
      race: prismaCharacter.race,
      alignment: prismaCharacter.alignment,
      background: prismaCharacter.background || '',
      stats,
      skills,
      inventory,
      spells,
      feats,
      notes: prismaCharacter.notes || '',
      isActive: prismaCharacter.isActive ?? true,
      isFavorite: prismaCharacter.favorite ?? false, // Corrigiendo el campo de favorite a isFavorite
      metadata,
      createdAt: prismaCharacter.createdAt,
      updatedAt: prismaCharacter.updatedAt,
    };

    // Agregar relaciones si están disponibles
    const characterWithRelations = {
      ...baseCharacter,
      // Manejar relaciones, transformando a los formatos esperados
      party: prismaCharacter.party ? { id: prismaCharacter.party.id } : undefined,
      campaign: prismaCharacter.campaign ? { id: prismaCharacter.campaign.id } : undefined,
      images: (prismaCharacter.images && Array.isArray(prismaCharacter.images))
        ? prismaCharacter.images.map((img: any) => ({ id: img.id }))
        : [],
      items: (prismaCharacter.items && Array.isArray(prismaCharacter.items))
        ? prismaCharacter.items.map((item: any) => ({ id: item.id }))
        : [],
      abilities: (prismaCharacter.abilities && Array.isArray(prismaCharacter.abilities))
        ? prismaCharacter.abilities.map((ability: any) => ({ id: ability.id }))
        : [],
      quests: (prismaCharacter.quests && Array.isArray(prismaCharacter.quests))
        ? prismaCharacter.quests.map((quest: any) => ({ id: quest.id }))
        : [],
      locations: (prismaCharacter.locations && Array.isArray(prismaCharacter.locations))
        ? prismaCharacter.locations.map((location: any) => ({ id: location.id }))
        : [],
      npcs: (prismaCharacter.npcs && Array.isArray(prismaCharacter.npcs))
        ? prismaCharacter.npcs.map((npc: any) => ({ id: npc.id }))
        : [],
      notes: (prismaCharacter.notes && Array.isArray(prismaCharacter.notes))
        ? prismaCharacter.notes.map((note: any) => ({ id: note.id }))
        : [],
      relatedCharacters: (prismaCharacter.relatedCharacters && Array.isArray(prismaCharacter.relatedCharacters))
        ? prismaCharacter.relatedCharacters.map((char: any) => ({ id: char.id }))
        : [],
      relatedTo: (prismaCharacter.relatedTo && Array.isArray(prismaCharacter.relatedTo))
        ? prismaCharacter.relatedTo.map((char: any) => ({ id: char.id }))
        : [],
      _count: characterCounts,
    };

    return characterWithRelations as CharacterComplete;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Valida un Character contra el schema y las reglas de negocio
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
 * Extiende un Character con datos adicionales como relaciones completas o UI
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

    return extended;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Parsea filtros de personaje desde un objeto JSON
 * @param filters Objeto con los filtros a aplicar
 * @returns Objeto con filtros transformados para Prisma
 */
export function parseCharacterFilterObject(filters: unknown): Record<string, unknown> {
  try {
    if (!filters || typeof filters !== 'object') {
      return {};
    }

    const typedFilters = filters as Record<string, any>;
    const parsed: Record<string, any> = {};

    // Filtro de búsqueda
    if (typedFilters.search) {
      parsed.search = typedFilters.search;
    }

    // Filtros básicos por propiedad
    if (typedFilters.class) {
      parsed.class = typedFilters.class;
    }
    if (typedFilters.race) {
      parsed.race = typedFilters.race;
    }
    if (typedFilters.alignment) {
      parsed.alignment = typedFilters.alignment;
    }

    return parsed;
  } catch (error) {
    logger.error('Error parseando filtros de personaje:', error);
    return {};
  }
}

/**
 * 🔍 Parsea filtros de Character desde un string JSON
 * @param filtersStr String JSON con filtros
 * @returns Array de filtros de Character
 */
export function parseCharacterFilters(filtersStr: string): CharacterFilter[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (filtersStr === 'empty_array') {
			return [];
		}

		// Parsear el string JSON a un array
		const parsedFilters = JSON.parse(filtersStr);

		// Validar que sea un array
		if (!Array.isArray(parsedFilters)) {
			return [];
		}

		// Retornar los filtros parseados
		return parsedFilters as CharacterFilter[];
	} catch (error) {
		logger.error('Error parseando filtros:', error);
		return [];
	}
}

/**
 * Parsea stats de Character desde un string JSON
 * @param statsStr String JSON con estadísticas
 * @returns Objeto con estadísticas
 */
export function parseCharacterStats(statsStr: string): CharacterStats {
	try {
		// Si no hay stats, retornar un objeto vacío
		if (!statsStr || statsStr === '{}') {
			return {};
		}

		// Parsear el string JSON a un objeto
		const parsedStats = JSON.parse(statsStr);

		// Validar que sea un objeto
		if (typeof parsedStats !== 'object' || Array.isArray(parsedStats)) {
			return {};
		}

		// Retornar las estadísticas parseadas
		return parsedStats as CharacterStats;
	} catch (error) {
		logger.error('Error parseando estadísticas:', error);
		return {};
	}
}

/**
 * Parsea relaciones de Character desde un string JSON
 * @param relationshipsStr String JSON con relaciones
 * @returns Array de relaciones
 */
export function parseCharacterRelationships(relationshipsStr: string): CharacterRelationship[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (relationshipsStr === 'empty_array') {
			return [];
		}

		// Parsear el string JSON a un array
		const parsedRelationships = JSON.parse(relationshipsStr);

		// Validar que sea un array
		if (!Array.isArray(parsedRelationships)) {
			return [];
		}

		// Retornar las relaciones parseadas
		return parsedRelationships as CharacterRelationship[];
	} catch (error) {
		logger.error('Error parseando relaciones:', error);
		return [];
	}
}

/**
 * Parsea un array de strings desde un string JSON
 * @param str String JSON con array
 * @returns Array de strings
 */
export function parseStringArray(str: string): string[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (!str || str === 'empty_array') {
			return [];
		}

		// Parsear el string JSON a un array
		const parsedArray = JSON.parse(str);

		// Validar que sea un array
		if (!Array.isArray(parsedArray)) {
			return [];
		}

		// Retornar el array parseado
		return parsedArray as string[];
	} catch (error) {
		logger.error('Error parseando array:', error);
		return [];
	}
}

/**
 * Serializa un array de tags a formato JSON
 * @param tags Array de tags
 * @returns String JSON con los tags
 */
export function serializeTags(tags: string[]): string {
	try {
		return tags && tags.length > 0 ? JSON.stringify(tags) : 'empty_array';
	} catch (error) {
		logger.error('Error serializando tags:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa tags desde un string JSON
 * @param tags String JSON con tags
 * @returns Array de strings con los tags
 */
export function deserializeTags(tags: string): string[] {
	try {
		return parseStringArray(tags);
	} catch (error) {
		logger.error('Error deserializando tags:', error);
		return [];
	}
}

/**
 * Serializa relaciones a formato JSON
 * @param relationships Array de relaciones o string JSON
 * @returns String JSON con las relaciones
 */
export function serializeRelationships(relationships: any[] | string): string {
	try {
		if (typeof relationships === 'string') {
			return relationships;
		}
		return relationships && Array.isArray(relationships) && relationships.length > 0
			? JSON.stringify(relationships)
			: 'empty_array';
	} catch (error) {
		logger.error('Error serializando relaciones:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa relaciones desde un string JSON
 * @param relationships String JSON con relaciones
 * @returns Array de relaciones
 */
export function deserializeRelationships(relationships: string): any[] {
	try {
		return parseCharacterRelationships(relationships);
	} catch (error) {
		logger.error('Error deserializando relaciones:', error);
		return [];
	}
}

/**
 * Serializa estadísticas a formato JSON
 * @param stats Objeto de estadísticas o string JSON
 * @returns String JSON con las estadísticas
 */
export function serializeStats(stats: Record<string, any> | string): string {
	try {
		if (typeof stats === 'string') {
			return stats;
		}
		return stats && typeof stats === 'object' ? JSON.stringify(stats) : '{}';
	} catch (error) {
		logger.error('Error serializando estadísticas:', error);
		return '{}';
	}
}

/**
 * Deserializa estadísticas desde un string JSON
 * @param stats String JSON con estadísticas
 * @returns Objeto con estadísticas
 */
export function deserializeStats(stats: string): Record<string, any> {
	try {
		return parseCharacterStats(stats);
	} catch (error) {
		logger.error('Error deserializando estadísticas:', error);
		return {};
	}
}

/**
 * Serializa un array a formato JSON
 * @param jsonString Array o string JSON
 * @returns String JSON serializado
 */
export function serializeJsonArray(array: string[] | string): string {
	try {
		if (typeof array === 'string') {
			return array;
		}
		return array && Array.isArray(array) && array.length > 0 ? JSON.stringify(array) : 'empty_array';
	} catch (error) {
		logger.error('Error serializando array:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa un array desde un string JSON
 * @param jsonString String JSON con array
 * @returns Array deserializado
 */
export function deserializeArray(jsonString: string): string[] {
	try {
		return parseStringArray(jsonString);
	} catch (error) {
		logger.error('Error deserializando array:', error);
		return [];
	}
}

/**
 * Serializa filtros a formato JSON
 * @param filters Objeto con filtros o string JSON
 * @returns String JSON con los filtros
 */
export function serializeFilters(filters: Record<string, any> | string): string {
	try {
		if (typeof filters === 'string') {
			return filters;
		}
		return filters && typeof filters === 'object' ? JSON.stringify(filters) : 'empty_array';
	} catch (error) {
		logger.error('Error serializando filtros:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa filtros desde un string JSON
 * @param filters String JSON con filtros
 * @returns Objeto con filtros
 */
export function deserializeFilters(filters: string): Record<string, any> {
	try {
		// Si es "empty_array", retornar un array vacío
		if (filters === 'empty_array') {
			return {};
		}

		// Parsear el string JSON
		const parsedFilters = JSON.parse(filters);

		// Validar que sea un objeto
		if (typeof parsedFilters !== 'object' || Array.isArray(parsedFilters)) {
			return {};
		}

		// Retornar los filtros parseados
		return parsedFilters;
	} catch (error) {
		logger.error('Error deserializando filtros:', error);
		return {};
	}
}

/**
 * Serializa un objeto a formato JSON
 * @param obj Objeto o string JSON
 * @returns String JSON serializado
 */
export function serializeObject(obj: Record<string, any> | string | null | undefined): string {
	try {
		if (obj === null || obj === undefined) {
			return '{}';
		}

		if (typeof obj === 'string') {
			// Si ya es un string, verificar si es un objeto JSON válido
			try {
				const parsed = JSON.parse(obj);
				if (typeof parsed === 'object' && !Array.isArray(parsed)) {
					return obj; // Ya es un string JSON válido
				}
				return '{}'; // No es un objeto
			} catch {
				return '{}'; // No se pudo parsear, no es un JSON válido
			}
		}

		// Serializar el objeto
		return obj && typeof obj === 'object' && !Array.isArray(obj) ? JSON.stringify(obj) : '{}';
	} catch (error) {
		logger.error('Error serializando objeto:', error);
		return '{}';
	}
}

/**
 * Serializa un array a formato JSON
 * @param arr Array o string JSON
 * @returns String JSON serializado
 */
export function serializeArray(arr: any[] | string | null | undefined): string {
	try {
		if (arr === null || arr === undefined) {
			return 'empty_array';
		}

		if (typeof arr === 'string') {
			// Si ya es un string, verificar si es un array JSON válido
			try {
				const parsed = JSON.parse(arr);
				if (Array.isArray(parsed)) {
					return arr; // Ya es un string JSON válido
				}
				return 'empty_array'; // No es un array
			} catch {
				return 'empty_array'; // No se pudo parsear, no es un JSON válido
			}
		}

		// Serializar el array
		return arr && Array.isArray(arr) && arr.length > 0 ? JSON.stringify(arr) : 'empty_array';
	} catch (error) {
		logger.error('Error serializando array:', error);
		return 'empty_array';
	}
}

/**
 * 🔄 Convierte un CharacterExtended a su formato para Prisma
 * Invierte la operación de toExtendedCharacter
 * @param extendedCharacter Objeto CharacterExtended a convertir
 * @returns Objeto parcial CharacterBase para Prisma
 */
export function fromExtendedCharacter(extendedCharacter: Partial<CharacterExtended>): Partial<CharacterBase> {
	// Extraer propiedades principales
	const {
		parsedFilters,
		parsedStats,
		parsedRelationships,
		parsedGoals,
		parsedFears,
		parsedBeliefs,
		parsedPersonality,
		isSelected,
		imageCount,
		// Ignorar todas las propiedades UI
		...rest
	} = extendedCharacter;

	// Inicializar resultado con los campos restantes
	const result: Record<string, any> = { ...rest };

	// Manejar la conversión de isFavorite a favorite
	if ('isFavorite' in extendedCharacter) {
		result.favorite = extendedCharacter.isFavorite;

		// En lugar de usar delete, no incluimos isFavorite en el objeto final
		const { isFavorite: _, ...withoutIsFavorite } = result;
		Object.assign(result, withoutIsFavorite);
	}

	// Agregamos de vuelta los campos JSON serializados
	const serializedFields: Record<string, string> = {};

	if (parsedStats) {
		serializedFields.stats = serializeObject(parsedStats);
	}

	if (parsedFilters) {
		serializedFields.filters = serializeObject(parsedFilters);
	}

	if (parsedRelationships) {
		serializedFields.relationships = serializeArray(parsedRelationships);
	}

	if (parsedGoals) {
		serializedFields.goals = serializeArray(parsedGoals);
	}

	if (parsedFears) {
		serializedFields.fears = serializeArray(parsedFears);
	}

	if (parsedBeliefs) {
		serializedFields.beliefs = serializeArray(parsedBeliefs);
	}

	if (parsedPersonality) {
		serializedFields.personality = serializeArray(parsedPersonality);
	}

	return {
		...result,
		...serializedFields
	} as Partial<CharacterBase>;
}

/**
 * @deprecated Use fromPrismaCharacter instead
 */
export function toCharacterWithStats(character: PrismaCharacter & { _count?: { images?: number; concepts?: number; notes?: number; worldItems?: number } }) {
  const extended = toExtendedCharacter(character);

  // Add stats counts
  const stats = {
    ...extended.parsedStats,
    imageCount: character._count?.images || 0,
    conceptCount: character._count?.concepts || 0,
    noteCount: character._count?.notes || 0,
    worldItemCount: character._count?.worldItems || 0
  };

  return {
    ...extended,
    parsedStats: stats
  };
}
