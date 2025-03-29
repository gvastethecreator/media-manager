/**
 * @file Funciones para serializar y deserializar datos de grupos
 * @module transformers/group/serializers
 */

// Constantes para valores por defecto
export const DEFAULT_GROUP_EMOJI = '📂';
export const DEFAULT_GROUP_COLOR = '#3b82f6';

/**
 * Genera un emoji para el grupo basado en su nombre y categoría
 * @param name Nombre del grupo
 * @param category Categoría del grupo
 * @returns Emoji adecuado para el grupo
 */
export function generateGroupEmoji(name: string, category?: string): string {
  // Normalizar nombre y categoría para búsqueda
  const normalizedName = name.toLowerCase();
  const normalizedCategory = category?.toLowerCase() || '';

  // Mapeo de categorías comunes a emojis
  if (normalizedCategory === 'favorites' || normalizedName.includes('favorit')) {
    return '⭐';
  }

  if (normalizedCategory === 'archive' || normalizedName.includes('archiv')) {
    return '🗄️';
  }

  if (normalizedCategory === 'projects' || normalizedName.includes('project')) {
    return '📊';
  }

  if (normalizedCategory === 'collections' || normalizedName.includes('collect')) {
    return '🌟';
  }

  if (normalizedCategory === 'smart' || normalizedName.includes('smart')) {
    return '🧠';
  }

  if (normalizedName.includes('recent')) {
    return '🕒';
  }

  // Valor predeterminado
  return DEFAULT_GROUP_EMOJI;
}

/**
 * Genera un color para el grupo basado en su nombre
 * @param name Nombre del grupo
 * @returns Color en formato hexadecimal
 */
export function generateGroupColor(name: string): string {
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
 * Parsea los filtros serializados de un grupo
 * @param filtersJson String JSON con los filtros
 * @returns Objeto de filtros parseado o array vacío
 */
export function parseGroupFilters(filtersJson: string): any[] {
  if (!filtersJson || filtersJson === 'empty_array') {
    return [];
  }

  try {
    return JSON.parse(filtersJson);
  } catch (error) {
    console.error('Error parsing group filters:', error);
    return [];
  }
}

/**
 * Serializa los filtros de un grupo a formato JSON
 * @param filters Filtros a serializar
 * @returns String JSON con los filtros
 */
export function serializeGroupFilters(filters: any[]): string {
  if (!filters || filters.length === 0) {
    return 'empty_array';
  }

  try {
    return JSON.stringify(filters);
  } catch (error) {
    console.error('Error serializing group filters:', error);
    return 'empty_array';
  }
}