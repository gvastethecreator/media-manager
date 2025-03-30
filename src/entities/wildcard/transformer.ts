/**
 * @file Transformer para la entidad Wildcard
 * @module entities/wildcard/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { CreateWildcardData, UpdateWildcardData, WildcardBase, WildcardFilters, WildcardSortCriteria, WildcardWithRelations } from '@/types/entities/wildcard/types';
import { mapCreateWildcardDataToPrisma, mapUpdateWildcardDataToPrisma, mapWildcardSearchOptionsToPrisma } from './mappers';
import { buildWildcardTree, calculateWildcardStats, deserializeWildcardChildren, extendWildcard, validateWildcard } from './serializers';

/**
 * Clase para transformar y gestionar comodines
 */
export class WildcardTransformer {
  /**
   * Busca múltiples comodines con opciones de filtrado y paginación
   */
  static async findMany(options: {
    take?: number;
    skip?: number;
    sortBy?: WildcardSortCriteria;
    filters?: WildcardFilters;
    include?: Record<string, boolean>;
    asTree?: boolean;
  }): Promise<{
    items: WildcardWithRelations[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const { take = 10, skip = 0, asTree = false } = options;

      // Mapear opciones de búsqueda a formato Prisma
      const prismaOptions = mapWildcardSearchOptionsToPrisma(options);

      // Ejecutar consulta para obtener comodines y contar total
      const [items, totalCount] = await Promise.all([
        prisma.wildcard.findMany(prismaOptions),
        prisma.wildcard.count({ where: prismaOptions.where })
      ]);

      // Extender comodines con campos deserializados
      let extendedItems = items.map(item => {
        const extendedItem = this.extend(item as WildcardBase);
        if (item.children) {
          extendedItem.childrenData = deserializeWildcardChildren(item.children);
        }
        return extendedItem;
      });

      // Construir árbol si se solicita
      if (asTree) {
        extendedItems = buildWildcardTree(extendedItems);
      }

      return {
        items: extendedItems,
        totalCount,
        hasMore: skip + take < totalCount
      };
    } catch (error) {
      logger.error('Error al buscar comodines:', error);
      throw error;
    }
  }

