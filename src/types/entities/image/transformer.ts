/**
 * @file Transformer for image entity
 * @module types/entities/image/transformer
 */

import type { Transformer } from '@/types/common/transformer';
import type { Image as PrismaImage } from '@prisma/client';
import type { ImageBase, ImageExtended } from './types';

/**
 * Type for database image record
 */
export type ImageDBRecord = PrismaImage;

/**
 * Type for API response of image
 */
export type ImageResult = ImageExtended;

/**
 * Transformer for images
 */
export const imageTransformer: Transformer<ImageDBRecord, ImageBase, ImageResult> = {
  /**
   * Transform database record to domain entity
   */
  fromDB: (record): ImageBase => {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      path: record.path,
      hash: record.hash,
      size: record.size,
      width: record.width,
      height: record.height,
      metadata: record.metadata,
      isFavorite: record.isFavorite,
      isPublic: record.isPublic,
      folderId: record.folderId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      addedAt: record.addedAt,
    };
  },

  /**
   * Transform domain entity to client result with additional data
   */
  toClient: (entity, options): ImageResult => {
    // Parse metadata if available
    const metadata = entity.metadata ? JSON.parse(entity.metadata as string) : null;

    // Calculate thumbnail URL if available
    const hasThumbnail = !!entity.thumbnailWidth && !!entity.thumbnailHeight;
    const thumbnailUrl = hasThumbnail
      ? `/api/images/${entity.id}/thumbnail`
      : null;

    // Calculate full image URL
    const fullUrl = `/api/images/${entity.id}`;

    // Calculate aspect ratio
    const aspectRatio = entity.width && entity.height
      ? entity.width / entity.height
      : 1;

    return {
      ...entity,
      displayName: entity.name || 'Sin nombre',
      thumbnailUrl,
      fullUrl,
      aspectRatio,
      metadata,
      hasThumbnail,
      hasMetadata: !!metadata,
      isProcessed: true,
      folder: options?.includes?.folder,
    };
  },

  /**
   * Transform client input to database record for creation
   */
  toDB: (input): Partial<ImageDBRecord> => {
    const { metadata, ...rest } = input;

    return {
      ...rest,
      metadata: metadata ?
        (typeof metadata === 'string' ? metadata : JSON.stringify(metadata))
        : null,
    };
  }
};