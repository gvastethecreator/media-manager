import type { Image as PrismaImage, ImageStats as PrismaImageStats, ImageVisualConfig as PrismaImageVisualConfig } from '@prisma/client';

/**
 * Tipo base para Image, extendido directamente del tipo Prisma
 */
export type ImageBase = PrismaImage;

/**
 * Tipo base para ImageVisualConfig, extendido directamente del tipo Prisma
 */
export type ImageVisualConfigBase = PrismaImageVisualConfig;

/**
 * Tipo base para ImageStats, extendido directamente del tipo Prisma
 */
export type ImageStatsBase = PrismaImageStats;

/**
 * Datos mínimos requeridos para crear una imagen
 */
export interface CreateImageData {
  name: string;
  path: string;
  folderId: string;
  hash: string;
  size: number;
  width: number;
  height: number;
  description?: string;
  metadata?: string;
  presetId?: string | null;
}

/**
 * Datos para actualizar una imagen
 */
export interface UpdateImageData {
  name?: string;
  description?: string;
  presetId?: string | null;
  isFavorite?: boolean;
  isPublic?: boolean;
}

/**
 * Resumen básico de una imagen para listados
 */
export interface ImageSummary {
  id: string;
  name: string;
  path: string;
  folderId: string;
  hash: string;
  size: number;
  width: number;
  height: number;
  thumbnailWidth?: number | null;
  thumbnailHeight?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Estructura de metadatos de una imagen
 */
export interface ImageMetadata {
  format?: string;
  exif?: Record<string, unknown>;
  iptc?: Record<string, unknown>;
  xmp?: Record<string, unknown>;
  icc?: Record<string, unknown>;
  ai?: ImageAIMetadata;
}

/**
 * Estructura de metadatos de IA para imágenes generadas
 */
export interface ImageAIMetadata {
  model?: string;
  prompt?: string;
  negativePrompt?: string;
  seed?: number;
  samplingSteps?: number;
  cfgScale?: number;
  samplingMethod?: string;
  extraParameters?: Record<string, unknown>;
}