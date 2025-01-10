'use server'

import { thumbnailService } from '@/services/thumbnail.service'
import type { ProcessOptions } from '@/services/thumbnail.service'
import { logger } from '@/lib/logger'

const thumbLogger = logger.withContext('ThumbnailActions')

export async function optimizeThumbnails(options?: ProcessOptions) {
  try {
    return await thumbnailService.optimizeThumbnails(options)
  } catch (error) {
    thumbLogger.error("Error optimizing thumbnails:", error);
    throw error;
  }
}

export async function reprocessThumbnails(options?: ProcessOptions) {
  try {
    return await thumbnailService.reprocessAll(options)
  } catch (error) {
    thumbLogger.error("Error reprocessing thumbnails:", error);
    throw error;
  }
}

export async function cleanThumbnails(options?: ProcessOptions) {
  try {
    return await thumbnailService.cleanThumbnails(options);
  } catch (error) {
    thumbLogger.error("Error cleaning thumbnails:", error);
    throw error;
  }
}