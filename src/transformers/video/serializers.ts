/**
 * @file Funciones para serializar y deserializar datos de videos
 * @module transformers/video/serializers
 */

import {
    type Video,
    type VideoBase,
    type VideoMetadata,
    type VideoVisualConfig
} from '../../types/entities/video';

/**
 * Convierte un objeto VideoBase a Video con propiedades extendidas
 * @param video Objeto básico de video
 * @returns Objeto Video completo
 */
export function extendVideo(video: VideoBase): Video {
  return {
    ...video,
    metadata: parseVideoMetadata(video),
    isPublic: false,
    isFavorite: false,
  };
}

/**
 * Convierte un array de objetos VideoBase a array de Video con propiedades extendidas
 * @param videos Array de objetos básicos de video
 * @returns Array de objetos Video completos
 */
export function extendVideos(videos: VideoBase[]): Video[] {
  return videos.map(extendVideo);
}

/**
 * Parsea los metadatos de un video si están en formato string
 * @param video Objeto de video
 * @returns Metadatos parseados o undefined
 */
export function parseVideoMetadata(video: VideoBase): VideoMetadata | undefined {
  if (!video.metadata) return undefined;

  if (typeof video.metadata === 'string') {
    try {
      return JSON.parse(video.metadata) as VideoMetadata;
    } catch (error) {
      console.error('Error parsing video metadata', error);
      return undefined;
    }
  }

  return video.metadata as unknown as VideoMetadata;
}

/**
 * Serializa los metadatos de un video para guardarlos
 * @param metadata Objeto de metadatos de video
 * @returns String serializado o undefined
 */
export function serializeVideoMetadata(metadata?: VideoMetadata): string | undefined {
  if (!metadata) return undefined;

  try {
    return JSON.stringify(metadata);
  } catch (error) {
    console.error('Error serializing video metadata', error);
    return undefined;
  }
}

/**
 * Serializa la configuración visual de un video
 * @param visualConfig Configuración visual básica
 * @returns Configuración visual extendida con propiedades adicionales
 */
export function serializeVideoVisualConfig(
  visualConfig: VideoVisualConfig | null | undefined
): VideoVisualConfig | undefined {
  if (!visualConfig) return undefined;

  // Crear copia para evitar mutar el objeto original
  const extendedConfig: VideoVisualConfig = {
    ...visualConfig,
  };

  // Procesar campos de tipo string JSON
  if (visualConfig.layerSystem) {
    try {
      // Añadir propiedad extendida layersConfig
      (extendedConfig as any).layersConfig = JSON.parse(visualConfig.layerSystem);
    } catch (error) {
      console.error('Error al serializar layerSystem:', error);
    }
  }

  if (visualConfig.effects) {
    try {
      // Añadir propiedad extendida effectsConfig
      (extendedConfig as any).effectsConfig = JSON.parse(visualConfig.effects);
    } catch (error) {
      console.error('Error al serializar effects:', error);
    }
  }

  if (visualConfig.performance) {
    try {
      // Añadir propiedad extendida performanceConfig
      (extendedConfig as any).performanceConfig = JSON.parse(visualConfig.performance);
    } catch (error) {
      console.error('Error al serializar performance:', error);
    }
  }

  if (visualConfig.states) {
    try {
      // Añadir propiedad extendida statesConfig
      (extendedConfig as any).statesConfig = JSON.parse(visualConfig.states);
    } catch (error) {
      console.error('Error al serializar states:', error);
    }
  }

  return extendedConfig;
}