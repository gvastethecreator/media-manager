import type { StateCreator } from 'zustand';

export interface BaseEntity {
	id: string;
	name: string;
}

export interface BaseState<T extends BaseEntity> {
	items: T[];
	loading: boolean;
	error: Error | null;
	currentPage: number;
	totalPages: number;
	itemsPerPage: number;
	selectedItem: T | null;
	selectedItems: T[];
	lastSelectedItem: T | null;
}

export interface BaseActions<T extends BaseEntity, CreateType = Partial<T>, UpdateType = Partial<T>> {
	loadItems: () => Promise<void>;
	loadMoreItems: () => Promise<void>;
	refreshItems: () => Promise<void>;
	createItem: (data: CreateType) => Promise<void>;
	updateItem: (id: string, data: UpdateType) => Promise<void>;
	deleteItem: (id: string) => Promise<void>;
	selectItem: (item: T) => void;
	deselectItem: (id: string) => void;
	toggleItemSelection: (item: T, isMultiSelect: boolean) => void;
	clearSelection: () => void;
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
