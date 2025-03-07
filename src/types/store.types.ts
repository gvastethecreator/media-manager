export interface EntityCount {
	images?: number;
}

export interface BaseEntity {
	id: string;
	name: string;
	description?: string | null;
	createdAt: Date;
	updatedAt: Date;
	_count?: EntityCount;
	totalSize?: number;
}

export interface BaseStore<T extends BaseEntity> {
	items: T[];
	isLoading: boolean;
	error: Error | null;
	loadItems: () => Promise<void>;
	createItem: (data: Partial<T>) => Promise<T>;
	updateItem: (id: string, data: Partial<T>) => Promise<T>;
	deleteItem: (id: string) => Promise<void>;
}

export interface StatsData {
	totalItems: number;
	totalImages: number;
	totalSize: number;
	distribution: Array<{ name: string; count: number }>;
	recentItems: Array<{
		id: string;
		name: string;
		emoji?: string;
		count: number;
	}>;
	lastUpdated?: Date;
}
