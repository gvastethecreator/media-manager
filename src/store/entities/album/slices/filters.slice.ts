/**
 * @file Slice de filtros para el store de Album.
 * @module store/entities/album/slices/filters
 */
import type { StateCreator } from 'zustand';
import type { AlbumFilterActions, AlbumFilterState, AlbumStore } from '../types';

const initialState: AlbumFilterState = {};

export const createAlbumFilterSlice: StateCreator<
	AlbumStore,
	[['zustand/immer', never]],
	[],
	AlbumFilterState & AlbumFilterActions
> = () => ({
	...initialState,
});
