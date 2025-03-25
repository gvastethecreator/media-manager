import type { MetadataBase } from './base';

// Tipo extendido para UI con información adicional
export interface MetadataExtended extends MetadataBase {
  aspectRatio: number;
  formattedSize: string;
  dimensions: string;
  exif?: {
    make?: string;
    model?: string;
    exposureTime?: string;
    fNumber?: number;
    iso?: number;
    focalLength?: string;
    lensModel?: string;
    dateTimeOriginal?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
  };
}

// Tipo para la vista de metadatos en tarjetas
export interface MetadataCard {
  id: string;
  dimensions: string;
  formattedSize: string;
  format: string;
  hasExif: boolean;
}

// Tipo para la vista de lista de metadatos
export interface MetadataListItem {
  id: string;
  imageId: string;
  dimensions: string;
  format: string;
  size: number;
  formattedSize: string;
  updatedAt: Date;
}