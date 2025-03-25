/**
 * @file Funciones de mapeo para la entidad Video
 * @module transformers/video/mappers
 */

import type {
    CreateVideoData,
    VideoMetadata,
    VideoVisualConfig
} from '../../types/entities/video';
import { serializeVideoMetadata } from './serializers';

/**
 * Mapea datos de creación de video a formato compatible con Prisma
 * @param data Datos de creación de video
 * @returns Objeto formateado para Prisma
 */
export function mapCreateVideoDataToPrisma(data: CreateVideoData) {
  // Serializar metadatos si no vienen como string
  const metadata = typeof data.metadata === 'string'
    ? data.metadata
    : serializeVideoMetadata(data.metadata as VideoMetadata);

  return {
    name: data.name,
    description: data.description || '',
    path: data.path,
    folderId: data.folderId,
    metadata,
    presetId: data.presetId
  };
}

/**
 * Extrae la duración formateada de los metadatos de un video
 * @param metadata Metadatos del video
 * @returns Duración formateada (HH:MM:SS)
 */
export function extractVideoDuration(metadata?: Partial<VideoMetadata>): string {
  if (!metadata || !metadata.duration) return '--:--';

  const totalSeconds = Math.floor(metadata.duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formatea la resolución de un video a partir de sus metadatos
 * @param metadata Metadatos del video
 * @returns Resolución formateada
 */
export function formatVideoResolution(metadata?: VideoMetadata): string {
  if (!metadata || !metadata.width || !metadata.height) return 'Desconocida';

  // Detectar si es HD, Full HD, 4K, etc.
  if (metadata.height >= 2160) return '4K';
  if (metadata.height >= 1440) return '2K';
  if (metadata.height >= 1080) return 'Full HD';
  if (metadata.height >= 720) return 'HD';
  if (metadata.height >= 480) return 'SD';

  return `${metadata.width}×${metadata.height}`;
}

/**
 * Obtiene un frame específico del video como timestamp
 * @param totalDuration Duración total en segundos
 * @param percentage Porcentaje de la duración (0-1)
 * @returns Timestamp en formato HH:MM:SS
 */
export function getVideoFrameTimestamp(totalDuration: number, percentage: number): string {
  if (!totalDuration || percentage < 0 || percentage > 1) {
    return '00:00';
  }

  const targetSeconds = Math.floor(totalDuration * percentage);
  return extractVideoDuration({ duration: targetSeconds });
}

/**
 * Mapea datos de configuración visual para la creación
 * @param config Configuración visual
 * @returns Objeto formateado para Prisma
 */
export function mapVideoVisualConfigToPrisma(config: Partial<VideoVisualConfig>) {
  // Serializar campos como JSON si es necesario
  const layerSystem = typeof config.layerSystem === 'object'
    ? JSON.stringify(config.layerSystem)
    : config.layerSystem;

  const effects = typeof config.effects === 'object'
    ? JSON.stringify(config.effects)
    : config.effects;

  const performance = typeof config.performance === 'object'
    ? JSON.stringify(config.performance)
    : config.performance;

  const states = typeof config.states === 'object'
    ? JSON.stringify(config.states)
    : config.states;

  return {
    videoId: config.videoId,
    enable3DEffect: config.enable3DEffect ?? true,
    designSystem: config.designSystem,
    enableHolographicEffect: config.enableHolographicEffect ?? true,
    enableGlowEffect: config.enableGlowEffect ?? true,
    enableAnimatedBorder: config.enableAnimatedBorder ?? true,
    enableLightHalo: config.enableLightHalo ?? true,
    layerSystem,
    effects,
    performance,
    states,
    presetId: config.presetId,
  };
}

/**
 * Mapea un objeto de VideoVisualConfig a un formato para actualización
 * @param config Configuración visual
 * @returns Objeto formateado para Prisma
 */
export function mapVideoVisualConfigUpdateToPrisma(config: Partial<VideoVisualConfig>) {
  const result: Record<string, any> = {};

  // Solo incluir campos que están definidos
  if (config.enable3DEffect !== undefined) result.enable3DEffect = config.enable3DEffect;
  if (config.designSystem !== undefined) result.designSystem = config.designSystem;
  if (config.enableHolographicEffect !== undefined) result.enableHolographicEffect = config.enableHolographicEffect;
  if (config.enableGlowEffect !== undefined) result.enableGlowEffect = config.enableGlowEffect;
  if (config.enableAnimatedBorder !== undefined) result.enableAnimatedBorder = config.enableAnimatedBorder;
  if (config.enableLightHalo !== undefined) result.enableLightHalo = config.enableLightHalo;
  if (config.presetId !== undefined) result.presetId = config.presetId;

  // Serializar campos como JSON si es necesario
  if (config.layerSystem !== undefined) {
    result.layerSystem = typeof config.layerSystem === 'object'
      ? JSON.stringify(config.layerSystem)
      : config.layerSystem;
  }

  if (config.effects !== undefined) {
    result.effects = typeof config.effects === 'object'
      ? JSON.stringify(config.effects)
      : config.effects;
  }

  if (config.performance !== undefined) {
    result.performance = typeof config.performance === 'object'
      ? JSON.stringify(config.performance)
      : config.performance;
  }

  if (config.states !== undefined) {
    result.states = typeof config.states === 'object'
      ? JSON.stringify(config.states)
      : config.states;
  }

  return result;
}