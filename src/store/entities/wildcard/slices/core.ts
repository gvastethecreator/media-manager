/**
 * @file Slice principal para operaciones CRUD del store de comodines
 * @module store/entities/wildcard/slices/core
 */

import {
    createWildcard as createWildcardAction,
    deleteWildcard as deleteWildcardAction,
    getWildcard as getWildcardAction,
    getWildcards as getWildcardsAction,
    updateWildcard as updateWildcardAction,
} from '@/app/actions/wildcards/wildcard.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import {
    extendWildcard,
    extendWildcards,
} from '@/transformers/wildcard/serializers';
import type {
    CreateWildcardData,
    UpdateWildcardData,
    Wildcard,
    WildcardBase,
} from '@/types/entities/wildcard';
import type { StateCreator } from 'zustand';
import type { WildcardState } from '../types';

const wildcardLogger = clientLogger.withContext('WildcardStore');

export interface WildcardCoreSlice {
	// Getters
	getWildcard: (id: string) => Wildcard | undefined;
	getWildcards: () => Wildcard[];
	getWildcardItems: (
		wildcardId: string,
	) => Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>;
	getChildWildcards: (parentId: string | null) => Wildcard[];
	getWildcardHierarchy: () => Record<string | 'root', string[]>;

	// Operaciones síncronas
	addWildcard: (wildcard: Wildcard) => void;
	addWildcards: (wildcards: Wildcard[]) => void;
	_updateWildcard: (id: string, data: Partial<Wildcard>) => void;
	deleteWildcard: (id: string) => void;

	// Gestión de elementos
	addItemToWildcard: (
		wildcardId: string,
		itemId: string,
		itemType: 'image' | 'video' | 'note' | 'tag',
	) => void;
	removeItemFromWildcard: (wildcardId: string, itemId: string) => void;
	clearWildcardItems: (wildcardId: string) => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchWildcard: (id: string) => Promise<Wildcard | undefined>;
	fetchWildcards: () => Promise<Wildcard[]>;
	createWildcard: (
		data: CreateWildcardData,
	) => Promise<Wildcard | undefined>;
	updateWildcard: (
		id: string,
		data: UpdateWildcardData,
	) => Promise<Wildcard | undefined>;
	removeWildcard: (id: string) => Promise<boolean>;
	moveWildcard: (id: string, newParentId: string | null) => Promise<boolean>;
}

export const createWildcardCoreSlice: StateCreator<
	WildcardState & WildcardCoreSlice,
	[],
	[],
	WildcardCoreSlice
