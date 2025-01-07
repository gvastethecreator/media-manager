'use server'

import { thumbnailService } from "@/services/thumbnail.service";
import { logger } from "@/lib/logger";
import { thumbnailEventService } from "@/services/thumbnail-events.service";

export async function reprocessThumbnails() {
  try {
    return await thumbnailService.reprocessAll({
      onProgress: (status) => {
        thumbnailEventService.emitProgress(status);
      },
      onError: (error) => {
        thumbnailEventService.emitError(error);
      },
      onComplete: (data) => {
        thumbnailEventService.emitComplete(data);
      }
    });
  } catch (error) {
    logger.error('Error reprocessing thumbnails:', error);
    throw error;
  }
}

export async function optimizeThumbnails() {
  try {
    return await thumbnailService.optimizeThumbnails({
      onProgress: (status) => {
        thumbnailEventService.emitProgress(status);
      },
      onError: (error) => {
        thumbnailEventService.emitError(error);
      },
      onComplete: (data) => {
        thumbnailEventService.emitComplete(data);
      }
    });
  } catch (error) {
    logger.error('Error optimizing thumbnails:', error);
    throw error;
  }
}

export async function cleanThumbnails() {
  try {
    return await thumbnailService.cleanThumbnails({
      onProgress: (status) => {
        thumbnailEventService.emitProgress(status);
      },
      onError: (error) => {
        thumbnailEventService.emitError(error);
      },
      onComplete: (data) => {
        thumbnailEventService.emitComplete(data);
      }
    });
  } catch (error) {
    logger.error('Error cleaning thumbnails:', error);
    throw error;
  }
}

export async function getStats() {
  try {
    const stats = await thumbnailService.getStats();
    thumbnailEventService.emitStats(stats);
    return stats;
  } catch (error) {
    logger.error('Error getting thumbnail stats:', error);
    throw error;
  }
}