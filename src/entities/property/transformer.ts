/**
 * @file Transformer para la entidad Property
 * @module entities/property/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { CreatePropertyData, PropertyBase, PropertyFilters, PropertySortCriteria, PropertyWithRelations, UpdatePropertyData } from '@/types/entities/property/types';
import { mapCreatePropertyDataToPrisma, mapPropertySearchOptionsToPrisma, mapUpdatePropertyDataToPrisma } from './mappers';
import { calculatePropertyStats, extendProperty, validateProperty } from './serializers';

/**
 * Clase para transformar y gestionar propiedades
 */
export class PropertyTransformer {
  /**
   * Busca múltiples propiedades con opciones de filtrado y paginación
   */
  static async findMany(options: {
    take?: number;
    skip?: number;
    sortBy?: PropertySortCriteria;
    filters?: PropertyFilters;
    include?: Record<string, boolean>;
  }): Promise<{
    items: PropertyWithRelations[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const { take = 10, skip = 0 } = options;

      // Mapear opciones de búsqueda a formato Prisma
      const prismaOptions = mapPropertySearchOptionsToPrisma(options);

      // Ejecutar consulta para obtener propiedades y contar total
      const [items, totalCount] = await Promise.all([
        prisma.property.findMany(prismaOptions),
        prisma.property.count({ where: prismaOptions.where })
      ]);

      // Extender propiedades con campos deserealizados
      const extendedItems = items.map(item => this.extend(item as PropertyBase));

      return {
        items: extendedItems,
        totalCount,
        hasMore: skip + take < totalCount
      };
    } catch (error) {
      logger.error('Error al buscar propiedades:', error);
      throw error;
    }
  }

  /**
   * Busca una propiedad por su ID
   */
  static async findById(
    id: string,
    include?: Record<string, boolean>
  ): Promise<PropertyWithRelations | null> {
    try {
      // Preparar opciones de inclusión para relaciones
      const includeOptions = {
        _count: true,
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
        ...(include?.wildcards && { wildcards: true }),
        ...(include?.groups && { groups: true })
      };

      // Buscar propiedad con relaciones
      const property = await prisma.property.findUnique({
        where: { id },
        include: includeOptions
      });

      if (!property) {
        return null;
      }

      // Extender propiedad con campos deserealizados
      return this.extend(property as PropertyBase);
    } catch (error) {
      logger.error(`Error al buscar propiedad con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva propiedad
   */
  static async create(data: CreatePropertyData): Promise<PropertyWithRelations> {
    try {
      // Validar datos de entrada
      if (!data.name) {
        throw new Error('El nombre de la propiedad es requerido');
      }

      // Mapear datos al formato de Prisma
      const prismaData = mapCreatePropertyDataToPrisma(data);

      // Crear nueva propiedad
      const property = await prisma.property.create({
        data: prismaData,
        include: { _count: true }
      });

      // Extender propiedad con campos deserealizados
      return this.extend(property as PropertyBase);
    } catch (error) {
      logger.error('Error al crear propiedad:', error);
      throw error;
    }
  }

  /**
   * Actualiza una propiedad existente
   */
  static async update(id: string, data: UpdatePropertyData): Promise<PropertyWithRelations> {
    try {
      // Verificar si la propiedad existe
      const existingProperty = await prisma.property.findUnique({
        where: { id }
      });

      if (!existingProperty) {
        throw new Error(`Propiedad con ID ${id} no encontrada`);
      }

      // Mapear datos al formato de Prisma
      const prismaData = mapUpdatePropertyDataToPrisma(data);

      // Actualizar propiedad
      const updatedProperty = await prisma.property.update({
        where: { id },
        data: prismaData,
        include: { _count: true }
      });

      // Extender propiedad con campos deserealizados
      return this.extend(updatedProperty as PropertyBase);
    } catch (error) {
      logger.error(`Error al actualizar propiedad con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una propiedad existente
   */
  static async delete(id: string): Promise<PropertyWithRelations> {
    try {
      // Verificar si la propiedad existe
      const existingProperty = await prisma.property.findUnique({
        where: { id },
        include: { _count: true }
      });

      if (!existingProperty) {
        throw new Error(`Propiedad con ID ${id} no encontrada`);
      }

      // Eliminar propiedad
      const deletedProperty = await prisma.property.delete({
        where: { id },
        include: { _count: true }
      });

      // Extender propiedad con campos deserealizados
      return this.extend(deletedProperty as PropertyBase);
    } catch (error) {
      logger.error(`Error al eliminar propiedad con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Buscar propiedades por categoría
   */
  static async findByCategory(
    category: string,
    limit: number = 10
  ): Promise<PropertyWithRelations[]> {
    try {
      const properties = await prisma.property.findMany({
        where: { category },
        take: limit,
        include: { _count: true }
      });

      return properties.map(property => this.extend(property as PropertyBase));
    } catch (error) {
      logger.error(`Error al buscar propiedades por categoría ${category}:`, error);
      throw error;
    }
  }

  /**
   * Buscar propiedades favoritas
   */
  static async findFavorites(
    limit: number = 10
  ): Promise<PropertyWithRelations[]> {
    try {
      const properties = await prisma.property.findMany({
        where: { isFavorite: true },
        take: limit,
        include: { _count: true }
      });

      return properties.map(property => this.extend(property as PropertyBase));
    } catch (error) {
      logger.error('Error al buscar propiedades favoritas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de uso de una propiedad
   */
  static async getStats(id: string): Promise<{
    usageCount: number;
    relatedEntitiesCount: number;
  }> {
    try {
      const property = await prisma.property.findUnique({
        where: { id },
        include: { _count: true }
      });

      if (!property) {
        throw new Error(`Propiedad con ID ${id} no encontrada`);
      }

      return calculatePropertyStats(property as PropertyWithRelations);
    } catch (error) {
      logger.error(`Error al obtener estadísticas de propiedad con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Extiende una propiedad con campos deserealizados adicionales
   */
  static extend(property: PropertyBase): PropertyWithRelations {
    return extendProperty(property);
  }

  /**
   * Valida una propiedad
   */
  static validate(property: PropertyBase): boolean {
    return validateProperty(property);
  }
}

// Exportación de funciones individuales para uso directo
export const findManyProperties = PropertyTransformer.findMany.bind(PropertyTransformer);
export const findPropertyById = PropertyTransformer.findById.bind(PropertyTransformer);
export const createProperty = PropertyTransformer.create.bind(PropertyTransformer);
export const updateProperty = PropertyTransformer.update.bind(PropertyTransformer);
export const deleteProperty = PropertyTransformer.delete.bind(PropertyTransformer);
export const findPropertiesByCategory = PropertyTransformer.findByCategory.bind(PropertyTransformer);
export const findFavoriteProperties = PropertyTransformer.findFavorites.bind(PropertyTransformer);
export const getPropertyStats = PropertyTransformer.getStats.bind(PropertyTransformer);
export const extendPropertyTransform = PropertyTransformer.extend.bind(PropertyTransformer);
export const validatePropertyData = PropertyTransformer.validate.bind(PropertyTransformer);