/**
 * @file Funciones para serializar y deserializar datos de propiedades
 * @module transformers/property/serializers
 */

// Constantes para valores por defecto
export const DEFAULT_PROPERTY_EMOJI = '🔍';
export const DEFAULT_PROPERTY_COLOR = '#3b82f6';

/**
 * Genera un emoji para la propiedad basado en su nombre y categoría
 * @param name Nombre de la propiedad
 * @param category Categoría de la propiedad
 * @returns Emoji adecuado para la propiedad
 */
export function generatePropertyEmoji(name: string, category?: string): string {
  // Normalizar nombre y categoría para búsqueda
  const normalizedName = name.toLowerCase();
  const normalizedCategory = category?.toLowerCase() || '';

  // Mapeo de categorías comunes a emojis
  if (normalizedName.includes('color') || normalizedName.includes('colour')) {
    return '🎨';
  }

  if (normalizedName.includes('size') || normalizedName.includes('dimension')) {
    return '📏';
  }

  if (normalizedName.includes('weight') || normalizedName.includes('mass')) {
    return '⚖️';
  }

  if (normalizedName.includes('time') || normalizedName.includes('date')) {
    return '⏱️';
  }

  if (normalizedName.includes('location') || normalizedName.includes('place')) {
    return '📍';
  }

  if (normalizedName.includes('material') || normalizedName.includes('substance')) {
    return '💎';
  }

  if (normalizedName.includes('quality') || normalizedName.includes('rating')) {
    return '⭐';
  }

  if (normalizedName.includes('price') || normalizedName.includes('cost')) {
    return '💰';
  }

  if (normalizedName.includes('author') || normalizedName.includes('creator')) {
    return '👤';
  }

  // Categorías específicas
  if (normalizedCategory === 'physical') {
    return '📦';
  }

  if (normalizedCategory === 'metadata') {
    return '📝';
  }

  if (normalizedCategory === 'technical') {
    return '⚙️';
  }

  // Valor predeterminado
  return DEFAULT_PROPERTY_EMOJI;
}

/**
 * Genera un color para la propiedad basado en su nombre
 * @param name Nombre de la propiedad
 * @returns Color en formato hexadecimal
 */
export function generatePropertyColor(name: string): string {
  // Lista de colores predefinidos
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f97316', // orange
    '#d946ef', // fuchsia
  ];

  // Calcular un valor hash simple basado en el nombre
  const hashValue = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  // Seleccionar un color basado en el hash
  return colors[hashValue % colors.length];
}

/**
 * Extiende una propiedad de Prisma con propiedades calculadas y formateadas para la UI
 * @param property Propiedad base de la base de datos
 * @returns Propiedad extendida con propiedades calculadas
 */
export function extendProperty(property: any) {
  if (!property) return null;

  return {
    ...property,
    // Asegurar que las fechas sean instancias de Date
    createdAt: property.createdAt instanceof Date ? property.createdAt : new Date(property.createdAt),
    updatedAt: property.updatedAt instanceof Date ? property.updatedAt : new Date(property.updatedAt),
    // Calcular contadores de elementos relacionados si están disponibles
    itemCount: property._count ? (
      (property._count.images || 0) +
      (property._count.videos || 0) +
      (property._count.albums || 0) +
      (property._count.collections || 0) +
      (property._count.tags || 0) +
      (property._count.characters || 0) +
      (property._count.places || 0) +
      (property._count.worldItems || 0) +
      (property._count.concepts || 0) +
      (property._count.prompts || 0) +
      (property._count.notes || 0) +
      (property._count.wildcards || 0) +
      (property._count.groups || 0)
    ) : 0
  };
}

/**
 * Extiende un array de propiedades con propiedades calculadas
 * @param properties Array de propiedades de la base de datos
 * @returns Array de propiedades extendidas
 */
export function extendProperties(properties: any[]) {
  if (!properties || !Array.isArray(properties)) return [];
  return properties.map(property => extendProperty(property));
}