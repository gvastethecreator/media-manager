export interface ThumbnailStats {
  pending: number;
  processed: number;
  total: number;
  errors: ThumbnailError[];
}

export interface ThumbnailError {
  imageId: string;
  imagePath: string;
  error: string;
  timestamp: string | Date;
}

export interface ThumbnailProcessStatus {
  status?: string;
  current?: number;
  total?: number;
  progress?: number;
  currentFile?: string;
  lastProcessed?: LastProcessedThumbnail;
}

export interface LastProcessedThumbnail {
  id: string;
  path: string;
  processedAt: string;
  saved?: number;
}

export interface OptimizeResult {
  optimized: number;
  totalSaved: number;
}

export interface CleanResult {
  cleaned: number;
  totalFreed: number;
}

export interface ReprocessResult {
  processed: number;
}

export interface ThumbnailCallbacks {
  onProgress?: (status: ThumbnailProcessStatus) => void;
  onError?: (error: unknown) => void;
  onComplete?: (data: OptimizeResult | CleanResult | ReprocessResult) => void;
}

export type ThumbnailQuality = 'compressed' | 'low' | 'medium' | 'high';

export interface ThumbnailQualityConfig {
  quality: number;
  width: number;
  height: number;
}

export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, ThumbnailQualityConfig> = {
  compressed: { quality: 60, width: 200, height: 200 },
  low: { quality: 70, width: 300, height: 300 },
  medium: { quality: 80, width: 400, height: 400 },
  high: { quality: 90, width: 500, height: 500 }
};