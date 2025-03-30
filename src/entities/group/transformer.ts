/**
 * @file Transformer para la entidad Group
 * @module entities/group/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { GroupBase, GroupComplete, GroupCreateInput, GroupFilters, GroupSortCriteria, GroupUpdateInput, GroupWithStats } from '@/types/entities/group/types';
import { mapCreateGroupDataToPrisma, mapGroupSearchOptionsToPrisma, mapUpdateGroupDataToPrisma } from './mappers';
import { calculateGroupStats, deserializeGroupFilters, extendGroup, extendGroupWithStats, validateGroup } from './serializers';

/**
 * Clase para transformar y gestionar grupos
 */
export class GroupTransformer {
  /**
   * Busca múltiples grupos con opciones de filtrado y paginación
   */
  static async findMany(options: {
    take?: number;
    skip?: number;
    sortBy?: GroupSortCriteria;
    filters?: GroupFilters;
    include?: Record<string, boolean>;
    includeStats?: boolean;
  }): Promise<{
    items: GroupComplete[] | GroupWithStats[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const { take = 10, skip = 0, includeStats = false } = options;

      // Mapear opciones de búsqueda a formato Prisma
      const prismaOptions = mapGroupSearchOptionsToPrisma(options);

      // Ejecutar consulta para obtener grupos y contar total
      const [items, totalCount] = await Promise.all([
        prisma.group.findMany(prismaOptions),
        prisma.group.count({ where: prismaOptions.where })
      ]);

      // Extender grupos con campos deserializados
      let extendedItems = items.map(item => {
        const baseItem = extendGroup(item as GroupBase);

        // Deserializar los filtros JSON
        if (item.filters) {
          baseItem.filtersData = deserializeGroupFilters(item.filters);
        }

        return baseItem;
      });

      // Añadir estadísticas si se solicitan
      if (includeStats) {
        extendedItems = extendedItems.map(item => extendGroupWithStats(item));
      }

      return {
        items: extendedItems,
        totalCount,
        hasMore: skip + take < totalCount
      };
    } catch (error) {
      logger.error('Error al buscar grupos:', error);
      throw error;
    }
  }

