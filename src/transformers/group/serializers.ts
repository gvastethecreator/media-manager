/**
 * @file Funciones para serializar y deserializar datos de grupos
 * @module transformers/group/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { GroupBase, GroupComplete, GroupExtended } from '@/types/entities/group/types';

// Logger específico para serializadores de Group
const serializerLogger = serverLogger.withContext('GroupSerializers');

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
    serializerLogger.error('❌ Error al parsear filtros de grupo:', error);
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
    serializerLogger.error('❌ Error al serializar filtros de grupo:', error);
    return 'empty_array';
  }
}

/**
 * Convierte un GroupBase con campos en formato de base de datos a un GroupComplete con todos los campos deserializados
 * @param group Objeto básico de grupo desde la base de datos
 * @returns Objeto GroupComplete con campos JSON parseados
 */
export function toGroupComplete(group: GroupBase): GroupComplete {
  try {
    return {
      ...group,
      filters: parseGroupFilters(group.filters || 'empty_array')
    };
  } catch (error) {
    serializerLogger.error('❌ Error al convertir GroupBase a GroupComplete:', error);
    return {
      ...group,
      filters: []
    } as GroupComplete;
  }
}

/**
 * Convierte un GroupComplete con campos deserializados a un GroupBase con formato para la base de datos
 * @param group Objeto GroupComplete con campos parseados
 * @returns GroupBase con campos serializados para BD
 */
export function fromGroupComplete(group: GroupComplete): GroupBase {
  try {
    const { filters, ...rest } = group;
    return {
      ...rest,
      filters: serializeGroupFilters(filters || [])
    };
  } catch (error) {
    serializerLogger.error('❌ Error al convertir GroupComplete a GroupBase:', error);
    return {
      ...group,
      filters: 'empty_array'
    } as GroupBase;
  }
}

/**
 * Extiende un grupo con propiedades adicionales para UI
 * @param group Grupo básico o completo
 * @returns Grupo con propiedades adicionales para UI
 */
export function extendGroup(group: GroupBase | GroupComplete): GroupExtended {
  // Asegurar que tenemos una versión completa
  const completeGroup = 'id' in group ? toGroupComplete(group) : group;

  return {
    ...completeGroup,
    isSelected: false,
    isExpanded: false,
    isEditing: false,
    imageCount: 0, // Estos valores deberían actualizarse después con datos reales
    videoCount: 0,
    entityCount: 0
  };
}

/**
 * Extiende múltiples grupos con propiedades adicionales para UI
 * @param groups Lista de grupos básicos o completos
 * @returns Lista de grupos extendidos
 */
export function extendGroups(groups: (GroupBase | GroupComplete)[]): GroupExtended[] {
  return groups.map(extendGroup);
}