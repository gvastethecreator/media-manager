/**
 * @file Mappers para la entidad Video
 * @module entities/video/mappers
 */

import type { CreateVideoData, VideoComplete, VideoSearchOptions, VideoWithRelationsComplete } from '@/types/entities/video/types';
import { logger } from '@/utils/logger';
import type { Prisma } from '@prisma/client';
import { serializeVideoChapters, serializeVideoMetadata, serializeVideoPlayState } from './serializers';

/**
 * 🎬 Mapea datos de creación de video a formato Prisma
 */
export function mapCreateVideoDataToPrisma(data: CreateVideoData): Prisma.VideoCreateInput {
  try {
    return {
      name: data.name,
      description: data.description || null,
      path: data.path,
      hash: data.hash,
      size: data.size,
      duration: data.duration,
      width: data.width || null,
      height: data.height || null,
      metadata: data.metadata ?
        (typeof data.metadata === 'string' ?
          data.metadata :
          serializeVideoMetadata(data.metadata)
        ) : null,
      isPublic: false,
      isFavorite: false,
      folder: {
        connect: {
          id: data.folderId
        }
      }
    };
  } catch (error) {
    logger.error('Error mapeando datos de creación de video:', error);
    throw error;
  }
}

/**
 * 🎬 Mapea datos de actualización de video a formato Prisma
 */
export function mapUpdateVideoDataToPrisma(data: Partial<VideoComplete>): Prisma.VideoUpdateInput {
  try {
    const updateData: Prisma.VideoUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.path !== undefined) updateData.path = data.path;
    if (data.hash !== undefined) updateData.hash = data.hash;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.metadata !== undefined) {
      updateData.metadata = typeof data.metadata === 'string' ?
        data.metadata :
        serializeVideoMetadata(data.metadata);
    }
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.thumbnailSize !== undefined) updateData.thumbnailSize = data.thumbnailSize;
    if (data.thumbnailWidth !== undefined) updateData.thumbnailWidth = data.thumbnailWidth;
    if (data.thumbnailHeight !== undefined) updateData.thumbnailHeight = data.thumbnailHeight;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.playState !== undefined) {
      updateData.playState = typeof data.playState === 'string' ?
        data.playState :
        serializeVideoPlayState(data.playState);
    }
    if (data.chapters !== undefined) {
      updateData.chapters = typeof data.chapters === 'string' ?
        data.chapters :
        serializeVideoChapters(data.chapters);
    }

    return updateData;
  } catch (error) {
    logger.error('Error mapeando datos de actualización de video:', error);
    throw error;
  }
}

/**
 * 🔍 Mapea opciones de búsqueda a formato Prisma
 */
export function mapVideoSearchOptionsToPrisma(options: VideoSearchOptions): Prisma.VideoFindManyArgs {
  try {
    const prismaOptions: Prisma.VideoFindManyArgs = {
      take: options.take,
      skip: options.skip,
      orderBy: options.orderBy,
      where: options.where,
      include: {
        folder: options.include?.folder,
        albums: options.include?.albums,
        collections: options.include?.collections,
        tags: options.include?.tags,
        characters: options.include?.characters,
        places: options.include?.places,
        worldItems: options.include?.worldItems,
        concepts: options.include?.concepts,
        prompts: options.include?.prompts,
        notes: options.include?.notes,
        wildcards: options.include?.wildcards,
        properties: options.include?.properties,
        groups: options.include?.groups,
        _count: options.include?._count
      }
    };

    return prismaOptions;
  } catch (error) {
    logger.error('Error mapeando opciones de búsqueda de video:', error);
    throw error;
  }
}

/**
 * 🔗 Mapea un video a su versión relacionada
 */
export function mapVideoToRelatedVideo(video: VideoWithRelationsComplete) {
  try {
    return {
      id: video.id,
      name: video.name,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      width: video.width,
      height: video.height,
      quality: video.metadata?.quality,
      type: video.metadata?.type
    };
  } catch (error) {
    logger.error('Error mapeando video a versión relacionada:', error);
    throw error;
  }
}