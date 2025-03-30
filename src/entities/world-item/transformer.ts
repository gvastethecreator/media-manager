/**
 * @file Transformer para la entidad WorldItem
 * @module entities/world-item/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { WorldItemBase } from '@/types/entities/world-item/base';
import { CreateWorldItemData, UpdateWorldItemData, WorldItemFilters, WorldItemWithRelations, WorldItemWithStats } from '@/types/entities/world-item/types';
import { mapCreateWorldItemDataToPrisma, mapUpdateWorldItemDataToPrisma, mapWorldItemSearchOptionsToPrisma } from './mappers';
import { extendWorldItem, extendWorldItemWithStats, validateWorldItem } from './serializers';

/**
 * Transformer para la entidad WorldItem
 */
export class WorldItemTransformer {
  /**
   * Busca múltiples objetos del mundo con opciones de filtrado y paginación
   */
  static async findMany(options: {
    take?: number;
    skip?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    filters?: WorldItemFilters;
    include?: Record<string, boolean>;
  } = {}): Promise<{ items: WorldItemWithRelations[]; total: number; hasMore: boolean }> {
    try {
      const prismaOptions = mapWorldItemSearchOptionsToPrisma(options);
      const [items, total] = await Promise.all([
        prisma.worldItem.findMany(prismaOptions),
        prisma.worldItem.count({ where: prismaOptions.where })
      ]);

      const extendedItems = items.map(item => extendWorldItem(item as WorldItemBase));
      const hasMore = (options.skip || 0) + items.length < total;

      return { items: extendedItems, total, hasMore };
    } catch (error) {
      logger.error('Error buscando objetos del mundo:', error);
      throw error;
    }
  }

