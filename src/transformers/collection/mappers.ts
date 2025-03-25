/**
 * @file Funciones de mapeo para la entidad Collection
 * @module transformers/collection/mappers
 */

import type { CollectionExtended, CollectionSummary } from '@/types/entities/collection';
import { COLLECTION_CATEGORY_COLORS, COLLECTION_CATEGORY_EMOJIS, CollectionCategory, CollectionRarity } from '@/types/entities/collection';
import type { Image, Collection as PrismaCollection } from '@prisma/client';
import { parseCollectionFilters } from './serializers';

/**
 * Mapeador para obtener una lista de colecciones a partir de datos de Prisma
 * @param collections Datos de colecciones desde Prisma
 * @param imageCountMap Mapa opcional con conteo de imágenes por colección
 * @returns Array de CollectionExtended
 */
export function mapCollectionsFromPrisma(
  collections: PrismaCollection[],
  imageCountMap?: Record<string, number>
): CollectionExtended[] {
  return collections.map(collection => mapCollectionFromPrisma(collection, imageCountMap?.[collection.id]));
}

/**
 * Mapeador para obtener una colección extendida a partir de datos de Prisma
 * @param collection Datos de colección desde Prisma
 * @param imageCount Contador opcional de imágenes
 * @returns CollectionExtended
 */
export function mapCollectionFromPrisma(
  collection: PrismaCollection,
  imageCount?: number
): CollectionExtended {
  const parsedFilters = collection.filters ? parseCollectionFilters(collection.filters) : [];

  return {
    ...collection,
    // Propiedades adicionales de UI
    isSelected: false,
    isHovered: false,
    isOpen: false,
    isLoading: false,
    hasError: false,
    // Datos calculados
    parsedFilters,
    imageCount: imageCount || 0,
    totalValue: collection.price || 0,
  };
}

/**
 * Mapeador para obtener un resumen de colecciones a partir de datos extendidos
 * @param collections Colecciones extendidas
 * @returns Array de CollectionSummary
 */
export function mapCollectionsToSummary(collections: CollectionExtended[]): CollectionSummary[] {
  return collections.map(collection => ({
    id: collection.id,
    name: collection.name,
    emoji: collection.emoji || '🌟',
    color: collection.color || '#3b82f6',
    imageCount: collection.imageCount || 0,
    category: collection.category,
    rarity: collection.rarity,
  }));
}

/**
 * Mapeador para crear datos de colección a partir de un formulario
 * @param formData Datos del formulario
 * @returns Datos parciales de Collection
 */
export function mapFormToCollection(formData: Record<string, any>): Partial<PrismaCollection> {
  return {
    name: formData.name,
    description: formData.description || '',
    emoji: formData.emoji || '🌟',
    color: formData.color || '#3b82f6',
    category: formData.category || null,
    rarity: formData.rarity || CollectionRarity.COMMON,
    url: formData.url || null,
    alternativeUrl: formData.alternativeUrl || null,
    platform: formData.platform || null,
    price: formData.price ? parseFloat(formData.price) : null,
    isFavorite: Boolean(formData.isFavorite),
    presetId: formData.presetId || null,
    texture: formData.texture || null,
  };
}

/**
 * Asigna color y emoji según la categoría si no están definidos
 * @param collection Colección a procesar
 * @returns Colección con color y emoji asignados
 */
export function applyDefaultStyleByCategory(
  collection: Partial<CollectionExtended>
): Partial<CollectionExtended> {
  if (!collection.category) {
    return collection;
  }

  const category = collection.category as CollectionCategory;

  return {
    ...collection,
    color: collection.color || COLLECTION_CATEGORY_COLORS[category] || '#3b82f6',
    emoji: collection.emoji || COLLECTION_CATEGORY_EMOJIS[category] || '🌟',
  };
}

/**
 * Extrae las imágenes destacadas de una colección
 * @param collection Colección con imágenes
 * @param maxImages Número máximo de imágenes a extraer
 * @returns URLs de imágenes destacadas
 */
export function extractFeaturedImages(
  collection: CollectionExtended & { images?: Image[] },
  maxImages = 3
): string[] {
  if (!collection.images || collection.images.length === 0) {
    return [];
  }

  // Priorizar la imagen destacada si existe
  const featuredImages: string[] = [];

  if (collection.featuredImage) {
    featuredImages.push(collection.featuredImage);
  }

  // Agregar hasta maxImages imágenes de la colección
  const remainingImages = collection.images
    .filter(img => img.path !== collection.featuredImage)
    .slice(0, maxImages - featuredImages.length);

  return [...featuredImages, ...remainingImages.map(img => img.path)];
}