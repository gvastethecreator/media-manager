import { create, type StateCreator } from 'zustand';

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

export type ExtendedState<T extends BaseEntity, S> = BaseState<T> & S;

export type ExtendedStore<
	T extends BaseEntity,
	S = Record<string, unknown>,
	CreateType = Partial<T>,
	UpdateType = Partial<T>,
> = ExtendedState<T, S> & BaseActions<T, CreateType, UpdateType>;

// Tipo específico para el logger
interface Logger {
	info: (message: string, ...args: unknown[]) => void;
	error: (message: string, ...args: unknown[]) => void;
	warn: (message: string, ...args: unknown[]) => void;
}

export function createBaseStore<
	T extends BaseEntity,
	S = Record<string, unknown>,
	CreateType = Partial<T>,
	UpdateType = Partial<T>,
>(_name: string, _apiEndpoint: string, _options?: { customLogger?: Logger }) {
	return (config: StateCreator<ExtendedStore<T, S, CreateType, UpdateType>, [], []>) =>
		create<ExtendedStore<T, S, CreateType, UpdateType>>(config);
}
