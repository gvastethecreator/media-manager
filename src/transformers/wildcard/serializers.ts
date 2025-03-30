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

/**
 * Extiende un comodín de Prisma con propiedades calculadas y formateadas para la UI
 * @param wildcard Comodín base de la base de datos
 * @returns Comodín extendido con propiedades calculadas
 */
export function extendWildcard(wildcard: any) {
  if (!wildcard) return null;

  return {
    ...wildcard,
    // Asegurar que las fechas sean instancias de Date
    createdAt: wildcard.createdAt instanceof Date ? wildcard.createdAt : new Date(wildcard.createdAt),
    updatedAt: wildcard.updatedAt instanceof Date ? wildcard.updatedAt : new Date(wildcard.updatedAt),
    // Parsea el campo children que está almacenado como JSON string
    children: parseWildcardChildren(wildcard.children),
    // Calcular contadores de elementos relacionados si están disponibles
    itemCount: wildcard._count ? (
      (wildcard._count.images || 0) +
      (wildcard._count.videos || 0) +
      (wildcard._count.albums || 0) +
      (wildcard._count.collections || 0) +
      (wildcard._count.tags || 0) +
      (wildcard._count.characters || 0) +
      (wildcard._count.places || 0) +
      (wildcard._count.worldItems || 0) +
      (wildcard._count.concepts || 0) +
      (wildcard._count.prompts || 0) +
      (wildcard._count.notes || 0) +
      (wildcard._count.properties || 0) +
      (wildcard._count.groups || 0)
    ) : 0,
    // Propiedades calculadas de jerarquía
    hasParent: !!wildcard.parentId,
    hasChildren: (wildcard._count?.childWildcards || 0) > 0
  };
}

/**
 * Extiende un array de comodines con propiedades calculadas
 * @param wildcards Array de comodines de la base de datos
 * @returns Array de comodines extendidos
 */
export function extendWildcards(wildcards: any[]) {
  if (!wildcards || !Array.isArray(wildcards)) return [];
  return wildcards.map(wildcard => extendWildcard(wildcard));
}