/**
 * @file Tipos para el store de la entidad Album.
 * @module store/entities/album/types
 * @description Define la forma del estado y las acciones para el store de Album.
 */

import type { Prisma } from '@prisma/client';
import type { AlbumWithStats } from '@/types/entities/album';

// --- Estado del Slice ---

export interface AlbumCoreState {
	albums: Record<string, AlbumWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

export type AlbumUIState = {};

export type AlbumFilterState = {};

// --- Acciones del Slice ---

export interface AlbumCoreActions {
	loadAlbums: () => Promise<void>;
	createAlbum: (data: Prisma.AlbumCreateInput) => Promise<void>;
	updateAlbum: (id: string, data: Prisma.AlbumUpdateInput) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
	// Getters
	getSortedAlbums: () => AlbumWithStats[];
}

export type AlbumUIActions = {};

export type AlbumFilterActions = {};

// --- Store Completo ---

export type AlbumStore = AlbumCoreState &
	AlbumCoreActions &
	AlbumUIState &
	AlbumUIActions &
	AlbumFilterState &
	AlbumFilterActions;
