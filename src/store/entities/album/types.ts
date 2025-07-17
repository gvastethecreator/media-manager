/**
 * @file Tipos para el store de la entidad Album.
 * @module store/entities/album/types
 * @description Define la forma del estado y las acciones para el store de Album.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type { AlbumWithStats, CreateAlbumInput, UpdateAlbumInput } from '@/types/entities/album';

// --- Estado del Slice ---

export interface AlbumCoreState {
	albums: Record<string, AlbumWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

export interface AlbumUIState {
	currentAlbumId: string | null;
}

export type AlbumFilterState = Record<string, never>;

// --- Acciones del Slice ---

export interface AlbumCoreActions {
	loadAlbums: () => Promise<void>;
	createAlbum: (data: AlbumCreateInput) => Promise<void>;
	updateAlbum: (id: string, data: AlbumUpdateInput) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
	// Getters
	getSortedAlbums: () => AlbumWithStats[];
}

export interface AlbumUIActions {
	setCurrentAlbumId: (id: string | null) => void;
}

export type AlbumFilterActions = Record<string, never>;

// --- Store Completo ---

export type AlbumStore = AlbumCoreState &
	AlbumCoreActions &
	AlbumUIState &
	AlbumUIActions &
	AlbumFilterState &
	AlbumFilterActions;
