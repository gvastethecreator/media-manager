/**
 * @file Slice de UI para el store de Album.
 * @module store/entities/album/slices/ui
 */
import type { StateCreator } from 'zustand';
import type { AlbumStore, AlbumUIActions, AlbumUIState } from '../types';

const initialState: AlbumUIState = {
	currentAlbumId: null,
};

export const createAlbumUISlice: StateCreator<AlbumStore, [['zustand/immer', never]], [], AlbumUIState & AlbumUIActions> = (set) => ({
	...initialState,

	setCurrentAlbumId: (id) => {
		set((state) => {
			state.currentAlbumId = id;
		});
	},
});
