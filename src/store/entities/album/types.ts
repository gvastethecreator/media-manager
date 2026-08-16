/**
 * @file Tipos para el store de la entidad Album.
 * @module store/entities/album/types
 * @description Define la forma del estado y las acciones para el store de Album.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type { AlbumCreateInput, AlbumUpdateInput, AlbumWithStats } from '@/types/entities/album';

// Re-export for compatibility
export type { AlbumCreateInput as CreateAlbumInput, AlbumUpdateInput as UpdateAlbumInput };

// --- Estado del Slice ---

export interface AlbumCoreState {
	albums: Record<string, AlbumWithStats>;
	error: string | null;
	isLoading: boolean;
	lastUpdated: number | null;
}

export interface AlbumUIState {
	currentAlbumId: string | null;
}

export type AlbumFilterState = Record<never, never>;

// --- Acciones del Slice ---

export interface AlbumCoreActions {
	createAlbum: (data: AlbumCreateInput) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
	// Getters
	getSortedAlbums: () => AlbumWithStats[];
	loadAlbums: () => Promise<void>;
	updateAlbum: (id: string, data: AlbumUpdateInput) => Promise<void>;
}

export interface AlbumUIActions {
	setCurrentAlbumId: (id: string | null) => void;
}

export type AlbumFilterActions = Record<never, never>;

// --- Store Completo ---

export type AlbumStore = AlbumCoreState &
	AlbumCoreActions &
	AlbumUIState &
	AlbumUIActions &
	AlbumFilterState &
	AlbumFilterActions;
