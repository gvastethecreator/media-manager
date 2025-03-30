/**
 * @file Transformer principal para la entidad Place
 * @module entities/place/transformer
 */

import { prisma } from '@/lib/prisma';
import type { CreatePlaceData, PlaceComplete, PlaceExtendedComplete, PlaceSearchOptions, PlaceWithRelations } from '@/types/entities/place/types';
import { logger } from '@/utils/logger';
import { mapCreatePlaceDataToPrisma, mapPlaceSearchOptionsToPrisma, mapPlaceToRelatedPlace, mapUpdatePlaceDataToPrisma } from './mappers';
import { extendPlace, extendPlaceComplete, validatePlace } from './serializers';

/**
 * 🌍 Transformer para la entidad Place
 */
export class PlaceTransformer {
  /**
   * 🔍 Busca lugares con opciones de filtrado y paginación
   */
  static async findMany(options: PlaceSearchOptions = {}): Promise<{
    items: PlaceExtendedComplete[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const prismaOptions = mapPlaceSearchOptionsToPrisma(options);
      const [items, total] = await Promise.all([
        prisma.place.findMany(prismaOptions),
        prisma.place.count({ where: prismaOptions.where })
      ]);

      const extendedItems = items.map(item => extendPlaceComplete(item as PlaceComplete));
      const hasMore = options.skip ? options.skip + items.length < total : items.length < total;

      return {
        items: extendedItems,
        total,
        hasMore
      };
    } catch (error) {
      logger.error('Error buscando lugares:', error);
      throw error;
    }
  }

  /**
   * 🔍 Busca un lugar por ID
   */
  static async findById(id: string, include?: PlaceSearchOptions['include']): Promise<PlaceExtendedComplete | null> {
    try {
      const place = await prisma.place.findUnique({
        where: { id },
        include
      });

      if (!place) return null;
      return extendPlaceComplete(place as PlaceComplete);
    } catch (error) {
      logger.error('Error buscando lugar por ID:', error);
      throw error;
    }
  }

  /**
   * ➕ Crea un nuevo lugar
   */
  static async create(data: CreatePlaceData): Promise<PlaceExtendedComplete> {
    try {
      const prismaData = mapCreatePlaceDataToPrisma(data);
      const place = await prisma.place.create({
        data: prismaData
      });

      return extendPlaceComplete(place as PlaceComplete);
    } catch (error) {
      logger.error('Error creando lugar:', error);
      throw error;
    }
  }

  /**
   * 📝 Actualiza un lugar existente
   */
  static async update(id: string, data: Partial<PlaceComplete>): Promise<PlaceExtendedComplete> {
    try {
      const prismaData = mapUpdatePlaceDataToPrisma(data);
      const place = await prisma.place.update({
        where: { id },
        data: prismaData
      });

      return extendPlaceComplete(place as PlaceComplete);
    } catch (error) {
      logger.error('Error actualizando lugar:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Elimina un lugar
   */
  static async delete(id: string): Promise<PlaceExtendedComplete> {
    try {
      const place = await prisma.place.delete({
        where: { id }
      });

      return extendPlaceComplete(place as PlaceComplete);
    } catch (error) {
      logger.error('Error eliminando lugar:', error);
      throw error;
    }
  }

  /**
   * 🔄 Extiende un lugar con sus campos deserializados
   */
  static extend(place: PlaceComplete): PlaceWithRelations {
    return extendPlace(place);
  }

  /**
   * 🔄 Extiende un lugar con todos sus campos y relaciones
   */
  static extendComplete(place: PlaceComplete): PlaceExtendedComplete {
    return extendPlaceComplete(place);
  }

  /**
   * 🔗 Obtiene la versión relacionada de un lugar
   */
  static toRelated(place: PlaceWithRelations) {
    return mapPlaceToRelatedPlace(place);
  }

  /**
   * ✅ Valida un lugar
   */
  static validate(place: unknown): PlaceComplete {
    return validatePlace(place);
  }
}

// Exportar funciones individuales para uso directo
export const findManyPlaces = PlaceTransformer.findMany;
export const findPlaceById = PlaceTransformer.findById;
export const createPlace = PlaceTransformer.create;
export const updatePlace = PlaceTransformer.update;
export const deletePlace = PlaceTransformer.delete;
export const extendPlaceTransform = PlaceTransformer.extend;
export const extendPlaceCompleteTransform = PlaceTransformer.extendComplete;
export const toRelatedPlace = PlaceTransformer.toRelated;
export const validatePlaceData = PlaceTransformer.validate;