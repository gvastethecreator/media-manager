import { z } from 'zod'

export enum ThumbnailQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export const THUMBNAIL_QUALITY_CONFIG = {
  [ThumbnailQuality.LOW]: {
    width: 200,
    height: 200,
    quality: 60,
  },
  [ThumbnailQuality.MEDIUM]: {
    width: 400,
    height: 400,
    quality: 75,
  },
  [ThumbnailQuality.HIGH]: {
    width: 800,
    height: 800,
    quality: 85,
  },
}

export const ThumbnailQualitySchema = z.nativeEnum(ThumbnailQuality)
