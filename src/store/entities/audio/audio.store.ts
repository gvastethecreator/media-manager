/**
 * 🎵 Store de Audio
 * @module store/entities/audio/audio.store
 * @description Store Zustand para gestionar el estado de audios
 */

import { createAudio, deleteAudio, getAudios, updateAudio } from '@/app/actions/audio/audio.actions';
import type { AudioComplete, AudioFilters, AudioFormData } from '@/types/entities/audio/types';
import { createSelectors } from '@/utils/store/create-selectors';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AudioState } from './types';

const useAudioStoreBase = create<AudioState>()(
	devtools(
		(set, get) => ({
			// Estado inicial
			audios: [],
			selectedAudios: [],
			currentAudio: null,
			loading: false,
			error: null,
			filters: {},

			// Acciones de datos
			fetchAudios: async () => {
				set({ loading: true, error: null });
				try {
					const audios = await getAudios();
					set({ audios, loading: false });
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			createAudio: async (data: AudioFormData) => {
				set({ loading: true, error: null });
				try {
					const newAudio = await createAudio(data);
					set((state) => ({
						audios: [...state.audios, newAudio],
						loading: false,
					}));
					return newAudio;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return undefined;
				}
			},

			updateAudio: async (id: string, data: AudioFormData) => {
				set({ loading: true, error: null });
				try {
					const updatedAudio = await updateAudio(id, data);
					set((state) => ({
						audios: state.audios.map((a) => (a.id === id ? updatedAudio : a)),
						currentAudio: state.currentAudio?.id === id ? updatedAudio : state.currentAudio,
						loading: false,
					}));
					return updatedAudio;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return undefined;
				}
			},

			deleteAudio: async (id: string) => {
				set({ loading: true, error: null });
				try {
					await deleteAudio(id);
					set((state) => ({
						audios: state.audios.filter((a) => a.id !== id),
						selectedAudios: state.selectedAudios.filter((a) => a.id !== id),
						currentAudio: state.currentAudio?.id === id ? null : state.currentAudio,
						loading: false,
					}));
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			// Acciones de selección
			selectAudio: (audio: AudioComplete) => {
				set((state) => ({
					selectedAudios: [...state.selectedAudios, audio],
					currentAudio: audio,
				}));
			},

			deselectAudio: (audioId: string) => {
				set((state) => ({
					selectedAudios: state.selectedAudios.filter((a) => a.id !== audioId),
				}));
			},

			clearSelection: () => {
				set({ selectedAudios: [], currentAudio: null });
			},

			// Acciones de filtrado
			setFilters: (newFilters: Partial<AudioFilters>) => {
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				}));
			},

			clearFilters: () => {
				set({ filters: {} });
			},

			// Utilidades
			getAudioById: (id: string) => {
				return get().audios.find((a) => a.id === id);
			},

			toggleFavorite: async (id: string) => {
				const audio = get().getAudioById(id);
				if (audio) {
					await get().updateAudio(id, {
						...audio,
						isFavorite: !audio.isFavorite,
					});
				}
			},
		}),
		{
			name: 'audio-store',
		}
	)
);

export const useAudioStore = createSelectors(useAudioStoreBase);