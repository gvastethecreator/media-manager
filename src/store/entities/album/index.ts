/**
 * @file Store de Zustand para la entidad Album.
 * @module store/entities/album
 * @description
 *   Este store centraliza el estado y la lógica para los álbumes.
 *   Utiliza un patrón de "slices" para separar las preocupaciones:
 *   - Core: Datos principales y acciones CRUD.
 *   - UI: Estado de la interfaz (selecciones, etc.).
 *   - Filters: Filtros, ordenación y búsqueda.
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createAlbumCoreSlice } from './slices/core.slice';
import { createAlbumFilterSlice } from './slices/filters.slice';
import { createAlbumUISlice } from './slices/ui.slice';
import type { AlbumStore } from './types';

export const useAlbumStore = create<AlbumStore>()(
	devtools(
		immer((...a) => ({
			...createAlbumCoreSlice(...a),
			...createAlbumUISlice(...a),
			...createAlbumFilterSlice(...a),
		})),
		{ name: 'AlbumStore' },
	),
);
