/**
 * 🎵 Tipos del Store de Audio
 * @module store/entities/audio/types
 */

import type { AudioComplete, AudioFilters, AudioFormData } from '@/types/entities/audio/types';

/**
 * 🏪 Estado del store de Audio
 */
export interface AudioState {
	// Estado de datos
	audios: AudioComplete[];
	clearFilters: () => void;
	clearSelection: () => void;
	createAudio: (data: AudioFormData) => Promise<AudioComplete | undefined>;
	currentAudio: AudioComplete | null;
	deleteAudio: (id: string) => Promise<void>;
	deselectAudio: (audioId: string) => void;
	error: string | null;

	// Acciones de datos
	fetchAudios: () => Promise<void>;
	filters: AudioFilters;

	// Utilidades
	getAudioById: (id: string) => AudioComplete | undefined;

	// Estado de UI
	loading: boolean;

	// Acciones de selección
	selectAudio: (audio: AudioComplete) => void;
	selectedAudios: AudioComplete[];

	// Acciones de filtrado
	setFilters: (filters: Partial<AudioFilters>) => void;
	toggleFavorite: (id: string) => Promise<void>;
	updateAudio: (id: string, data: AudioFormData) => Promise<AudioComplete | undefined>;
}
