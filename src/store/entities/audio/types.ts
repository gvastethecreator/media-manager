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
	selectedAudios: AudioComplete[];
	currentAudio: AudioComplete | null;

	// Estado de UI
	loading: boolean;
	error: string | null;
	filters: AudioFilters;

	// Acciones de datos
	fetchAudios: () => Promise<void>;
	createAudio: (data: AudioFormData) => Promise<AudioComplete | undefined>;
	updateAudio: (id: string, data: AudioFormData) => Promise<AudioComplete | undefined>;
	deleteAudio: (id: string) => Promise<void>;

	// Acciones de selección
	selectAudio: (audio: AudioComplete) => void;
	deselectAudio: (audioId: string) => void;
	clearSelection: () => void;

	// Acciones de filtrado
	setFilters: (filters: Partial<AudioFilters>) => void;
	clearFilters: () => void;

	// Utilidades
	getAudioById: (id: string) => AudioComplete | undefined;
	toggleFavorite: (id: string) => Promise<void>;
}
