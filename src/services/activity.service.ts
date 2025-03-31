/**
 * @file Servicio para la entidad Activity
 * @module services/activity.service
 */

import { PrismaClient } from '@prisma/client';
import { mapActivityFiltersToPrisma, mapCreateActivityDataToPrisma } from '../transformers/activity';
import type {
    Activity,
    ActivityFilters,
    ActivityListResponse,
    CreateActivityData
} from '../types/entities/activity';

/**
 * Interfaz para el servicio de Activity
 */
export interface ActivityService {
  /**
   * Crea una nueva actividad
   * @param data Datos para la creación
   * @returns Actividad creada
   */
  create(data: CreateActivityData): Promise<Activity>;

  /**
   * Busca una actividad por su identificador
   * @param id Identificador de la actividad
   * @returns Actividad encontrada o null
   */
  findById(id: string): Promise<Activity | null>;

  /**
   * Lista actividades según filtros especificados
   * @param filters Filtros de búsqueda
   * @returns Respuesta con actividades y metadatos
   */
  list(filters?: ActivityFilters): Promise<ActivityListResponse>;

  /**
   * Elimina una actividad por su identificador
   * @param id Identificador de la actividad
   * @returns true si se eliminó correctamente
   */
  delete(id: string): Promise<boolean>;

  /**
   * Elimina todas las actividades o las que coincidan con los filtros
   * @param filters Filtros opcionales
   * @returns Número de actividades eliminadas
   */
  clearAll(filters?: ActivityFilters): Promise<number>;
}

/**
 * Implementación del servicio de Activity
 */
export class ActivityServiceImpl implements ActivityService {
  private prisma: PrismaClient;

  /**
   * Constructor del servicio
   * @param prismaClient Cliente Prisma
   */
  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Crea una nueva actividad
   * @param data Datos para la creación
   * @returns Actividad creada
   */
  async create(data: CreateActivityData): Promise<Activity> {
    try {
      const prismaData = mapCreateActivityDataToPrisma(data);

      const activity = await this.prisma.activity.create({
        data: prismaData,
        include: {
          image: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
        },
      });

      return this.transformActivityResponse(activity);
    } catch (error) {
      console.error('Error al crear actividad:', error);
      throw new Error('No se pudo crear la actividad');
    }
  }

  /**
   * Busca una actividad por su identificador
   * @param id Identificador de la actividad
   * @returns Actividad encontrada o null
   */
  async findById(id: string): Promise<Activity | null> {
    try {
      const activity = await this.prisma.activity.findUnique({
        where: { id },
        include: {
          image: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
        },
      });

      if (!activity) return null;

      return this.transformActivityResponse(activity);
    } catch (error) {
      console.error('Error al buscar actividad:', error);
      throw new Error('No se pudo buscar la actividad');
    }
  }

  /**
   * Lista actividades según filtros especificados
   * @param filters Filtros de búsqueda
   * @returns Respuesta con actividades y metadatos
   */
  async list(filters: ActivityFilters = {}): Promise<ActivityListResponse> {
    try {
      const prismaQuery = mapActivityFiltersToPrisma(filters);

      // Consulta principal
      const activities = await this.prisma.activity.findMany(prismaQuery);

      // Consulta para contar total
      const totalCount = await this.prisma.activity.count({
        where: prismaQuery.where,
      });

      // Transformar resultados
      const transformedActivities = activities.map(activity =>
        this.transformActivityResponse(activity)
      );

      return {
        activities: transformedActivities,
        totalCount,
        hasMore: (prismaQuery.skip || 0) + (prismaQuery.take || 20) < totalCount,
      };
    } catch (error) {
      console.error('Error al listar actividades:', error);
      throw new Error('No se pudieron listar las actividades');
    }
  }

