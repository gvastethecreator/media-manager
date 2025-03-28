/**
 * @file Slice core para el store de WorldItem
 * @module store/entities/world-item/slices/core
 */

import type { StateCreator } from 'zustand';
import { extendWorldItem, extendWorldItems } from '../../../../transformers/world-item';
import type { ParsedWorldItemVisualConfig, WorldItem } from '../../../../types/entities/world-item';
import type { WorldItemStore } from '../index';

export interface WorldItemCoreSlice {
	// Estado
	worldItems: WorldItem[];
	isLoading: boolean;
	error: string | null;

	// Configuración visual
	visualConfig: ParsedWorldItemVisualConfig | null;

	// Acciones
	setWorldItems: (worldItems: WorldItem[]) => void;
	addWorldItem: (worldItem: WorldItem) => void;
	updateWorldItem: (id: string, data: Partial<WorldItem>) => void;
	removeWorldItem: (id: string) => void;
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
	setVisualConfig: (config: ParsedWorldItemVisualConfig | null) => void;
	resetStore: () => void;

	// Selectors
	getWorldItemById: (id: string) => WorldItem | undefined;
	getWorldItemsByIds: (ids: string[]) => WorldItem[];
	getWorldItemsByCategory: (category: string) => WorldItem[];
	getWorldItemsByType: (type: string) => WorldItem[];
	getWorldItemsByRarity: (rarity: string) => WorldItem[];
	getFavoriteWorldItems: () => WorldItem[];
}

export const createWorldItemCoreSlice: StateCreator<WorldItemStore, [], [], WorldItemCoreSlice> = (set, get) => ({
	// Estado inicial
	worldItems: [],
	isLoading: false,
	error: null,
	visualConfig: null,

	// Acciones
	setWorldItems: (worldItems) => {
		set({ worldItems: extendWorldItems(worldItems) });
	},

	addWorldItem: (worldItem) => {
		set((state) => ({
			worldItems: [...state.worldItems, extendWorldItem(worldItem)],
		}));
	},

	updateWorldItem: (id, data) => {
		set((state) => ({
			worldItems: state.worldItems.map((item) => (item.id === id ? { ...item, ...data } : item)),
		}));
	},

	removeWorldItem: (id) => {
		set((state) => ({
			worldItems: state.worldItems.filter((item) => item.id !== id),
		}));
	},

	setLoading: (isLoading) => {
		set({ isLoading });
	},

	setError: (error) => {
		set({ error });
	},

	setVisualConfig: (config) => {
		set({ visualConfig: config });
	},

	resetStore: () => {
		set({
			worldItems: [],
			isLoading: false,
			error: null,
			visualConfig: null,
		});
	},

	// Selectors
	getWorldItemById: (id) => {
		return get().worldItems.find((item) => item.id === id);
	},

	getWorldItemsByIds: (ids) => {
		return get().worldItems.filter((item) => ids.includes(item.id));
	},

	getWorldItemsByCategory: (category) => {
		return get().worldItems.filter((item) => item.category === category);
	},

	getWorldItemsByType: (type) => {
		return get().worldItems.filter((item) => item.type === type);
	},

	getWorldItemsByRarity: (rarity) => {
		return get().worldItems.filter((item) => item.rarity === rarity);
	},

	getFavoriteWorldItems: () => {
		return get().worldItems.filter((item) => item.isFavorite);
	},
});
