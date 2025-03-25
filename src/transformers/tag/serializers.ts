/**
 * @file Funciones para serializar y deserializar datos de etiquetas
 * @module transformers/tag/serializers
 */

import {
    type Tag,
    type TagBase,
    type TagWithStats,
    TagCategory,
    TagRarity
} from '../../types/entities/tag/index';

/**
 * Convierte una etiqueta básica en una etiqueta extendida
 * @param tag Etiqueta básica
 * @returns Etiqueta con información adicional
 */
export function extendTag(tag: TagBase): Tag {
  const extended: Tag = {
    ...tag,
    isSelected: false,
    isExpanded: false,
    isEditing: false,
    isHighlighted: false
  };

  return extended;
}

/**
 * Convierte múltiples etiquetas básicas en etiquetas extendidas
 * @param tags Lista de etiquetas básicas
 * @returns Lista de etiquetas extendidas
 */
export function extendTags(tags: TagBase[]): Tag[] {
  return tags.map(extendTag);
}

/**
 * Convierte una etiqueta en su versión con estadísticas
 * @param tag Etiqueta base
 * @param imageCount Número de imágenes asociadas
 * @param totalSize Tamaño total en bytes
 * @returns Etiqueta con estadísticas
 */
export function tagToTagWithStats(
  tag: TagBase,
  imageCount = 0,
  totalSize = 0
): TagWithStats {
  return {
    ...tag,
    count: imageCount,
    size: formatSize(totalSize)
  };
}

/**
 * Formatea un tamaño en bytes a una representación legible
 * @param bytes Tamaño en bytes
 * @returns Tamaño formateado (ej: "1.23 MB")
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Normaliza una categoría de etiqueta
 * @param category Categoría a normalizar (o undefined)
 * @returns Categoría normalizada
 */
export function normalizeTagCategory(category?: string | null): TagCategory {
  if (!category) return TagCategory.OTHER;

  // Intentar mapear a una categoría existente
  const lowerCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(TagCategory)) {
    if (value.toLowerCase() === lowerCategory) {
      return value as TagCategory;
    }
  }

  return TagCategory.CUSTOM;
}

/**
 * Normaliza una rareza de etiqueta
 * @param rarity Rareza a normalizar (o undefined)
 * @returns Rareza normalizada
 */
export function normalizeTagRarity(rarity?: string | null): TagRarity {
  if (!rarity) return TagRarity.COMMON;

  // Intentar mapear a una rareza existente
  const lowerRarity = rarity.toLowerCase();
  for (const [key, value] of Object.entries(TagRarity)) {
    if (value.toLowerCase() === lowerRarity) {
      return value as TagRarity;
    }
  }

  return TagRarity.COMMON;
}

/**
 * Genera un color por defecto basado en el nombre de la etiqueta
 * @param name Nombre de la etiqueta
 * @returns Color en formato hexadecimal
 */
export function generateTagColor(name: string): string {
  if (!name) return '#3b82f6'; // Azul por defecto

  // Generar un hash del nombre
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convertir a color hexadecimal
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }

  return color;
}

/**
 * Genera un emoji basado en el nombre o categoría de la etiqueta
 * @param name Nombre de la etiqueta
 * @param category Categoría de la etiqueta
 * @returns Emoji representativo
 */
export function generateTagEmoji(name: string, category?: string): string {
  // Mapeo de categorías a emojis
  const categoryEmojis: Record<string, string> = {
    [TagCategory.CHARACTER]: '👤',
    [TagCategory.LOCATION]: '📍',
    [TagCategory.OBJECT]: '🔮',
    [TagCategory.CONCEPT]: '💭',
    [TagCategory.EVENT]: '🎉',
    [TagCategory.COLOR]: '🎨',
    [TagCategory.STYLE]: '✨',
    [TagCategory.EMOTION]: '😊',
    [TagCategory.CUSTOM]: '🏷️',
    [TagCategory.OTHER]: '📌'
  };

  // Si hay categoría y está en el mapeo, usar ese emoji
  if (category && categoryEmojis[category]) {
    return categoryEmojis[category];
  }

  // Análisis básico del nombre para decidir un emoji
  const lowerName = name.toLowerCase();

  if (lowerName.includes('person') || lowerName.includes('character')) return '👤';
  if (lowerName.includes('place') || lowerName.includes('location')) return '📍';
  if (lowerName.includes('object') || lowerName.includes('item')) return '🔮';
  if (lowerName.includes('concept') || lowerName.includes('idea')) return '💭';
  if (lowerName.includes('event') || lowerName.includes('celebration')) return '🎉';
  if (lowerName.includes('color') || lowerName.includes('colour')) return '🎨';
  if (lowerName.includes('style') || lowerName.includes('design')) return '✨';
  if (lowerName.includes('emotion') || lowerName.includes('feeling')) return '😊';

  // Emoji por defecto
  return '🏷️';
}