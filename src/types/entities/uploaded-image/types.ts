/**
 * @file Types for uploaded images entity
 * @module types/entities/uploaded-image/types
 */

import { type BaseEntity, BaseEntitySchema, MetadataFieldsSchema } from '@/types/common/transformer';
import { UploadedFileType } from '@/types/uploaded-images';
import { z } from 'zod';

/**
 * Re-export the UploadedFileType for use as UploadedImageType
 * This creates a proper type alias to fix the current casting approach
 */
export type UploadedImageType = UploadedFileType;

/**
 * Schema for uploaded image validation
 */
export const UploadedImageSchema = z.object({
  ...BaseEntitySchema.shape,
  ...MetadataFieldsSchema.shape,
  path: z.string(),
  originalName: z.string().optional(),
  type: z.nativeEnum(UploadedFileType),
  category: z.string(),
  size: z.number(),
  width: z.number(),
  height: z.number(),
  metadata: z.string().nullable().optional(),
  uploadedAt: z.date(),
});

/**
 * Base interface for uploaded images
 */
export interface UploadedImageBase extends BaseEntity {
  path: string;
  originalName?: string;
  type: UploadedImageType;
  category: string;
  size: number;
  width: number;
  height: number;
  metadata?: string | null;
  uploadedAt: Date;
}

/**
 * Interface for dimensions with aspect ratio
 */
export interface UploadedImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Interface for uploaded image with additional client-side properties
 */
export interface UploadedImageExtended extends UploadedImageBase {
  dimensions: UploadedImageDimensions;
  url: string;
  thumbnailUrl?: string;
}

/**
 * Data required to create an uploaded image
 */
export type UploadedImageCreateInput = Omit<UploadedImageBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an uploaded image
 */
export type UploadedImageUpdateInput = Partial<Omit<UploadedImageBase, 'id' | 'createdAt' | 'updatedAt'>>;