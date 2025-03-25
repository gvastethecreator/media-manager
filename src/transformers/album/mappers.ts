/**
 * @file Funciones de mapeo para la entidad Album
 * @module transformers/album/mappers
 */

import {
    type AlbumMetadata,
    type CreateAlbumData,
    type UpdateAlbumData,
    AlbumPrivacyLevel,
    AlbumType
} from '../../types/entities/album';
import { generateAlbumSlug, serializeAlbumViewConfig } from './serializers';

/**
 * Mapea datos de creación de álbum a formato compatible con Prisma
 * @param data Datos de creación de álbum
 * @returns Objeto formateado para Prisma
 */
export function mapCreateAlbumDataToPrisma(data: CreateAlbumData) {
  // Generar slug a partir del nombre
  const slug = generateAlbumSlug(data.name);

  // Serializar configuración de visualización si existe
  const viewConfig = data.viewConfig
    ? serializeAlbumViewConfig(data.viewConfig)
    : undefined;

  return {
    name: data.name,
    description: data.description || '',
    coverImageId: data.coverImageId || null,
    type: data.type || AlbumType.STANDARD,
    parentId: data.parentId || null,
    slug,
    isArchived: false,
    privacyLevel: data.privacyLevel || AlbumPrivacyLevel.PRIVATE,
    viewConfig
  };
}

/**
 * Mapea datos de actualización de álbum a formato compatible con Prisma
 * @param data Datos de actualización de álbum
 * @returns Objeto formateado para Prisma
 */
export function mapUpdateAlbumDataToPrisma(data: UpdateAlbumData) {
  // Construir objeto de actualización
  const updateData: Record<string, any> = {};

  // Actualizar propiedades básicas si están presentes
  if (data.name !== undefined) {
    updateData.name = data.name;
    // Actualizar slug si cambia el nombre
    updateData.slug = generateAlbumSlug(data.name);
  }

  if (data.description !== undefined) updateData.description = data.description;
  if (data.coverImageId !== undefined) updateData.coverImageId = data.coverImageId;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.parentId !== undefined) updateData.parentId = data.parentId;
  if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
  if (data.privacyLevel !== undefined) updateData.privacyLevel = data.privacyLevel;

  // Serializar configuración de visualización si existe
  if (data.viewConfig) {
    updateData.viewConfig = serializeAlbumViewConfig(data.viewConfig);
  }

  return updateData;
}

/**
 * Calcula los metadatos de un álbum basado en sus elementos
 * @param items Array de elementos del álbum
 * @returns Objeto de metadatos calculados
 */
export function calculateAlbumMetadata(
  items: Array<{ itemType: 'image' | 'video'; size?: number; createdAt?: Date | string }>
): AlbumMetadata {
  const metadata: AlbumMetadata = {
    itemCount: items.length,
    imageCount: 0,
    videoCount: 0,
    totalSize: 0,
    dateRange: {
      from: null,
      to: null
    }
  };

  // No hay elementos
  if (items.length === 0) {
    return metadata;
  }

  // Fechas iniciales para comparación
  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;

  // Procesar cada elemento
  items.forEach(item => {
    // Contar por tipo
    if (item.itemType === 'image') {
      metadata.imageCount! += 1;
    } else if (item.itemType === 'video') {
      metadata.videoCount! += 1;
    }

    // Sumar tamaño
    if (item.size) {
      metadata.totalSize! += item.size;
    }

    // Procesar fecha si existe
    if (item.createdAt) {
      const itemDate = new Date(item.createdAt);

      if (!earliestDate || itemDate < earliestDate) {
        earliestDate = itemDate;
      }

      if (!latestDate || itemDate > latestDate) {
        latestDate = itemDate;
      }
    }
  });

  // Asignar rango de fechas si se encontraron
  if (earliestDate) {
    metadata.dateRange!.from = earliestDate.toISOString();
  }

  if (latestDate) {
    metadata.dateRange!.to = latestDate.toISOString();
  }

  return metadata;
}

/**
 * Formatea el recuento de elementos de un álbum
 * @param metadata Metadatos del álbum
 * @returns String con el recuento formateado
 */
export function formatAlbumItemCount(metadata?: AlbumMetadata): string {
  if (!metadata) return '0 elementos';

  const totalItems = metadata.itemCount || 0;

  if (totalItems === 0) {
    return 'Álbum vacío';
  } else if (totalItems === 1) {
    return '1 elemento';
  }

  // Si tenemos desglose de tipos
  if (metadata.imageCount !== undefined && metadata.videoCount !== undefined) {
    const images = metadata.imageCount;
    const videos = metadata.videoCount;

    if (images > 0 && videos > 0) {
      return `${totalItems} elementos (${images} imágenes, ${videos} videos)`;
    } else if (images > 0) {
      return `${images} ${images === 1 ? 'imagen' : 'imágenes'}`;
    } else if (videos > 0) {
      return `${videos} ${videos === 1 ? 'video' : 'videos'}`;
    }
  }

  return `${totalItems} elementos`;
}

/**
 * Formatea el rango de fechas de un álbum
 * @param metadata Metadatos del álbum
 * @returns String con el rango de fechas formateado
 */
export function formatAlbumDateRange(metadata?: AlbumMetadata): string {
  if (!metadata?.dateRange?.from) return '';

  const fromDate = new Date(metadata.dateRange.from);

  // Si no hay fecha final o es la misma que la inicial
  if (!metadata.dateRange.to || metadata.dateRange.from === metadata.dateRange.to) {
    return fromDate.toLocaleDateString();
  }

  const toDate = new Date(metadata.dateRange.to);

  // Si son del mismo año
  if (fromDate.getFullYear() === toDate.getFullYear()) {
    // Si son del mismo mes
    if (fromDate.getMonth() === toDate.getMonth()) {
      return `${fromDate.getDate()} - ${toDate.getDate()} de ${fromDate.toLocaleDateString('default', { month: 'long' })} de ${fromDate.getFullYear()}`;
    }
    // Mismo año, distinto mes
    return `${fromDate.toLocaleDateString('default', { day: 'numeric', month: 'short' })} - ${toDate.toLocaleDateString('default', { day: 'numeric', month: 'short' })} de ${fromDate.getFullYear()}`;
  }

  // Distinto año
  return `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;
}