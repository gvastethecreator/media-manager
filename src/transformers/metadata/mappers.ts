import { formatBytes } from '@/lib/utils/format';
import type { MetadataBase } from '@/types/entities/metadata/base';
import type { MetadataCard, MetadataExtended, MetadataListItem } from '@/types/entities/metadata/extended';

// Mapear datos de Prisma a tipo extendido
export function extendMetadata(metadata: MetadataBase): MetadataExtended {
  const aspectRatio = metadata.width / metadata.height;
  const formattedSize = formatBytes(metadata.size);
  const dimensions = `${metadata.width}x${metadata.height}`;

  return {
    ...metadata,
    aspectRatio,
    formattedSize,
    dimensions,
  };
}

// Mapear a formato de tarjeta
export function toMetadataCard(metadata: MetadataBase): MetadataCard {
  return {
    id: metadata.id,
    dimensions: `${metadata.width}x${metadata.height}`,
    formattedSize: formatBytes(metadata.size),
    format: metadata.format,
    hasExif: false, // Se actualiza cuando se implementen los metadatos EXIF
  };
}

// Mapear a formato de lista
export function toMetadataListItem(metadata: MetadataBase): MetadataListItem {
  return {
    id: metadata.id,
    imageId: metadata.imageId,
    dimensions: `${metadata.width}x${metadata.height}`,
    format: metadata.format,
    size: metadata.size,
    formattedSize: formatBytes(metadata.size),
    updatedAt: metadata.updatedAt,
  };
}

// Mapear datos de creación a formato Prisma
export function mapCreateMetadataDataToPrisma(data: Partial<MetadataBase>) {
  return {
    imageId: data.imageId,
    format: data.format,
    width: data.width,
    height: data.height,
    size: data.size,
    colorSpace: data.colorSpace,
    hasAlpha: data.hasAlpha,
    orientation: data.orientation,
  };
}

// Mapear datos de actualización a formato Prisma
export function mapUpdateMetadataDataToPrisma(data: Partial<MetadataBase>) {
  return {
    format: data.format,
    width: data.width,
    height: data.height,
    size: data.size,
    colorSpace: data.colorSpace,
    hasAlpha: data.hasAlpha,
    orientation: data.orientation,
  };
}