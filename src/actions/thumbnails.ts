'use server'

import { thumbnailService, type ProcessStatus } from "@/services/thumbnail.service";
import { logger } from "@/lib/logger";
import { thumbnailEventService } from "@/services/thumbnail-events.service";

const actionLogger = logger.withContext('ThumbnailActions');

export async function reprocessThumbnails(options?: {
  onProgress?: (status: ProcessStatus) => void;
  onError?: (error: unknown) => void;
  onComplete?: (data: any) => void;
}) {
  try {
    return await thumbnailService.reprocessAll({
      onProgress: (status: ProcessStatus) => {
        thumbnailEventService.emitProgress(status);
        options?.onProgress?.(status);
      },
      onError: (error: unknown) => {
        thumbnailEventService.emitError(error);
        options?.onError?.(error);
      },
      onComplete: (data: any) => {
        thumbnailEventService.emitComplete(data);
        options?.onComplete?.(data);
      }
    });
  } catch (error) {
    actionLogger.error('Error reprocessing thumbnails:', error);
    thumbnailEventService.emitError(error);
    throw error;
  }
}

export async function optimizeThumbnails(options?: {
  onProgress?: (status: ProcessStatus) => void;
  onError?: (error: unknown) => void;
  onComplete?: (data: any) => void;
}) {
  try {
    return await thumbnailService.optimizeThumbnails({
      onProgress: (status: ProcessStatus) => {
        thumbnailEventService.emitProgress(status);
        options?.onProgress?.(status);
      },
      onError: (error: unknown) => {
        thumbnailEventService.emitError(error);
        options?.onError?.(error);
      },
      onComplete: (data: any) => {
        thumbnailEventService.emitComplete(data);
        options?.onComplete?.(data);
      }
    });
  } catch (error) {
    actionLogger.error('Error optimizing thumbnails:', error);
    thumbnailEventService.emitError(error);
    throw error;
  }
}

export async function cleanThumbnails(options?: {
  onProgress?: (status: ProcessStatus) => void;
  onError?: (error: unknown) => void;
  onComplete?: (data: any) => void;
}) {
  try {
    return await thumbnailService.cleanThumbnails({
      onProgress: (status: ProcessStatus) => {
        thumbnailEventService.emitProgress(status);
        options?.onProgress?.(status);
      },
      onError: (error: unknown) => {
        thumbnailEventService.emitError(error);
        options?.onError?.(error);
      },
      onComplete: (data: any) => {
        thumbnailEventService.emitComplete(data);
        options?.onComplete?.(data);
      }
    });
  } catch (error) {
    actionLogger.error('Error cleaning thumbnails:', error);
    thumbnailEventService.emitError(error);
    throw error;
  }
}

export async function getStats() {
  try {
    const stats = await thumbnailService.getStats();
    thumbnailEventService.emitStats(stats);
    return stats;
  } catch (error) {
    actionLogger.error('Error getting thumbnail stats:', error);
    thumbnailEventService.emitError(error);
    throw error;
  }
}