> = (set, get) => ({
	// --- Getters ---
	getWildcard: (id) => get().core.wildcards[id],
	getWildcards: () => Object.values(get().core.wildcards),
	getWildcardItems: (wildcardId) => get().core.wildcardItems[wildcardId] || [],
	getChildWildcards: (parentId) =>
		get()
			.getWildcards()
			.filter((wildcard) => wildcard.parentId === parentId),
	getWildcardHierarchy: () => {
		const hierarchy: Record<string | 'root', string[]> = { root: [] };
		const wildcards = get().getWildcards();
		for (const wildcard of wildcards) {
			hierarchy[wildcard.id] = [];
		}
		for (const wildcard of wildcards) {
			if (wildcard.parentId && hierarchy[wildcard.parentId]) {
				hierarchy[wildcard.parentId].push(wildcard.id);
			} else {
				hierarchy.root.push(wildcard.id);
			}
		}
		return hierarchy;
	},

	// --- Operaciones Síncronas ---
	addWildcard: (wildcard) => {
		set((state) => ({
			core: {
				...state.core,
				wildcards: { ...state.core.wildcards, [wildcard.id]: wildcard },
			},
		}));
	},
	addWildcards: (wildcards) => {
		const wildcardsMap = wildcards.reduce(
			(acc, w) => {
				acc[w.id] = w;
				return acc;
			},
			{} as Record<string, Wildcard>,
		);
		set((state) => ({
			core: {
				...state.core,
				wildcards: { ...state.core.wildcards, ...wildcardsMap },
			},
		}));
	},
	_updateWildcard: (id, data) => {
		const existing = get().getWildcard(id);
		if (existing) {
			get().addWildcard({ ...existing, ...data, updatedAt: new Date() });
		}
	},
	deleteWildcard: (id) => {
		set((state) => {
			const { [id]: _, ...restWildcards } = state.core.wildcards;
			const { [id]: __, ...restItems } = state.core.wildcardItems;
			return {
				core: {
					...state.core,
					wildcards: restWildcards,
					wildcardItems: restItems,
				},
			};
		});
	},

	// --- Gestión de elementos ---
	addItemToWildcard: (wildcardId, itemId, itemType) => {
		set((state) => {
			const items = state.core.wildcardItems[wildcardId] || [];
			if (items.some((item) => item.id === itemId)) return state;
			return {
				core: {
					...state.core,
					wildcardItems: {
						...state.core.wildcardItems,
						[wildcardId]: [...items, { id: itemId, type: itemType }],
					},
				},
			};
		});
	},
	removeItemFromWildcard: (wildcardId, itemId) => {
		set((state) => {
			const items = state.core.wildcardItems[wildcardId] || [];
			return {
				core: {
					...state.core,
					wildcardItems: {
						...state.core.wildcardItems,
						[wildcardId]: items.filter((item) => item.id !== itemId),
					},
				},
			};
		});
	},
	clearWildcardItems: (wildcardId) => {
		set((state) => ({
			core: {
				...state.core,
				wildcardItems: { ...state.core.wildcardItems, [wildcardId]: [] },
			},
		}));
	},

	// --- Estado de Carga ---
	setLoading: (isLoading) =>
		set((state) => ({ core: { ...state.core, isLoading } })),
	setError: (error) => set((state) => ({ core: { ...state.core, error } })),

	// --- Acciones Asíncronas ---
	fetchWildcard: async (id) => {
		get().setLoading(true);
		try {
			const response = await getWildcardAction(id);
			if (response.success && response.data) {
				const wildcard = extendWildcard(response.data as WildcardBase);
				get().addWildcard(wildcard);
				return wildcard;
			}
			get().setError(response.error ?? 'Error fetching wildcard');
			return undefined;
		} catch (e) {
			wildcardLogger.error('Failed to fetch wildcard', { error: e });
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},
	fetchWildcards: async () => {
		get().setLoading(true);
		try {
			const response = await getWildcardsAction();
			if (response.success && response.data) {
				const wildcards = extendWildcards(response.data as WildcardBase[]);
				get().addWildcards(wildcards);
				return wildcards;
			}
			get().setError(response.error ?? 'Error fetching wildcards');
			return [];
		} catch (e) {
			wildcardLogger.error('Failed to fetch wildcards', { error: e });
			return [];
		} finally {
			get().setLoading(false);
		}
	},
	createWildcard: async (data) => {
		get().setLoading(true);
		try {
			const response = await createWildcardAction(data);
			if (response.success && response.data) {
				const wildcard = extendWildcard(response.data as WildcardBase);
				get().addWildcard(wildcard);
				toastService.success('Wildcard creado');
				return wildcard;
			}
			toastService.error(response.error ?? 'Error creating wildcard');
			return undefined;
		} catch (e) {
			wildcardLogger.error('Failed to create wildcard', { error: e });
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},
	updateWildcard: async (id, data) => {
		get().setLoading(true);
		try {
			const response = await updateWildcardAction(id, data);
			if (response.success && response.data) {
				const wildcard = extendWildcard(response.data as WildcardBase);
				get().addWildcard(wildcard);
				toastService.success('Wildcard actualizado');
				return wildcard;
			}
			toastService.error(response.error ?? 'Error updating wildcard');
			return undefined;
		} catch (e) {
			wildcardLogger.error('Failed to update wildcard', { error: e });
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},
	removeWildcard: async (id) => {
		get().setLoading(true);
		try {
			const response = await deleteWildcardAction(id);
			if (response.success) {
				get().deleteWildcard(id);
				toastService.success('Wildcard eliminado');
				return true;
			}
			toastService.error(response.error ?? 'Error removing wildcard');
			return false;
		} catch (e) {
			wildcardLogger.error('Failed to remove wildcard', { error: e });
			return false;
		} finally {
			get().setLoading(false);
		}
	},
	moveWildcard: async (id, newParentId) => {
		const wildcard = get().getWildcard(id);
		if (!wildcard) return false;
		// Optimistic update
		get()._updateWildcard(id, { parentId: newParentId });
		try {
			const response = await updateWildcardAction(id, { parentId: newParentId });
			if (response.success && response.data) {
				const updatedWildcard = extendWildcard(response.data as WildcardBase);
				get().addWildcard(updatedWildcard);
				toastService.success('Wildcard movido');
				return true;
			}
			// Revert on failure
			get()._updateWildcard(id, { parentId: wildcard.parentId });
			toastService.error(response.error ?? 'Error moving wildcard');
			return false;
		} catch (e) {
			wildcardLogger.error('Failed to move wildcard', { error: e });
			// Revert on failure
			get()._updateWildcard(id, { parentId: wildcard.parentId });
			return false;
		}
	},
});
