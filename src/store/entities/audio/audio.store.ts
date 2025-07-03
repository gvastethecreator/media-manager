/**
 * 🎵 Store de Audio
 * @module store/entities/audio/audio.store
 * @description Store Zustand para gestionar el estado de audios
 * ✅ MIGRADO A DRIZZLE - Usa tipos locales en lugar de Prisma
 */

import { createSelectors } from '@/lib/utils/store/create-selectors';
import { createAudio, deleteAudio, getAudios, updateAudio } from '@/services/audio/audio.service';
import type {
    AudioCreateInput,
    AudioUpdateInput,
    AudioWithStats
} from '@/types/entities/audio';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Definiendo un tipo de filtro genérico hasta que se creen los esquemas Zod
export type AudioFilters = Record<string, any>;

/**
 * 🏪 Estado del store de Audio
 */
export interface AudioState {
	// Estado de datos
	audios: AudioWithStats[];
	selectedAudios: AudioWithStats[];
	currentAudio: AudioWithStats | null;

	// Estado de UI
	loading: boolean;
	error: string | null;
	filters: AudioFilters;

	// Acciones de datos
	fetchAudios: () => Promise<void>;
	createAudio: (data: AudioCreateInput) => Promise<AudioWithStats | undefined>;
	updateAudio: (id: string, data: AudioUpdateInput) => Promise<AudioWithStats | undefined>;
	deleteAudio: (id: string) => Promise<void>;

	// Acciones de selección
	selectAudio: (audio: AudioWithStats) => void;
	deselectAudio: (audioId: string) => void;
	clearSelection: () => void;

	// Acciones de filtrado
	setFilters: (filters: Partial<AudioFilters>) => void;
	clearFilters: () => void;

	// Utilidades
	getAudioById: (id: string) => AudioWithStats | undefined;
	toggleFavorite: (id: string) => Promise<void>;
}

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

			createAudio: async (data: AudioCreateInput) => {
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

			updateAudio: async (id: string, data: AudioUpdateInput) => {
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
					await get().updateAudio(id, {
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
