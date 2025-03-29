/**
 * @file Funciones para serializar y deserializar datos de comodines
 * @module transformers/wildcard/serializers
 */

// Constantes para valores por defecto
export const DEFAULT_WILDCARD_EMOJI = '🎭';
export const DEFAULT_WILDCARD_COLOR = '#3b82f6';

/**
 * Genera un emoji para el comodín basado en su nombre y categoría
 * @param name Nombre del comodín
 * @param category Categoría del comodín
 * @returns Emoji adecuado para el comodín
 */
export function generateWildcardEmoji(name: string, category?: string): string {
  // Normalizar nombre y categoría para búsqueda
  const normalizedName = name.toLowerCase();
  const normalizedCategory = category?.toLowerCase() || '';

  // Mapeo de categorías comunes a emojis
  if (normalizedName.includes('character') || normalizedName.includes('person')) {
    return '👤';
  }

  if (normalizedName.includes('landscape') || normalizedName.includes('scenery')) {
    return '🏞️';
  }

  if (normalizedName.includes('animal') || normalizedName.includes('creature')) {
    return '🐾';
  }

  if (normalizedName.includes('weapon') || normalizedName.includes('sword')) {
    return '⚔️';
  }

  if (normalizedName.includes('style') || normalizedName.includes('aesthetic')) {
    return '🎨';
  }

  if (normalizedName.includes('color') || normalizedName.includes('colour')) {
    return '🌈';
  }

  if (normalizedName.includes('random') || normalizedName.includes('surprise')) {
    return '🎲';
  }

  if (normalizedName.includes('template') || normalizedName.includes('preset')) {
    return '📋';
  }

  // Categorías específicas
  if (normalizedCategory === 'characters') {
    return '👥';
  }

  if (normalizedCategory === 'places') {
    return '🗺️';
  }

  if (normalizedCategory === 'objects') {
    return '🧩';
  }

  if (normalizedCategory === 'styles') {
    return '✨';
  }

  // Valor predeterminado
  return DEFAULT_WILDCARD_EMOJI;
}

/**
 * Genera un color para el comodín basado en su nombre
 * @param name Nombre del comodín
 * @returns Color en formato hexadecimal
 */
export function generateWildcardColor(name: string): string {
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
 * Parsea los hijos serializados de un comodín
 * @param childrenJson String JSON con los hijos
 * @returns Array de hijos parseado o array vacío
 */
export function parseWildcardChildren(childrenJson: string): any[] {
  if (!childrenJson || childrenJson === 'empty_array') {
    return [];
  }

  try {
    return JSON.parse(childrenJson);
  } catch (error) {
    console.error('Error parsing wildcard children:', error);
    return [];
  }
}

/**
 * Serializa los hijos de un comodín a formato JSON
 * @param children Array de hijos a serializar
 * @returns String JSON con los hijos
 */
export function serializeWildcardChildren(children: any[]): string {
  if (!children || children.length === 0) {
    return 'empty_array';
  }

  try {
    return JSON.stringify(children);
  } catch (error) {
    console.error('Error serializing wildcard children:', error);
    return 'empty_array';
  }
}