  /**
   * Busca un objeto del mundo por su ID
   */
  static async findById(id: string, include?: Record<string, boolean>): Promise<WorldItemWithRelations | null> {
    try {
      const worldItem = await prisma.worldItem.findUnique({
        where: { id },
        include: {
          _count: true,
          ...(include?.images && { images: true }),
          ...(include?.videos && { videos: true }),
          ...(include?.albums && { albums: true }),
          ...(include?.collections && { collections: true }),
          ...(include?.tags && { tags: true }),
          ...(include?.characters && { characters: true }),
          ...(include?.places && { places: true }),
          ...(include?.concepts && { concepts: true }),
          ...(include?.prompts && { prompts: true }),
          ...(include?.notes && { notes: true }),
          ...(include?.wildcards && { wildcards: true }),
          ...(include?.properties && { properties: true }),
          ...(include?.groups && { groups: true })
        }
      });

      return worldItem ? extendWorldItem(worldItem as WorldItemBase) : null;
    } catch (error) {
      logger.error(`Error buscando objeto del mundo con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo objeto del mundo
   */
  static async create(data: CreateWorldItemData): Promise<WorldItemWithRelations> {
    try {
      const prismaData = mapCreateWorldItemDataToPrisma(data);
      const worldItem = await prisma.worldItem.create({
        data: prismaData,
        include: { _count: true }
      });

      return extendWorldItem(worldItem as WorldItemBase);
    } catch (error) {
      logger.error('Error creando objeto del mundo:', error);
      throw error;
    }
  }

  /**
   * Actualiza un objeto del mundo existente
   */
  static async update(id: string, data: UpdateWorldItemData): Promise<WorldItemWithRelations> {
    try {
      const prismaData = mapUpdateWorldItemDataToPrisma(data);
      const worldItem = await prisma.worldItem.update({
        where: { id },
        data: prismaData,
        include: { _count: true }
      });

      return extendWorldItem(worldItem as WorldItemBase);
    } catch (error) {
      logger.error(`Error actualizando objeto del mundo con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un objeto del mundo
   */
  static async delete(id: string): Promise<WorldItemWithRelations> {
    try {
      const worldItem = await prisma.worldItem.delete({
        where: { id },
        include: { _count: true }
      });

      return extendWorldItem(worldItem as WorldItemBase);
    } catch (error) {
      logger.error(`Error eliminando objeto del mundo con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca objetos del mundo por tipo
   */
  static async findByType(type: string, limit = 10): Promise<WorldItemWithRelations[]> {
    try {
      const worldItems = await prisma.worldItem.findMany({
        where: { type },
        take: limit,
        include: { _count: true }
      });

      return worldItems.map(item => extendWorldItem(item as WorldItemBase));
    } catch (error) {
      logger.error(`Error buscando objetos del mundo por tipo ${type}:`, error);
      throw error;
    }
  }

  /**
   * Busca objetos del mundo por categoría
   */
  static async findByCategory(category: string, limit = 10): Promise<WorldItemWithRelations[]> {
    try {
      const worldItems = await prisma.worldItem.findMany({
        where: { category },
        take: limit,
        include: { _count: true }
      });

      return worldItems.map(item => extendWorldItem(item as WorldItemBase));
    } catch (error) {
      logger.error(`Error buscando objetos del mundo por categoría ${category}:`, error);
      throw error;
    }
  }

  /**
   * Busca objetos del mundo por rareza
   */
  static async findByRarity(rarity: string, limit = 10): Promise<WorldItemWithRelations[]> {
    try {
      const worldItems = await prisma.worldItem.findMany({
        where: { rarity },
        take: limit,
        include: { _count: true }
      });

      return worldItems.map(item => extendWorldItem(item as WorldItemBase));
    } catch (error) {
      logger.error(`Error buscando objetos del mundo por rareza ${rarity}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas detalladas para un objeto del mundo
   */
  static async getStats(id: string): Promise<WorldItemWithStats> {
    try {
      const worldItem = await prisma.worldItem.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              images: true,
              videos: true,
              albums: true,
              collections: true,
              tags: true,
              characters: true,
              places: true,
              worldItems: true,
              concepts: true,
              prompts: true,
              notes: true,
              wildcards: true,
              properties: true,
              groups: true
            }
          }
        }
      });

      if (!worldItem) {
        throw new Error(`Objeto del mundo con ID ${id} no encontrado`);
      }

      return extendWorldItemWithStats(worldItem as WorldItemBase);
    } catch (error) {
      logger.error(`Error obteniendo estadísticas para objeto del mundo con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Conecta un objeto del mundo con otra entidad
   */
  static async connectEntity(worldItemId: string, entityType: string, entityId: string): Promise<WorldItemWithRelations> {
    try {
      let worldItem;

      // Determinar el tipo de entidad y conectarlo
      switch (entityType) {
        case 'image':
          worldItem = await prisma.worldItem.update({
            where: { id: worldItemId },
            data: { images: { connect: { id: entityId } } },
            include: { _count: true, images: true }
          });
          break;
        case 'video':
          worldItem = await prisma.worldItem.update({
            where: { id: worldItemId },
            data: { videos: { connect: { id: entityId } } },
            include: { _count: true, videos: true }
          });
          break;
        case 'character':
          worldItem = await prisma.worldItem.update({
            where: { id: worldItemId },
            data: { characters: { connect: { id: entityId } } },
            include: { _count: true, characters: true }
          });
          break;
        case 'place':
          worldItem = await prisma.worldItem.update({
            where: { id: worldItemId },
            data: { places: { connect: { id: entityId } } },
            include: { _count: true, places: true }
          });
          break;
        // Añadir más casos según sea necesario
        default:
          throw new Error(`Tipo de entidad no soportado: ${entityType}`);
      }

      return extendWorldItem(worldItem as WorldItemBase);
    } catch (error) {
      logger.error(`Error conectando objeto del mundo ${worldItemId} con entidad ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Extiende un objeto del mundo con datos adicionales
   */
  static extend(worldItem: WorldItemBase): WorldItemWithRelations {
    return extendWorldItem(worldItem);
  }

  /**
   * Enriquece un objeto del mundo con estadísticas
   */
  static extendWithStats(worldItem: WorldItemBase): WorldItemWithStats {
    return extendWorldItemWithStats(worldItem);
  }

  /**
   * Valida un objeto del mundo
   */
  static validate(worldItem: WorldItemBase): boolean {
    return validateWorldItem(worldItem);
  }
}

// Exportar funciones individuales para uso directo
export const findManyWorldItems = WorldItemTransformer.findMany;
export const findWorldItemById = WorldItemTransformer.findById;
export const createWorldItem = WorldItemTransformer.create;
export const updateWorldItem = WorldItemTransformer.update;
export const deleteWorldItem = WorldItemTransformer.delete;
export const findWorldItemsByType = WorldItemTransformer.findByType;
export const findWorldItemsByCategory = WorldItemTransformer.findByCategory;
export const findWorldItemsByRarity = WorldItemTransformer.findByRarity;
export const getWorldItemStats = WorldItemTransformer.getStats;
export const connectWorldItemEntity = WorldItemTransformer.connectEntity;
export const extendWorldItemTransform = WorldItemTransformer.extend;
export const extendWorldItemWithStatsTransform = WorldItemTransformer.extendWithStats;
export const validateWorldItemData = WorldItemTransformer.validate;