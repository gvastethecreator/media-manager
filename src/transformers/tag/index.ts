/**
 * @file Exportaciones principales de transformers para la entidad Tag
 * @module transformers/tag
 */

import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type {
    TagComplete,
    TagCreateInput,
    TagSearchOptions,
    TagSearchResult,
    TagUpdateInput,
} from '@/types/entities/tag/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import { mapTagSearchOptionsToPrisma } from './mappers';
import { validateTag } from './serializers';
import { transformTag as transformTagMain } from './transformer';

// Re-exportar todo desde los módulos principales
export * from './mappers';
export * from './serializers';
export * from './transformer';

const logger = new Logger('TagTransformer');

// Re-exportar el transformador principal con el nombre deseado
export { transformTagMain as transformTag };

/**
 * 🔍 Busca tags según los criterios especificados
 */
export async function searchTags(options: TagSearchOptions): Promise<TagSearchResult> {
  try {
    // Mapear opciones de búsqueda a formato Prisma
    const prismaOptions = mapTagSearchOptionsToPrisma(options);

    // Realizar búsqueda
    const [items, total] = await Promise.all([
      prisma.tag.findMany(prismaOptions),
      prisma.tag.count({ where: prismaOptions.where }),
    ]);

    // Deserializar resultados
    const tags = items.map(item => transformTagMain(item));

    return {
      items: tags,
      total,
      hasMore: total > (options.skip || 0) + items.length,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Obtiene un tag por su ID
 */
export async function getTagById(id: string): Promise<TagComplete | null> {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        images: true,
        videos: true,
        albums: true,
        collections: true,
        characters: true,
        places: true,
        worldItems: true,
        concepts: true,
        prompts: true,
        notes: true,
        wildcards: true,
        properties: true,
        groups: true,
        _count: true,
      },
    });

    if (!tag) {
      return null;
    }

    return transformTagMain(tag);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * ✨ Crea un nuevo tag
 */
export async function createTag(data: TagCreateInput): Promise<TagComplete> {
  try {
    // Validar datos de entrada
    await validateTag(data);

    // Mapear datos a formato Prisma
    const createData = mapCreateTagDataToPrisma(data);

    // Crear tag
    const tag = await prisma.tag.create({
      data: createData,
      include: {
        images: true,
        videos: true,
        albums: true,
        collections: true,
        characters: true,
        places: true,
        worldItems: true,
        concepts: true,
        prompts: true,
        notes: true,
        wildcards: true,
        properties: true,
        groups: true,
        _count: true,
      },
    });

    return transformTagMain(tag);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 📝 Actualiza un tag existente
 */
export async function updateTag(id: string, data: TagUpdateInput): Promise<TagComplete> {
  try {
    // Validar datos de entrada
    await validateTag(data);

    // Mapear datos a formato Prisma
    const updateData = mapUpdateTagDataToPrisma(data);

    // Actualizar tag
    const tag = await prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        images: true,
        videos: true,
        albums: true,
        collections: true,
        characters: true,
        places: true,
        worldItems: true,
        concepts: true,
        prompts: true,
        notes: true,
        wildcards: true,
        properties: true,
        groups: true,
        _count: true,
      },
    });

    return transformTagMain(tag);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🗑️ Elimina un tag
 */
export async function deleteTag(id: string): Promise<void> {
  try {
    await prisma.tag.delete({
      where: { id },
    });
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Convierte un tag a su versión relacionada
 */
export function toRelatedTag(tag: TagComplete) {
  try {
    return mapTagToRelatedTag(tag);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

// Exportar otros mappers
export {
    mapCreateTagDataToPrisma, mapTagFiltersToPrisma, mapTagToRelatedTag, mapUpdateTagDataToPrisma, transformCompleteTagToPrisma,
    transformTagToPrisma
} from './mappers';

// Re-exportar funciones específicas de v2
export {
    mapCompleteToTag,
    mapTagToComplete,
    tagToDisplayObject
} from './v2/converters';

