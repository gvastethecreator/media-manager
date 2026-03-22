import { create, type StateCreator } from 'zustand';

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

export type ExtendedState<T extends BaseEntity, S> = BaseState<T> & S;

export type ExtendedStore<
	T extends BaseEntity,
	S = Record<string, unknown>,
	CreateType = Partial<T>,
	UpdateType = Partial<T>,
> = ExtendedState<T, S> & BaseActions<T, CreateType, UpdateType>;

// Tipo específico para el logger
interface Logger {
	error: (message: string, ...args: unknown[]) => void;
	info: (message: string, ...args: unknown[]) => void;
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
