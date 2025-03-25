/**
 * @file Mapeadores para la entidad WorldItem
 * @module transformers/world-item/mappers
 */

import {
    type CreateWorldItemData,
    type UpdateWorldItemData,
    type WorldItem,
    type WorldItemBase,
    WorldItemCategory,
    WorldItemType,
    type WorldItemVisualConfig,
    type WorldItemVisualConfigUpdateData
} from '../../types/entities/world-item';
import {
    parseJsonFields,
    parseVisualConfig,
    serializeWorldItemFilters
} from './serializers';

/**
 * Genera un color aleatorio para un objeto del mundo basado en su nombre y categoría
 * @param name Nombre del objeto
 * @param category Categoría opcional
 * @returns Color hexadecimal
 */
export function generateWorldItemColor(name: string, category?: string | null): string {
  // Colores predeterminados por categoría
  const categoryColors: Record<string, string> = {
    [WorldItemCategory.COMBAT]: '#ef4444', // Rojo
    [WorldItemCategory.MAGIC]: '#8b5cf6', // Violeta
    [WorldItemCategory.TECHNOLOGY]: '#3b82f6', // Azul
    [WorldItemCategory.UTILITY]: '#10b981', // Verde
    [WorldItemCategory.DECORATION]: '#ec4899', // Rosa
    [WorldItemCategory.SURVIVAL]: '#f59e0b', // Ámbar
    [WorldItemCategory.TRANSPORTATION]: '#0ea5e9', // Azul cielo
    [WorldItemCategory.QUEST]: '#f97316', // Naranja
    [WorldItemCategory.LORE]: '#6366f1', // Índigo
    [WorldItemCategory.OTHER]: '#64748b', // Gris azulado
  };

  // Si hay una categoría válida, usar su color
  if (category && categoryColors[category]) {
    return categoryColors[category];
  }

  // Si no hay categoría, generar un color basado en el nombre
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const saturation = 65 + (hash % 20);
  const lightness = 45 + (hash % 10);

  // Convertir HSL a hexadecimal
  return hslToHex(hue, saturation, lightness);
}

/**
 * Genera un emoji para un objeto del mundo basado en su tipo y nombre
 * @param name Nombre del objeto
 * @param type Tipo de objeto opcional
 * @returns Emoji representativo
 */
export function generateWorldItemEmoji(name: string, type?: string | null): string {
  // Emojis predeterminados por tipo
  const typeEmojis: Record<string, string> = {
    [WorldItemType.WEAPON]: '⚔️',
    [WorldItemType.ARMOR]: '🛡️',
    [WorldItemType.ACCESSORY]: '💍',
    [WorldItemType.POTION]: '🧪',
    [WorldItemType.SCROLL]: '📜',
    [WorldItemType.ARTIFACT]: '🔮',
    [WorldItemType.RELIC]: '✨',
    [WorldItemType.TECHNOLOGY]: '⚙️',
    [WorldItemType.BOOK]: '📕',
    [WorldItemType.KEY]: '🔑',
    [WorldItemType.CURRENCY]: '💰',
    [WorldItemType.TOOL]: '🔨',
    [WorldItemType.CONTAINER]: '📦',
    [WorldItemType.CLOTHING]: '👕',
    [WorldItemType.FOOD]: '🍞',
    [WorldItemType.CRAFTING]: '⚒️',
    [WorldItemType.QUEST]: '❗',
    [WorldItemType.MISC]: '🎯'
  };

  // Si hay un tipo válido, usar su emoji
  if (type && typeEmojis[type]) {
    return typeEmojis[type];
  }

  // Si no hay tipo o es desconocido, usar el emoji por defecto
  return '🎯';
}

/**
 * Convierte valores HSL a formato hexadecimal
 * @param h Tono (0-360)
 * @param s Saturación (0-100)
 * @param l Luminosidad (0-100)
 * @returns Color en formato hexadecimal
 */
function hslToHex(h: number, s: number, l: number): string {
  // Convertir HSL a RGB
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Extiende un objeto del mundo base con campos adicionales
 * @param worldItem Objeto del mundo base
 * @returns Objeto del mundo extendido
 */
export function extendWorldItem(worldItem: WorldItemBase): WorldItem {
  return parseJsonFields(worldItem);
}

/**
 * Extiende un array de objetos del mundo base con campos adicionales
 * @param worldItems Array de objetos del mundo base
 * @returns Array de objetos del mundo extendidos
 */
export function extendWorldItems(worldItems: WorldItemBase[]): WorldItem[] {
  return worldItems.map(extendWorldItem);
}

/**
 * Prepara los datos para crear un objeto del mundo
 * @param data Datos de creación
 * @returns Datos preparados para la base de datos
 */
export function prepareCreateWorldItemData(data: CreateWorldItemData): Record<string, any> {
  // Asignar valores por defecto si no se proporcionan
  if (!data.emoji) {
    data.emoji = generateWorldItemEmoji(data.name, data.type);
  }

  if (!data.color) {
    data.color = generateWorldItemColor(data.name, data.category);
  }

  // Preparar datos para inserción
  return {
    name: data.name,
    emoji: data.emoji,
    color: data.color,
    description: data.description ?? null,
    shortcut: data.shortcut ?? null,
    type: data.type ?? 'misc',
    rarity: data.rarity ?? 'common',
    properties: data.properties ?? 'empty_array',
    requirements: data.requirements ?? '{}',
    origin: data.origin ?? '',
    stats: data.stats ?? '{}',
    sortBy: data.sortBy ?? 'name',
    filters: data.filters ?? 'empty_array',
    featuredImage: data.featuredImage ?? null,
    isFavorite: data.isFavorite ?? false,
    category: data.category ?? null
  };
}

/**
 * Prepara los datos para actualizar un objeto del mundo
 * @param data Datos de actualización
 * @returns Datos preparados para la base de datos
 */
export function prepareUpdateWorldItemData(data: UpdateWorldItemData): Record<string, any> {
  // Filtrar campos nulos o indefinidos para actualización
  const updateData: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  return updateData;
}

/**
 * Prepara los datos para actualizar configuración visual
 * @param data Datos de actualización de configuración visual
 * @returns Datos preparados para la base de datos
 */
export function prepareVisualConfigUpdateData(data: WorldItemVisualConfigUpdateData): Record<string, any> {
  const updateData: Record<string, any> = {};

  if (data.view !== undefined) {
    updateData.view = data.view;
  }

  if (data.sortBy !== undefined) {
    updateData.sortBy = data.sortBy;
  }

  if (data.filters !== undefined) {
    updateData.filters = serializeWorldItemFilters(data.filters);
  }

  if (data.lastViewedWorldItemId !== undefined) {
    updateData.lastViewedWorldItemId = data.lastViewedWorldItemId;
  }

  if (data.expandedWorldItemIds !== undefined) {
    updateData.expandedWorldItemIds = data.expandedWorldItemIds;
  }

  if (data.selectedWorldItemIds !== undefined) {
    updateData.selectedWorldItemIds = data.selectedWorldItemIds;
  }

  return updateData;
}

/**
 * Mapea la configuración visual a formato para la UI
 * @param config Configuración visual
 * @returns Configuración visual parseada
 */
export function mapVisualConfig(config: WorldItemVisualConfig) {
  return parseVisualConfig(config);
}