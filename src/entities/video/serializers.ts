/**
 * @file Serializadores para la entidad Video
 * @module entities/video/serializers
 */

import { logger } from '@/lib/logger';
import { VideoChapterSchema, VideoMetadataSchema, VideoPlayStateSchema, VideoSchema } from '@/types/entities/video/schema';
import type { VideoChapter, VideoComplete, VideoExtendedComplete, VideoMetadata, VideoPlayState, VideoWithRelationsComplete } from '@/types/entities/video/types';
import { deserializeJsonField, serializeJsonField } from '@/utils/transformers/common';

/**
 * 🔄 Serializa los metadatos de video
 */
export function serializeVideoMetadata(metadata: VideoMetadata | null): string {
  try {
    if (!metadata) return '';
    return serializeJsonField(metadata);
  } catch (error) {
    logger.error('Error serializando metadatos de video:', error);
    return '';
  }
}

/**
 * 🔄 Deserializa los metadatos de video
 */
export function deserializeVideoMetadata(metadata: string | null): VideoMetadata | null {
  try {
    if (!metadata) return null;
    const parsed = deserializeJsonField<VideoMetadata>(metadata, null);
    if (!parsed) return null;
    return VideoMetadataSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando metadatos de video:', error);
    return null;
  }
}

/**
 * 🔄 Serializa el estado de reproducción
 */
export function serializeVideoPlayState(playState: VideoPlayState | null): string {
  try {
    if (!playState) return '';
    return serializeJsonField(playState);
  } catch (error) {
    logger.error('Error serializando estado de reproducción:', error);
    return '';
  }
}

/**
 * 🔄 Deserializa el estado de reproducción
 */
export function deserializeVideoPlayState(playState: string | null): VideoPlayState | null {
  try {
    if (!playState) return null;
    const parsed = deserializeJsonField<VideoPlayState>(playState, null);
    if (!parsed) return null;
    return VideoPlayStateSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando estado de reproducción:', error);
    return null;
  }
}

/**
 * 🔄 Serializa los capítulos de video
 */
export function serializeVideoChapters(chapters: VideoChapter[] | null): string {
  try {
    if (!chapters) return '';
    return serializeJsonField(chapters);
  } catch (error) {
    logger.error('Error serializando capítulos de video:', error);
    return '';
  }
}

/**
 * 🔄 Deserializa los capítulos de video
 */
export function deserializeVideoChapters(chapters: string | null): VideoChapter[] | null {
  try {
    if (!chapters) return null;
    const parsed = deserializeJsonField<VideoChapter[]>(chapters, null);
    if (!parsed) return null;
    return parsed.map(chapter => VideoChapterSchema.parse(chapter));
  } catch (error) {
    logger.error('Error deserializando capítulos de video:', error);
    return null;
  }
}

/**
 * 🎬 Extiende un video con sus campos deserializados
 */
export function extendVideo(video: VideoComplete): VideoWithRelationsComplete {
  try {
    return {
      ...video,
      metadata: deserializeVideoMetadata(video.metadata),
      playState: video.playState ? deserializeVideoPlayState(video.playState as unknown as string) : null,
      chapters: video.chapters ? deserializeVideoChapters(video.chapters as unknown as string) : null
    };
  } catch (error) {
    logger.error('Error extendiendo video:', error);
    return video;
  }
}

/**
 * 🎬 Extiende un video con todos sus campos y relaciones
 */
export function extendVideoComplete(video: VideoComplete): VideoExtendedComplete {
  try {
    const extended = extendVideo(video);
    return {
      ...extended,
      thumbnailUrl: video.thumbnail ? `/api/videos/${video.id}/thumbnail` : null,
      isSelected: false
    };
  } catch (error) {
    logger.error('Error extendiendo video completo:', error);
    return video as VideoExtendedComplete;
  }
}

/**
 * 🔍 Valida un video usando el esquema Zod
 */
export function validateVideo(video: unknown): VideoComplete {
  return VideoSchema.parse(video);
}