  /**
   * Busca un comodín por su ID
   */
  static async findById(
    id: string,
    include?: Record<string, boolean>
  ): Promise<WildcardWithRelations | null> {
    try {
      // Preparar opciones de inclusión para relaciones
      const includeOptions = {
        _count: true,
        ...(include?.parent && { parent: true }),
        ...(include?.childWildcards && { childWildcards: true }),
        ...(include?.images && { images: true }),
        ...(include?.videos && { videos: true }),
        ...(include?.albums && { albums: true }),
        ...(include?.collections && { collections: true }),
        ...(include?.tags && { tags: true }),
        ...(include?.characters && { characters: true }),
        ...(include?.places && { places: true }),
        ...(include?.worldItems && { worldItems: true }),
        ...(include?.concepts && { concepts: true }),
        ...(include?.prompts && { prompts: true }),
        ...(include?.notes && { notes: true }),
        ...(include?.properties && { properties: true }),
        ...(include?.groups && { groups: true })
      };

      // Buscar comodín con relaciones
      const wildcard = await prisma.wildcard.findUnique({
        where: { id },
        include: includeOptions
      });

      if (!wildcard) {
        return null;
      }

      // Extender comodín con campos deserializados
      const extendedWildcard = this.extend(wildcard as WildcardBase);

      // Deserializar los hijos
      if (wildcard.children) {
        extendedWildcard.childrenData = deserializeWildcardChildren(wildcard.children);
      }

      return extendedWildcard;
    } catch (error) {
      logger.error(`Error al buscar comodín con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca comodines por categoría
   */
  static async findByCategory(
    category: string,
    limit = 10
  ): Promise<WildcardWithRelations[]> {
    try {
      const wildcards = await prisma.wildcard.findMany({
        where: { category },
        take: limit,
        include: { _count: true }
      });

      return wildcards.map(wildcard => this.extend(wildcard as WildcardBase));
    } catch (error) {
      logger.error(`Error al buscar comodines por categoría ${category}:`, error);
      throw error;
    }
  }

  /**
   * Busca comodines favoritos
   */
  static async findFavorites(
    limit = 10
  ): Promise<WildcardWithRelations[]> {
    try {
      const wildcards = await prisma.wildcard.findMany({
        where: { isFavorite: true },
        take: limit,
        include: { _count: true }
      });

      return wildcards.map(wildcard => this.extend(wildcard as WildcardBase));
    } catch (error) {
      logger.error('Error al buscar comodines favoritos:', error);
      throw error;
    }
  }

  /**
   * Busca comodines hijo de un comodín específico
   */
  static async findChildren(
    parentId: string,
    limit = 100
  ): Promise<WildcardWithRelations[]> {
    try {
      const wildcards = await prisma.wildcard.findMany({
        where: { parentId },
        take: limit,
        include: { _count: true }
      });

      return wildcards.map(wildcard => this.extend(wildcard as WildcardBase));
    } catch (error) {
      logger.error(`Error al buscar comodines hijos de ${parentId}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo comodín
   */
  static async create(data: CreateWildcardData): Promise<WildcardWithRelations> {
    try {
      // Validar datos de entrada
      if (!data.name) {
        throw new Error('El nombre del comodín es requerido');
      }

      // Mapear datos al formato de Prisma
      const prismaData = mapCreateWildcardDataToPrisma(data);

      // Crear nuevo comodín
      const wildcard = await prisma.wildcard.create({
        data: prismaData,
        include: { _count: true }
      });

      // Extender comodín con campos deserializados
      return this.extend(wildcard as WildcardBase);
    } catch (error) {
      logger.error('Error al crear comodín:', error);
      throw error;
    }
  }

  /**
   * Actualiza un comodín existente
   */
  static async update(id: string, data: UpdateWildcardData): Promise<WildcardWithRelations> {
    try {
      // Verificar si el comodín existe
      const existingWildcard = await prisma.wildcard.findUnique({
        where: { id }
      });

      if (!existingWildcard) {
        throw new Error(`Comodín con ID ${id} no encontrado`);
      }

      // Validar que no se intente establecer un ciclo (un comodín no puede ser hijo de sí mismo)
      if (data.parentId === id) {
        throw new Error('Un comodín no puede ser hijo de sí mismo');
      }

      // Mapear datos al formato de Prisma
      const prismaData = mapUpdateWildcardDataToPrisma(data);

      // Actualizar comodín
      const updatedWildcard = await prisma.wildcard.update({
        where: { id },
        data: prismaData,
        include: { _count: true }
      });

      // Extender comodín con campos deserializados
      return this.extend(updatedWildcard as WildcardBase);
    } catch (error) {
      logger.error(`Error al actualizar comodín con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un comodín existente
   */
  static async delete(id: string): Promise<WildcardWithRelations> {
    try {
      // Verificar si el comodín existe
      const existingWildcard = await prisma.wildcard.findUnique({
        where: { id },
        include: { _count: true, childWildcards: true }
      });

      if (!existingWildcard) {
        throw new Error(`Comodín con ID ${id} no encontrado`);
      }

      // Actualizar los comodines hijos para quitar el parentId
      if (existingWildcard.childWildcards?.length) {
        await prisma.wildcard.updateMany({
          where: { parentId: id },
          data: { parentId: null }
        });
      }

      // Eliminar comodín
      const deletedWildcard = await prisma.wildcard.delete({
        where: { id },
        include: { _count: true }
      });

      // Extender comodín con campos deserializados
      return this.extend(deletedWildcard as WildcardBase);
    } catch (error) {
      logger.error(`Error al eliminar comodín con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de uso de un comodín
   */
  static async getStats(id: string): Promise<{
    usageCount: number;
    relatedEntitiesCount: number;
  }> {
    try {
      const wildcard = await prisma.wildcard.findUnique({
        where: { id },
        include: { _count: true }
      });

      if (!wildcard) {
        throw new Error(`Comodín con ID ${id} no encontrado`);
      }

      return calculateWildcardStats(wildcard as WildcardWithRelations);
    } catch (error) {
      logger.error(`Error al obtener estadísticas de comodín con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Conecta un comodín con otra entidad
   */
  static async connectEntity(
    wildcardId: string,
    entityType: 'image' | 'video' | 'album' | 'collection' | 'tag' | 'character' | 'place' | 'worldItem' | 'concept' | 'prompt' | 'note' | 'property' | 'group',
    entityId: string
  ): Promise<boolean> {
    try {
      // Verificar si el comodín existe
      const wildcard = await prisma.wildcard.findUnique({
        where: { id: wildcardId }
      });

      if (!wildcard) {
        throw new Error(`Comodín con ID ${wildcardId} no encontrado`);
      }

      // Crear objeto de conexión basado en el tipo de entidad
      const connectionData: any = {};

      switch (entityType) {
        case 'image':
          connectionData.images = { connect: { id: entityId } };
          break;
        case 'video':
          connectionData.videos = { connect: { id: entityId } };
          break;
        case 'album':
          connectionData.albums = { connect: { id: entityId } };
          break;
        case 'collection':
          connectionData.collections = { connect: { id: entityId } };
          break;
        case 'tag':
          connectionData.tags = { connect: { id: entityId } };
          break;
        case 'character':
          connectionData.characters = { connect: { id: entityId } };
          break;
        case 'place':
          connectionData.places = { connect: { id: entityId } };
          break;
        case 'worldItem':
          connectionData.worldItems = { connect: { id: entityId } };
          break;
        case 'concept':
          connectionData.concepts = { connect: { id: entityId } };
          break;
        case 'prompt':
          connectionData.prompts = { connect: { id: entityId } };
          break;
        case 'note':
          connectionData.notes = { connect: { id: entityId } };
          break;
        case 'property':
          connectionData.properties = { connect: { id: entityId } };
          break;
        case 'group':
          connectionData.groups = { connect: { id: entityId } };
          break;
        default:
          throw new Error(`Tipo de entidad no soportado: ${entityType}`);
      }

      // Actualizar el comodín con la nueva conexión
      await prisma.wildcard.update({
        where: { id: wildcardId },
        data: connectionData
      });

      return true;
    } catch (error) {
      logger.error(`Error al conectar comodín ${wildcardId} con ${entityType} ${entityId}:`, error);
      return false;
    }
  }

  /**
   * Desconecta un comodín de otra entidad
   */
  static async disconnectEntity(
    wildcardId: string,
    entityType: 'image' | 'video' | 'album' | 'collection' | 'tag' | 'character' | 'place' | 'worldItem' | 'concept' | 'prompt' | 'note' | 'property' | 'group',
    entityId: string
  ): Promise<boolean> {
    try {
      // Verificar si el comodín existe
      const wildcard = await prisma.wildcard.findUnique({
        where: { id: wildcardId }
      });

      if (!wildcard) {
        throw new Error(`Comodín con ID ${wildcardId} no encontrado`);
      }

      // Crear objeto de desconexión basado en el tipo de entidad
      const disconnectionData: any = {};

      switch (entityType) {
        case 'image':
          disconnectionData.images = { disconnect: { id: entityId } };
          break;
        case 'video':
          disconnectionData.videos = { disconnect: { id: entityId } };
          break;
        case 'album':
          disconnectionData.albums = { disconnect: { id: entityId } };
          break;
        case 'collection':
          disconnectionData.collections = { disconnect: { id: entityId } };
          break;
        case 'tag':
          disconnectionData.tags = { disconnect: { id: entityId } };
          break;
        case 'character':
          disconnectionData.characters = { disconnect: { id: entityId } };
          break;
        case 'place':
          disconnectionData.places = { disconnect: { id: entityId } };
          break;
        case 'worldItem':
          disconnectionData.worldItems = { disconnect: { id: entityId } };
          break;
        case 'concept':
          disconnectionData.concepts = { disconnect: { id: entityId } };
          break;
        case 'prompt':
          disconnectionData.prompts = { disconnect: { id: entityId } };
          break;
        case 'note':
          disconnectionData.notes = { disconnect: { id: entityId } };
          break;
        case 'property':
          disconnectionData.properties = { disconnect: { id: entityId } };
          break;
        case 'group':
          disconnectionData.groups = { disconnect: { id: entityId } };
          break;
        default:
          throw new Error(`Tipo de entidad no soportado: ${entityType}`);
      }

      // Actualizar el comodín con la desconexión
      await prisma.wildcard.update({
        where: { id: wildcardId },
        data: disconnectionData
      });

      return true;
    } catch (error) {
      logger.error(`Error al desconectar comodín ${wildcardId} de ${entityType} ${entityId}:`, error);
      return false;
    }
  }

  /**
   * Extiende un comodín con campos deserializados adicionales
   */
  static extend(wildcard: WildcardBase): WildcardWithRelations {
    return extendWildcard(wildcard);
  }

  /**
   * Valida un comodín
   */
  static validate(wildcard: WildcardBase): boolean {
    return validateWildcard(wildcard);
  }
}

// Exportación de funciones individuales para uso directo
export const findManyWildcards = WildcardTransformer.findMany.bind(WildcardTransformer);
export const findWildcardById = WildcardTransformer.findById.bind(WildcardTransformer);
export const findWildcardsByCategory = WildcardTransformer.findByCategory.bind(WildcardTransformer);
export const findFavoriteWildcards = WildcardTransformer.findFavorites.bind(WildcardTransformer);
export const findWildcardChildren = WildcardTransformer.findChildren.bind(WildcardTransformer);
export const createWildcard = WildcardTransformer.create.bind(WildcardTransformer);
export const updateWildcard = WildcardTransformer.update.bind(WildcardTransformer);
export const deleteWildcard = WildcardTransformer.delete.bind(WildcardTransformer);
export const getWildcardStats = WildcardTransformer.getStats.bind(WildcardTransformer);
export const connectWildcardEntity = WildcardTransformer.connectEntity.bind(WildcardTransformer);
export const disconnectWildcardEntity = WildcardTransformer.disconnectEntity.bind(WildcardTransformer);
export const extendWildcardTransform = WildcardTransformer.extend.bind(WildcardTransformer);
export const validateWildcardData = WildcardTransformer.validate.bind(WildcardTransformer);