  /**
   * Busca un grupo por su ID
   */
  static async findById(
    id: string,
    options?: {
      include?: Record<string, boolean>;
      includeStats?: boolean;
    }
  ): Promise<GroupComplete | GroupWithStats | null> {
    try {
      const { include, includeStats = false } = options || {};

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
        ...(include?.properties && { properties: true })
      };

      // Buscar grupo con relaciones
      const group = await prisma.group.findUnique({
        where: { id },
        include: includeOptions
      });

      if (!group) {
        return null;
      }

      // Extender grupo con campos deserializados
      let extendedGroup = extendGroup(group as GroupBase);

      // Deserializar los filtros JSON
      if (group.filters) {
        extendedGroup.filtersData = deserializeGroupFilters(group.filters);
      }

      // Añadir estadísticas si se solicitan
      if (includeStats) {
        extendedGroup = extendGroupWithStats(extendedGroup);
      }

      return extendedGroup;
    } catch (error) {
      logger.error(`Error al buscar grupo con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca grupos por categoría
   */
  static async findByCategory(
    category: string,
    limit: number = 10
  ): Promise<GroupComplete[]> {
    try {
      const groups = await prisma.group.findMany({
        where: { category },
        take: limit,
        include: { _count: true }
      });

      return groups.map(group => extendGroup(group as GroupBase));
    } catch (error) {
      logger.error(`Error al buscar grupos por categoría ${category}:`, error);
      throw error;
    }
  }

  /**
   * Busca grupos favoritos
   */
  static async findFavorites(
    limit: number = 10
  ): Promise<GroupComplete[]> {
    try {
      const groups = await prisma.group.findMany({
        where: { isFavorite: true },
        take: limit,
        include: { _count: true }
      });

      return groups.map(group => extendGroup(group as GroupBase));
    } catch (error) {
      logger.error('Error al buscar grupos favoritos:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo grupo
   */
  static async create(data: GroupCreateInput): Promise<GroupComplete> {
    try {
      // Validar datos de entrada
      if (!data.name) {
        throw new Error('El nombre del grupo es requerido');
      }

      // Mapear datos al formato de Prisma
      const prismaData = mapCreateGroupDataToPrisma(data);

      // Crear nuevo grupo
      const group = await prisma.group.create({
        data: prismaData,
        include: { _count: true }
      });

      // Extender grupo con campos deserializados
      const extendedGroup = extendGroup(group as GroupBase);

      // Deserializar los filtros JSON
      if (group.filters) {
        extendedGroup.filtersData = deserializeGroupFilters(group.filters);
      }

      return extendedGroup;
    } catch (error) {
      logger.error('Error al crear grupo:', error);
      throw error;
    }
  }

  /**
   * Actualiza un grupo existente
   */
  static async update(id: string, data: GroupUpdateInput): Promise<GroupComplete> {
    try {
      // Verificar si el grupo existe
      const existingGroup = await prisma.group.findUnique({
        where: { id }
      });

      if (!existingGroup) {
        throw new Error(`Grupo con ID ${id} no encontrado`);
      }

      // Mapear datos al formato de Prisma
      const prismaData = mapUpdateGroupDataToPrisma(data);

      // Actualizar grupo
      const updatedGroup = await prisma.group.update({
        where: { id },
        data: prismaData,
        include: { _count: true }
      });

      // Extender grupo con campos deserializados
      const extendedGroup = extendGroup(updatedGroup as GroupBase);

      // Deserializar los filtros JSON
      if (updatedGroup.filters) {
        extendedGroup.filtersData = deserializeGroupFilters(updatedGroup.filters);
      }

      return extendedGroup;
    } catch (error) {
      logger.error(`Error al actualizar grupo con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un grupo existente
   */
  static async delete(id: string): Promise<GroupComplete> {
    try {
      // Verificar si el grupo existe
      const existingGroup = await prisma.group.findUnique({
        where: { id },
        include: { _count: true }
      });

      if (!existingGroup) {
        throw new Error(`Grupo con ID ${id} no encontrado`);
      }

      // Eliminar grupo
      const deletedGroup = await prisma.group.delete({
        where: { id },
        include: { _count: true }
      });

      // Extender grupo con campos deserializados
      return extendGroup(deletedGroup as GroupBase);
    } catch (error) {
      logger.error(`Error al eliminar grupo con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Conecta un grupo con otra entidad
   */
  static async connectEntity(
    groupId: string,
    entityType: 'image' | 'video' | 'album' | 'collection' | 'tag' | 'character' | 'place' | 'worldItem' | 'concept' | 'prompt' | 'note' | 'wildcard' | 'property',
    entityId: string
  ): Promise<boolean> {
    try {
      // Verificar si el grupo existe
      const group = await prisma.group.findUnique({
        where: { id: groupId }
      });

      if (!group) {
        throw new Error(`Grupo con ID ${groupId} no encontrado`);
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
        case 'wildcard':
          connectionData.wildcards = { connect: { id: entityId } };
          break;
        case 'property':
          connectionData.properties = { connect: { id: entityId } };
          break;
        default:
          throw new Error(`Tipo de entidad no soportado: ${entityType}`);
      }

      // Actualizar el grupo con la nueva conexión
      await prisma.group.update({
        where: { id: groupId },
        data: connectionData
      });

      return true;
    } catch (error) {
      logger.error(`Error al conectar grupo ${groupId} con ${entityType} ${entityId}:`, error);
      return false;
    }
  }

  /**
   * Desconecta un grupo de otra entidad
   */
  static async disconnectEntity(
    groupId: string,
    entityType: 'image' | 'video' | 'album' | 'collection' | 'tag' | 'character' | 'place' | 'worldItem' | 'concept' | 'prompt' | 'note' | 'wildcard' | 'property',
    entityId: string
  ): Promise<boolean> {
    try {
      // Verificar si el grupo existe
      const group = await prisma.group.findUnique({
        where: { id: groupId }
      });

      if (!group) {
        throw new Error(`Grupo con ID ${groupId} no encontrado`);
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
        case 'wildcard':
          disconnectionData.wildcards = { disconnect: { id: entityId } };
          break;
        case 'property':
          disconnectionData.properties = { disconnect: { id: entityId } };
          break;
        default:
          throw new Error(`Tipo de entidad no soportado: ${entityType}`);
      }

      // Actualizar el grupo con la desconexión
      await prisma.group.update({
        where: { id: groupId },
        data: disconnectionData
      });

      return true;
    } catch (error) {
      logger.error(`Error al desconectar grupo ${groupId} de ${entityType} ${entityId}:`, error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de uso de un grupo
   */
  static async getStats(id: string): Promise<{
    usageCount: number;
    relatedEntitiesCount: number;
  }> {
    try {
      const group = await prisma.group.findUnique({
        where: { id },
        include: { _count: true }
      });

      if (!group) {
        throw new Error(`Grupo con ID ${id} no encontrado`);
      }

      const extendedGroup = extendGroup(group as GroupBase);
      return calculateGroupStats(extendedGroup);
    } catch (error) {
      logger.error(`Error al obtener estadísticas de grupo con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Extiende un grupo con campos deserializados adicionales
   */
  static extend(group: GroupBase): GroupComplete {
    return extendGroup(group);
  }

  /**
   * Extiende un grupo con estadísticas
   */
  static extendWithStats(group: GroupComplete): GroupWithStats {
    return extendGroupWithStats(group);
  }

  /**
   * Valida un grupo
   */
  static validate(group: GroupBase): boolean {
    return validateGroup(group);
  }
}

// Exportación de funciones individuales para uso directo
export const findManyGroups = GroupTransformer.findMany.bind(GroupTransformer);
export const findGroupById = GroupTransformer.findById.bind(GroupTransformer);
export const findGroupsByCategory = GroupTransformer.findByCategory.bind(GroupTransformer);
export const findFavoriteGroups = GroupTransformer.findFavorites.bind(GroupTransformer);
export const createGroup = GroupTransformer.create.bind(GroupTransformer);
export const updateGroup = GroupTransformer.update.bind(GroupTransformer);
export const deleteGroup = GroupTransformer.delete.bind(GroupTransformer);
export const connectGroupEntity = GroupTransformer.connectEntity.bind(GroupTransformer);
export const disconnectGroupEntity = GroupTransformer.disconnectEntity.bind(GroupTransformer);
export const getGroupStats = GroupTransformer.getStats.bind(GroupTransformer);
export const extendGroupTransform = GroupTransformer.extend.bind(GroupTransformer);
export const extendGroupWithStatsTransform = GroupTransformer.extendWithStats.bind(GroupTransformer);
export const validateGroupData = GroupTransformer.validate.bind(GroupTransformer);