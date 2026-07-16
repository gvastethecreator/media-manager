/**
 * 🎵 Store de Audio
 * @module store/entities/audio/audio.store
 * @description Store Zustand para gestionar el estado de audios
 * ✅ MIGRADO A DRIZZLE - Usa tipos locales en lugar de Prisma
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
// Migrado a cliente de API
import {
	type PublicAudioCreateInput,
	type PublicAudioUpdateInput,
	createAudioInApi,
	deleteAudioFromApi,
	getAudiosFromApi,
	toggleAudioFavoriteInApi,
	updateAudioInApi,
} from '@/lib/api/client/audio.client';
import { createSelectors } from '@/lib/utils/store/create-selectors';
import type { AudioWithStats } from '@/types/entities/audio';

// Definiendo un tipo de filtro genérico hasta que se creen los esquemas Zod
export type AudioFilters = Record<string, any>;

/**
 * 🏪 Estado del store de Audio
 */
export interface AudioState {
	// Estado de datos
	audios: AudioWithStats[];
	clearFilters: () => void;
	clearSelection: () => void;
	createAudio: (data: PublicAudioCreateInput) => Promise<AudioWithStats | undefined>;
	currentAudio: AudioWithStats | null;
	deleteAudio: (id: string) => Promise<void>;
	deselectAudio: (audioId: string) => void;
	error: string | null;

	// Acciones de datos
	fetchAudios: () => Promise<void>;
	filters: AudioFilters;

	// Utilidades
	getAudioById: (id: string) => AudioWithStats | undefined;

	// Estado de UI
	isLoading: boolean;
	loading: boolean;

	// Acciones de selección
	selectAudio: (audio: AudioWithStats) => void;
	selectedAudios: AudioWithStats[];

	// Acciones de filtrado
	setFilters: (filters: Partial<AudioFilters>) => void;
	toggleFavorite: (id: string) => Promise<void>;
	updateAudio: (id: string, data: PublicAudioUpdateInput) => Promise<AudioWithStats | undefined>;
}

const useAudioStoreBase = create<AudioState>()(
	devtools(
		(set, get) => ({
			// Estado inicial
			audios: [],
			selectedAudios: [],
			currentAudio: null,
			isLoading: false,
			loading: false,
			error: null,
			filters: {},

			// Acciones de datos
			fetchAudios: async () => {
				set({ loading: true, isLoading: true, error: null });
				try {
					const audios = await getAudiosFromApi();
					set({ audios, loading: false, isLoading: false });
				} catch (error) {
					set({ error: (error as Error).message, loading: false, isLoading: false });
				}
			},

			createAudio: async (data: PublicAudioCreateInput) => {
				set({ loading: true, error: null });
				try {
					const newAudio = await createAudioInApi(data);
					set((state) => ({
						audios: [...state.audios, newAudio],
						loading: false,
					}));
					return newAudio;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return;
				}
			},

			updateAudio: async (id: string, data: PublicAudioUpdateInput) => {
				set({ loading: true, error: null });
				try {
					const updatedAudio = await updateAudioInApi(id, data);
					set((state) => ({
						audios: state.audios.map((a) => (a.id === id ? updatedAudio : a)),
						currentAudio: state.currentAudio?.id === id ? updatedAudio : state.currentAudio,
						loading: false,
					}));
					return updatedAudio;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return;
				}
			},

			deleteAudio: async (id: string) => {
				set({ loading: true, error: null });
				try {
					await deleteAudioFromApi(id);
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
			selectAudio: (audio: AudioWithStats) => {
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
					set({ loading: true, error: null });
					try {
						const updatedAudio = await toggleAudioFavoriteInApi(id);
						set((state) => ({
							audios: state.audios.map((item) => (item.id === id ? updatedAudio : item)),
							currentAudio: state.currentAudio?.id === id ? updatedAudio : state.currentAudio,
							loading: false,
						}));
					} catch (error) {
						set({ error: (error as Error).message, loading: false });
					}
				}
			},
		}),
		{
			name: 'audio-store',
		}
	)
);

export const useAudioStore = createSelectors(useAudioStoreBase);
