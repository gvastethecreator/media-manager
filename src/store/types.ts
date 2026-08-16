import type { StateCreator } from 'zustand';

export interface BaseEntity {
	id: string;
	name: string;
}

export interface BaseState<T extends BaseEntity> {
	currentPage: number;
	error: Error | null;
	items: T[];
	itemsPerPage: number;
	lastSelectedItem: T | null;
	loading: boolean;
	selectedItem: T | null;
	selectedItems: T[];
	totalPages: number;
}

export interface BaseActions<T extends BaseEntity, CreateType = Partial<T>, UpdateType = Partial<T>> {
	clearSelection: () => void;
	createItem: (data: CreateType) => Promise<void>;
	deleteItem: (id: string) => Promise<void>;
	deselectItem: (id: string) => void;
	loadItems: () => Promise<void>;
	loadMoreItems: () => Promise<void>;
	refreshItems: () => Promise<void>;
	selectItem: (item: T) => void;
	toggleItemSelection: (item: T, isMultiSelect: boolean) => void;
	updateItem: (id: string, data: UpdateType) => Promise<void>;
}

export type BaseStore<T extends BaseEntity, CreateType = Partial<T>, UpdateType = Partial<T>> = BaseState<T> &
	BaseActions<T, CreateType, UpdateType>;

export type ExtendedStore<
	T extends BaseEntity,
	S = Record<string, unknown>,
	CreateType = Partial<T>,
	UpdateType = Partial<T>,
> = BaseStore<T, CreateType, UpdateType> & S;

export type StoreCreator<
	T extends BaseEntity,
	S = Record<string, unknown>,
	CreateType = Partial<T>,
	UpdateType = Partial<T>,
> = StateCreator<ExtendedStore<T, S, CreateType, UpdateType>, [], [], ExtendedStore<T, S, CreateType, UpdateType>>;

export interface StoreHook<
	T extends BaseEntity,
	S = Record<string, unknown>,
	CreateType = Partial<T>,
	UpdateType = Partial<T>,
> {
	(): ExtendedStore<T, S, CreateType, UpdateType>;
	<U>(selector: (state: ExtendedStore<T, S, CreateType, UpdateType>) => U): U;
}
