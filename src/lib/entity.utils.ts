import { type BaseEntity } from "@/types/store.types";

export interface BaseFormData {
  id?: string;
  name: string;
  description?: string;
  emoji?: string;
  shortcut?: string;
}

export function baseToFormData<T extends BaseEntity>(entity: T): BaseFormData {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description || undefined,
    emoji: (entity as any).emoji || undefined,
    shortcut: (entity as any).shortcut || undefined,
  };
}

export function formDataToBase<T extends BaseEntity>(
  data: BaseFormData,
  id?: string
): Partial<T> {
  return {
    ...(id ? { id } : {}),
    name: data.name,
    description: data.description || null,
    ...(data.emoji ? { emoji: data.emoji } : {}),
    ...(data.shortcut ? { shortcut: data.shortcut } : {}),
  } as Partial<T>;
}

export interface BaseStats {
  total: number;
  active: number;
  favorite: number;
  archived: number;
}

export interface ExtendedStats extends BaseStats {
  totalItems: number;
  totalImages: number;
  totalSize: number;
  distribution: Array<{
    name: string;
    count: number;
  }>;
  recentItems: Array<{
    id: string;
    name: string;
    emoji?: string;
    count?: number;
  }>;
  lastUpdated?: Date;
}

export function calculateStats<T extends BaseEntity>(
  items: T[],
  getCount = (item: T) => (item as any)._count?.images || 0,
  getSize = (item: T) => (item as any).totalSize || 0
): ExtendedStats {
  // Estadísticas básicas
  const basicStats = {
    total: items.length,
    active: items.filter((item) => !(item as any).isArchived).length,
    favorite: items.filter((item) => (item as any).isFavorite).length,
    archived: items.filter((item) => (item as any).isArchived).length,
  };

  // Si no hay items, devolver solo las estadísticas básicas
  if (!items.length) {
    return {
      ...basicStats,
      totalItems: 0,
      totalImages: 0,
      totalSize: 0,
      distribution: [],
      recentItems: [],
      lastUpdated: undefined,
    };
  }

  // Calcular estadísticas extendidas
  const totalImages = items.reduce((acc, item) => acc + getCount(item), 0);
  const totalSize = items.reduce((acc, item) => acc + getSize(item), 0);

  // Ordenar por fecha de actualización
  const sortedItems = [...items].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Obtener items recientes
  const recentItems = sortedItems.slice(0, 5).map((item) => ({
    id: item.id,
    name: item.name,
    emoji: (item as any).emoji || "📄",
    count: getCount(item),
  }));

  // Devolver todas las estadísticas
  return {
    ...basicStats,
    totalItems: items.length,
    totalImages,
    totalSize,
    distribution: [],
    recentItems,
    lastUpdated: sortedItems[0]?.updatedAt,
  };
}