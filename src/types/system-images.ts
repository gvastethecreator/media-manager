import { SystemImageType } from './entities'

export interface SystemImageMetadata {
  mimeType?: string
  format?: string
  quality?: number
  compression?: number
  originalName?: string
  originalPath?: string
  hash?: string
  [key: string]: any
}

export interface SystemImageDimensions {
  width: number
  height: number
  aspectRatio: number
}

export interface SystemImageStats {
  total: number
  byType: Record<SystemImageType, number>
  totalSize: number
  averageSize: number
}

export interface SystemImageFilters {
  type?: SystemImageType
  category?: string
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  minSize?: number
  maxSize?: number
  search?: string
  sortBy?: 'createdAt' | 'name' | 'size' | 'type'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface SystemImageResult {
  id: string
  name: string
  path: string
  type: SystemImageType
  category: string
  size: number
  width: number
  height: number
  metadata: SystemImageMetadata | null
  dimensions: SystemImageDimensions
  url: string
  thumbnailUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface SystemImageResults {
  items: SystemImageResult[]
  total: number
  page: number
  pageSize: number
  stats: SystemImageStats
}

export interface SystemImageFile extends Partial<File> {
  path: string;
  size: number;
}

export interface CreateSystemImageParams {
  name: string
  type: SystemImageType
  category: string
  file: SystemImageFile
  dimensions: SystemImageDimensions
  metadata?: SystemImageMetadata
  processingOptions?: SystemImageProcessingOptions
}

export interface UpdateSystemImageParams {
  id: string;
  name?: string;
  type?: SystemImageType;
  category?: string;
  file?: SystemImageFile;
  dimensions?: SystemImageDimensions;
  metadata?: SystemImageMetadata;
  processingOptions?: SystemImageProcessingOptions;
}

export interface GetSystemImagesParams {
  filters?: SystemImageFilters
  includeDimensions?: boolean
  includeThumbnails?: boolean
  targetDimensions?: SystemImageDimensions
}

export interface SystemImageEvents {
  IMAGE_CREATED: string
  IMAGE_UPDATED: string
  IMAGE_DELETED: string
  IMAGES_CHANGED: string
}

export const SYSTEM_IMAGE_EVENTS: SystemImageEvents = {
  IMAGE_CREATED: 'system-image:created',
  IMAGE_UPDATED: 'system-image:updated',
  IMAGE_DELETED: 'system-image:deleted',
  IMAGES_CHANGED: 'system-images:changed',
}

export interface SystemImageProcessingOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  position?: 'center' | 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top'
  background?: string
  withoutEnlargement?: boolean
  progressive?: boolean
  optimizationLevel?: number
}