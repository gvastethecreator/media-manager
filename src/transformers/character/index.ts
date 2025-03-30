/**
 * @file Punto de entrada para exportar todas las funciones de transformación de Character
 * @module transformers/character
 */

import { Logger } from '@/lib/logger';
import {
    CharacterComplete,
    CharacterCreateInput,
    CharacterSearchOptions,
    CharacterSearchResult,
    CharacterUpdateInput,
} from '@/types/entities/character/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import { PrismaClient } from '@prisma/client';
import {
    mapCharacterSearchOptionsToPrisma,
    mapCharacterToRelatedCharacter,
    mapCreateCharacterDataToPrisma,
    mapUpdateCharacterDataToPrisma,
} from './mappers';
import {
    extendCharacter,
    fromPrismaCharacter,
    parseCharacterFilters,
    toPrismaCharacter,
    validateCharacter,
} from './serializers';

const logger = new Logger('CharacterTransformer');
const prisma = new PrismaClient();

/**
 * 🎭 Transformer para entidades Character
 */
export class CharacterTransformer {
  /**
   * 🔍 Busca personajes según los criterios especificados
   */
  static async search(options: CharacterSearchOptions): Promise<CharacterSearchResult> {
    try {
      const prismaOptions = mapCharacterSearchOptionsToPrisma(options);
      const [items, total] = await Promise.all([
        prisma.character.findMany(prismaOptions),
        prisma.character.count({ where: prismaOptions.where }),
      ]);

      const characters = items.map(item => fromPrismaCharacter(item));
      const validatedCharacters = characters.map(char => validateCharacter(char));

      return {
        items: validatedCharacters,
        total,
        page: options.page || 1,
        pageSize: prismaOptions.take || 10,
      };
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔍 Obtiene un personaje por su ID
   */
  static async getById(id: string): Promise<CharacterComplete | null> {
    try {
      const character = await prisma.character.findUnique({
        where: { id },
        include: {
          party: true,
          campaign: true,
          images: true,
          items: true,
          abilities: true,
          quests: true,
          locations: true,
          npcs: true,
          notes: true,
          relatedCharacters: true,
          relatedTo: true,
          _count: true,
        },
      });

      if (!character) {
        return null;
      }

      const mapped = fromPrismaCharacter(character);
      return validateCharacter(mapped);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * ➕ Crea un nuevo personaje
   */
  static async create(data: CharacterCreateInput): Promise<CharacterComplete> {
    try {
      const prismaData = mapCreateCharacterDataToPrisma(data);
      const character = await prisma.character.create({
        data: prismaData,
        include: {
          party: true,
          campaign: true,
          images: true,
          items: true,
          abilities: true,
          quests: true,
          locations: true,
          npcs: true,
          notes: true,
          relatedCharacters: true,
          relatedTo: true,
          _count: true,
        },
      });

      const mapped = fromPrismaCharacter(character);
      return validateCharacter(mapped);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 📝 Actualiza un personaje existente
   */
  static async update(id: string, data: CharacterUpdateInput): Promise<CharacterComplete> {
    try {
      const prismaData = mapUpdateCharacterDataToPrisma(data);
      const character = await prisma.character.update({
        where: { id },
        data: prismaData,
        include: {
          party: true,
          campaign: true,
          images: true,
          items: true,
          abilities: true,
          quests: true,
          locations: true,
          npcs: true,
          notes: true,
          relatedCharacters: true,
          relatedTo: true,
          _count: true,
        },
      });

      const mapped = fromPrismaCharacter(character);
      return validateCharacter(mapped);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🗑️ Elimina un personaje
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.character.delete({
        where: { id },
      });
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔄 Convierte un personaje a su versión relacionada
   */
  static toRelated(character: CharacterComplete): { id: string } {
    try {
      return mapCharacterToRelatedCharacter(character);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }

  /**
   * 🔍 Parsea filtros de personaje
   */
  static parseFilters(filters: unknown): Record<string, unknown> {
    try {
      return parseCharacterFilters(filters);
    } catch (error) {
      throw handleTransformerError(error);
    }
  }
}

// Exportar funciones individuales para uso directo
export {
    extendCharacter, fromPrismaCharacter, mapCharacterSearchOptionsToPrisma,
    mapCharacterToRelatedCharacter, mapCreateCharacterDataToPrisma,
    mapUpdateCharacterDataToPrisma, parseCharacterFilters, toPrismaCharacter, validateCharacter
};

// Re-exportar todas las funciones de serializers
    export {
        parseCharacterFilters,
        parseCharacterRelationships,
        parseCharacterStats,
        parseStringArray,
        serializeArray,
        serializeFilters,
        serializeRelationships,
        serializeStats,
        toCharacterSummary,
        toCharacterWithStats,
        toExtendedCharacter,
        toPrismaCharacter
    } from './serializers';

// Re-exportar todas las funciones de mappers
export * from './mappers';

// Exportar funciones adicionales y valores por defecto si es necesario
export const DEFAULT_CHARACTER_COLOR = '#3b82f6';
export const DEFAULT_CHARACTER_EMOJI = '👤';