  /**
   * Elimina una actividad por su identificador
   * @param id Identificador de la actividad
   * @returns true si se eliminó correctamente
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.activity.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
      return false;
    }
  }

  /**
   * Elimina todas las actividades o las que coincidan con los filtros
   * @param filters Filtros opcionales
   * @returns Número de actividades eliminadas
   */
  async clearAll(filters?: ActivityFilters): Promise<number> {
    try {
      const where = filters ? mapActivityFiltersToPrisma(filters).where : {};

      const result = await this.prisma.activity.deleteMany({
        where,
      });

      return result.count;
    } catch (error) {
      console.error('Error al eliminar todas las actividades:', error);
      throw new Error('No se pudieron eliminar las actividades');
    }
  }

  /**
   * Transforma la respuesta de Prisma al formato de la aplicación
   * @param prismaActivity Actividad desde Prisma
   * @returns Actividad en formato de aplicación
   */
  private transformActivityResponse(prismaActivity: any): Activity {
    return {
      id: prismaActivity.id,
      type: prismaActivity.type,
      description: prismaActivity.description,
      imageId: prismaActivity.imageId,
      createdAt: prismaActivity.createdAt,
      image: prismaActivity.image,
      // Podríamos añadir más campos UI aquí basados en el tipo de actividad
      iconEmoji: this.getIconForActivityType(prismaActivity.type),
      iconColor: this.getColorForActivityType(prismaActivity.type),
      category: this.getCategoryForActivityType(prismaActivity.type),
    };
  }

  /**
   * Devuelve un emoji según el tipo de actividad
   * @param type Tipo de actividad
   * @returns Emoji correspondiente
   */
  private getIconForActivityType(type: string): string {
    // Mapa de tipos a emojis
    const iconMap: Record<string, string> = {
      image_upload: '🖼️',
      image_update: '✏️',
      image_delete: '🗑️',
      image_view: '👁️',
      image_download: '⬇️',
      image_share: '🔗',
      image_tag: '🏷️',
      image_untag: '✂️',
      image_favorite: '⭐',
      image_unfavorite: '☆',
      // Podemos seguir con más mapeos
    };

    return iconMap[type] || '📋';
  }

  /**
   * Devuelve un color según el tipo de actividad
   * @param type Tipo de actividad
   * @returns Color correspondiente
   */
  private getColorForActivityType(type: string): string {
    // Podemos identificar categorías principales
    if (type.startsWith('image_')) return '#3b82f6';
    if (type.startsWith('video_')) return '#ec4899';
    if (type.startsWith('folder_')) return '#f59e0b';
    if (type.startsWith('album_')) return '#10b981';
    if (type.startsWith('collection_')) return '#8b5cf6';
    if (type.startsWith('system_')) return '#ef4444';
    if (type.startsWith('user_')) return '#6366f1';

    return '#64748b';
  }

  /**
   * Devuelve una categoría según el tipo de actividad
   * @param type Tipo de actividad
   * @returns Categoría correspondiente
   */
  private getCategoryForActivityType(type: string): string {
    if (type.startsWith('image_')) return 'images';
    if (type.startsWith('video_')) return 'videos';
    if (type.startsWith('folder_')) return 'folders';
    if (type.startsWith('album_')) return 'albums';
    if (type.startsWith('collection_')) return 'collections';
    if (type.startsWith('system_')) return 'system';
    if (type.startsWith('user_')) return 'user';
    if (type.startsWith('search_')) return 'search';

    return 'other';
  }
}

// Exportar una instancia por defecto
let activityServiceInstance: ActivityService | null = null;

/**
 * Obtiene una instancia del servicio
 * @param prisma Cliente Prisma opcional
 * @returns Instancia del servicio
 */
export function getActivityService(prisma?: PrismaClient): ActivityService {
  if (!activityServiceInstance && prisma) {
    activityServiceInstance = new ActivityServiceImpl(prisma);
  }

  if (!activityServiceInstance) {
    throw new Error('ActivityService no ha sido inicializado');
  }

  return activityServiceInstance;
}

/**
 * Inicializa el servicio con un cliente prisma
 * @param prisma Cliente Prisma
 */
export function initActivityService(prisma: PrismaClient): void {
  activityServiceInstance = new ActivityServiceImpl(prisma);
}