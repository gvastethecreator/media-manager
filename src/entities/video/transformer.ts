/**
 * @file Transformer principal para la entidad Video
 * @module entities/video/transformer
 */

import { prisma } from '@/lib/prisma';
import type { CreateVideoData, VideoComplete, VideoExtendedComplete, VideoSearchOptions, VideoWithRelationsComplete } from '@/types/entities/video/types';
import { logger } from '@/utils/logger';
import { mapCreateVideoDataToPrisma, mapUpdateVideoDataToPrisma, mapVideoSearchOptionsToPrisma, mapVideoToRelatedVideo } from './mappers';
import { extendVideo, extendVideoComplete, validateVideo } from './serializers';

/**
 * 🎬 Transformer para la entidad Video
 */
export class VideoTransformer {
  /**
   * 🔍 Busca videos con opciones de filtrado y paginación
   */
  static async findMany(options: VideoSearchOptions = {}): Promise<{
    items: VideoExtendedComplete[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const prismaOptions = mapVideoSearchOptionsToPrisma(options);
      const [items, total] = await Promise.all([
        prisma.video.findMany(prismaOptions),
        prisma.video.count({ where: prismaOptions.where })
      ]);

      const extendedItems = items.map(item => extendVideoComplete(item as VideoComplete));
      const hasMore = options.skip ? options.skip + items.length < total : items.length < total;

      return {
        items: extendedItems,
        total,
        hasMore
      };
    } catch (error) {
      logger.error('Error buscando videos:', error);
      throw error;
    }
  }

  /**
   * 🔍 Busca un video por ID
   */
  static async findById(id: string, include?: VideoSearchOptions['include']): Promise<VideoExtendedComplete | null> {
    try {
      const video = await prisma.video.findUnique({
        where: { id },
        include
      });

      if (!video) return null;
      return extendVideoComplete(video as VideoComplete);
    } catch (error) {
      logger.error('Error buscando video por ID:', error);
      throw error;
    }
  }

  /**
   * ➕ Crea un nuevo video
   */
  static async create(data: CreateVideoData): Promise<VideoExtendedComplete> {
    try {
      const prismaData = mapCreateVideoDataToPrisma(data);
      const video = await prisma.video.create({
        data: prismaData
      });

      return extendVideoComplete(video as VideoComplete);
    } catch (error) {
      logger.error('Error creando video:', error);
      throw error;
    }
  }

  /**
   * 📝 Actualiza un video existente
   */
  static async update(id: string, data: Partial<VideoComplete>): Promise<VideoExtendedComplete> {
    try {
      const prismaData = mapUpdateVideoDataToPrisma(data);
      const video = await prisma.video.update({
        where: { id },
        data: prismaData
      });

      return extendVideoComplete(video as VideoComplete);
    } catch (error) {
      logger.error('Error actualizando video:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Elimina un video
   */
  static async delete(id: string): Promise<VideoExtendedComplete> {
    try {
      const video = await prisma.video.delete({
        where: { id }
      });

      return extendVideoComplete(video as VideoComplete);
    } catch (error) {
      logger.error('Error eliminando video:', error);
      throw error;
    }
  }

  /**
   * 🔄 Extiende un video con sus campos deserializados
   */
  static extend(video: VideoComplete): VideoWithRelationsComplete {
    return extendVideo(video);
  }

  /**
   * 🔄 Extiende un video con todos sus campos y relaciones
   */
  static extendComplete(video: VideoComplete): VideoExtendedComplete {
    return extendVideoComplete(video);
  }

  /**
   * 🔗 Obtiene la versión relacionada de un video
   */
  static toRelated(video: VideoWithRelationsComplete) {
    return mapVideoToRelatedVideo(video);
  }

  /**
   * ✅ Valida un video
   */
  static validate(video: unknown): VideoComplete {
    return validateVideo(video);
  }
}

// Exportar funciones individuales para uso directo
export const findManyVideos = VideoTransformer.findMany;
export const findVideoById = VideoTransformer.findById;
export const createVideo = VideoTransformer.create;
export const updateVideo = VideoTransformer.update;
export const deleteVideo = VideoTransformer.delete;
export const extendVideoTransform = VideoTransformer.extend;
export const extendVideoCompleteTransform = VideoTransformer.extendComplete;
export const toRelatedVideo = VideoTransformer.toRelated;
export const validateVideoData = VideoTransformer.validate;