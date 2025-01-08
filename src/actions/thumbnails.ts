'use server'

import { thumbnailService, type ProcessStatus, type ThumbnailCallbacks } from "@/services/thumbnail.service";
import { logger } from "@/lib/logger";
import { thumbnailEventService } from "@/services/thumbnail-events.service";

export async function reprocessThumbnails(callbacks?: ThumbnailCallbacks) {
  try {
    return await thumbnailService.reprocessAll({
      onProgress: (status: ProcessStatus) => {
        thumbnailEventService.emitProgress(status);
        callbacks?.onProgress?.(status);
      },
      onError: (error: unknown) => {
        thumbnailEventService.emitError(error);
        callbacks?.onError?.(error);
      },
      onComplete: (data: any) => {
        thumbnailEventService.emitComplete(data);
        callbacks?.onComplete?.(data);
      }
    });
  } catch (error) {
    logger.error('Error reprocessing thumbnails:', error);
    throw error;
  }
}

export async function optimizeThumbnails(callbacks?: ThumbnailCallbacks) {
  try {
    return await thumbnailService.optimizeThumbnails({
      onProgress: (status: ProcessStatus) => {
        thumbnailEventService.emitProgress(status);
        callbacks?.onProgress?.(status);
      },
      onError: (error: unknown) => {
        thumbnailEventService.emitError(error);
        callbacks?.onError?.(error);
      },
      onComplete: (data: any) => {
        thumbnailEventService.emitComplete(data);
        callbacks?.onComplete?.(data);
      }
    });
  } catch (error) {
    logger.error('Error optimizing thumbnails:', error);
    throw error;
  }
}

export async function cleanThumbnails(callbacks?: ThumbnailCallbacks) {
  try {
    return await thumbnailService.cleanThumbnails({
      onProgress: (status: ProcessStatus) => {
        thumbnailEventService.emitProgress(status);
        callbacks?.onProgress?.(status);
      },
      onError: (error: unknown) => {
        thumbnailEventService.emitError(error);
        callbacks?.onError?.(error);
      },
      onComplete: (data: any) => {
        thumbnailEventService.emitComplete(data);
        callbacks?.onComplete?.(data);
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