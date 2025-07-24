import type { BaseEntity } from '@/types/store.types';

export interface BaseFormData {
	id?: string;
	name: string;
	description?: string;
	emoji?: string;
	shortcut?: string;
}

// Interfaz para entidades con emoji y shortcut
interface ExtendedEntity extends BaseEntity {
	emoji?: string;
	shortcut?: string;
}

export function baseToFormData<T extends BaseEntity>(entity: T): BaseFormData {
	return {
		id: entity.id,
		name: entity.name,
		description: entity.description || undefined,
		emoji: (entity as ExtendedEntity).emoji || undefined,
		shortcut: (entity as ExtendedEntity).shortcut || undefined,
	};
}

export function formDataToBase<T extends BaseEntity>(data: BaseFormData, id?: string): Partial<T> {
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
	isFavorite: number;
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

// Interfaz para entidades con contadores y estado
interface EntityWithStats extends BaseEntity {
	_count?: { images: number };
	totalSize?: number;
	isArchived?: boolean;
	isFavorite?: boolean;
}

export function calculateStats<T extends EntityWithStats>(
	items: T[],
	getCount = (item: T) => item._count?.images || 0,
	getSize = (item: T) => item.totalSize || 0
): ExtendedStats {
	// Estadísticas básicas
	const basicStats = {
		total: items.length,
		active: items.filter((item) => !item.isArchived).length,
		isFavorite: items.filter((item) => item.isFavorite).length,
		archived: items.filter((item) => item.isArchived).length,
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
	const sortedItems = [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

	// Obtener items recientes
	const recentItems = sortedItems.slice(0, 5).map((item) => ({
		id: item.id,
		name: item.name,
		emoji: (item as ExtendedEntity).emoji || '📄',
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
