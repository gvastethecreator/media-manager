/**
 * @file Core slice para el store de metadata
 * @module store/entities/metadata/slices/core
 */

import { StateCreator } from 'zustand';
import { MetadataWithStats } from '@/types/entities/metadata/base';
import { MetadataStore } from '..';

// Estado
export interface CoreState {
	error: string | null;
	isLoading: boolean;
	// Datos
	metadatas: MetadataWithStats[];
}

// Acciones
export interface CoreActions {
	// Operaciones
	addMetadata: (metadata: MetadataWithStats) => void;
	removeMetadata: (id: string) => void;

	// Operaciones masivas
	reset: () => void;
	setError: (error: string | null) => void;
	setIsLoading: (isLoading: boolean) => void;
	// Setters básicos
	setMetadatas: (metadatas: MetadataWithStats[]) => void;
	updateMetadata: (id: string, metadata: Partial<MetadataWithStats>) => void;
}

// Estado inicial
const initialState: CoreState = {
	metadatas: [],
	isLoading: false,
	error: null,
};

// Crear slice
export const createCoreSlice: StateCreator<MetadataStore, [], [], CoreState & CoreActions> = (set, get) => ({
	...initialState,

	// Setters básicos
	setMetadatas: (metadatas) => set({ metadatas }),
	setIsLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),

	// Operaciones
	addMetadata: (metadata) => {
		const { metadatas } = get();
		set({ metadatas: [...metadatas, metadata] });
	},

	updateMetadata: (id, updatedData) => {
		const { metadatas } = get();
		const updatedMetadatas = metadatas.map((metadata) =>
			metadata.id === id ? { ...metadata, ...updatedData } : metadata
		);
		set({ metadatas: updatedMetadatas });
	},

	removeMetadata: (id) => {
		const { metadatas } = get();
		set({ metadatas: metadatas.filter((metadata) => metadata.id !== id) });
	},

	// Operaciones masivas
	reset: () => set(initialState),
});
