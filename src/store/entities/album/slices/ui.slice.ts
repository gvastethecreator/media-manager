/**
 * @file Slice de UI para el store de Album.
 * @module store/entities/album/slices/ui
 */
import type { StateCreator } from 'zustand';
import type { AlbumStore, AlbumUIActions, AlbumUIState } from '../types';

const initialState: AlbumUIState = {};

export const createAlbumUISlice: StateCreator<
	AlbumStore,
	[],
	[],
	AlbumUIState & AlbumUIActions
> = () => ({
	...initialState,
});
