/**
 * @file Transformer for uploaded images entity
 * @module types/entities/uploaded-image/transformers
 */

import type { Transformer } from '@/types/common/transformer';
import type { MediaMetadata } from '@/types/metadata.types';
import type { JSONString } from '@/utils/types/utility-types';
import type {
    UploadedImageBase,
    UploadedImageDimensions,
    UploadedImageExtended,
    UploadedImageType
} from './types';

/**
 * Type for database uploaded image record
 */
export type UploadedImageDBRecord = {
  id: string;
  name: string;
  path: string;
  originalName?: string;
  type: string;
  category: string;
  size: number;
  width: number;
  height: number;
  metadata: string | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Type for API response of uploaded image
 */
export type UploadedImageResult = UploadedImageExtended;

/**
 * Transformer for uploaded images
 */
export const uploadedImageTransformer: Transformer<UploadedImageDBRecord, UploadedImageBase, UploadedImageResult> = {
  /**
   * Transform database record to domain entity
   */
  fromDB: (record): UploadedImageBase => {
    return {
      id: record.id,
      name: record.name,
      path: record.path,
      originalName: record.originalName,
      type: record.type as UploadedImageType,
      category: record.category,
      size: record.size,
      width: record.width,
      height: record.height,
      metadata: record.metadata,
      uploadedAt: record.uploadedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  /**
   * Transform domain entity to client result with additional data
   */
  toClient: (entity, options): UploadedImageResult => {
    // Calculate dimensions with aspect ratio
    const dimensions: UploadedImageDimensions = {
      width: entity.width,
      height: entity.height,
      aspectRatio: entity.width / entity.height,
    };

    // Generate URLs
    const url = `/api/images/${encodeURIComponent(entity.path)}`;
    const thumbnailUrl = `/api/images/thumbnails/${encodeURIComponent(entity.path)}`;

    // Parse metadata if available
    const parsedMetadata = entity.metadata
      ? JSON.parse(entity.metadata) as MediaMetadata
      : null;

    return {
      ...entity,
      dimensions,
      url,
      thumbnailUrl,
      metadata: entity.metadata as JSONString<MediaMetadata>,
    };
  },

  /**
   * Transform client input to database record for creation
   */
  toDB: (input): Partial<UploadedImageDBRecord> => {
    const { metadata, ...rest } = input;

    return {
      ...rest,
      metadata: metadata ?
        (typeof metadata === 'string' ? metadata : JSON.stringify(metadata))
        : null,
    };
  }
};