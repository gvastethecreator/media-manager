/**
 * @file Tipos para el store de la entidad Album.
 * @module store/entities/album/types
 * @description Define la forma del estado y las acciones para el store de Album.
 */

import type { AlbumWithStats } from '@/types/entities/album';
import type { Prisma } from '@prisma/client';

// --- Estado del Slice ---

export interface AlbumCoreState {
	albums: Record<string, AlbumWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

export interface AlbumUIState {
	// ...p.ej., álbum seleccionado, modo de vista, etc.
}

export interface AlbumFilterState {
	// ...p.ej., filtros de búsqueda, ordenación, etc.
}

// --- Acciones del Slice ---

export interface AlbumCoreActions {
	loadAlbums: () => Promise<void>;
	createAlbum: (data: Prisma.AlbumCreateInput) => Promise<void>;
	updateAlbum: (id: string, data: Prisma.AlbumUpdateInput) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
}

export interface AlbumUIActions {
	// ...
}

export interface AlbumFilterActions {
	// ...
}

// --- Store Completo ---

export type AlbumStore = AlbumCoreState &
	AlbumCoreActions &
	AlbumUIState &
	AlbumUIActions &
	AlbumFilterState &
	AlbumFilterActions;
